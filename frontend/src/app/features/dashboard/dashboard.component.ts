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

interface Player {
  name: string;
  position: string;
  team: string;
  age: number;
  rating: number;
  marketValue?: string;
}

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

  positionsOptions = [
    { label: 'Goalkeeper', value: 'GK' },
    { label: 'Defender', value: 'DEF' },
    { label: 'Midfielder', value: 'MID' },
    { label: 'Forward', value: 'FWD' },
  ];

  teams = [
    { label: 'Barcelona', value: 'barcelona' },
    { label: 'Real Madrid', value: 'real_madrid' },
    { label: 'Manchester City', value: 'man_city' },
    { label: 'Bayern Munich', value: 'bayern' },
    { label: 'Liverpool', value: 'liverpool' },
  ];

  samplePlayers: Player[] = [
    {
      name: 'Lionel Messi',
      position: 'RW',
      team: 'Inter Miami',
      age: 36,
      rating: 9.2,
      marketValue: '€25M',
    },
    {
      name: 'Erling Haaland',
      position: 'ST',
      team: 'Manchester City',
      age: 23,
      rating: 9.0,
      marketValue: '€180M',
    },
    {
      name: 'Kevin De Bruyne',
      position: 'CM',
      team: 'Manchester City',
      age: 32,
      rating: 8.8,
      marketValue: '€75M',
    },
    {
      name: 'Virgil van Dijk',
      position: 'CB',
      team: 'Liverpool',
      age: 32,
      rating: 8.7,
      marketValue: '€45M',
    },
    {
      name: 'Alisson Becker',
      position: 'GK',
      team: 'Liverpool',
      age: 30,
      rating: 8.5,
      marketValue: '€55M',
    },
  ];

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
      LB: '#059669',
      RB: '#059669',
      CM: '#7c3aed',
      LM: '#7c3aed',
      RM: '#7c3aed',
      ST: '#dc2626',
      LW: '#dc2626',
      RW: '#dc2626',
    };

    return {
      'background-color': colors[position] || 'var(--p-primary-600)',
      color: 'white',
    };
  }
}
