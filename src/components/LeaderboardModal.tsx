import React, { useState, useEffect } from 'react';
import { X, Trophy, RefreshCw, Database, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface GameRecordRow {
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

interface SheetStatus {
  connected: boolean;
  configured: boolean;
  sheetTitle?: string;
  sheetId?: string;
  clientEmail?: string;
  message: string;
}

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [records, setRecords] = useState<GameRecordRow[]>([]);
  const [status, setStatus] = useState<SheetStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConfigGuide, setShowConfigGuide] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch status
      const statusRes = await fetch('/api/sheets/status');
      const statusData = await statusRes.json();
      setStatus(statusData);

      // 2. Fetch records from 遊戲記錄
      const recordsRes = await fetch('/api/records/list');
      const recordsData = await recordsRes.json();
      if (recordsData.success && Array.isArray(recordsData.records)) {
        setRecords(recordsData.records);
      }
    } catch (err) {
      console.error('Failed to fetch records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-stone-900 border-2 border-amber-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-950 border-b border-amber-900/60">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-amber-500 text-stone-950 rounded-xl shadow-sm">
              <Trophy className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-amber-300 font-arcade">
                夜市神射手 · 雲端英雄榜
              </h2>
              <p className="text-xs text-stone-400">
                同步自 Google 試算表【遊戲記錄】工作表！
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              title="重新載入資料"
              className="p-1.5 rounded-lg text-stone-400 hover:text-amber-400 hover:bg-stone-800 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Google Sheets Status Banner */}
        <div className="px-6 py-2.5 bg-stone-950/80 border-b border-stone-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-500" />
            <span className="text-stone-400 font-bold">試算表同步狀態:</span>
            {status?.connected ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Sheets 已連線 (試算表: {status.sheetTitle})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>本地備用儲存庫模式（尚未配置 Google Sheets 金鑰）</span>
              </span>
            )}
          </div>

          <button
            onClick={() => setShowConfigGuide(!showConfigGuide)}
            className="flex items-center gap-1 text-amber-400 hover:underline text-[11px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{showConfigGuide ? '收起試算表結構與安全指南' : '檢視 Google 試算表【工作表規格】與 .gitignore 安全設定'}</span>
          </button>
        </div>

        {/* Expandable Configuration & Sheet Schema Guide */}
        {showConfigGuide && (
          <div className="p-5 bg-stone-950 border-b border-amber-900/40 text-xs text-stone-300 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Google 試算表兩大工作表規格與資安保護</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-400">
                  工作表 1: 【玩家】
                </h4>
                <p className="text-stone-400 text-[11px]">
                  記錄玩家註冊與最後登入紀錄，密碼在後端經過雜湊保護：
                </p>
                <div className="p-2 bg-black/60 rounded font-mono text-[10px] text-yellow-300">
                  玩家名稱, 密碼, 最後一次登入時間
                </div>

                <h4 className="font-bold text-amber-400 pt-1">
                  工作表 2: 【遊戲記錄】
                </h4>
                <p className="text-stone-400 text-[11px]">
                  每局遊戲結束後自動寫入遊玩戰績：
                </p>
                <div className="p-2 bg-black/60 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto">
                  時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣
                </div>
              </div>

              <div className="p-3 bg-stone-900 rounded-xl border border-stone-800 space-y-2">
                <h4 className="font-bold text-amber-400">
                  .gitignore 資安保證 (嚴防 GitHub 外洩)
                </h4>
                <p className="text-stone-400 text-[11px] leading-relaxed">
                  專案已配置完整防護，以下檔案均被 Git 排除，絕不會上傳到 GitHub：
                </p>
                <pre className="p-2 bg-black/60 rounded font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`.env
.env.*
*service-account*.json
service-account.json`}
                </pre>
                <p className="text-[10px] text-stone-400">
                  ★ 設定方式：在根目錄 <code className="text-amber-300">.env</code> 設定 <code className="text-amber-300">GOOGLE_SHEET_ID</code> 與 <code className="text-amber-300">GOOGLE_SERVICE_ACCOUNT_JSON</code>。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Records Table Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-stone-400 gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
              <span className="text-xs">讀取試算表資料中...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="py-16 text-center text-stone-400 text-xs">
              目前【遊戲記錄】工作表中尚無資料，快去開玩打破紀錄吧！
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-mono">
                    <th className="py-2.5 px-3">名次</th>
                    <th className="py-2.5 px-3">玩家名稱</th>
                    <th className="py-2.5 px-3">遊戲模式</th>
                    <th className="py-2.5 px-3 text-right">最終得分</th>
                    <th className="py-2.5 px-3 text-right">命中率</th>
                    <th className="py-2.5 px-3 text-right">擊破數</th>
                    <th className="py-2.5 px-3 text-right">最高連擊</th>
                    <th className="py-2.5 px-3">使用武器</th>
                    <th className="py-2.5 px-3 text-right">獲得夜市幣</th>
                    <th className="py-2.5 px-3 text-right">記錄時間</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60 font-mono">
                  {records.map((rec, index) => {
                    const isTop1 = index === 0;
                    const isTop2 = index === 1;
                    const isTop3 = index === 2;

                    return (
                      <tr
                        key={index}
                        className={`hover:bg-stone-800/40 transition-colors ${
                          isTop1
                            ? 'bg-amber-950/20 text-yellow-300'
                            : isTop2
                            ? 'bg-stone-800/20 text-stone-200'
                            : isTop3
                            ? 'bg-amber-950/10 text-amber-200'
                            : 'text-stone-300'
                        }`}
                      >
                        <td className="py-3 px-3 font-bold">
                          {isTop1 ? '🥇 1' : isTop2 ? '🥈 2' : isTop3 ? '🥉 3' : `${index + 1}`}
                        </td>
                        <td className="py-3 px-3 font-sans font-bold text-stone-100">
                          {rec.playerName}
                        </td>
                        <td className="py-3 px-3 font-sans text-stone-400 text-[11px]">
                          {rec.gameMode}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-400 text-sm tabular-nums">
                          {rec.score.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-emerald-400">
                          {rec.accuracy}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums">
                          {rec.totalHits} 靶
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-orange-400 font-bold">
                          {rec.maxCombo}X
                        </td>
                        <td className="py-3 px-3 font-sans text-stone-400 text-[11px]">
                          {rec.weapon}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-yellow-300">
                          +{rec.coinsEarned} 幣
                        </td>
                        <td className="py-3 px-3 text-right text-stone-500 text-[11px]">
                          {rec.time}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-stone-950 border-t border-amber-900/40 flex items-center justify-between text-xs text-stone-400">
          <span>對應試算表欄位：時間 · 玩家名稱 · 遊戲模式 · 最終得分 · 命中率 · 擊破數 · 最高連擊 · 使用武器 · 獲得夜市幣</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  );
};
