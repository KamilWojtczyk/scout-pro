import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import {
  PlayerResponse,
  DatabaseStats,
  Player,
  SimilarPlayer,
} from './player.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private http = inject(HttpClient);
  private api = environment.apiUrl; // 'http://localhost:8000'

  list(
    params: Partial<Record<string, string | number | null>>
  ): Observable<PlayerResponse> {
    return this.http.get<PlayerResponse>(`${this.api}/players`, {
      params: new HttpParams({ fromObject: params as any }),
    });
  }

  stats(): Observable<DatabaseStats> {
    return this.http.get<DatabaseStats>(`${this.api}/stats/overview`);
  }

  positions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/metadata/positions`);
  }

  teams(): Observable<string[]> {
    return this.http.get<string[]>(`${this.api}/metadata/teams`);
  }

  getPlayer(normalizedName: string, team: string, season: string) {
    return this.http.get<Player>(
      `${this.api}/player/${encodeURIComponent(
        normalizedName
      )}/${encodeURIComponent(team)}/${encodeURIComponent(season)}`
    );
  }

  getSimilarPlayers(
    player: Pick<Player, 'normalized_player_name' | 'team' | 'season'>,
    limit = 8
  ) {
    const { normalized_player_name, team, season } = player;

    return this.http.get<SimilarPlayer[]>(
      `${this.api}/players/${encodeURIComponent(
        normalized_player_name
      )}/${encodeURIComponent(team)}/${encodeURIComponent(season)}/similar`,
      { params: { limit } }
    );
  }
}
