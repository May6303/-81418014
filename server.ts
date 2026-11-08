import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { google } from 'googleapis';

// Load environment variables securely from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// In-memory fallback stores
interface PlayerData {
  username: string;
  passwordHash: string;
  lastLoginTime: string;
}

interface GameRecordData {
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

const memoryPlayers: Map<string, PlayerData> = new Map([
  [
    '夜市老將',
    {
      username: '夜市老將',
      passwordHash: hashPassword('123456'),
      lastLoginTime: '2026-11-07 20:30:00',
    },
  ],
  [
    '神射手小明',
    {
      username: '神射手小明',
      passwordHash: hashPassword('123456'),
      lastLoginTime: '2026-11-07 21:15:00',
    },
  ],
]);

const memoryGameRecords: GameRecordData[] = [
  {
    time: '2026-11-07 20:35:12',
    playerName: '夜市老將',
    gameMode: '限時 60秒',
    score: 4850,
    accuracy: '94%',
    totalHits: 46,
    maxCombo: 18,
    weapon: '精準連發BB步槍',
    coinsEarned: 68,
  },
  {
    time: '2026-11-07 21:18:45',
    playerName: '神射手小明',
    gameMode: '限時 60秒',
    score: 3920,
    accuracy: '89%',
    totalHits: 37,
    maxCombo: 14,
    weapon: '經典軟木塞空氣槍',
    coinsEarned: 54,
  },
  {
    time: '2026-11-07 22:05:30',
    playerName: '士林快槍俠',
    gameMode: '限量 25發',
    score: 3350,
    accuracy: '86%',
    totalHits: 33,
    maxCombo: 11,
    weapon: '夜市霸主強力彈弓',
    coinsEarned: 46,
  },
];

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`nightmarket_salt_${password}`).digest('hex');
}

function getFormattedNow(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Initialize Google Sheets Client safely from Environment Variables
 */
function getGoogleSheetsClient() {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const rawServiceAccount = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (!sheetId || !rawServiceAccount) {
    return { client: null, sheetId: null, clientEmail: null, error: 'Missing environment variables' };
  }

  try {
    let credentials: { client_email?: string; private_key?: string } | null = null;

    if (rawServiceAccount.trim().startsWith('{')) {
      credentials = JSON.parse(rawServiceAccount);
    } else {
      const filePath = path.resolve(process.cwd(), rawServiceAccount.trim());
      if (fs.existsSync(filePath)) {
        credentials = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      } else {
        return { client: null, sheetId: null, clientEmail: null, error: `Service account file not found: ${filePath}` };
      }
    }

    if (!credentials?.client_email || !credentials?.private_key) {
      return { client: null, sheetId: null, clientEmail: null, error: 'Service account JSON missing client_email or private_key' };
    }

    const privateKey = credentials.private_key.replace(/\\n/g, '\n');

    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { client: sheets, sheetId, clientEmail: credentials.client_email, error: null };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:', errorMsg);
    return { client: null, sheetId: null, clientEmail: null, error: errorMsg };
  }
}

/**
 * Automatically ensure worksheets "玩家" and "遊戲記錄" exist with their specified headers
 */
async function ensureWorksheets(sheets: any, sheetId: string) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingTitles: string[] = (meta.data.sheets || []).map((s: any) => s.properties?.title);

    const requests: any[] = [];
    if (!existingTitles.includes('玩家')) {
      requests.push({
        addSheet: { properties: { title: '玩家' } },
      });
    }
    if (!existingTitles.includes('遊戲記錄')) {
      requests.push({
        addSheet: { properties: { title: '遊戲記錄' } },
      });
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests },
      });
    }

    // Write headers if empty
    if (!existingTitles.includes('玩家')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: '玩家!A1:C1',
        valueInputOption: 'RAW',
        requestBody: { values: [['玩家名稱', '密碼', '最後一次登入時間']] },
      });
    }
    if (!existingTitles.includes('遊戲記錄')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: '遊戲記錄!A1:I1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [['時間', '玩家名稱', '遊戲模式', '最終得分', '命中率', '擊破數', '最高連擊', '使用武器', '獲得夜市幣']],
        },
      });
    }
  } catch (err) {
    console.warn('ensureWorksheets notice:', err);
  }
}

/**
 * API: Check Google Sheets Status
 */
app.get('/api/sheets/status', async (_req: Request, res: Response) => {
  const { client, sheetId, clientEmail, error } = getGoogleSheetsClient();

  if (!client || !sheetId) {
    res.json({
      connected: false,
      configured: false,
      sheetId: sheetId ? `${sheetId.slice(0, 6)}...` : null,
      clientEmail: null,
      message: error || '未偵測到 GOOGLE_SERVICE_ACCOUNT_JSON 或 GOOGLE_SHEET_ID 環境變數。已啟用本地備用儲存模式。',
    });
    return;
  }

  try {
    await ensureWorksheets(client, sheetId);
    const meta = await client.spreadsheets.get({ spreadsheetId: sheetId });
    const sheetTitle = meta.data.properties?.title || 'Google Sheet';

    res.json({
      connected: true,
      configured: true,
      sheetTitle,
      sheetId: `${sheetId.slice(0, 6)}...${sheetId.slice(-4)}`,
      clientEmail,
      message: 'Google Sheets API 連線正常，【玩家】與【遊戲記錄】工作表已就緒！',
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    res.json({
      connected: false,
      configured: true,
      sheetId: `${sheetId.slice(0, 6)}...`,
      clientEmail,
      message: `Google Sheets 連線錯誤: ${errMsg}`,
    });
  }
});

/**
 * ==========================================
 * 玩家註冊與登入 API (對應【玩家】工作表)
 * 欄位: 玩家名稱, 密碼, 最後一次登入時間
 * ==========================================
 */

// 玩家註冊
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    res.status(400).json({ success: false, message: '請輸入玩家名稱與密碼' });
    return;
  }

  const cleanName = username.trim();
  const passwordHash = hashPassword(password);
  const now = getFormattedNow();

  const { client, sheetId } = getGoogleSheetsClient();

  if (client && sheetId) {
    try {
      await ensureWorksheets(client, sheetId);

      // Check if username already exists in 玩家工作表
      const getRes = await client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: '玩家!A2:A',
      });
      const rows = getRes.data.values || [];
      const userExists = rows.some((row: string[]) => row[0]?.toLowerCase() === cleanName.toLowerCase());

      if (userExists) {
        res.status(400).json({ success: false, message: `玩家名稱「${cleanName}」已被註冊，請換一個或直接登入！` });
        return;
      }

      // Append row to 玩家 工作表: [玩家名稱, 密碼, 最後一次登入時間]
      await client.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: '玩家!A:C',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[cleanName, passwordHash, now]],
        },
      });

      res.json({
        success: true,
        source: 'google_sheets',
        message: '註冊成功！資料已同步寫入 Google 試算表【玩家】工作表。',
        user: { username: cleanName, lastLoginTime: now, isLoggedIn: true },
      });
      return;
    } catch (err: unknown) {
      console.error('Google Sheets register error:', err);
    }
  }

  // Fallback to memory
  if (memoryPlayers.has(cleanName)) {
    res.status(400).json({ success: false, message: `玩家名稱「${cleanName}」已被註冊，請換一個或直接登入！` });
    return;
  }

  memoryPlayers.set(cleanName, { username: cleanName, passwordHash, lastLoginTime: now });
  res.json({
    success: true,
    source: 'local_fallback',
    message: '註冊成功！（已暫存至伺服器記憶體）',
    user: { username: cleanName, lastLoginTime: now, isLoggedIn: true },
  });
});

// 玩家登入
app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    res.status(400).json({ success: false, message: '請輸入玩家名稱與密碼' });
    return;
  }

  const cleanName = username.trim();
  const passwordHash = hashPassword(password);
  const now = getFormattedNow();

  const { client, sheetId } = getGoogleSheetsClient();

  if (client && sheetId) {
    try {
      await ensureWorksheets(client, sheetId);

      // Read 玩家工作表: A=玩家名稱, B=密碼, C=最後一次登入時間
      const getRes = await client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: '玩家!A2:C',
      });
      const rows = getRes.data.values || [];
      const rowIndex = rows.findIndex((row: string[]) => row[0]?.toLowerCase() === cleanName.toLowerCase());

      if (rowIndex === -1) {
        res.status(404).json({ success: false, message: '查無此玩家名稱，請先註冊帳號！' });
        return;
      }

      const row = rows[rowIndex];
      if (row[1] !== passwordHash && row[1] !== password) {
        res.status(401).json({ success: false, message: '密碼錯誤，請重新確認！' });
        return;
      }

      // Update C column (最後一次登入時間) in Google Sheets
      // Row is (rowIndex + 2) in 1-based indexing because row 1 is header
      const targetRow = rowIndex + 2;
      await client.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `玩家!C${targetRow}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [[now]] },
      });

      res.json({
        success: true,
        source: 'google_sheets',
        message: '登入成功！已更新【玩家】工作表最後登入時間。',
        user: { username: row[0], lastLoginTime: now, isLoggedIn: true },
      });
      return;
    } catch (err: unknown) {
      console.error('Google Sheets login error:', err);
    }
  }

  // Fallback to memory
  const user = memoryPlayers.get(cleanName);
  if (!user) {
    res.status(404).json({ success: false, message: '查無此玩家名稱，請先註冊帳號！' });
    return;
  }

  if (user.passwordHash !== passwordHash && user.passwordHash !== password) {
    res.status(401).json({ success: false, message: '密碼錯誤，請重新確認！' });
    return;
  }

  user.lastLoginTime = now;
  res.json({
    success: true,
    source: 'local_fallback',
    message: '登入成功！（本地記憶體模式）',
    user: { username: user.username, lastLoginTime: now, isLoggedIn: true },
  });
});

/**
 * ==========================================
 * 遊戲記錄自動寫入與查詢 API (對應【遊戲記錄】工作表)
 * 欄位: 時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣
 * ==========================================
 */

async function handleSaveGameRecord(req: Request, res: Response) {
  const {
    time,
    playerName,
    gameMode,
    score,
    accuracy,
    totalHits,
    maxCombo,
    weapon,
    coinsEarned,
  } = req.body;

  const recordTime = time || getFormattedNow();
  const player = playerName?.trim() || '匿名神射手';
  const mode = gameMode || '限時 60秒';
  const finalScore = Number(score) || 0;
  const accStr = typeof accuracy === 'number' ? `${accuracy}%` : accuracy || '0%';
  const hits = Number(totalHits) || 0;
  const combo = Number(maxCombo) || 0;
  const weaponUsed = weapon || '經典軟木塞空氣槍';
  const coins = Number(coinsEarned) || 0;

  const newRecord: GameRecordData = {
    time: recordTime,
    playerName: player,
    gameMode: mode,
    score: finalScore,
    accuracy: accStr,
    totalHits: hits,
    maxCombo: combo,
    weapon: weaponUsed,
    coinsEarned: coins,
  };

  const { client, sheetId } = getGoogleSheetsClient();

  if (client && sheetId) {
    try {
      await ensureWorksheets(client, sheetId);

      // Columns: 時間, 玩家名稱, 遊戲模式, 最終得分, 命中率, 擊破數, 最高連擊, 使用武器, 獲得夜市幣
      const rowValues = [
        newRecord.time,
        newRecord.playerName,
        newRecord.gameMode,
        newRecord.score,
        newRecord.accuracy,
        newRecord.totalHits,
        newRecord.maxCombo,
        newRecord.weapon,
        newRecord.coinsEarned,
      ];

      await client.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: '遊戲記錄!A:I',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [rowValues] },
      });

      res.json({
        success: true,
        source: 'google_sheets',
        message: '遊玩記錄已自動成功存入 Google 試算表【遊戲記錄】！',
        record: newRecord,
      });
      return;
    } catch (err: unknown) {
      console.error('Google Sheets save record error:', err);
    }
  }

  // Fallback to memory
  memoryGameRecords.unshift(newRecord);
  res.json({
    success: true,
    source: 'local_fallback',
    message: '遊玩記錄已記錄至伺服器記憶體備用庫！',
    record: newRecord,
  });
}

// 自動儲存遊玩記錄
app.post('/api/records/save', handleSaveGameRecord);
app.post('/api/sheets/scores', handleSaveGameRecord);

// 查詢遊玩記錄列表 (從【遊戲記錄】工作表讀取)
app.get('/api/records/list', async (_req: Request, res: Response) => {
  const { client, sheetId } = getGoogleSheetsClient();

  if (client && sheetId) {
    try {
      await ensureWorksheets(client, sheetId);

      const response = await client.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: '遊戲記錄!A2:I100',
      });

      const rows = response.data.values || [];
      const records: GameRecordData[] = rows.map((row: string[]) => ({
        time: row[0] || '',
        playerName: row[1] || '匿名神射手',
        gameMode: row[2] || '',
        score: parseInt(row[3], 10) || 0,
        accuracy: row[4] || '0%',
        totalHits: parseInt(row[5], 10) || 0,
        maxCombo: parseInt(row[6], 10) || 0,
        weapon: row[7] || '',
        coinsEarned: parseInt(row[8], 10) || 0,
      }));

      // Sort by score descending
      records.sort((a, b) => b.score - a.score);

      res.json({
        success: true,
        source: 'google_sheets',
        records: records.slice(0, 30),
      });
      return;
    } catch (err) {
      console.warn('Failed to read 遊戲記錄 from Google Sheet:', err);
    }
  }

  // Fallback to memory
  const sorted = [...memoryGameRecords].sort((a, b) => b.score - a.score);
  res.json({
    success: true,
    source: 'local_fallback',
    records: sorted.slice(0, 30),
  });
});

app.get('/api/sheets/scores', (_req: Request, res: Response) => {
  res.redirect('/api/records/list');
});

/**
 * Dev / Production Serving Configuration
 */
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    // Redirect root to custom base path
    app.get('/', (_req, res) => {
      res.redirect('/-81418014/');
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.get('/', (_req, res) => {
      res.redirect('/-81418014/');
    });
    app.use('/-81418014', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Night Market Sharpshooter server running on http://localhost:${PORT}`);
  });
}

startServer();
