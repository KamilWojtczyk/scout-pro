from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from models import PlayerCombined
from schemas import Player
from typing import List, Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class SimilarityService:
    """Service for calculating player similarity based on performance metrics"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def find_similar_players(
        self, 
        normalized_name: str, 
        team: str, 
        season: str, 
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Find players similar to the specified player using OBV values
        """
        # Get reference player
        ref_player = self.db.query(PlayerCombined).filter(
            and_(
                PlayerCombined.normalized_player_name == normalized_name,
                PlayerCombined.team == team,
                PlayerCombined.season == season
            )
        ).first()
        
        if not ref_player:
            return []
        
        desired_pos = ref_player.primary_position
        
        # Find candidates with same position
        candidates = self.db.query(PlayerCombined).filter(
            and_(
                or_(
                    PlayerCombined.primary_position == desired_pos,
                    PlayerCombined.secondary_position == desired_pos
                ),
                or_(
                    PlayerCombined.normalized_player_name != normalized_name,
                    PlayerCombined.team != team,
                    PlayerCombined.season != season
                )
            )
        ).all()
        
        similar_players = []
        
        for candidate in candidates:
            similarity_score = self._calculate_similarity(ref_player, candidate)
            if similarity_score > 0.1:  # Only include meaningful similarities
                similar_players.append({
                    "player": candidate,
                    "similarity_percentage": round(similarity_score * 100, 1),
                    "position": candidate.primary_position,
                    "key_similarities": self._get_key_similarities(ref_player, candidate)
                })
        
        # Sort by similarity and return top results
        similar_players.sort(key=lambda x: x["similarity_percentage"], reverse=True)
        return similar_players[:limit]
    
    def _calculate_similarity(self, player1: PlayerCombined, player2: PlayerCombined) -> float:
        """
        Calculate similarity between two players using OBV values and performance metrics
        """
        # OBV attributes (main similarity indicators)
        obv_attrs = [
            'defensive_obv_value',
            'dribble_carry_obv_value', 
            'pass_obv_value'
        ]
        
        # Performance attributes (secondary indicators)
        perf_attrs = [
            'nineties_played',
            'total_distance_full_all_p90',
            'minutes_full_all'
        ]
        
        total_diff = 0
        valid_comparisons = 0
        
        # Compare OBV values (weighted heavily)
        for attr in obv_attrs:
            val1 = getattr(player1, attr, None)
            val2 = getattr(player2, attr, None)
            
            if self._are_values_comparable(val1, val2):
                max_val = max(abs(val1), abs(val2))
                if max_val > 0:
                    diff = abs(val1 - val2) / max_val
                    total_diff += diff * 1.0  # Full weight for OBV
                    valid_comparisons += 1.0
        
        # Compare performance metrics (lower weight)
        for attr in perf_attrs:
            val1 = getattr(player1, attr, None)
            val2 = getattr(player2, attr, None)
            
            if self._are_values_comparable(val1, val2):
                if attr == 'nineties_played':
                    diff = abs(val1 - val2) / 50  # Normalize by typical max
                elif attr == 'total_distance_full_all_p90':
                    diff = abs(val1 - val2) / 4000  # Normalize by typical range
                elif attr == 'minutes_full_all':
                    diff = abs(val1 - val2) / 3000  # Normalize by season minutes
                else:
                    diff = 0
                
                total_diff += diff * 0.3  # Lower weight for performance
                valid_comparisons += 0.3
        
        if valid_comparisons == 0:
            return 0
        
        avg_diff = total_diff / valid_comparisons
        return max(0, 1 - min(avg_diff, 1))
    
    def _are_values_comparable(self, val1, val2) -> bool:
        """Check if two values are valid for comparison"""
        return (
            val1 is not None and val2 is not None and 
            val1 != 0 and val2 != 0 and
            not (isinstance(val1, float) and val1 != val1) and  # Check for NaN
            not (isinstance(val2, float) and val2 != val2)
        )
    
    def _get_key_similarities(self, player1: PlayerCombined, player2: PlayerCombined) -> List[str]:
        """
        Identify key areas where players are similar
        """
        similarities = []
        
        # Check OBV similarities
        if self._are_similar_values(player1.defensive_obv_value, player2.defensive_obv_value):
            similarities.append("Defensive actions")
        
        if self._are_similar_values(player1.pass_obv_value, player2.pass_obv_value):
            similarities.append("Passing ability")
        
        if self._are_similar_values(player1.dribble_carry_obv_value, player2.dribble_carry_obv_value):
            similarities.append("Dribbling & carrying")
        
        # Check performance similarities
        if self._are_similar_values(player1.nineties_played, player2.nineties_played, threshold=0.2):
            similarities.append("Playing time")
        
        if self._are_similar_values(player1.total_distance_full_all_p90, player2.total_distance_full_all_p90, threshold=0.15):
            similarities.append("Physical output")
        
        return similarities
    
    def _are_similar_values(self, val1, val2, threshold: float = 0.25) -> bool:
        """Check if two values are similar within a threshold"""
        if not self._are_values_comparable(val1, val2):
            return False
        
        max_val = max(abs(val1), abs(val2))
        if max_val == 0:
            return True
        
        diff_ratio = abs(val1 - val2) / max_val
        return diff_ratio <= threshold