import React from 'react';
import { X, Target, Crosshair, Sparkles, Flame, HelpCircle } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-stone-900 border-2 border-amber-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-amber-900/60">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500 text-stone-950 rounded-xl">
              <HelpCircle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-arcade">
                夜市神射手 · 玩法指南與秘訣
              </h2>
              <p className="text-xs text-stone-400">
                掌握夜市射擊核心物理機制，快速累積高分抱走巨型玩偶！
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-stone-200">
          
          {/* Controls Card */}
          <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Crosshair className="w-4 h-4 text-red-500" />
              <span>操作方式</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-stone-900 rounded-lg">
                <span className="text-amber-300 font-bold block mb-1">滑鼠移動 / 觸控</span>
                <span className="text-stone-400">控制十字準心瞄準目標</span>
              </div>
              <div className="p-2.5 bg-stone-900 rounded-lg">
                <span className="text-amber-300 font-bold block mb-1">滑鼠左鍵 / 點擊</span>
                <span className="text-stone-400">扣動扳機開火發射</span>
              </div>
              <div className="p-2.5 bg-stone-900 rounded-lg">
                <span className="text-amber-300 font-bold block mb-1">空白鍵 / R / 右鍵</span>
                <span className="text-stone-400">拉動槍機重新裝填子彈</span>
              </div>
            </div>
          </div>

          {/* Targets Guide */}
          <div className="p-4 bg-stone-950/80 rounded-xl border border-stone-800 space-y-3">
            <h3 className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-4 h-4 text-amber-500" />
              <span>夜市標靶分值表</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-red-500 inline-block" />
                  <span className="font-bold text-stone-200">彩色普通氣球 (紅/藍/綠/黃/紫)</span>
                </div>
                <span className="font-mono text-yellow-400 font-bold">100 ~ 150 分</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">💣</span>
                  <span className="font-bold text-stone-200">爆破炸彈氣球 (連鎖引爆相鄰周圍氣球)</span>
                </div>
                <span className="font-mono text-orange-400 font-bold">250 分 + 連鎖爆破</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">★</span>
                  <span className="font-bold text-stone-200">閃耀黃金氣球 / 問號神秘氣球</span>
                </div>
                <span className="font-mono text-amber-300 font-bold">200 ~ 300 分</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🥫</span>
                  <span className="font-bold text-stone-200">經典飲料鐵罐金字塔 (全倒觸發獎勵)</span>
                </div>
                <span className="font-mono text-sky-400 font-bold">120 ~ 200 分 (全倒+500)</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🐥</span>
                  <span className="font-bold text-stone-200">旋轉水流小黃鴨 (金冠小鴨高分)</span>
                </div>
                <span className="font-mono text-yellow-300 font-bold">150 ~ 300 分</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-stone-900/60 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-base">🪳</span>
                  <span className="font-bold text-stone-200">隱藏彩蛋：逃跑的小強 (高速橫穿台面)</span>
                </div>
                <span className="font-mono text-emerald-400 font-bold">500 分 (神級狙擊)</span>
              </div>
            </div>
          </div>

          {/* Marksman Pro-tips */}
          <div className="p-4 bg-amber-950/30 rounded-xl border border-amber-900/60 space-y-2">
            <h3 className="font-bold text-amber-300 text-xs flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>神射手高分密技</span>
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-stone-300">
              <li>
                <strong className="text-amber-400">連擊倍率加成:</strong> 連續擊中目標會持續拉升連擊倍率，最高可達數倍得分！一旦空槍將重置連擊。
              </li>
              <li>
                <strong className="text-amber-400">鐵罐物理擊破點:</strong> 瞄準鐵罐金字塔底層中央的鐵罐，可以一次震垮整座金字塔，達成全倒加分！
              </li>
              <li>
                <strong className="text-amber-400">預判水流小鴨:</strong> 移動中的小鴨需要適度往前預瞄一個身位，命中率大幅提升！
              </li>
              <li>
                <strong className="text-amber-400">獎券兌換神槍:</strong> 累積 200 張彩券可前往兌換處解鎖「黃金至尊神射槍」，享有 200% 全額雙倍得分加成！
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-amber-900/40 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg text-xs transition-colors"
          >
            知道了，立即開戰
          </button>
        </div>
      </div>
    </div>
  );
};
