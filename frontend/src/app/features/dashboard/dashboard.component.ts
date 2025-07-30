import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableLazyLoadEvent, TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { PanelModule } from 'primeng/panel';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { Formation, FORMATIONS } from './dashboard.model';
import { FormsModule } from '@angular/forms';
import { DashboardStore } from '../../core/state/dashboard.store';
import { Router } from '@angular/router';
import { Player } from '../../core/api/player.model';
import { SliderModule } from 'primeng/slider';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    CardModule,
    TableModule,
    InputTextModule,
    SelectModule,
    PanelModule,
    ToolbarModule,
    SliderModule,
    InputNumberModule,
    TagModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private router = inject(Router);
  private store = inject(DashboardStore);

  stats = this.store.stats;
  pageSlice = this.store.currentSlice;
  competitionsOptions = this.store.competitionsOptions;
  total = this.store.total;

  /* dropdown data */
  positionsOptions = this.store.positionsOptions;
  teamsOptions = this.store.teamsOptions;
  competitionsCnt = this.store.competitionsCount;
  positionsCnt = this.store.positionsCount;

  selectedPos: string | null = null;
  selectedTeam: string | null = null;
  selectedComp: string | null = null;
  ageRange: [number, number] = [15, 50];
  minutesMin: number | null = null;
  mvRange: [number, number] = [0, 50_000_000];

  formations = FORMATIONS;
  selectedFormation = this.formations[0];

  applyFilters(): void {
    this.store.setPosition(this.selectedPos);
    this.store.setTeam(this.selectedTeam);
    this.store.setCompetition(this.selectedComp);
    this.store.setAgeRange(this.ageRange);
    this.store.setMinutesMin(this.minutesMin);
    this.store.setMarketRange(this.mvRange);

    this.store.ensureChunk({ first: 0 } as any);
  }

  clearFilters(): void {
    this.selectedPos = null;
    this.selectedTeam = null;
    this.selectedComp = null;
    this.ageRange = [15, 50];
    this.minutesMin = null;
    this.mvRange = [0, 50_000_000];

    this.store.setPosition(null);
    this.store.setTeam(null);
    this.store.setCompetition(null);
    this.store.setAgeRange(this.ageRange);
    this.store.setMinutesMin(null);
    this.store.setMarketRange(this.mvRange);

    this.store.ensureChunk({ first: 0 } as any);
  }

  onLazy(event: TableLazyLoadEvent): void {
    this.store.ensureChunk(event);
  }

  positions() {
    return Object.entries(this.selectedFormation.positions).map(
      ([label, { bottom, left }]) => ({ label, bottom, left })
    );
  }

  selectFormation(f: Formation) {
    this.selectedFormation = f;
  }
  getPlayerInitials(name: string): string {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getPositionTagStyle(position: string | null | undefined) {
    const clrByKeyword: Record<string, string> = {
      goalkeeper: '#2563eb',
      defender: '#059669',
      midfield: '#7c3aed',
      attack: '#dc2626',
    };

    const txt = (position ?? '').toLowerCase();

    const hex =
      Object.entries(clrByKeyword).find(([kw]) => txt.includes(kw))?.[1] ??
      'var(--p-primary-600)'; // fallback

    return { 'background-color': hex, color: 'white' };
  }

  navigateToPlayer(player: Player) {
    this.router.navigate(['/player', player.normalizedName], {
      queryParams: {
        teamName: player.teamName,
      },
    });
  }
}
