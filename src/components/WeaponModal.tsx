import React from 'react';
import { Weapon } from '../types/game';
import { X, Check, Lock, Crosshair, Zap, Sparkles } from 'lucide-react';

interface WeaponModalProps {
  isOpen: boolean;
  onClose: () => void;
  weapons: Weapon[];
  currentWeaponId: string;
  onSelectWeapon: (weapon: Weapon) => void;
  onOpenShop: () => void;
}

export const WeaponModal: React.FC<WeaponModalProps> = ({
  isOpen,
  onClose,
  weapons,
  currentWeaponId,
  onSelectWeapon,
  onOpenShop,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-stone-900 border-2 border-amber-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-amber-900/60">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-red-600 text-stone-100 rounded-xl">
              <Crosshair className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-arcade">
                夜市神射手 · 武器軍械庫
              </h2>
              <p className="text-xs text-stone-400">
                選擇你得心應手的射擊利器，每種槍械擁有獨特彈道與手感！
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

        {/* Weapons List */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weapons.map((w) => {
              const isEquipped = w.id === currentWeaponId;

              return (
                <div
                  key={w.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isEquipped
                      ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500/50'
                      : w.unlocked
                      ? 'bg-stone-800/80 border-stone-700 hover:border-stone-500'
                      : 'bg-stone-900/60 border-stone-800 opacity-60'
                  }`}
                >
                  <div>
                    {/* Title & Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {w.id === 'cork' && <Sparkles className="w-4 h-4 text-amber-400" />}
                        {w.id === 'bb' && <Zap className="w-4 h-4 text-sky-400" />}
                        {w.id === 'slingshot' && <Crosshair className="w-4 h-4 text-orange-400" />}
                        {w.id === 'golden_rifle' && <Sparkles className="w-4 h-4 text-yellow-400" />}
                        <h3 className="font-bold text-stone-100 text-sm">
                          {w.name}
                        </h3>
                      </div>

                      {isEquipped && (
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-stone-950 rounded">
                          裝備中
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-stone-300 mb-3 leading-relaxed">
                      {w.description}
                    </p>

                    {/* Stats Specs */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 font-mono bg-stone-950/60 p-2.5 rounded-lg border border-stone-800/80 mb-4">
                      <div>
                        <span className="text-stone-500">彈匣容量:</span>{' '}
                        <span className="text-amber-300 font-bold">{w.capacity} 發</span>
                      </div>
                      <div>
                        <span className="text-stone-500">射擊間隔:</span>{' '}
                        <span className="text-amber-300 font-bold">{w.fireRateMs} ms</span>
                      </div>
                      <div>
                        <span className="text-stone-500">衝擊打擊面:</span>{' '}
                        <span className="text-amber-300 font-bold">直徑 {w.hitRadius}px</span>
                      </div>
                      <div>
                        <span className="text-stone-500">得分加成:</span>{' '}
                        <span className="text-amber-300 font-bold">x{w.scoreMultiplier}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end pt-2 border-t border-stone-700/50">
                    {isEquipped ? (
                      <div className="flex items-center gap-1 text-xs text-amber-400 font-bold">
                        <Check className="w-4 h-4" />
                        <span>已裝備此槍械</span>
                      </div>
                    ) : w.unlocked ? (
                      <button
                        onClick={() => {
                          onSelectWeapon(w);
                          onClose();
                        }}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-lg shadow-sm transition-transform active:scale-95"
                      >
                        裝備使用
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenShop();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded-lg border border-stone-700"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        <span>前往獎品處解鎖</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-amber-900/40 flex items-center justify-between text-xs text-stone-400">
          <span>提示: 軟木塞槍命中面廣、BB槍射速快、強力彈弓擅長擊倒鐵罐！</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium"
          >
            確定
          </button>
        </div>
      </div>
    </div>
  );
};
