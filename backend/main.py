from fastapi import FastAPI, Depends, Query, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List
import logging
from datetime import datetime

from db import SessionLocal
from schemas import Player
from additional_schemas import (
    PlayerResponse, DatabaseStats, ErrorResponse, 
    SuccessResponse, PlayerSearchResult, SimilarPlayerResponse
)
from crud import (
    get_players, get_player_by_composite_key, search_players,
    get_database_stats, get_available_positions, get_available_teams,
    get_available_seasons, get_available_competitions, get_similar_players_with_service
)

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="ScoutPro API",
    description="Advanced Player Scouting & Recruitment Platform",
    version="1.0.0"
)

# Add CORS middleware for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/", response_model=SuccessResponse)
def read_root():
    return SuccessResponse(
        message="Welcome to ScoutPro API",
        data={
            "version": "1.0.0",
            "description": "Advanced Player Scouting & Recruitment Platform",
            "docs": "/docs"
        }
    )

@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "api_version": "1.0.0"
    }

@app.get("/players", response_model=PlayerResponse, response_model_by_alias=False)
def read_players(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, le=1000, description="Maximum records to return"),
    team: Optional[str] = Query(None, description="Filter by team name"),
    season: Optional[str] = Query(None, description="Filter by season"),
    position: Optional[str] = Query(None, description="Filter by position"),
    competition: Optional[str] = Query(None, description="Filter by competition"),
    min_age: Optional[float] = Query(None, ge=15, le=50, description="Minimum age"),
    max_age: Optional[float] = Query(None, ge=15, le=50, description="Maximum age"),
    min_minutes: Optional[float] = Query(None, ge=0, description="Minimum minutes"),
    search: Optional[str] = Query(None, description="Search player names"),
    sort_by: Optional[str] = Query("normalized_player_name", description="Sort field"),
    sort_order: Optional[str] = Query("asc", regex="^(asc|desc)$", description="Sort order"),
    db: Session = Depends(get_db),
):
    """
    Get players with advanced filtering, pagination, and sorting
    """
    try:
        result = get_players(
            db=db, skip=skip, limit=limit, team=team, season=season,
            position=position, competition=competition, min_age=min_age,
            max_age=max_age, min_minutes=min_minutes, search=search,
            sort_by=sort_by, sort_order=sort_order
        )
        return PlayerResponse(**result)
    except Exception as e:
        logger.error(f"Error fetching players: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/players/search", response_model=List[PlayerSearchResult])
def search_players_endpoint(
    q: str = Query(..., min_length=2, description="Search query (min 2 chars)"),
    limit: int = Query(20, le=100, description="Maximum results"),
    db: Session = Depends(get_db),
):
    """
    Search players by name for autocomplete functionality
    """
    try:
        players = search_players(db, query=q, limit=limit)
        return [PlayerSearchResult.from_player(player) for player in players]
    except Exception as e:
        logger.error(f"Error searching players: {e}")
        raise HTTPException(status_code=500, detail="Search failed")

@app.get("/player/{normalized_name}/{team}/{season:path}", response_model=Player, response_model_by_alias=False)
def get_player(
    normalized_name: str = Path(..., description="Normalized player name"),
    team: str = Path(..., description="Team name"),
    season: str = Path(..., description="Season"),
    db: Session = Depends(get_db),
):
    """
    Get a specific player by composite key (name, team, season)
    """
    try:
        player = get_player_by_composite_key(db, normalized_name, team, season)
        if not player:
            raise HTTPException(status_code=404, detail="Player not found")
        return player
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching player: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/stats/overview", response_model=DatabaseStats)
def get_stats_overview(db: Session = Depends(get_db)):
    """
    Get overview statistics of the database
    """
    try:
        return DatabaseStats(**get_database_stats(db))
    except Exception as e:
        logger.error(f"Error fetching database stats: {e}")
        raise HTTPException(status_code=500, detail="Stats unavailable")

@app.get("/metadata/positions", response_model=List[str])
def get_positions(db: Session = Depends(get_db)):
    """
    Get all available positions
    """
    try:
        return get_available_positions(db)
    except Exception as e:
        logger.error(f"Error fetching positions: {e}")
        raise HTTPException(status_code=500, detail="Positions unavailable")

@app.get("/metadata/teams", response_model=List[str])
def get_teams(
    competition: Optional[str] = Query(None, description="Filter by competition"),
    season: Optional[str] = Query(None, description="Filter by season"),
    db: Session = Depends(get_db)
):
    """
    Get all available teams with optional filtering
    """
    try:
        return get_available_teams(db, competition=competition, season=season)
    except Exception as e:
        logger.error(f"Error fetching teams: {e}")
        raise HTTPException(status_code=500, detail="Teams unavailable")

@app.get("/metadata/seasons", response_model=List[str])
def get_seasons(db: Session = Depends(get_db)):
    """
    Get all available seasons
    """
    try:
        return get_available_seasons(db)
    except Exception as e:
        logger.error(f"Error fetching seasons: {e}")
        raise HTTPException(status_code=500, detail="Seasons unavailable")

@app.get("/metadata/competitions", response_model=List[str])
def get_competitions(db: Session = Depends(get_db)):
    """
    Get all available competitions
    """
    try:
        return get_available_competitions(db)
    except Exception as e:
        logger.error(f"Error fetching competitions: {e}")
        raise HTTPException(status_code=500, detail="Competitions unavailable")
    

@app.get("/players/{normalized_name}/{team}/{season:path}/similar", response_model=List[SimilarPlayerResponse], response_model_by_alias=False)
def get_similar_players_endpoint(
    normalized_name: str = Path(..., description="Normalized player name"),
    team: str = Path(..., description="Team name"),
    season: str = Path(..., description="Season"),
    limit: int = Query(10, le=50, description="Maximum number of similar players"),
    db: Session = Depends(get_db),
):
    """
    Find players similar to the specified player based on OBV values and performance
    """
    try:
        # First check if the reference player exists
        reference_player = get_player_by_composite_key(db, normalized_name, team, season)
        if not reference_player:
            raise HTTPException(status_code=404, detail="Reference player not found")
        
        similar_players = get_similar_players_with_service(db, normalized_name, team, season, limit)
        
        return [
            SimilarPlayerResponse(
                player=sp["player"],
                similarity_percentage=sp["similarity_percentage"],
                position=sp["position"],
                key_similarities=sp["key_similarities"]
            )
            for sp in similar_players
        ]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error finding similar players: {e}")
        raise HTTPException(status_code=500, detail="Similarity search failed")