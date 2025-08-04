import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { PanelModule } from 'primeng/panel';
import { TagModule } from 'primeng/tag';
import { AvatarModule } from 'primeng/avatar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TabViewModule } from 'primeng/tabview';
import { SelectModule } from 'primeng/select';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import { MessageModule } from 'primeng/message';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';

import { DashboardStore } from '../../core/state/dashboard.store';
import { Player, PlayerMeta, SimilarPlayer } from '../../core/api/player.model';
import { PlayerService } from '../../core/api/player.service';
import { HeadToHeadComparisonComponent } from '../head-to-head-comparison/head-to-head-comparison.component';
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

interface ComparisonStat {
  key: string;
  label: string;
}

interface ComparisonCategory {
  title: string;
  stats: ComparisonStat[];
}

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
    TabViewModule,
    MessageModule,
    DialogModule,
    TooltipModule,
    HeadToHeadComparisonComponent,
  ],
  templateUrl: './player-details.component.html',
  styleUrls: ['./player-details.component.scss'],
})
export class PlayerDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly store = inject(DashboardStore);
  private readonly playerService = inject(PlayerService);

  compareQuery$ = new Subject<string>();
  compareResults = signal<PlayerMeta[]>([]);

  player = signal<Player | null>(null);
  selectedComparisonPlayer = signal<Player | null>(null);
  similarPlayers = signal<SimilarPlayer[]>([]);
  loadingSimilarPlayers = false;

  // Dialog states
  showSimilarPlayersDialog = false;
  showCompareDialog = false;
  showHeadToHeadDialog = false;

  get playerImageUrl(): string {
    return this.player()?.imageUrl ?? '';
  }

  get transfermarktUrl(): string {
    const href = this.player()?.href;
    return href ? `https://www.transfermarkt.co.uk${href}` : '';
  }

  get isGoalkeeper(): boolean {
    const pos = this.player()?.positionTm?.toLowerCase() ?? '';
    return pos.includes('goalkeeper') || pos.includes('keeper') || pos === 'gk';
  }

  Math = Math;

  get comparisonCategories(): ComparisonCategory[] {
    if (this.isGoalkeeper) {
      return [
        {
          title: 'Performance',
          stats: [
            { key: 'ratingAvg', label: 'Rating' },
            { key: 'minutesPlayed', label: 'Minutes' },
            { key: 'touches', label: 'Touches' },
            { key: 'goalsPrevented', label: 'Goals Prevented' },
          ],
        },
        {
          title: 'Shot Stopping',
          stats: [
            { key: 'savesInsideBox', label: 'Saves (Box)' },
            { key: 'penaltiesSaved', label: 'Penalties Saved' },
            { key: 'shotsBlocked', label: 'Shots Blocked' },
          ],
        },
        {
          title: 'Distribution',
          stats: [
            { key: 'passes', label: 'Total Passes' },
            { key: 'longBalls', label: 'Long Balls' },
            { key: 'longBallsCompleted', label: 'Long Balls Completed' },
            { key: 'possessionsLost', label: 'Possessions Lost' },
          ],
        },
        {
          title: 'Aerial & Positioning',
          stats: [
            { key: 'highClaims', label: 'High Claims' },
            { key: 'punches', label: 'Punches' },
            { key: 'runsOutSuccess', label: 'Successful Runs-Out' },
            { key: 'aerialsWon', label: 'Aerials Won' },
          ],
        },
      ];
    } else {
      return [
        {
          title: 'Performance',
          stats: [
            { key: 'goals', label: 'Goals' },
            { key: 'assists', label: 'Assists' },
            { key: 'ratingAvg', label: 'Rating' },
            { key: 'minutesPlayed', label: 'Minutes' },
          ],
        },
        {
          title: 'Offensive',
          stats: [
            { key: 'shotsOnTarget', label: 'Shots on Target' },
            { key: 'bigChancesCreated', label: 'Big Chances Created' },
            { key: 'keyPasses', label: 'Key Passes' },
            { key: 'dribbleSuccessPct', label: 'Dribble Success %' },
          ],
        },
        {
          title: 'Defensive',
          stats: [
            { key: 'tackles', label: 'Tackles' },
            { key: 'interceptions', label: 'Interceptions' },
            { key: 'clearances', label: 'Clearances' },
            { key: 'defensiveActions', label: 'Defensive Actions' },
          ],
        },
        {
          title: 'Passing',
          stats: [
            { key: 'passes', label: 'Total Passes' },
            { key: 'longBalls', label: 'Long Balls' },
            { key: 'crosses', label: 'Crosses' },
            { key: 'possessionsLost', label: 'Possessions Lost' },
          ],
        },
        {
          title: 'Physical',
          stats: [
            { key: 'aerialsWon', label: 'Aerials Won' },
            { key: 'groundDuelsTotal', label: 'Ground Duels' },
            { key: 'groundDuelsWinPct', label: 'Ground Duel Win %' },
            { key: 'touches', label: 'Touches' },
          ],
        },
      ];
    }
  }

  constructor() {
    combineLatest([this.route.paramMap, this.route.queryParamMap])
      .pipe(
        switchMap(([p, q]) =>
          this.playerService.getPlayer(p.get('name')!, q.get('teamName') ?? '')
        )
      )
      .subscribe({
        next: (row) => {
          this.player.set(row ?? null);
          this.fetchSimilarPlayers(row ?? null);
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

  getPassAccuracy(player: Player): number {
    if (!player.passes || player.passes === 0) return 0;
    return Math.round((player.passesCompleted / player.passes) * 100);
  }

  getCrossAccuracy(player: Player): number {
    if (!player.crosses || player.crosses === 0) return 0;
    return Math.round((player.crossesCompleted / player.crosses) * 100);
  }

  getAerialWinRate(player: Player): number {
    const total = player.aerialsWon + player.aerialsLost;
    if (total === 0) return 0;
    return Math.round((player.aerialsWon / total) * 100);
  }

  getChallengeSuccessRate(player: Player): number {
    const totalChallenges = player.tackles + player.challengeLost;
    if (totalChallenges === 0) return 0;
    return Math.round((player.tackles / totalChallenges) * 100);
  }

  getRunsOutSuccessRate(player: Player): number {
    if (!player.runsOut || player.runsOut === 0) return 0;
    return Math.round((player.runsOutSuccess / player.runsOut) * 100);
  }

  getLongBallAccuracy(player: Player): number {
    if (!player.longBalls || player.longBalls === 0) return 0;
    return Math.round((player.longBallsCompleted / player.longBalls) * 100);
  }

  getPlayerStat(player: Player, statKey: string): string {
    const value = (player as any)[statKey];
    if (value === null || value === undefined) return '0';

    if (statKey.includes('Pct') || statKey.includes('percentage')) {
      return `${value.toFixed(0)}%`;
    }

    if (statKey === 'minutesPlayed' && value > 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }

    if (statKey === 'ratingAvg') {
      return value.toFixed(1);
    }

    return typeof value === 'number'
      ? value.toLocaleString()
      : value.toString();
  }

  getComparisonPercentage(
    player1: Player,
    player2: Player,
    statKey: string,
    side: 'left' | 'right'
  ): number {
    const val1 = +(player1 as any)[statKey] || 0;
    const val2 = +(player2 as any)[statKey] || 0;
    const total = Math.abs(val1) + Math.abs(val2);

    if (total === 0) return 50;

    const leftPct = (Math.abs(val1) / total) * 100;
    return side === 'left' ? leftPct : 100 - leftPct;
  }

  getPlayerImageUrl(player: Player): string {
    return player.imageUrl ?? '';
  }

  isComparisonPlayerGoalkeeper(player: Player): boolean {
    const pos = player?.positionTm?.toLowerCase() ?? '';
    return pos.includes('goalkeeper') || pos.includes('keeper') || pos === 'gk';
  }

  onCompareSearch(term: string) {
    this.compareQuery$.next(term);
  }

  onCompareSelectDialog(event: AutoCompleteSelectEvent) {
    this.playerService
      .getPlayer(event.value.normalizedName, event.value.teamName)
      .subscribe((full) => {
        this.selectedComparisonPlayer.set(full ?? null);
        this.showCompareDialog = false;
        this.showHeadToHeadDialog = true;
      });
  }

  selectSimilarPlayerForComparison(player: Player) {
    this.selectedComparisonPlayer.set(player);
    this.showSimilarPlayersDialog = false;
    this.showHeadToHeadDialog = true;
  }

  compareWithSimilarPlayer(player: Player) {
    this.selectedComparisonPlayer.set(player);
    this.showSimilarPlayersDialog = false;
    this.showHeadToHeadDialog = true;
  }

  navigateToPlayer(player: Player) {
    this.router.navigate(['/player', player.normalizedName], {
      queryParams: { teamName: player.teamName },
    });
    this.selectedComparisonPlayer.set(null);
  }

  clearComparison() {
    this.selectedComparisonPlayer.set(null);
  }

  goBack() {
    this.router.navigate(['']);
  }

  onHeadToHeadDialogClose() {
    this.showHeadToHeadDialog = false;
    this.selectedComparisonPlayer.set(null);
  }

  onViewPlayer1Profile(player: Player) {
    this.showHeadToHeadDialog = false;
  }

  onViewPlayer2Profile(player: Player) {
    this.navigateToPlayer(player);
    this.showHeadToHeadDialog = false;
  }

  private fetchSimilarPlayers(player: Player | null) {
    if (!player) return;
    this.loadingSimilarPlayers = true;

    this.playerService.similarPlayers(player, 8).subscribe((players) => {
      this.loadingSimilarPlayers = false;
      this.similarPlayers.set(players);
    });
  }
}
