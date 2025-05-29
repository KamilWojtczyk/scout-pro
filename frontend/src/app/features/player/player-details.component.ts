import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/* PrimeNG */
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { DashboardStore } from '../../core/state/dashboard.store';
import { Player, PlayerMeta, SimilarPlayer } from '../../core/api/player.model';
import { PlayerService } from '../../core/api/player.service';
import {
  catchError,
  combineLatest,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { SelectModule } from 'primeng/select';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';

@Component({
  selector: 'app-player-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    PanelModule,
    SelectModule,
    TagModule,
    AvatarModule,
    ProgressSpinnerModule,
    AutoCompleteModule,
  ],
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.scss'],
})
export class PlayerDetailComponent {
  /* ---------------- DI ---------------- */
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  public readonly store = inject(DashboardStore);
  private readonly playerService = inject(PlayerService);

  compareQuery$ = new Subject<string>();
  compareResults = signal<PlayerMeta[]>([]);

  /* ---------------- state ---------------- */
  player = signal<Player | null>(null);
  playerImageUrl =
    'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1';

  selectedComparisonPlayer = signal<Player | null>(null);
  allPlayers = signal<Player[]>([]);

  similarPlayers = signal<SimilarPlayer[]>([]);
  loadingSimilarPlayers = false;

  basicRows = [
    { label: 'Age', key: 'age' },
    { label: 'Height (cm)', key: 'height' },
    { label: 'Minutes', key: 'minutes_full_all' },
    { label: '90s Played', key: 'nineties_played' },
  ];

  contractRows = [
    { label: 'Market value', key: 'current_market_value' },
    { label: 'Contract expires', key: 'contract_expires' },
    { label: 'On loan from', key: 'on_loan_from' },
    { label: 'Loan ends', key: 'loan_contract_expires' },
    { label: 'Option', key: 'contract_option' },
  ];

  statsRows = [
    { label: 'Matches', key: 'count_match' },
    { label: 'Minutes Played', key: 'minutes_full_all' },
    { label: '90s Played', key: 'nineties_played' },
    { label: 'Distance (p90)', key: 'total_distance_full_all_p90' },
    { label: 'Defensive OBV', key: 'defensive_obv_value' },
    { label: 'Dribble & Carry OBV', key: 'dribble_carry_obv_value' },
    { label: 'Pass OBV', key: 'pass_obv_value' },
  ];

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([p, q]) =>
          this.playerService.getPlayer(
            p.get('name')!,
            q.get('team') ?? '',
            q.get('season') ?? ''
          )
        )
      )
      .subscribe({
        next: (row) => {
          this.player.set(row);
          this.fetchSimilarPlayers(row);
        },
        error: () => this.player.set(null),
      });

    this.compareQuery$
      .pipe(
        tap((q) => {
          if (q.trim().length < 2) this.compareResults.set([]);
        }),
        map((q) => q.trim()),
        filter((q) => q.length >= 2),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          this.playerService.searchPlayers(q).pipe(catchError(() => of([])))
        )
      )
      .subscribe((list) => this.compareResults.set(list));
  }

  private fetchSimilarPlayers(player: Player | null) {
    if (!player) return;
    this.loadingSimilarPlayers = true;
    this.playerService
      .getSimilarPlayers(
        {
          normalized_player_name: player.normalized_player_name,
          team: player.team,
          season: player.season,
        },
        6
      )
      .subscribe({
        next: (r) => this.similarPlayers.set(r),
        complete: () => (this.loadingSimilarPlayers = false),
      });
  }

  onCompareSearch(term: string) {
    this.compareQuery$.next(term);
  }

  onCompareSelect(meta: AutoCompleteSelectEvent) {
    this.playerService
      .getPlayer(
        meta.value.original_player_name,
        meta.value.team,
        meta.value.season
      )
      .subscribe((full) => this.selectedComparisonPlayer.set(full));
  }

  formatMetricValue(value: any, key: string): string {
    const numValue = +(value ?? 0);

    switch (key) {
      case 'total_distance_full_all_p90':
        return `${(numValue / 1000).toFixed(1)}km`;
      case 'minutes_full_all':
        return numValue.toLocaleString();
      default:
        return numValue.toFixed(key.includes('obv') ? 2 : 1);
    }
  }

  leftPct(k: string): number {
    const p = this.player();
    const c = this.selectedComparisonPlayer();
    if (!p || !c) return 50;

    const a = +(p as any)[k];
    const b = +(c as any)[k];
    const tot = Math.abs(a) + Math.abs(b);
    return tot ? (Math.abs(a) / tot) * 100 : 50;
  }

  rightPct(k: string): number {
    return 100 - this.leftPct(k);
  }

  /* ============== handlers ============== */
  onSimilarPlayerClick(p: Player) {
    this.selectedComparisonPlayer.set(p);
  }

  navigateToPlayer(p: Player) {
    this.router.navigate(['/player', p.normalized_player_name], {
      queryParams: { team: p.team, season: p.season },
    });
    this.selectedComparisonPlayer.set(null);
  }

  goBack() {
    this.router.navigate(['']);
  }
}
