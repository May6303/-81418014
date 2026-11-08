import React from 'react';
import { PrizeItem, Weapon } from '../types/game';
import { sound } from '../utils/audio';
import { X, Ticket, Gift, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PrizeShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  tickets: number;
  prizes: PrizeItem[];
  weapons: Weapon[];
  onRedeemPrize: (prizeId: string) => void;
  onUnlockWeapon: (weaponId: string) => void;
}

export const PrizeShopModal: React.FC<PrizeShopModalProps> = ({
  isOpen,
  onClose,
  tickets,
  prizes,
  weapons,
  onRedeemPrize,
  onUnlockWeapon,
}) => {
  if (!isOpen) return null;

  const goldenRifle = weapons.find((w) => w.id === 'golden_rifle');

  const handleRedeem = (item: PrizeItem) => {
    if (tickets < item.ticketsRequired) return;

    sound.playJackpot();
    if (item.category === 'legendary') {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
    onRedeemPrize(item.id);
  };

  const handleUnlockRifle = () => {
    if (!goldenRifle || tickets < (goldenRifle.costTickets || 200)) return;
    sound.playJackpot();
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.6 },
    });
    onUnlockWeapon('golden_rifle');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-950 via-stone-900 to-amber-950 border-b border-amber-800/60">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500 text-stone-950 rounded-xl shadow-sm">
              <Gift className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-arcade">
                夜市獎品兌換處
              </h2>
              <p className="text-xs text-stone-400">
                憑神射手累積彩券，把夜市大玩偶、香腸與黃金神槍帶回家！
              </p>
            </div>
          </div>

          {/* Tickets Balance */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-950/80 border border-red-700 rounded-xl text-yellow-300 font-mono text-sm">
              <Ticket className="w-4 h-4 text-red-400" />
              <span>彩券餘額:</span>
              <span className="font-bold tabular-nums text-base">
                {tickets.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shop Items Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Special Weapon Unlock (Golden Rifle) */}
          {goldenRifle && (
            <div className="p-4 bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-2 border-amber-500/60 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              <div className="flex items-center gap-4">
                <span className="text-4xl p-2 bg-amber-500/20 rounded-xl border border-amber-400/30">
                  👑
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-amber-300 text-base">
                      {goldenRifle.name}
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-500 text-stone-950 rounded">
                      限定神裝
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 mt-1 max-w-lg">
                    {goldenRifle.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-amber-400 mt-2 font-mono">
                    <span>彈匣: {goldenRifle.capacity}發</span>
                    <span>·</span>
                    <span>得分: 200% 翻倍</span>
                    <span>·</span>
                    <span>金光雷射彈</span>
                  </div>
                </div>
              </div>

              <div>
                {goldenRifle.unlocked ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-950 text-emerald-300 border border-emerald-700 rounded-lg text-xs font-bold whitespace-nowrap">
                    <Check className="w-4 h-4" />
                    <span>已解鎖槍械</span>
                  </div>
                ) : (
                  <button
                    onClick={handleUnlockRifle}
                    disabled={tickets < (goldenRifle.costTickets || 200)}
                    className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
                      tickets >= (goldenRifle.costTickets || 200)
                        ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md hover:scale-105'
                        : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>解鎖 ({goldenRifle.costTickets} 張彩券)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 2: Carnival Prizes Grid */}
          <div>
            <h3 className="text-sm font-bold text-amber-400 mb-3 flex items-center gap-2">
              <span>夜市經典禮品架</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {prizes.map((item) => {
                const canAfford = tickets >= item.ticketsRequired;
                const isLegendary = item.category === 'legendary';

                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isLegendary
                        ? 'bg-gradient-to-b from-stone-900 via-amber-950/40 to-stone-900 border-amber-500/70 shadow-lg'
                        : 'bg-stone-800/80 border-stone-700 hover:border-amber-700/60'
                    }`}
                  >
                    {/* Badge */}
                    {item.badge && (
                      <div className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800">
                        {item.badge}
                      </div>
                    )}

                    {/* Content */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-4xl">{item.icon}</span>
                        <div>
                          <h4 className="font-bold text-stone-100 text-sm">
                            {item.name}
                          </h4>
                          <span className="text-[11px] text-stone-400 font-mono">
                            {item.nameEn}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Bottom Status & Redeem */}
                    <div className="pt-3 border-t border-stone-700/60 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-stone-400">所需彩券</span>
                        <span className="text-amber-400 font-bold font-mono text-sm">
                          {item.ticketsRequired} 張
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.ownedCount > 0 && (
                          <span className="text-xs text-stone-400 font-mono">
                            已擁有 x{item.ownedCount}
                          </span>
                        )}

                        <button
                          onClick={() => handleRedeem(item)}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            canAfford
                              ? 'bg-red-600 hover:bg-red-500 text-white shadow-md active:scale-95'
                              : 'bg-stone-700/60 text-stone-500 cursor-not-allowed'
                          }`}
                        >
                          {canAfford ? '立即兌換' : '彩券不足'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-amber-900/40 flex items-center justify-between text-xs text-stone-400">
          <span>提示: 每局射擊結算時，根據得分與命中率換算為夜市彩券發放！</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium transition-colors"
          >
            關閉窗口
          </button>
        </div>
      </div>
    </div>
  );
};
