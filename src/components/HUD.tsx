import React from 'react';
import { Weapon, GameMode } from '../types/game';
import { RotateCcw, Clock, Flame, Target, MessageSquare } from 'lucide-react';

interface HUDProps {
  score: number;
  currentCombo: number;
  maxCombo: number;
  ammo: number;
  maxAmmo: number;
  isReloading: boolean;
  reloadProgress: number; // 0 to 1
  timeLeft: number;
  gameMode: GameMode;
  currentWeapon: Weapon;
  onReload: () => void;
  onOpenWeapons: () => void;
  onSelectMode: (mode: GameMode) => void;
  ownerQuote: string;
}

export const HUD: React.FC<HUDProps> = ({
  score,
  currentCombo,
  ammo,
  maxAmmo,
  isReloading,
  reloadProgress,
  timeLeft,
  gameMode,
  currentWeapon,
  onReload,
  onOpenWeapons,
  onSelectMode,
  ownerQuote,
}) => {
  return (
    <div className="w-full bg-stone-950/90 border-b border-amber-900/40 px-3 md:px-6 py-2.5 backdrop-blur-sm shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-stone-200">
        
        {/* Left Section: Modes & Weapon Info */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          {/* Mode Selector */}
          <div className="flex items-center gap-1 bg-stone-900/90 p-1 rounded-lg border border-stone-800 text-xs">
            <button
              onClick={() => onSelectMode('timed')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                gameMode === 'timed'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              限時 60秒
            </button>
            <button
              onClick={() => onSelectMode('ammo')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                gameMode === 'ammo'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              限量 25發
            </button>
            <button
              onClick={() => onSelectMode('carnival')}
              className={`px-2.5 py-1 rounded font-medium transition-colors whitespace-nowrap shrink-0 ${
                gameMode === 'carnival'
                  ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              無限暢射
            </button>
          </div>

          {/* Current Weapon Badge */}
          <button
            onClick={onOpenWeapons}
            title="點擊切換槍械"
            className="flex items-center gap-2 px-3 py-1 bg-stone-900 hover:bg-stone-800 border border-amber-900/40 rounded-lg text-xs transition-colors group"
          >
            <span className="text-amber-400 font-bold group-hover:underline">
              {currentWeapon.name}
            </span>
            <span className="text-stone-500 text-[11px]">
              ({currentWeapon.ammoType})
            </span>
            <span className="text-[10px] text-amber-500 bg-amber-950/80 px-1 rounded border border-amber-800/50">
              切換
            </span>
          </button>
        </div>

        {/* Center Section: Core Game Telemetry (Score, Time/Bullets, Combo) */}
        <div className="flex items-center gap-4 md:gap-8">
          {/* Score Counter */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] tracking-wider text-amber-500 font-bold uppercase">
              當前得分
            </span>
            <span className="text-2xl md:text-3xl font-black font-mono tabular-nums text-yellow-300 drop-shadow-sm">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Time or Shot Counter */}
          {gameMode === 'timed' ? (
            <div className="flex flex-col items-center">
              <span className="text-[10px] tracking-wider text-stone-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 text-red-400" />
                剩餘時間
              </span>
              <span
                className={`text-2xl md:text-3xl font-black font-mono tabular-nums ${
                  timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-stone-100'
                }`}
              >
                {Math.max(0, timeLeft)}s
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className="text-[10px] tracking-wider text-stone-400 font-bold flex items-center gap-1">
                <Target className="w-3 h-3 text-amber-400" />
                模式指標
              </span>
              <span className="text-sm md:text-base font-bold text-amber-200 mt-1">
                {gameMode === 'ammo' ? '考驗準確度' : '無拘束練習'}
              </span>
            </div>
          )}

          {/* Combo Multiplier Meter */}
          <div className="flex flex-col items-center min-w-[70px]">
            <span className="text-[10px] tracking-wider text-orange-400 font-bold flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-500" />
              連擊倍率
            </span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-xl md:text-2xl font-black font-mono tabular-nums transition-transform ${
                  currentCombo > 1
                    ? 'text-orange-400 scale-110 font-bold drop-shadow-sm'
                    : 'text-stone-400'
                }`}
              >
                {currentCombo > 0 ? `${currentCombo}X` : '0X'}
              </span>
              {currentCombo >= 5 && (
                <span className="text-[10px] bg-red-600 text-yellow-100 font-bold px-1 rounded animate-bounce">
                  狂暴
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Ammo Magazine & Quick Reload */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-stone-400">彈匣子彈:</span>
              <span
                className={`font-mono font-bold tabular-nums text-sm ${
                  ammo === 0
                    ? 'text-red-500 animate-ping'
                    : ammo <= 3
                    ? 'text-amber-400'
                    : 'text-yellow-400'
                }`}
              >
                {ammo} / {maxAmmo}
              </span>
            </div>
            {/* Visual Ammo Pip Bar */}
            <div className="flex items-center gap-0.5 mt-1 max-w-[120px] overflow-hidden">
              {Array.from({ length: Math.min(maxAmmo, 15) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-3 rounded-xs transition-colors ${
                    i < (ammo / maxAmmo) * Math.min(maxAmmo, 15)
                      ? 'bg-amber-400 shadow-sm'
                      : 'bg-stone-700 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Reload Button */}
          <button
            onClick={onReload}
            disabled={isReloading || ammo === maxAmmo}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              isReloading
                ? 'bg-stone-800 text-stone-500 border-stone-700 cursor-wait'
                : ammo === 0
                ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 animate-pulse'
                : 'bg-stone-800 hover:bg-stone-700 text-amber-300 border-amber-900/60'
            }`}
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span>{isReloading ? '裝填中...' : '重新裝彈'}</span>
            <span className="hidden lg:inline text-[10px] text-stone-400 font-mono">
              [R/空白]
            </span>

            {/* Reload progress bar overlay */}
            {isReloading && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-amber-400 rounded-b-lg transition-all duration-75"
                style={{ width: `${reloadProgress * 100}%` }}
              />
            )}
          </button>
        </div>
      </div>

      {/* Stall Owner Live Speech Bubble Strip */}
      <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-stone-900 flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-2 truncate">
          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-950 text-red-300 rounded text-[11px] font-bold border border-red-800/60 shrink-0">
            <MessageSquare className="w-3 h-3 text-red-400" />
            夜市老闆喊話:
          </span>
          <span className="text-amber-200/90 italic truncate">
            {ownerQuote}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] text-stone-500 shrink-0">
          <span>提示: 點擊滑鼠射擊 · 連擊越高得分翻倍 · 爆破炸彈可引爆整排氣球！</span>
        </div>
      </div>
    </div>
  );
};
