import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  of,
  switchMap,
  map,
  shareReplay,
  filter,
} from 'rxjs';
import Papa from 'papaparse';
import {
  PlayerResponse,
  DatabaseStats,
  Player,
  SimilarPlayer,
  BUCKET_STATS,
} from './player.model';
import {
  toCamel,
  norm,
  mvToNumber,
  bucketOf,
  buildNormalisers,
  vector,
  euclidean,
  similarityPct,
  formationLabelToBucket,
} from '../func/functions';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly players$ = new BehaviorSubject<Player[] | null>(null);

  private get allPlayers(): Player[] {
    return this.players$.value ?? [];
  }

  private loadCsv(): void {
    if (this.players$.value) return;

    this.http
      .get('/assets/players.csv', { responseType: 'text' })
      .subscribe((csv) => {
        const parsed = Papa.parse<Player>(csv, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          transformHeader: toCamel,
        }).data as Player[];
        parsed.forEach((p) => {
          (p as any).normalizedName = norm(p?.originalPlayerName);
          (p as any).marketValueNum = mvToNumber(p.currentMarketValue);
        });

        this.players$.next(parsed);
      });
  }

  private readonly stats$ = this.players$.pipe(
    switchMap((rows) => {
      if (!rows) return of<DatabaseStats | null>(null);

      const positions: Record<string, number> = {};
      const competitions: Record<string, number> = {};
      const teams: Record<string, number> = {};

      rows.forEach((p) => {
        if (p.positionTm) {
          positions[p.positionTm] = (positions[p.positionTm] ?? 0) + 1;
        }
        competitions[p.tournamentName] =
          (competitions[p.tournamentName] ?? 0) + 1;
        teams[p.teamName] = (teams[p.teamName] ?? 0) + 1;
      });
      return of<DatabaseStats>({
        total_players: rows.length,
        positions,
        competitions,
        teams,
      });
    }),
    shareReplay(1)
  );

  list(
    params: Record<string, string | number | null>
  ): Observable<PlayerResponse> {
    this.loadCsv();

    return this.players$.pipe(
      switchMap((rows) => {
        if (!rows) return of(this.emptyResponse());
        let data = rows;

        if (params['position'])
          data = data.filter((p) => p.positionTm === params['position']);

        if (params['team'])
          data = data.filter((p) => p.teamName === params['team']);

        if (params['competition'])
          data = data.filter((p) => p.tournamentName === params['competition']);

        if (params['min_age'])
          data = data.filter((p) => (p.age ?? 0) >= Number(params['min_age']));
        if (params['max_age'])
          data = data.filter((p) => (p.age ?? 0) <= Number(params['max_age']));

        if (params['min_minutes'])
          data = data.filter(
            (p) => (p.minutesPlayed ?? 0) >= Number(params['min_minutes'])
          );

        if (params['min_market_value'])
          data = data.filter(
            (p: any) =>
              (p.marketValueNum ?? 0) >= Number(params['min_market_value'])
          );
        if (params['max_market_value'])
          data = data.filter(
            (p: any) =>
              (p.marketValueNum ?? 0) <= Number(params['max_market_value'])
          );

        if (params['search']) {
          const q = norm(String(params['search']));
          data = data.filter(
            (p: any) =>
              (p.normalizedName as string).includes(q) ||
              norm(p.teamName).includes(q)
          );
        }

        const total = data.length;
        const skip = +(params['skip'] ?? 0);
        const limit = +(params['limit'] ?? total);
        const slice = data.slice(skip, skip + limit);

        return of({
          players: slice,
          total,
          skip,
          limit,
          has_next: skip + limit < total,
          has_previous: skip > 0,
        });
      })
    );
  }

  stats(): Observable<DatabaseStats> {
    this.loadCsv();
    return this.stats$ as Observable<DatabaseStats>;
  }

  positions(): Observable<string[]> {
    return this.stats$.pipe(map((s) => Object.keys(s?.positions ?? {})));
  }

  teams(): Observable<string[]> {
    return this.stats$.pipe(map((s) => Object.keys(s?.teams ?? {})));
  }

  competitions(): Observable<string[]> {
    return this.stats$.pipe(map((s) => Object.keys(s?.competitions ?? {})));
  }

  getPlayer(name: string, team: string) {
    this.loadCsv();
    return this.players$.pipe(
      map((rows) => {
        return (rows ?? []).find(
          (p) => p.normalizedName === name && p.teamName === team
        );
      })
    );
  }

  searchPlayers(q: string, limit = 20) {
    const query = norm(q);
    this.loadCsv();
    return this.players$.pipe(
      map((rows) =>
        (rows ?? [])
          .filter((p: any) => (p.normalizedName as string).includes(query))
          .slice(0, limit)
          .map((p) => ({
            normalizedName: p.normalizedName,
            originalPlayerName: p.originalPlayerName,
            teamName: p.teamName,
            positionTm: p.positionTm ?? '',
          }))
      )
    );
  }

  similarPlayers(source: Player, limit = 8): Observable<SimilarPlayer[]> {
    this.loadCsv();

    return this.players$.pipe(
      map((rows) => {
        if (!rows) return [];

        const bucket = bucketOf(source.positionTm);
        const keys = BUCKET_STATS[bucket];

        const pool = rows.filter(
          (r) => r.id !== source.id && bucketOf(r.positionTm) === bucket
        );
        if (pool.length === 0) return [];

        const norm = buildNormalisers([source, ...pool], keys);
        const vSrc = vector(source, keys, norm);

        const scored = pool.map((p) => {
          const d = euclidean(vSrc, vector(p, keys, norm));
          return { player: p, similarityPercentage: similarityPct(d) };
        });

        return scored
          .sort((a, b) => b.similarityPercentage - a.similarityPercentage)
          .slice(0, limit);
      })
    );
  }

  getTopPlayers(formationLabel: string, topN = 6): Observable<Player[]> {
    this.loadCsv();

    const bucket = formationLabelToBucket(formationLabel);
    const metricKeys = BUCKET_STATS[bucket];
    if (!metricKeys) return of([]);

    return this.players$.pipe(
      filter((rows): rows is Player[] => !!rows),
      map((rows) => {
        const eligible = rows.filter((p) => bucketOf(p.positionTm) === bucket);
        if (eligible.length === 0) return [];

        const max: Record<string, number> = {};
        for (const key of metricKeys) {
          max[key as string] = Math.max(
            ...eligible.map((r) => Number((r as any)[key] ?? 0))
          );
        }

        const withScore = eligible.map((p) => {
          const score = metricKeys.reduce<number>((acc, k) => {
            const v = Number((p as any)[k] ?? 0);
            return acc + v / (max[k as string] || 1);
          }, 0);
          return { ...p, __score__: score };
        });

        return withScore
          .sort((a, b) => b.__score__ - a.__score__)
          .slice(0, topN)
          .map(({ __score__, ...rest }) => rest);
      })
    );
  }

  private emptyResponse(): PlayerResponse {
    return {
      players: [],
      total: 0,
      skip: 0,
      limit: 0,
      has_next: false,
      has_previous: false,
    };
  }
}
