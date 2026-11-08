import React, { useState } from 'react';
import { UserSession } from '../types/game';
import { sound } from '../utils/audio';
import { X, User, Lock, Eye, EyeOff, LogIn, UserPlus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!username.trim()) {
      setErrorMsg('請輸入玩家名稱！');
      return;
    }
    if (!password.trim()) {
      setErrorMsg('請輸入密碼！');
      return;
    }

    setLoading(true);
    const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        sound.playCombo(3);
        setSuccessMsg(data.message || (tab === 'login' ? '登入成功！' : '註冊成功！'));

        setTimeout(() => {
          onLoginSuccess(data.user);
          onClose();
        }, 900);
      } else {
        setErrorMsg(data.message || '操作失敗，請重新確認！');
        sound.playDryFire();
      }
    } catch (err) {
      console.error('Auth request failed:', err);
      setErrorMsg('網路連線失敗，請檢查伺服器連線狀態！');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('夜市老將');
    setPassword('123456');
    setTab('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-stone-900 border-2 border-amber-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-amber-900/60">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-red-600 text-stone-100 rounded-xl shadow-sm">
              <User className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-black text-amber-300 font-arcade">
                夜市神射手 · 玩家俱樂部
              </h2>
              <p className="text-[11px] text-stone-400">
                登入帳號，遊戲數據將自動連動 Google 試算表！
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-stone-800 bg-stone-950/40">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'login'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-950/20'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>玩家登入</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className={`flex-1 py-3 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              tab === 'register'
                ? 'text-amber-400 border-b-2 border-amber-500 bg-amber-950/20'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>註冊新玩家</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Status Message */}
          {errorMsg && (
            <div className="p-3 bg-red-950/80 border border-red-700/80 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-700/80 rounded-xl flex items-center gap-2 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Username Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 block">
              玩家名稱 (暱稱)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如: 士林快槍俠"
                maxLength={16}
                required
                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 outline-none transition-colors"
              />
            </div>
            <span className="text-[10px] text-stone-500 block">
              對應 Google 試算表【玩家】工作表中的「玩家名稱」欄位
            </span>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-300 block">
              登入密碼
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入密碼"
                required
                className="w-full bg-stone-950 border border-stone-800 focus:border-amber-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-stone-100 placeholder:text-stone-600 outline-none transition-colors font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-500 hover:text-stone-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <span className="text-[10px] text-stone-500 block">
              密碼將於後端安全雜湊後寫入【玩家】工作表「密碼」欄位
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-amber-400 hover:bg-amber-300 active:scale-95 text-stone-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>立即登入夜市俱樂部</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>註冊新神射手帳號</span>
              </>
            )}
          </button>

          {/* Quick Demo Fill */}
          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
            <span>快速測試帳號:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-amber-400 hover:underline flex items-center gap-1 font-mono"
            >
              <Sparkles className="w-3 h-3" />
              <span>自動填入 (夜市老將 / 123456)</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-6 py-2.5 bg-stone-950 border-t border-amber-900/40 text-[10px] text-stone-500 text-center">
          成功登入後，每局結束將自動連動 Google 試算表【遊戲記錄】工作表！
        </div>
      </div>
    </div>
  );
};
