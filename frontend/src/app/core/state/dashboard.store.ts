import { Injectable, signal, computed, inject } from '@angular/core';
import { PlayerService } from '../api/player.service';
import { Player } from '../api/player.model';
import { TableLazyLoadEvent } from 'primeng/table';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly api = inject(PlayerService);

  private readonly CHUNK_SIZE = 1000; // rows fetched per HTTP request
  private readonly PAGE_SIZE = 11; // rows rendered per <p-table> page

  private readonly posFilter = signal<string | null>(null);
  private readonly teamFilter = signal<string | null>(null);
  private readonly search = signal<string | null>(null);

  readonly stats = signal({
    total_players: 0,
    positions: {} as Record<string, number>,
    seasons: {} as Record<string, number>,
    competitions: {} as Record<string, number>,
    teams: {} as Record<string, number>,
  });

  private readonly _chunks = signal(new Map<number, Player[]>()); // key = chunk
  readonly total = signal(0); // total rows
  readonly currentSlice = signal<Player[]>([]); // 11‑row view

  constructor() {
    this.api.stats().subscribe(this.stats.set);
  }

  ensureChunk(evt: TableLazyLoadEvent): void {
    const first = evt.first ?? 0; // row index requested
    const chunkIndex = Math.floor(first / this.CHUNK_SIZE);

    if (!this._chunks().has(chunkIndex)) {
      const skip = chunkIndex * this.CHUNK_SIZE;
      const limit = this.CHUNK_SIZE;

      const params = {
        skip,
        limit,
        position: this.posFilter(),
        team: this.teamFilter(),
        search: this.search(),
      } as const;

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
    const startInChunk = firstRow % this.CHUNK_SIZE;

    const chunk = this._chunks().get(chunkIndex) ?? [];
    this.currentSlice.set(
      chunk.slice(startInChunk, startInChunk + this.PAGE_SIZE)
    );
  }

  setPosition(pos: string | null): void {
    this.posFilter.set(pos);
    this.reset();
  }
  setTeam(team: string | null): void {
    this.teamFilter.set(team);
    this.reset();
  }
  setSearch(q: string | null): void {
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

  readonly competitionsCount = computed(
    () => Object.keys(this.stats().competitions).length
  );

  readonly positionsCount = computed(
    () => Object.keys(this.stats().positions).length
  );
}
