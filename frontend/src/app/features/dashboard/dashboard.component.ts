import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { PanelModule } from 'primeng/panel';
import { ToolbarModule } from 'primeng/toolbar';
import { TagModule } from 'primeng/tag';
import { Formation, FORMATIONS } from './dashboard.model';
import { FormsModule } from '@angular/forms';
import { DashboardStore } from '../../core/state/dashboard.store';

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
    DropdownModule,
    PanelModule,
    ToolbarModule,
    TagModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private store = new DashboardStore();

  players = this.store.players;
  stats = this.store.stats;
  totalPages = this.store.totalPages;
  competitionsCnt = this.store.competitionsCount;
  positionsCnt = this.store.positionsCount;

  formations = FORMATIONS;
  selectedFormation = this.formations[0];

  positions() {
    return Object.entries(this.selectedFormation.positions).map(
      ([label, { bottom, left }]) => ({ label, bottom, left })
    );
  }

  selectFormation(f: Formation) {
    this.selectedFormation = f;
  }

  positionsOptions = this.store.positionsOptions;
  teams = this.store.teamsOptions;
  getPlayerInitials(name: string): string {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  getPositionTagStyle(position: string) {
    const colors: { [key: string]: string } = {
      GK: '#2563eb',
      CB: '#059669',
      FB: '#059669',
      CM: '#7c3aed',
      DM: '#7c3aed',
      FOR: '#dc2626',
      ST: '#dc2626',
    };

    return {
      'background-color': colors[position] || 'var(--p-primary-600)',
      color: 'white',
    };
  }
}
