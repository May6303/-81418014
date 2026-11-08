import { PrizeItem, Weapon } from '../types/game';
import { INITIAL_PRIZES, INITIAL_WEAPONS } from './constants';

const HIGH_SCORE_KEY = 'nightmarket_sharpshooter_high_score';
const TICKETS_KEY = 'nightmarket_sharpshooter_tickets';
const PRIZES_KEY = 'nightmarket_sharpshooter_prizes';
const WEAPONS_KEY = 'nightmarket_sharpshooter_weapons';
const STATS_KEY = 'nightmarket_sharpshooter_stats';

export interface SavedStats {
  gamesPlayed: number;
  totalShots: number;
  totalHits: number;
  totalBalloons: number;
  totalCans: number;
  totalDucks: number;
}

export function loadHighScore(): number {
  try {
    const val = localStorage.getItem(HIGH_SCORE_KEY);
    return val ? parseInt(val, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number): void {
  try {
    const current = loadHighScore();
    if (score > current) {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
    }
  } catch {
    // ignore
  }
}

export function loadTickets(): number {
  try {
    const val = localStorage.getItem(TICKETS_KEY);
    return val !== null ? parseInt(val, 10) : 50; // default 50 welcome tickets
  } catch {
    return 50;
  }
}

export function saveTickets(tickets: number): void {
  try {
    localStorage.setItem(TICKETS_KEY, tickets.toString());
  } catch {
    // ignore
  }
}

export function loadPrizes(): PrizeItem[] {
  try {
    const val = localStorage.getItem(PRIZES_KEY);
    if (!val) return INITIAL_PRIZES;
    const parsed = JSON.parse(val) as PrizeItem[];
    // merge with any new initial prizes
    return INITIAL_PRIZES.map((item) => {
      const found = parsed.find((p) => p.id === item.id);
      return found ? { ...item, ownedCount: found.ownedCount } : item;
    });
  } catch {
    return INITIAL_PRIZES;
  }
}

export function savePrizes(prizes: PrizeItem[]): void {
  try {
    localStorage.setItem(PRIZES_KEY, JSON.stringify(prizes));
  } catch {
    // ignore
  }
}

export function loadWeapons(): Weapon[] {
  try {
    const val = localStorage.getItem(WEAPONS_KEY);
    if (!val) return INITIAL_WEAPONS;
    const parsed = JSON.parse(val) as Weapon[];
    return INITIAL_WEAPONS.map((item) => {
      const found = parsed.find((w) => w.id === item.id);
      return found ? { ...item, unlocked: found.unlocked } : item;
    });
  } catch {
    return INITIAL_WEAPONS;
  }
}

export function saveWeapons(weapons: Weapon[]): void {
  try {
    localStorage.setItem(WEAPONS_KEY, JSON.stringify(weapons));
  } catch {
    // ignore
  }
}

export function loadStats(): SavedStats {
  try {
    const val = localStorage.getItem(STATS_KEY);
    if (val) return JSON.parse(val);
  } catch {
    // ignore
  }
  return {
    gamesPlayed: 0,
    totalShots: 0,
    totalHits: 0,
    totalBalloons: 0,
    totalCans: 0,
    totalDucks: 0,
  };
}

export function updateStats(partial: Partial<SavedStats>): void {
  try {
    const current = loadStats();
    const updated = {
      gamesPlayed: current.gamesPlayed + (partial.gamesPlayed || 0),
      totalShots: current.totalShots + (partial.totalShots || 0),
      totalHits: current.totalHits + (partial.totalHits || 0),
      totalBalloons: current.totalBalloons + (partial.totalBalloons || 0),
      totalCans: current.totalCans + (partial.totalCans || 0),
      totalDucks: current.totalDucks + (partial.totalDucks || 0),
    };
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}
