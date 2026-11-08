import React, { useState, useEffect, useRef } from 'react';
import { GameStats, UserSession } from '../types/game';
import { sound } from '../utils/audio';
import { Trophy, Ticket, Award, ArrowRight, RotateCcw, CheckCircle, Database, RefreshCw, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  isOpen: boolean;
  stats: GameStats;
  weaponName: string;
  gameMode: string;
  currentUser: UserSession | null;
  isNewHighScore: boolean;
  ticketsEarned: number;
  onPlayAgain: () => void;
  onOpenShop: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  stats,
  weaponName,
  gameMode,
  currentUser,
  isNewHighScore,
  ticketsEarned,
  onPlayAgain,
  onOpenShop,
  onOpenLeaderboard,
  onOpenAuth,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return currentUser?.username || localStorage.getItem('nightmarket_player_name') || '夜市快槍俠';
  });
  const [syncStatus, setSyncStatus] = useState<'saving' | 'saved' | 'failed'>('saving');
  const [syncMessage, setSyncMessage] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const hasAutoSavedRef = useRef(false);

  // Sync active player name when currentUser changes
  useEffect(() => {
    if (currentUser?.username) {
      setPlayerName(currentUser.username);
    }
  }, [currentUser]);

  // Execute automatic save to Google Sheets "遊戲記錄" worksheet
  const performSave = async (nameToUse: string) => {
    setSyncStatus('saving');
    setSyncMessage('正在自動同步至 Google 試算表【遊戲記錄】工作表...');

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const timeStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const totalHits = stats.balloonsPopped + stats.cansKnocked + stats.ducksHit;

    try {
      localStorage.setItem('nightmarket_player_name', nameToUse);

      const res = await fetch('/api/records/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          time: timeStr,
          playerName: nameToUse,
          gameMode,
          score: stats.score,
          accuracy: `${stats.accuracy}%`,
          totalHits,
          maxCombo: stats.maxCombo,
          weapon: weaponName,
          coinsEarned: ticketsEarned,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncStatus('saved');
        setSyncMessage(
          data.source === 'google_sheets'
            ? '✓ 已自動寫入 Google 試算表【遊戲記錄】工作表！'
            : '✓ 已自動儲存至伺服器【遊戲記錄】（備用儲存庫）！'
        );
      } else {
        setSyncStatus('failed');
        setSyncMessage('同步失敗，請檢查網路連線');
      }
    } catch (err) {
      console.error('Failed to auto-save game record:', err);
      setSyncStatus('failed');
      setSyncMessage('網路中斷，已暫存於本機');
    }
  };

  useEffect(() => {
    if (isOpen) {
      sound.playJackpot();
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.5 },
      });

      if (!hasAutoSavedRef.current) {
        hasAutoSavedRef.current = true;
        const activeName = currentUser?.username || playerName;
        performSave(activeName);
      }
    } else {
      hasAutoSavedRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Title rank based on accuracy and score
  const getRankTitle = () => {
    if (stats.score >= 4500 || (stats.accuracy >= 85 && stats.score >= 3000)) {
      return { title: '傳奇夜市神射手', color: 'text-yellow-400', desc: '老闆含淚把兩米巨型大熊雙手奉上！' };
    }
    if (stats.score >= 2500) {
      return { title: '百步穿楊快槍俠', color: 'text-amber-400', desc: '手起槍落，整排氣球無一倖免！' };
    }
    if (stats.score >= 1200) {
      return { title: '熟練夜市常客', color: 'text-sky-400', desc: '準度不錯，再加把勁就能全倒換大獎！' };
    }
    return { title: '見習試槍新手', color: 'text-stone-300', desc: '深呼吸穩住準心，下一局一定更準！' };
  };

  const rank = getRankTitle();
  const totalBroken = stats.balloonsPopped + stats.cansKnocked + stats.ducksHit;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col p-6">
        
        {/* Top Carnival Stamp */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-950 text-red-300 border border-red-800 rounded-full text-xs font-bold mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>夜市射擊攤 · 成績結算收據</span>
          </div>

          <h2 className={`text-2xl md:text-3xl font-black font-arcade ${rank.color}`}>
            {rank.title}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5">
            {rank.desc}
          </p>

          {isNewHighScore && (
            <div className="mt-2 inline-block px-3 py-1 bg-yellow-400 text-stone-950 font-black text-xs rounded-lg animate-bounce shadow-md">
              ★ 恭喜創下最高分新紀錄！ ★
            </div>
          )}
        </div>

        {/* Score Receipt Card */}
        <div className="bg-stone-950 p-4 md:p-5 rounded-2xl border border-stone-800 space-y-3 mb-3">
          {/* Main Score Display */}
          <div className="flex items-center justify-between border-b border-stone-800 pb-2.5">
            <div>
              <span className="text-stone-400 text-xs block">本局結算得分</span>
              <span className="text-[11px] text-amber-500 font-mono">
                玩家: {currentUser?.username || playerName}
              </span>
            </div>
            <span className="text-3xl font-black font-mono tabular-nums text-yellow-300">
              {stats.score.toLocaleString()}
            </span>
          </div>

          {/* Detailed Statistics Grid matching 遊戲記錄 columns */}
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 bg-stone-900/80 rounded-lg">
              <span className="text-stone-400">命中率:</span>
              <span className="text-emerald-400 font-bold tabular-nums">
                {stats.accuracy}%
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-stone-900/80 rounded-lg">
              <span className="text-stone-400">擊破總數:</span>
              <span className="text-yellow-400 font-bold tabular-nums">
                {totalBroken} 靶
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-stone-900/80 rounded-lg">
              <span className="text-stone-400">最高連擊:</span>
              <span className="text-orange-400 font-bold tabular-nums">
                {stats.maxCombo}X
              </span>
            </div>

            <div className="flex items-center justify-between p-2 bg-stone-900/80 rounded-lg">
              <span className="text-stone-400">使用武器:</span>
              <span className="text-stone-200 truncate max-w-[90px]" title={weaponName}>
                {weaponName}
              </span>
            </div>
          </div>

          {/* Tickets Earned */}
          <div className="p-2.5 bg-gradient-to-r from-red-950/60 to-amber-950/60 rounded-xl border border-amber-800/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-xs text-stone-300 block">獲得夜市幣 (彩券)</span>
                <span className="text-[10px] text-stone-400">（寫入「獲得夜市幣」欄位）</span>
              </div>
            </div>
            <span className="text-xl font-black font-mono text-yellow-300 tabular-nums">
              +{ticketsEarned} 幣
            </span>
          </div>
        </div>

        {/* Automatic Google Sheets Sync Status Card */}
        <div className="p-3 bg-stone-950 rounded-2xl border border-amber-900/40 mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>Google 試算表【遊戲記錄】自動儲存</span>
            </span>
            <button
              onClick={onOpenLeaderboard}
              className="text-stone-400 hover:text-amber-300 underline text-[11px]"
            >
              檢視試算表記錄
            </button>
          </div>

          {/* Real-time sync feedback */}
          <div className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
            syncStatus === 'saved'
              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
              : syncStatus === 'saving'
              ? 'bg-amber-950/40 border-amber-700/60 text-amber-300'
              : 'bg-red-950/80 border-red-700/60 text-red-300'
          }`}>
            <div className="flex items-center gap-2 truncate">
              {syncStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
              ) : syncStatus === 'saved' ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <span className="text-red-400">⚠️</span>
              )}
              <span className="font-medium truncate">{syncMessage}</span>
            </div>

            <button
              onClick={() => performSave(playerName)}
              className="p-1 text-stone-400 hover:text-stone-100 shrink-0"
              title="重新同步"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Account Binding & Name Switcher */}
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
            {currentUser?.isLoggedIn ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>已綁定玩家帳號: {currentUser.username}</span>
              </span>
            ) : (
              <div className="flex items-center gap-2 w-full justify-between">
                <span>目前為訪客身分 (暱稱: {playerName})</span>
                <button
                  onClick={onOpenAuth}
                  className="text-amber-400 hover:underline font-bold"
                >
                  登入/註冊玩家
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={onPlayAgain}
            className="w-full sm:flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>再玩一局 (投幣)</span>
          </button>

          <button
            onClick={onOpenShop}
            className="w-full sm:flex-1 py-3 px-4 bg-stone-800 hover:bg-stone-700 active:scale-95 text-stone-100 font-bold rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <span>前往獎品櫃</span>
            <ArrowRight className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
