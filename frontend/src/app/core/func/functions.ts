import { Bucket, MAP, Player } from '../api/player.model';

export function bucketOf(posRaw: string | undefined): Bucket {
  const p = (posRaw ?? '').toLowerCase();

  if (p.includes('keeper')) return 'GK';

  if (p.includes('centre-back')) return 'CB';
  if (p.includes('left-back')) return 'LB';
  if (p.includes('right-back')) return 'RB';

  if (p.includes('defensive midfield')) return 'DM';
  if (p.includes('attacking midfield')) return 'AM';
  if (p.includes('central midfield')) return 'CM';
  if (p.includes('midfield')) return 'CM';

  if (p.includes('wing')) return 'W';

  if (p.includes('forward') || p.includes('striker') || p.includes('attack'))
    return 'ST';

  if (p.includes('defender')) return 'CB';

  return 'ST';
}

export function buildNormalisers(rows: Player[], keys: (keyof Player)[]) {
  const min: Record<string, number> = {};
  const max: Record<string, number> = {};
  for (const k of keys) {
    min[k as string] = Number.POSITIVE_INFINITY;
    max[k as string] = Number.NEGATIVE_INFINITY;
  }
  for (const r of rows) {
    keys.forEach((k) => {
      const v = +(r as any)[k] || 0;
      if (v < min[k as string]) min[k as string] = v;
      if (v > max[k as string]) max[k as string] = v;
    });
  }
  return { min, max };
}

export function vector(
  player: Player,
  keys: (keyof Player)[],
  norm: { min: Record<string, number>; max: Record<string, number> }
): number[] {
  return keys.map((k) => {
    const x = +(player as any)[k] || 0;
    const range = norm.max[k as string] - norm.min[k as string] || 1;
    return (x - norm.min[k as string]) / range;
  });
}

export function euclidean(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, x, i) => sum + (x - b[i]) ** 2, 0));
}

export function similarityPct(dist: number): number {
  return Math.round((1 / (1 + dist)) * 100);
}

export function toCamel(header: string): string {
  const hasSep = /[^A-Za-z0-9]/.test(header);
  const hasUpper = /[A-Z]/.test(header);

  if (!hasSep && hasUpper) {
    return header[0].toLowerCase() + header.slice(1);
  }

  const clean = header
    .replace(/%/g, 'Pct')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return clean
    .split('_')
    .map((w, i) =>
      i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');
}

export function mvToNumber(v?: string | null): number | null {
  if (!v) return null;
  const num = parseFloat(v.replace(/[^\d.]/g, ''));
  if (isNaN(num)) return null;
  return /m/i.test(v) ? num * 1_000_000 : /k/i.test(v) ? num * 1_000 : num;
}

export function norm(s: string): string {
  return s
    ?.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function formationLabelToBucket(label: string): Bucket {
  return MAP[label.toUpperCase()] ?? 'ST';
}
