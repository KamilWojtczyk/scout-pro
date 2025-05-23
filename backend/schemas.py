from datetime import date
from decimal import Decimal
from pydantic import BaseModel, Field

class Player(BaseModel):
    original_player_name: str | None = Field(None, alias="Original Player Name")
    normalized_player_name: str      = Field(...,  alias="Normalized Player Name")
    short_name: str | None           = Field(None, alias="Short Name")
    normalized_short_name: str | None= Field(None, alias="Normalized Short Name")
    dob: date | None                 = Field(None, alias="DoB")
    skillcorner_player_id: int | None= Field(None, alias="SkillCorner Player ID")
    team_id: int | None              = Field(None, alias="team_id")
    season_id: int | None            = Field(None, alias="season_id")
    position_group: str | None       = Field(None, alias="position_group")
    team: str                        = Field(...,  alias="Team")
    competition_name: str | None     = Field(None, alias="competition_name")
    competition_id: int | None       = Field(None, alias="competition_id")
    season: str                      = Field(..., alias="Season")
    minutes_full_all: float | None   = Field(None, alias="minutes_full_all")
    count_match: int | None          = Field(None, alias="count_match")
    count_match_failed: int | None   = Field(None, alias="count_match_failed")
    total_distance_full_all_p90: float | None = Field(None, alias="total_distance_full_all_p90")
    statsbomb_player_id: int | None  = Field(None, alias="Statsbomb Player ID")
    positional_group: str | None     = Field(None, alias="Positional Group")
    team_id_sb: int | None           = Field(None, alias="Team ID")
    competition_id_sb: int | None    = Field(None, alias="Competition ID")
    primary_position: str | None     = Field(None, alias="Primary Position")
    secondary_position: str | None   = Field(None, alias="Secondary Position")
    nineties_played: float | None    = Field(None, alias="90s Played")
    age: Decimal | None              = Field(None, alias="Age")
    height: int | None               = Field(None, alias="Height")
    defensive_obv_value: float | None= Field(None, alias="Defensive OBV Value")
    dribble_carry_obv_value: float|None=Field(None, alias="Dribble&Carry OBV Value")
    pass_obv_value: float | None     = Field(None, alias="Pass OBV Value")
    player_hyperlink: str | None     = Field(None, alias="Player HyperLink")
    on_loan_from: str | None         = Field(None, alias="on_loan_from")
    loan_contract_expires: date|None = Field(None, alias="loan_contract_expires")
    contract_expires: date | None    = Field(None, alias="contract_expires")
    contract_option: str | None      = Field(None, alias="contract_option")
    current_market_value: str | None = Field(None, alias="current_market_value")

    model_config = {
        "populate_by_name": True,     # allow either snake_case or DB aliases in input
        "from_attributes": True       # allow .from_orm(PlayerCombined_instance)
    }
