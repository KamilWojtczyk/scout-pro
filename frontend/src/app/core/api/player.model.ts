export interface Player {
  [key: string]: string | number | Date | undefined;

  id: number;
  originalPlayerName: string;
  normalizedName: string;
  teamName: string;
  tournamentName: string;
  tournamentCountry: string;
  crossesCompleted: number;
  runsOutSuccess: number;
  longBallsCompleted: number;
  passesCompleted: number;
  aerialsLost: number;
  aerialsWon: number;
  bigChancesCreated: number;
  bigChancesMissed: number;
  shotsBlocked: number;
  challengeLost: number;
  clearanceOffLine: number;
  foulsCommitted: number;
  assists: number;
  goals: number;
  goalsPrevented: number;
  highClaims: number;
  height: number;
  hitWoodwork: number;
  interceptions: number;
  keyPasses: number;
  lastManTackle: number;
  minutesPlayed: number;
  shotsOnTarget: number;
  blockedShots: number;
  ownGoals: number;
  penaltiesConceded: number;
  penaltiesMissed: number;
  penaltiesSaved: number;
  penaltiesWon: number;
  possessionsLost: number;
  punches: number;
  ratingAvg: number;
  savesInsideBox: number;
  shotsOffTarget: number;
  clearances: number;
  crosses: number;
  runsOut: number;
  longBalls: number;
  offsides: number;
  passes: number;
  tackles: number;
  touches: number;
  timesFouled: number;
  dribbleAttempts: number;
  dribblesCompleted: number;
  dribbleSuccessPct: number;
  defensiveActions: number;
  groundDuelsTotal: number;
  groundDuelsWinPct: number;
  doB?: string;

  /* Transfermarkt enrichments */
  href: string;
  age?: number;
  heightTm?: number;
  imageUrl?: string;
  foot?: string;
  onLoanFrom?: string;
  loanContractExpires?: string;
  contractExpires?: string;
  contractOption?: string;
  currentMarketValue?: string;
  positionTm: string;
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
  competitions: Record<string, number>;
  teams: Record<string, number>;
}

export interface SimilarPlayer {
  player: Player;
  similarityPercentage: number;
}

export interface PlayerMeta {
  normalizedName: string;
  teamName: string;
  position: string;
}

export type Bucket = 'GK' | 'CB' | 'FB' | 'DM' | 'CM' | 'AM' | 'W' | 'ST';

export const BUCKET_STATS: Record<Bucket, Array<keyof Player>> = {
  GK: [
    'savesInsideBox',
    'goalsPrevented',
    'longBallsCompleted',
    'highClaims',
    'punches',
    'runsOutSuccess',
  ],
  CB: [
    'tackles',
    'interceptions',
    'clearances',
    'blockedShots',
    'aerialsWon',
    'passesCompleted',
  ],
  FB: [
    'assists',
    'crossesCompleted',
    'keyPasses',
    'dribbleSuccessPct',
    'tackles',
    'interceptions',
  ],
  DM: [
    'tackles',
    'interceptions',
    'groundDuelsWinPct',
    'passesCompleted',
    'longBallsCompleted',
    'keyPasses',
  ],
  CM: [
    'goals',
    'assists',
    'tackles',
    'interceptions',
    'keyPasses',
    'passesCompleted',
  ],
  AM: [
    'goals',
    'assists',
    'keyPasses',
    'bigChancesCreated',
    'shotsOnTarget',
    'dribbleSuccessPct',
  ],
  W: [
    'goals',
    'assists',
    'dribbleSuccessPct',
    'crossesCompleted',
    'keyPasses',
    'shotsOnTarget',
  ],
  ST: [
    'goals',
    'assists',
    'shotsOnTarget',
    'bigChancesMissed',
    'dribbleSuccessPct',
    'aerialsWon',
  ],
};
