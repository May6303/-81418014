import { UserSession } from '../types/game';
import { Volume2, VolumeX, Music, Ticket, Trophy, Crosshair, HelpCircle, ShoppingBag, User, LogOut } from 'lucide-react';
import { sound } from '../utils/audio';

interface TopBarProps {
  score: number;
  tickets: number;
  highScore: number;
  isMuted: boolean;
  isMusicMuted: boolean;
  currentUser: UserSession | null;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onOpenRules: () => void;
  onOpenPrizes: () => void;
  onOpenWeapons: () => void;
  onOpenLeaderboard: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onStartNewGame: () => void;
  gameState: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  tickets,
  highScore,
  isMuted,
  isMusicMuted,
  currentUser,
  onToggleSound,
  onToggleMusic,
  onOpenRules,
  onOpenPrizes,
  onOpenWeapons,
  onOpenLeaderboard,
  onOpenAuth,
  onLogout,
  onStartNewGame,
  gameState,
}) => {
  return (
    <header className="relative z-40 flex items-center justify-between gap-8 px-4 md:px-8 py-3 bg-stone-900 border-b border-amber-900/60 text-stone-100 shadow-md">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onStartNewGame();
          }}
          className="flex items-center gap-2 group text-xl md:text-2xl font-black tracking-wider text-amber-400 whitespace-nowrap shrink-0 hover:text-amber-300 transition-colors"
        >
          <span className="inline-block p-1 bg-red-700 text-yellow-300 rounded shadow-sm group-hover:scale-105 transition-transform">
            <Crosshair className="w-5 h-5 text-amber-200" />
          </span>
          <span className="font-arcade tracking-normal drop-shadow-md">
            夜市神射手
          </span>
        </a>
      </div>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-300">
        <button
          onClick={onOpenRules}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>玩法技巧</span>
        </button>
        <button
          onClick={onOpenWeapons}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          <Crosshair className="w-4 h-4 text-red-500" />
          <span>槍械武器庫</span>
        </button>
        <button
          onClick={onOpenLeaderboard}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 text-yellow-300"
        >
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span>雲端英雄榜</span>
        </button>
        <button
          onClick={onOpenPrizes}
          className="flex items-center gap-1.5 hover:text-amber-400 transition-colors whitespace-nowrap shrink-0"
        >
          <ShoppingBag className="w-4 h-4 text-amber-400" />
          <span>獎品兌換處</span>
          <span className="px-1.5 py-0.2 text-xs font-mono tabular-nums text-yellow-300 bg-red-900/80 rounded">
            {tickets} 張
          </span>
        </button>
      </nav>

      {/* Zone 3: 1 primary action + audio toggles */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Audio FX button */}
        <button
          onClick={onToggleSound}
          title={isMuted ? '開啟音效' : '靜音音效'}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            isMuted
              ? 'bg-stone-800 text-stone-500 border-stone-700'
              : 'bg-stone-800 text-amber-300 border-amber-700/50 hover:bg-stone-700'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Music toggle button */}
        <button
          onClick={onToggleMusic}
          title={isMusicMuted ? '播放夜市音樂' : '暫停夜市音樂'}
          className={`p-2 rounded-lg border text-xs transition-colors ${
            isMusicMuted
              ? 'bg-stone-800 text-stone-500 border-stone-700'
              : 'bg-red-950 text-red-300 border-red-700/60 hover:bg-red-900'
          }`}
        >
          <Music className="w-4 h-4" />
        </button>

        {/* Mobile quick leaderboard access */}
        <button
          onClick={onOpenLeaderboard}
          title="查看排行榜"
          className="md:hidden flex items-center p-1.5 text-xs bg-stone-800 border border-stone-700 rounded-lg text-yellow-300"
        >
          <Trophy className="w-4 h-4" />
        </button>

        {/* Mobile quick prize access */}
        <button
          onClick={onOpenPrizes}
          className="md:hidden flex items-center gap-1 px-2.5 py-1.5 text-xs bg-red-900/70 border border-red-700 rounded-lg text-yellow-300"
        >
          <Ticket className="w-3.5 h-3.5" />
          <span className="tabular-nums font-mono">{tickets}</span>
        </button>

        {/* User Login & Account Badge */}
        {currentUser?.isLoggedIn ? (
          <div className="flex items-center gap-1 bg-stone-800/90 border border-stone-700 rounded-lg px-2 py-1 text-xs">
            <span className="text-amber-400 font-bold max-w-[90px] truncate" title={currentUser.username}>
              👤 {currentUser.username}
            </span>
            <button
              onClick={onLogout}
              title="登出帳號"
              className="p-1 text-stone-400 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 border border-amber-900/60 rounded-lg text-xs text-amber-300 transition-colors font-medium"
          >
            <User className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">登入/註冊</span>
          </button>
        )}

        {/* Primary Action Button */}
        <button
          onClick={onStartNewGame}
          className="px-4 py-2 text-xs md:text-sm font-bold tracking-wide text-stone-900 bg-amber-400 hover:bg-amber-300 active:scale-95 rounded-lg shadow-md transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Crosshair className="w-4 h-4" />
          <span>{gameState === 'PLAYING' ? '重新開局' : '投入硬幣開玩'}</span>
        </button>
      </div>
    </header>
  );
};
