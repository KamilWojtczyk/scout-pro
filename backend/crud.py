from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc, asc
from models import PlayerCombined
from typing import Optional, List, Dict, Any
from similarity_service import SimilarityService

def get_players(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    team: Optional[str] = None,
    season: Optional[str] = None,
    position: Optional[str] = None,
    competition: Optional[str] = None,
    min_age: Optional[float] = None,
    max_age: Optional[float] = None,
    min_minutes: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = "normalized_player_name",
    sort_order: str = "asc"
) -> Dict[str, Any]:
    """
    Enhanced get_players with filtering, search, and pagination info
    """
    query = db.query(PlayerCombined)
    
    # Apply filters
    if team:
        query = query.filter(PlayerCombined.team.ilike(f"%{team}%"))
    if season:
        query = query.filter(PlayerCombined.season == season)
    if position:
        query = query.filter(
            or_(
                PlayerCombined.primary_position.ilike(f"%{position}%"),
                PlayerCombined.position_group.ilike(f"%{position}%")
            )
        )
    if competition:
        query = query.filter(PlayerCombined.competition_name.ilike(f"%{competition}%"))
    if min_age:
        query = query.filter(PlayerCombined.age >= min_age)
    if max_age:
        query = query.filter(PlayerCombined.age <= max_age)
    if min_minutes:
        query = query.filter(PlayerCombined.minutes_full_all >= min_minutes)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                PlayerCombined.normalized_player_name.ilike(search_term),
                PlayerCombined.original_player_name.ilike(search_term),
                PlayerCombined.team.ilike(search_term)
            )
        )
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply sorting
    if hasattr(PlayerCombined, sort_by):
        sort_column = getattr(PlayerCombined, sort_by)
        if sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
    
    # Apply pagination
    players = query.offset(skip).limit(limit).all()
    
    return {
        "players": players,
        "total": total_count,
        "skip": skip,
        "limit": limit,
        "has_next": skip + limit < total_count,
        "has_previous": skip > 0
    }

def get_player_by_composite_key(
    db: Session, 
    normalized_name: str, 
    team: str, 
    season: str
) -> Optional[PlayerCombined]:
    """
    Get a specific player by composite primary key
    """
    return db.query(PlayerCombined).filter(
        and_(
            PlayerCombined.normalized_player_name == normalized_name,
            PlayerCombined.team == team,
            PlayerCombined.season == season
        )
    ).first()

def search_players(db: Session, query: str, limit: int = 20) -> List[PlayerCombined]:
    """
    Search players for autocomplete functionality
    """
    search_term = f"%{query}%"
    return db.query(PlayerCombined).filter(
        or_(
            PlayerCombined.normalized_player_name.ilike(search_term),
            PlayerCombined.original_player_name.ilike(search_term),
            PlayerCombined.short_name.ilike(search_term)
        )
    ).limit(limit).all()

def get_available_positions(db: Session) -> List[str]:
    """
    Get all unique positions from the database
    """
    positions = db.query(PlayerCombined.primary_position).distinct().filter(
        PlayerCombined.primary_position.isnot(None)
    ).all()
    return [pos[0] for pos in positions if pos[0]]

def get_available_teams(
    db: Session, 
    competition: Optional[str] = None, 
    season: Optional[str] = None
) -> List[str]:
    """
    Get all available teams with optional filtering
    """
    query = db.query(PlayerCombined.team).distinct()
    
    if competition:
        query = query.filter(PlayerCombined.competition_name.ilike(f"%{competition}%"))
    if season:
        query = query.filter(PlayerCombined.season == season)
    
    teams = query.all()
    return [team[0] for team in teams if team[0]]

def get_available_seasons(db: Session) -> List[str]:
    """
    Get all available seasons, sorted by most recent
    """
    seasons = db.query(PlayerCombined.season).distinct().order_by(
        PlayerCombined.season.desc()
    ).all()
    return [season[0] for season in seasons if season[0]]

def get_available_competitions(db: Session) -> List[str]:
    """
    Get all available competitions
    """
    competitions = db.query(PlayerCombined.competition_name).distinct().filter(
        PlayerCombined.competition_name.isnot(None)
    ).all()
    return [comp[0] for comp in competitions if comp[0]]

def get_database_stats(db: Session) -> Dict[str, Any]:
    """
    Get overview statistics of the database
    """
    total_players = db.query(PlayerCombined).count()
    
    # Position distribution
    position_stats = db.query(
        PlayerCombined.primary_position,
        func.count(PlayerCombined.normalized_player_name)
    ).filter(
        PlayerCombined.primary_position.isnot(None)
    ).group_by(PlayerCombined.primary_position).all()
    
    # Season distribution
    season_stats = db.query(
        PlayerCombined.season,
        func.count(PlayerCombined.normalized_player_name)
    ).group_by(PlayerCombined.season).order_by(PlayerCombined.season.desc()).all()
    
    # Competition distribution
    competition_stats = db.query(
        PlayerCombined.competition_name,
        func.count(PlayerCombined.normalized_player_name)
    ).filter(
        PlayerCombined.competition_name.isnot(None)
    ).group_by(PlayerCombined.competition_name).all()
    
    return {
        "total_players": total_players,
        "positions": dict(position_stats),
        "seasons": dict(season_stats),
        "competitions": dict(competition_stats)
    }

def get_similar_players_with_service(
    db: Session,
    normalized_name: str,
    team: str,
    season: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    Wrapper function to use the similarity service
    """
    service = SimilarityService(db)
    return service.find_similar_players(normalized_name, team, season, limit)