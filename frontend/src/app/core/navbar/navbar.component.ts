import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  AutoCompleteModule,
  AutoCompleteSelectEvent,
} from 'primeng/autocomplete';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  of,
  Subject,
  switchMap,
  tap,
} from 'rxjs';
import { PlayerMeta } from '../api/player.model';
import { PlayerService } from '../api/player.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, AutoCompleteModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  private router = inject(Router);
  private playerService = inject(PlayerService);

  private query$ = new Subject<string>();
  results = signal<PlayerMeta[]>([]);

  constructor() {
    this.query$
      .pipe(
        tap((q) => {
          if (q.trim().length < 2) this.results.set([]);
        }),
        map((q) => q.trim()),
        filter((q) => q.length >= 2),
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((q) =>
          this.playerService.searchPlayers(q).pipe(catchError(() => of([])))
        )
      )
      .subscribe((list) => this.results.set(list));
  }

  onSearch(q: string) {
    this.query$.next(q);
  }

  onPick(meta: AutoCompleteSelectEvent) {
    this.router.navigate(['/player', meta.value.original_player_name], {
      queryParams: { team: meta.value.team, season: meta.value.season },
    });
  }

  navigateToHomePage(): void {
    this.router.navigate(['']);
  }
}
