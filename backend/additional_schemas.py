from pydantic import BaseModel, Field
from typing import List, Dict, Any
from schemas import Player

class PlayerResponse(BaseModel):
    """Enhanced response model for paginated player results"""
    players: List[Player]
    total: int = Field(..., description="Total number of players matching filters")
    skip: int = Field(..., description="Number of records skipped")
    limit: int = Field(..., description="Maximum number of records returned")
    has_next: bool = Field(..., description="Whether there are more records")
    has_previous: bool = Field(..., description="Whether there are previous records")

class DatabaseStats(BaseModel):
    """Database overview statistics"""
    total_players: int
    positions: Dict[str, int]
    seasons: Dict[str, int]
    competitions: Dict[str, int]
    teams: Dict[str, int]

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    error_code: str = "GENERAL_ERROR"
    timestamp: str

class SuccessResponse(BaseModel):
    """Standard success response"""
    message: str
    data: Any = None

class PlayerSearchResult(BaseModel):
    """Response for player search/autocomplete"""
    normalized_player_name: str
    original_player_name: str | None
    team: str
    season: str
    primary_position: str | None

    @classmethod
    def from_player(cls, player: Player):
        return cls(
            normalized_player_name=player.normalized_player_name,
            original_player_name=player.original_player_name,
            team=player.team,
            season=player.season,
            primary_position=player.primary_position
        )
    
class SimilarPlayerResponse(BaseModel):
    """Response for similar player with details"""
    player: Player
    similarity_percentage: float = Field(..., ge=0, le=100)
    position: str
    key_similarities: List[str]