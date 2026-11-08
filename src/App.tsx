/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, GameMode, Weapon, GameStats, PrizeItem, UserSession } from './types/game';
import { TopBar } from './components/TopBar';
import { HUD } from './components/HUD';
import { ShootingBooth } from './components/ShootingBooth';
import { PrizeShopModal } from './components/PrizeShopModal';
import { WeaponModal } from './components/WeaponModal';
import { InstructionsModal } from './components/InstructionsModal';
import { GameOverModal } from './components/GameOverModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AuthModal } from './components/AuthModal';
import { sound } from './utils/audio';
import { STALL_OWNER_QUOTES } from './utils/constants';
import {
  loadHighScore,
  saveHighScore,
  loadTickets,
  saveTickets,
  loadPrizes,
  savePrizes,
  loadWeapons,
  saveWeapons,
  updateStats,
} from './utils/storage';
import { Crosshair, Play, Sparkles, Trophy, ShoppingBag, HelpCircle, Gift } from 'lucide-react';

export default function App() {
  // Persistence & Inventory
  const [highScore, setHighScore] = useState<number>(loadHighScore);
  const [tickets, setTickets] = useState<number>(loadTickets);
  const [prizes, setPrizes] = useState<PrizeItem[]>(loadPrizes);
  const [weapons, setWeapons] = useState<Weapon[]>(loadWeapons);

  // Active Weapon
  const [currentWeapon, setCurrentWeapon] = useState<Weapon>(() => {
    const loaded = loadWeapons();
    return loaded.find((w) => w.unlocked) || loaded[0];
  });

  // Game Engine State
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [gameMode, setGameMode] = useState<GameMode>('timed');
  const [score, setScore] = useState<number>(0);
  const [ammo, setAmmo] = useState<number>(currentWeapon.capacity);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [bulletsRemainingInAmmoMode, setBulletsRemainingInAmmoMode] = useState<number>(25);

  // Combos & Stats for current round
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);
  const [balloonsPopped, setBalloonsPopped] = useState<number>(0);
  const [cansKnocked, setCansKnocked] = useState<number>(0);
  const [ducksHit, setDucksHit] = useState<number>(0);

  // Modals & Dialogs
  const [showPrizesModal, setShowPrizesModal] = useState<boolean>(false);
  const [showWeaponsModal, setShowWeaponsModal] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('nightmarket_user_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isNewHighScore, setIsNewHighScore] = useState<boolean>(false);
  const [ticketsEarnedThisRound, setTicketsEarnedThisRound] = useState<number>(0);

  // Sound toggles
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(false);

  // Stall owner commentary
  const [ownerQuote, setOwnerQuote] = useState<string>(
    STALL_OWNER_QUOTES.welcome[0]
  );

  const handleLoginSuccess = (user: UserSession) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('nightmarket_user_session', JSON.stringify(user));
      localStorage.setItem('nightmarket_player_name', user.username);
    } catch {
      // ignore
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('nightmarket_user_session');
    } catch {
      // ignore
    }
  };

  const reloadTimerRef = useRef<number | null>(null);

  // Start BGM on first interaction
  useEffect(() => {
    const startAudio = () => {
      sound.startBgm();
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
    window.addEventListener('click', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
  }, []);

  // Update ammo when weapon changes
  useEffect(() => {
    setAmmo(currentWeapon.capacity);
  }, [currentWeapon]);

  // Main Timer Countdown for 'timed' mode
  useEffect(() => {
    if (gameState !== 'PLAYING' || gameMode !== 'timed') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, gameMode]);

  // Keyboard controls for reloading ([R], [Space])
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' || e.code === 'Space') {
        if (gameState === 'PLAYING' && !isReloading && ammo < currentWeapon.capacity) {
          e.preventDefault();
          handleReload();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, isReloading, ammo, currentWeapon]);

  // Start / Restart Game
  const handleStartGame = () => {
    setScore(0);
    setAmmo(currentWeapon.capacity);
    setIsReloading(false);
    setReloadProgress(0);
    setCurrentCombo(0);
    setMaxCombo(0);
    setShotsFired(0);
    setShotsHit(0);
    setBalloonsPopped(0);
    setCansKnocked(0);
    setDucksHit(0);
    setTimeLeft(60);
    setBulletsRemainingInAmmoMode(25);
    setIsNewHighScore(false);
    setShowGameOverModal(false);
    setGameState('PLAYING');

    // Pick random welcoming quote
    const randomWelcome =
      STALL_OWNER_QUOTES.welcome[
        Math.floor(Math.random() * STALL_OWNER_QUOTES.welcome.length)
      ];
    setOwnerQuote(randomWelcome);
  };

  // Reload action
  const handleReload = useCallback(() => {
    if (isReloading || ammo >= currentWeapon.capacity) return;

    setIsReloading(true);
    setReloadProgress(0);
    sound.playReload();

    const startTime = performance.now();
    const duration = currentWeapon.reloadTimeMs;

    if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);

    reloadTimerRef.current = window.setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setReloadProgress(progress);

      if (progress >= 1) {
        if (reloadTimerRef.current) clearInterval(reloadTimerRef.current);
        setIsReloading(false);
        setAmmo(currentWeapon.capacity);
      }
    }, 30);
  }, [isReloading, ammo, currentWeapon]);

  // Handle successful hit
  const handleFireHit = (hit: boolean, points: number, targetType: string) => {
    setAmmo((prev) => Math.max(0, prev - 1));
    setShotsFired((prev) => prev + 1);

    if (hit) {
      setShotsHit((prev) => prev + 1);
      const newCombo = currentCombo + 1;
      setCurrentCombo(newCombo);
      setMaxCombo((prev) => Math.max(prev, newCombo));

      // Combo sound
      sound.playCombo(newCombo);

      // Score with combo multiplier
      const comboMultiplier = 1 + Math.min(newCombo * 0.15, 2.0); // max 3x multiplier
      const finalPoints = Math.round(points * comboMultiplier);
      setScore((prev) => prev + finalPoints);

      // Target breakdown counts
      if (targetType === 'balloon') setBalloonsPopped((prev) => prev + 1);
      else if (targetType === 'can') setCansKnocked((prev) => prev + 1);
      else if (targetType === 'duck') setDucksHit((prev) => prev + 1);

      // Owner commentary on high combo
      if (newCombo >= 4 && Math.random() < 0.4) {
        const randomQuote =
          STALL_OWNER_QUOTES.hitHigh[
            Math.floor(Math.random() * STALL_OWNER_QUOTES.hitHigh.length)
          ];
        setOwnerQuote(randomQuote);
      }
    }

    // Check ammo mode exhaustion
    if (gameMode === 'ammo') {
      setBulletsRemainingInAmmoMode((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeout(handleGameOver, 400);
        }
        return Math.max(0, next);
      });
    }
  };

  // Handle miss
  const handleMiss = () => {
    setAmmo((prev) => Math.max(0, prev - 1));
    setShotsFired((prev) => prev + 1);
    setCurrentCombo(0);

    // Random miss quote
    if (Math.random() < 0.3) {
      const randomQuote =
        STALL_OWNER_QUOTES.miss[
          Math.floor(Math.random() * STALL_OWNER_QUOTES.miss.length)
        ];
      setOwnerQuote(randomQuote);
    }

    if (gameMode === 'ammo') {
      setBulletsRemainingInAmmoMode((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setTimeout(handleGameOver, 400);
        }
        return Math.max(0, next);
      });
    }
  };

  // Game Over calculation
  const handleGameOver = () => {
    setGameState('GAME_OVER');

    // Calculate accuracy
    const accuracy =
      shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

    // Check high score
    let newBest = false;
    if (score > highScore) {
      newBest = true;
      setIsNewHighScore(true);
      setHighScore(score);
      saveHighScore(score);
    }

    // Calculate tickets earned (1 ticket per 100 points + bonus for high accuracy)
    const baseTickets = Math.floor(score / 90);
    const accuracyBonus = accuracy >= 80 ? Math.floor(baseTickets * 0.3) : 0;
    const totalEarned = Math.max(5, baseTickets + accuracyBonus);

    setTicketsEarnedThisRound(totalEarned);
    const updatedTickets = tickets + totalEarned;
    setTickets(updatedTickets);
    saveTickets(updatedTickets);

    // Save persistent player stats
    updateStats({
      gamesPlayed: 1,
      totalShots: shotsFired,
      totalHits: shotsHit,
      totalBalloons: balloonsPopped,
      totalCans: cansKnocked,
      totalDucks: ducksHit,
    });

    setShowGameOverModal(true);
  };

  // Redeem prize
  const handleRedeemPrize = (prizeId: string) => {
    const item = prizes.find((p) => p.id === prizeId);
    if (!item || tickets < item.ticketsRequired) return;

    const remainingTickets = tickets - item.ticketsRequired;
    setTickets(remainingTickets);
    saveTickets(remainingTickets);

    const updatedPrizes = prizes.map((p) =>
      p.id === prizeId ? { ...p, ownedCount: p.ownedCount + 1 } : p
    );
    setPrizes(updatedPrizes);
    savePrizes(updatedPrizes);

    setOwnerQuote(`「恭喜你成功帶走了【${item.name}】！太神啦！」`);
  };

  // Unlock weapon
  const handleUnlockWeapon = (weaponId: string) => {
    const weapon = weapons.find((w) => w.id === weaponId);
    if (!weapon || !weapon.costTickets || tickets < weapon.costTickets) return;

    const remainingTickets = tickets - weapon.costTickets;
    setTickets(remainingTickets);
    saveTickets(remainingTickets);

    const updatedWeapons = weapons.map((w) =>
      w.id === weaponId ? { ...w, unlocked: true } : w
    );
    setWeapons(updatedWeapons);
    saveWeapons(updatedWeapons);

    // Auto-equip
    const unlockedWp = updatedWeapons.find((w) => w.id === weaponId);
    if (unlockedWp) {
      setCurrentWeapon(unlockedWp);
    }

    setOwnerQuote(`「恭喜解鎖夜市傳奇【${weapon.name}】！雙倍得分超爽快！」`);
  };

  // Audio toggles
  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    sound.setMuted(next);
  };

  const handleToggleMusic = () => {
    const next = !isMusicMuted;
    setIsMusicMuted(next);
    sound.setMusicMuted(next);
  };

  // Accuracy calculation for current round
  const currentAccuracy =
    shotsFired > 0 ? Math.round((shotsHit / shotsFired) * 100) : 0;

  const currentStats: GameStats = {
    score,
    highScore,
    tickets,
    totalTicketsEarned: tickets,
    shotsFired,
    shotsHit,
    balloonsPopped,
    cansKnocked,
    ducksHit,
    maxCombo,
    currentCombo,
    accuracy: currentAccuracy,
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      
      {/* 1. Universal Top Navigation Bar */}
      <TopBar
        score={score}
        tickets={tickets}
        highScore={highScore}
        isMuted={isMuted}
        isMusicMuted={isMusicMuted}
        currentUser={currentUser}
        onToggleSound={handleToggleSound}
        onToggleMusic={handleToggleMusic}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenPrizes={() => setShowPrizesModal(true)}
        onOpenWeapons={() => setShowWeaponsModal(true)}
        onOpenLeaderboard={() => setShowLeaderboardModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        onStartNewGame={handleStartGame}
        gameState={gameState}
      />

      {/* 2. Real-Time HUD Strip */}
      <HUD
        score={score}
        currentCombo={currentCombo}
        maxCombo={maxCombo}
        ammo={ammo}
        maxAmmo={currentWeapon.capacity}
        isReloading={isReloading}
        reloadProgress={reloadProgress}
        timeLeft={timeLeft}
        gameMode={gameMode}
        currentWeapon={currentWeapon}
        onReload={handleReload}
        onOpenWeapons={() => setShowWeaponsModal(true)}
        onSelectMode={(mode) => {
          setGameMode(mode);
          if (gameState === 'PLAYING') handleStartGame();
        }}
        ownerQuote={ownerQuote}
      />

      {/* 3. Main Stage Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 md:p-6 flex flex-col items-center justify-center">
        {gameState === 'MENU' ? (
          /* Title Menu Hero Area */
          <div className="w-full max-w-4xl py-6 md:py-10 px-6 bg-gradient-to-b from-stone-900 to-stone-950 border-2 border-amber-900/60 rounded-3xl shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
            {/* Striped Canopy Header */}
            <div className="absolute top-0 left-0 right-0 h-4 awning-stripes" />

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-950 text-yellow-300 border border-red-700 rounded-full text-xs font-bold mb-4 mt-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>道地台灣夜市經典遊戲 · 滿分抱走大玩偶</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-amber-400 font-arcade tracking-wide drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)] mb-3">
              夜市神射手
            </h1>
            <p className="text-stone-300 max-w-lg text-sm md:text-base leading-relaxed mb-6">
              拿起軟木塞空氣槍與連發BB槍，瞄準色彩繽紛的氣球列隊、擊垮香濃飲料鐵罐、射擊流動小黃鴨，累積連擊贏取夜市彩券！
            </p>

            {/* Mode selection buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                onClick={() => setGameMode('timed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  gameMode === 'timed'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md scale-105'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-700'
                }`}
              >
                限時 60 秒衝刺
              </button>
              <button
                onClick={() => setGameMode('ammo')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  gameMode === 'ammo'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md scale-105'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-700'
                }`}
              >
                限量 25 發準度賽
              </button>
              <button
                onClick={() => setGameMode('carnival')}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  gameMode === 'carnival'
                    ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md scale-105'
                    : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-700'
                }`}
              >
                無限歡樂練習場
              </button>
            </div>

            {/* Big Start Button */}
            <button
              onClick={handleStartGame}
              className="group relative px-8 py-4 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 hover:from-red-500 hover:to-amber-400 text-stone-950 font-black text-lg md:text-xl rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border-2 border-yellow-300"
            >
              <Play className="w-6 h-6 fill-stone-950" />
              <span>投幣開玩 (開始射擊)</span>
              <Crosshair className="w-5 h-5 text-stone-900 group-hover:rotate-45 transition-transform" />
            </button>

            {/* Quick feature links */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-10 w-full max-w-xl text-xs text-stone-400">
              <button
                onClick={() => setShowRulesModal(true)}
                className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 hover:border-amber-800/80 transition-colors flex flex-col items-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-200">得分標靶與規則</span>
                <span className="text-[10px] text-stone-400">查看炸彈與鐵罐機制</span>
              </button>

              <button
                onClick={() => setShowWeaponsModal(true)}
                className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 hover:border-amber-800/80 transition-colors flex flex-col items-center gap-1.5"
              >
                <Crosshair className="w-4 h-4 text-red-400" />
                <span className="font-bold text-stone-200">武器軍械庫</span>
                <span className="text-[10px] text-stone-400">
                  當前: {currentWeapon.name}
                </span>
              </button>

              <button
                onClick={() => setShowPrizesModal(true)}
                className="col-span-2 sm:col-span-1 p-3 bg-stone-900/60 rounded-xl border border-stone-800 hover:border-amber-800/80 transition-colors flex flex-col items-center gap-1.5"
              >
                <Gift className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-stone-200">獎品兌換櫃</span>
                <span className="text-[10px] text-yellow-400 font-mono">
                  持有 {tickets} 張彩券
                </span>
              </button>
              <button
                onClick={() => setShowLeaderboardModal(true)}
                className="p-3 bg-stone-900/60 rounded-xl border border-stone-800 hover:border-amber-800/80 transition-colors flex flex-col items-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-stone-200">雲端英雄榜</span>
                <span className="text-[10px] text-stone-400">Google Sheets 同步</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Interactive Shooting Booth Canvas */
          <div className="w-full flex flex-col items-center">
            <ShootingBooth
              weapon={currentWeapon}
              ammo={ammo}
              isReloading={isReloading}
              onFire={handleFireHit}
              onMiss={handleMiss}
              onReload={handleReload}
              currentCombo={currentCombo}
              triggerShake={false}
              onOwnerQuote={setOwnerQuote}
            />

            {/* Bottom Quick Bar */}
            <div className="w-full max-w-5xl mt-3 flex items-center justify-between px-2 text-xs text-stone-400">
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">遊戲模式:</span>
                <span>
                  {gameMode === 'timed'
                    ? '限時 60 秒衝刺'
                    : gameMode === 'ammo'
                    ? `限量考驗（剩餘 ${bulletsRemainingInAmmoMode} 顆）`
                    : '無限暢射模式'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowLeaderboardModal(true)}
                  className="hover:text-amber-400 underline transition-colors"
                >
                  雲端英雄榜
                </button>
                <button
                  onClick={() => setShowRulesModal(true)}
                  className="hover:text-amber-400 underline transition-colors"
                >
                  玩法秘笈
                </button>
                <button
                  onClick={handleStartGame}
                  className="hover:text-amber-400 underline transition-colors"
                >
                  重置當前局
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Modals */}
      <PrizeShopModal
        isOpen={showPrizesModal}
        onClose={() => setShowPrizesModal(false)}
        tickets={tickets}
        prizes={prizes}
        weapons={weapons}
        onRedeemPrize={handleRedeemPrize}
        onUnlockWeapon={handleUnlockWeapon}
      />

      <WeaponModal
        isOpen={showWeaponsModal}
        onClose={() => setShowWeaponsModal(false)}
        weapons={weapons}
        currentWeaponId={currentWeapon.id}
        onSelectWeapon={setCurrentWeapon}
        onOpenShop={() => setShowPrizesModal(true)}
      />

      <InstructionsModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />

      <GameOverModal
        isOpen={showGameOverModal}
        stats={currentStats}
        weaponName={currentWeapon.name}
        gameMode={
          gameMode === 'timed'
            ? '限時 60秒'
            : gameMode === 'ammo'
            ? '限量 25發'
            : '無限暢射'
        }
        currentUser={currentUser}
        isNewHighScore={isNewHighScore}
        ticketsEarned={ticketsEarnedThisRound}
        onPlayAgain={handleStartGame}
        onOpenShop={() => {
          setShowGameOverModal(false);
          setShowPrizesModal(true);
        }}
        onOpenLeaderboard={() => {
          setShowGameOverModal(false);
          setShowLeaderboardModal(true);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* 5. Quiet Clean Footer */}
      <footer className="w-full py-3 px-6 border-t border-stone-900 bg-stone-950 text-center text-xs text-stone-500">
        <span>© 2026 夜市神射手 Night Market Sharpshooter · 台灣夜市經典風情射擊遊戲</span>
      </footer>
    </div>
  );
}
