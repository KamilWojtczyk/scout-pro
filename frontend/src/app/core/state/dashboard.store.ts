import { Injectable, signal, computed, inject } from '@angular/core';
import { PlayerService } from '../api/player.service';
import { Player } from '../api/player.model';
import { TableLazyLoadEvent } from 'primeng/table';

function cleanParams<T extends Record<string, unknown>>(
  src: T
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(src)) {
    if (v !== null && v !== undefined && v !== '') out[k] = String(v);
  }
  return out;
}

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(PlayerService);

  private readonly CHUNK_SIZE = 1000;
  private readonly PAGE_SIZE = 11;

  private readonly posFilter = signal<string | null>(null);
  private readonly teamFilter = signal<string | null>(null);
  private readonly compFilter = signal<string | null>(null);
  private readonly ageMin = signal<number | null>(null);
  private readonly ageMax = signal<number | null>(null);
  private readonly minutesMin = signal<number | null>(null);
  private readonly mvMin = signal<number | null>(null); // market value €
  private readonly mvMax = signal<number | null>(null);
  private readonly search = signal<string | null>(null);

  readonly stats = signal({
    total_players: 0,
    positions: {} as Record<string, number>,
    seasons: {} as Record<string, number>,
    competitions: {} as Record<string, number>,
    teams: {} as Record<string, number>,
  });

  private readonly _chunks = signal(new Map<number, Player[]>());
  readonly total = signal(0);
  readonly currentSlice = signal<Player[]>([]);

  constructor() {
    this.api.stats().subscribe(this.stats.set);
  }

  ensureChunk(evt: TableLazyLoadEvent): void {
    const first = evt.first ?? 0;
    const chunkIndex = Math.floor(first / this.CHUNK_SIZE);

    if (!this._chunks().has(chunkIndex)) {
      const skip = chunkIndex * this.CHUNK_SIZE;
      const limit = this.CHUNK_SIZE;

      const params = cleanParams({
        skip,
        limit,
        position: this.posFilter(),
        team: this.teamFilter(),
        competition: this.compFilter(),
        min_age: this.ageMin(),
        max_age: this.ageMax(),
        min_minutes: this.minutesMin(),
        min_market_value: this.mvMin(),
        max_market_value: this.mvMax(),
        search: this.search(),
      });

      this.api.list(params).subscribe((res) => {
        this._chunks.update((m) => new Map(m).set(chunkIndex, res.players));
        this.total.set(res.total);
        this.updateSlice(first);
      });
    } else {
      this.updateSlice(first);
    }
  }

  private updateSlice(firstRow: number): void {
    const chunkIndex = Math.floor(firstRow / this.CHUNK_SIZE);
    const start = firstRow % this.CHUNK_SIZE;
    const chunk = this._chunks().get(chunkIndex) ?? [];
    this.currentSlice.set(chunk.slice(start, start + this.PAGE_SIZE));
  }

  /* ─────────── mutators ────────────── */
  setPosition(p: string | null) {
    this.posFilter.set(p);
    this.reset();
  }
  setTeam(t: string | null) {
    this.teamFilter.set(t);
    this.reset();
  }
  setCompetition(c: string | null) {
    this.compFilter.set(c);
    this.reset();
  }
  setAgeRange([min, max]: [number | null, number | null]) {
    this.ageMin.set(min);
    this.ageMax.set(max);
    this.reset();
  }
  setMinutesMin(m: number | null) {
    this.minutesMin.set(m);
    this.reset();
  }
  setMarketRange([min, max]: [number | null, number | null]) {
    this.mvMin.set(min);
    this.mvMax.set(max);
    this.reset();
  }
  setSearch(q: string | null) {
    this.search.set(q);
    this.reset();
  }

  private reset(): void {
    this._chunks.set(new Map());
    this.total.set(0);
    this.currentSlice.set([]);
  }

  readonly positionsOptions = computed(() =>
    Object.keys(this.stats().positions).map((label) => ({
      label,
      value: label,
    }))
  );

  readonly teamsOptions = computed(() =>
    Object.keys(this.stats().teams).map((label) => ({ label, value: label }))
  );

  readonly competitionsOptions = computed(() =>
    Object.keys(this.stats().competitions).map((label) => ({
      label,
      value: label,
    }))
  );

  readonly competitionsCount = computed(
    () => Object.keys(this.stats().competitions).length
  );

  readonly positionsCount = computed(
    () => Object.keys(this.stats().positions).length
  );
}

// ---------------------------------------------------------------------------
//  End of file
// ---------------------------------------------------------------------------
