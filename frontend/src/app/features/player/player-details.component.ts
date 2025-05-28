import {
  Component,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

/* PrimeNG */
import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ChartModule } from 'primeng/chart';

import { DashboardStore } from '../../core/state/dashboard.store';
import { Player, SimilarPlayer } from '../../core/api/player.model';
import { PlayerService } from '../../core/api/player.service';
import { combineLatest, switchMap } from 'rxjs';
import { SelectModule } from 'primeng/select';

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
    ChartModule,
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

  @ViewChild('comparisonSection') comparisonSection!: ElementRef<HTMLElement>;

  /* ---------------- state ---------------- */
  player = signal<Player | null>(null);
  playerImageUrl =
    'https://img.a.transfermarkt.technology/portrait/header/default.jpg?lm=1';

  selectedComparisonPlayer = signal<Player | null>(null);
  allPlayers: Player[] = [];

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
  }

  ngOnInit(): void {
    this.allPlayers = this.store.players();
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
    const c = this.selectedComparisonPlayer;
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
    this.location.back();
  }
}
