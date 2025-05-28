import { computed, effect, Injectable, signal } from '@angular/core';
import { PlayerService } from '../api/player.service';
import { inject } from '@angular/core';
import { Player } from '../api/player.model';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private api = inject(PlayerService);

  // --- query params --------------------
  private posFilter = signal<string | null>(null);
  private teamFilter = signal<string | null>(null);
  private search = signal<string | null>(null);
  private page = signal(0);

  // --- api responses -------------------
  readonly stats = signal({
    total_players: 0,
    positions: {},
    seasons: {},
    competitions: {},
    teams: {},
  });
  readonly players = signal<Player[]>([]);
  readonly total = signal(0);

  // --- bootstrap -----------------------------------------------------------
  constructor() {
    this.api.stats().subscribe(this.stats.set);

    effect(() => {
      const params = {
        skip: this.page() * 10,
        limit: 1000,
        // position: this.posFilter(),
        // team: this.teamFilter(),
        // search: this.search(),
      };

      this.api.list(params).subscribe((res) => {
        this.players.set(res.players);
        this.total.set(res.total);
      });
    });
  }

  // --- public mutators -----------------------------------------------------
  setPosition(pos: string | null) {
    this.posFilter.set(pos);
    this.page.set(0);
  }
  setTeam(team: string | null) {
    this.teamFilter.set(team);
    this.page.set(0);
  }
  setSearch(q: string | null) {
    this.search.set(q);
    this.page.set(0);
  }
  nextPage() {
    this.page.update((p) => p + 1);
  }
  prevPage() {
    this.page.update((p) => Math.max(0, p - 1));
  }

  // --- selectors -----------------------------------------------------------
  readonly totalPages = computed(() => Math.ceil(this.total() / 10));

  readonly competitionsCount = computed(
    () => Object.keys(this.stats().competitions).length
  );

  readonly positionsCount = computed(
    () => Object.keys(this.stats().positions).length
  );

  readonly positionsOptions = computed(() =>
    Object.keys(this.stats().positions).map((pos) => ({
      label: pos,
      value: pos,
    }))
  );

  readonly teamsOptions = computed(() =>
    Object.keys(this.stats().teams).map((team) => ({
      label: team,
      value: team,
    }))
  );
}
