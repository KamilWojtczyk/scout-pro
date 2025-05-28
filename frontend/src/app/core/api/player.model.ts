export interface Player {
  [key: string]: string | number | Date | undefined;

  normalized_player_name: string;
  team: string;
  season: string;

  // Optional player information
  original_player_name?: string;
  short_name?: string;
  normalized_short_name?: string;
  dob?: Date;
  skillcorner_player_id?: number;
  team_id?: number;
  season_id?: number;
  position_group?: string;
  competition_name?: string;
  competition_id?: number;

  // Performance metrics
  minutes_full_all?: number;
  count_match?: number;
  count_match_failed?: number;
  total_distance_full_all_p90?: number;

  // StatsBomb data
  statsbomb_player_id?: number;
  positional_group: string;
  team_id_sb?: number;
  competition_id_sb?: number;
  primary_position: string;
  secondary_position?: string;
  nineties_played?: number;
  age?: number;
  height?: number;

  // OBV (On-Ball Value) metrics
  defensive_obv_value: number;
  dribble_carry_obv_value: number;
  pass_obv_value: number;

  // Additional information
  player_hyperlink?: string;
  on_loan_from?: string;
  loan_contract_expires?: Date;
  contract_expires?: Date;
  contract_option?: string;
  current_market_value?: string;
}

export interface PlayerResponse {
  players: Player[];
  total: number;
  skip: number;
  limit: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DatabaseStats {
  total_players: number;
  positions: Record<string, number>;
  seasons: Record<string, number>;
  competitions: Record<string, number>;
  teams: Record<string, number>;
}

export interface SimilarPlayer {
  player: Player;
  similarity_percentage: number;
  position: string;
  key_similarities: string[];
}
