export type GameState = 'MENU' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

export type GameMode = 'timed' | 'ammo' | 'carnival' | 'boss';

export type WeaponId = 'cork' | 'bb' | 'slingshot' | 'golden_rifle';

export interface Weapon {
  id: WeaponId;
  name: string;
  nameEn: string;
  description: string;
  capacity: number;
  reloadTimeMs: number;
  fireRateMs: number;
  hitRadius: number; // in pixels
  knockback: number; // for cans
  scoreMultiplier: number;
  iconName: string;
  ammoType: string;
  unlocked: boolean;
  costTickets?: number;
}

export type BalloonColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'gold' | 'bomb' | 'mystery';

export interface BalloonTarget {
  id: string;
  row: number;
  col: number;
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  radius: number; // percentage
  color: BalloonColor;
  popped: boolean;
  respawnTimer?: number;
  points: number;
  wobbleOffset: number;
}

export interface TinCanTarget {
  id: string;
  row: number; // 0 (bottom), 1 (middle), 2 (top)
  col: number;
  x: number; // percentage
  y: number; // percentage
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  knocked: boolean;
  points: number;
  color: string;
  label: string;
}

export interface MovingDuckTarget {
  id: string;
  x: number; // percentage
  y: number; // percentage
  speed: number; // percentage per second
  direction: 1 | -1;
  points: number;
  hit: boolean;
  duckType: 'yellow' | 'gold' | 'special';
  hitTime?: number;
}

export interface EasterEggTarget {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  active: boolean;
  hit: boolean;
  points: number;
  type: 'roach' | 'lucky_cat';
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  createdAt: number;
  scale?: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  shape?: 'circle' | 'square' | 'line';
}

export interface PrizeItem {
  id: string;
  name: string;
  nameEn: string;
  category: 'snack' | 'toy' | 'souvenir' | 'legendary';
  ticketsRequired: number;
  description: string;
  icon: string;
  badge?: string;
  ownedCount: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  tickets: number;
  totalTicketsEarned: number;
  shotsFired: number;
  shotsHit: number;
  balloonsPopped: number;
  cansKnocked: number;
  ducksHit: number;
  maxCombo: number;
  currentCombo: number;
  accuracy: number;
}

export interface UserSession {
  username: string;
  lastLoginTime: string;
  isLoggedIn: boolean;
}

export interface SheetGameRecord {
  time: string;
  playerName: string;
  gameMode: string;
  score: number;
  accuracy: string;
  totalHits: number;
  maxCombo: number;
  weapon: string;
  coinsEarned: number;
}

