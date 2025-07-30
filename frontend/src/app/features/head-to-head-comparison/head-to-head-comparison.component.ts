import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { Player } from '../../core/api/player.model';

interface StatComparison {
  key: string;
  label: string;
}

interface StatCategory {
  title: string;
  stats: StatComparison[];
}

@Component({
  selector: 'app-head-to-head-comparison',
  standalone: true,
  imports: [CommonModule, DialogModule, ButtonModule, TagModule],
  template: `
    <p-dialog
      [(visible)]="visible"
      [modal]="true"
      [style]="{ width: '95vw', maxWidth: '1200px', height: '90vh' }"
      [closable]="false"
      [draggable]="false"
      [resizable]="false"
      styleClass="head-to-head-dialog"
      (onHide)="onClose()"
    >
      <div class="head-to-head-container">
        <!-- Close button -->
        <button class="close-button" (click)="onClose()" type="button">
          <i class="pi pi-times"></i>
        </button>

        <!-- Header -->
        <div class="text-center mb-2">
          <h1 class="head-to-head-title">HEAD TO HEAD</h1>
        </div>

        <!-- Player Info Cards -->
        <div class="player-cards-container">
          <!-- Player 1 Card -->
          <div class="player-card player-1">
            <div class="player-card-content">
              <div class="flex align-items-center gap-4">
                <img
                  [src]="player1.imageUrl || '/assets/placeholder-player.png'"
                  [alt]="player1.originalPlayerName"
                  class="player-avatar player-1-avatar"
                  onerror="this.src='/assets/placeholder-player.png'"
                />
                <div class="flex-1">
                  <h2 class="player-name">{{ player1.originalPlayerName }}</h2>
                  <p class="player-info">
                    {{ player1.teamName }} •
                    {{ player1.positionTm || 'Player' }}
                  </p>
                  <p-tag
                    [value]="player1.ratingAvg + '/10'"
                    severity="warning"
                    class="rating-tag"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- VS -->
          <div class="vs-divider">
            <span>VS</span>
          </div>

          <!-- Player 2 Card -->
          <div class="player-card player-2">
            <div
              class="player-card-content clickable-card"
              (click)="onViewPlayer2Profile()"
            >
              <div class="flex align-items-center gap-4">
                <div class="flex-1 text-right">
                  <h2 class="player-name">{{ player2.originalPlayerName }}</h2>
                  <p class="player-info">
                    {{ player2.teamName }} •
                    {{ player2.positionTm || 'Player' }}
                  </p>
                  <p-tag
                    [value]="player2.ratingAvg + '/10'"
                    severity="info"
                    class="rating-tag"
                  />
                </div>
                <img
                  [src]="player2.imageUrl || '/assets/placeholder-player.png'"
                  [alt]="player2.originalPlayerName"
                  class="player-avatar player-2-avatar"
                  onerror="this.src='/assets/placeholder-player.png'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Categories -->
        <div class="stats-categories-container">
          @for (category of statCategories; track category.title) {
          <div class="stats-category">
            <h3 class="category-title">{{ category.title }}</h3>
            <div class="stats-list">
              @for (stat of category.stats; track stat.key) {
              <div class="stat-comparison-row">
                <!-- Player 1 Value -->
                <div class="stat-value stat-value-left">
                  {{ getPlayerStat(player1, stat.key) }}
                </div>

                <!-- Center section with bars and label -->
                <div class="stat-center">
                  <div class="stat-bars">
                    <div class="stat-bar-container">
                      <!-- Left bar (Player 1) -->
                      <div class="stat-bar-left">
                        <div
                          class="stat-bar-fill stat-bar-fill-left"
                          [style.width.%]="
                            getComparisonPercentage(
                              player1,
                              player2,
                              stat.key,
                              'left'
                            )
                          "
                        ></div>
                      </div>

                      <!-- Right bar (Player 2) -->
                      <div class="stat-bar-right">
                        <div
                          class="stat-bar-fill stat-bar-fill-right"
                          [style.width.%]="
                            getComparisonPercentage(
                              player1,
                              player2,
                              stat.key,
                              'right'
                            )
                          "
                        ></div>
                      </div>
                    </div>
                  </div>

                  <!-- Label -->
                  <div class="stat-label">{{ stat.label }}</div>
                </div>

                <!-- Player 2 Value -->
                <div class="stat-value stat-value-right">
                  {{ getPlayerStat(player2, stat.key) }}
                </div>
              </div>
              }
            </div>
          </div>
          }
        </div>
      </div>
    </p-dialog>
  `,
  styleUrls: ['./head-to-head-comparison.component.scss'],
})
export class HeadToHeadComparisonComponent implements OnInit {
  @Input() visible: boolean = false;
  @Input() player1!: Player;
  @Input() player2!: Player;

  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() viewPlayer1 = new EventEmitter<Player>();
  @Output() viewPlayer2 = new EventEmitter<Player>();

  statCategories: StatCategory[] = [];

  ngOnInit() {
    this.initializeStatCategories();
  }

  onClose() {
    this.visible = false;
    this.visibleChange.emit(false);
  }

  onViewPlayer2Profile() {
    this.viewPlayer2.emit(this.player2);
  }

  getFirstName(fullName: string): string {
    return fullName.split(' ')[0];
  }

  getPlayerStat(player: Player, statKey: string): string {
    const value = (player as any)[statKey];
    if (value === null || value === undefined) return '0';

    if (
      statKey.includes('Pct') ||
      statKey.includes('percentage') ||
      statKey.includes('Accuracy')
    ) {
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

  private initializeStatCategories() {
    const isPlayer1Goalkeeper = this.isGoalkeeper(this.player1);
    const isPlayer2Goalkeeper = this.isGoalkeeper(this.player2);

    if (isPlayer1Goalkeeper || isPlayer2Goalkeeper) {
      this.statCategories = this.getGoalkeeperStatCategories();
    } else {
      this.statCategories = this.getOutfieldStatCategories();
    }
  }

  private isGoalkeeper(player: Player): boolean {
    const pos = player?.positionTm?.toLowerCase() ?? '';
    return pos.includes('goalkeeper') || pos.includes('keeper') || pos === 'gk';
  }

  private getOutfieldStatCategories(): StatCategory[] {
    return [
      {
        title: 'PERFORMANCE',
        stats: [
          { key: 'goals', label: 'GOALS' },
          { key: 'assists', label: 'ASSISTS' },
          { key: 'ratingAvg', label: 'RATING' },
          { key: 'minutesPlayed', label: 'MINUTES PLAYED' },
          { key: 'touches', label: 'TOUCHES' },
        ],
      },
      {
        title: 'OFFENSIVE',
        stats: [
          { key: 'shotsOnTarget', label: 'SHOTS ON TARGET' },
          { key: 'shotsOffTarget', label: 'SHOTS OFF TARGET' },
          { key: 'bigChancesCreated', label: 'BIG CHANCES CREATED' },
          { key: 'bigChancesMissed', label: 'BIG CHANCES MISSED' },
          { key: 'keyPasses', label: 'KEY PASSES' },
          { key: 'dribblesCompleted', label: 'DRIBBLES COMPLETED' },
          { key: 'dribbleSuccessPct', label: 'DRIBBLE SUCCESS %' },
          { key: 'offsides', label: 'OFFSIDES' },
        ],
      },
      {
        title: 'DEFENSIVE',
        stats: [
          { key: 'tackles', label: 'TACKLES' },
          { key: 'interceptions', label: 'INTERCEPTIONS' },
          { key: 'defensiveActions', label: 'DEFENSIVE ACTIONS' },
          { key: 'clearances', label: 'CLEARANCES' },
          { key: 'blockedShots', label: 'BLOCKED SHOTS' },
          { key: 'aerialsWon', label: 'AERIALS WON' },
          { key: 'aerialsLost', label: 'AERIALS LOST' },
          { key: 'groundDuelsTotal', label: 'GROUND DUELS TOTAL' },
          { key: 'groundDuelsWinPct', label: 'GROUND DUELS WIN %' },
        ],
      },
      {
        title: 'PASSING',
        stats: [
          { key: 'passes', label: 'TOTAL PASSES' },
          { key: 'passesCompleted', label: 'PASSES COMPLETED' },
          { key: 'longBalls', label: 'LONG BALLS' },
          { key: 'longBallsCompleted', label: 'LONG BALLS COMPLETED' },
          { key: 'crosses', label: 'CROSSES' },
          { key: 'crossesCompleted', label: 'CROSSES COMPLETED' },
          { key: 'possessionsLost', label: 'POSSESSIONS LOST' },
        ],
      },
      {
        title: 'DISCIPLINE',
        stats: [
          { key: 'foulsCommitted', label: 'FOULS COMMITTED' },
          { key: 'timesFouled', label: 'TIMES FOULED' },
          { key: 'challengeLost', label: 'CHALLENGES LOST' },
        ],
      },
    ];
  }

  private getGoalkeeperStatCategories(): StatCategory[] {
    return [
      {
        title: 'PERFORMANCE',
        stats: [
          { key: 'ratingAvg', label: 'RATING' },
          { key: 'minutesPlayed', label: 'MINUTES PLAYED' },
          { key: 'touches', label: 'TOUCHES' },
          { key: 'goalsPrevented', label: 'GOALS PREVENTED' },
        ],
      },
      {
        title: 'SHOT STOPPING',
        stats: [
          { key: 'savesInsideBox', label: 'SAVES (BOX)' },
          { key: 'penaltiesSaved', label: 'PENALTIES SAVED' },
          { key: 'shotsBlocked', label: 'SHOTS BLOCKED' },
          { key: 'goals', label: 'GOALS CONCEDED' },
        ],
      },
      {
        title: 'DISTRIBUTION',
        stats: [
          { key: 'passes', label: 'TOTAL PASSES' },
          { key: 'passesCompleted', label: 'PASSES COMPLETED' },
          { key: 'longBalls', label: 'LONG BALLS' },
          { key: 'longBallsCompleted', label: 'LONG BALLS COMPLETED' },
          { key: 'possessionsLost', label: 'POSSESSIONS LOST' },
        ],
      },
      {
        title: 'AERIAL & POSITIONING',
        stats: [
          { key: 'highClaims', label: 'HIGH CLAIMS' },
          { key: 'punches', label: 'PUNCHES' },
          { key: 'runsOutSuccess', label: 'SUCCESSFUL RUNS-OUT' },
          { key: 'aerialsWon', label: 'AERIALS WON' },
        ],
      },
    ];
  }
}
