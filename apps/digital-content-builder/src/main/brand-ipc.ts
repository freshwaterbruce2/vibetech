import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { initDatabase } from './database';

function analyzeTone(sample: string): string {
  if (!sample) return 'neutral';
  const lower = sample.toLowerCase();
  if (lower.includes('we help') || lower.includes('our team')) return 'professional';
  if (lower.includes('awesome') || lower.includes('cool') || lower.includes('!')) return 'casual';
  if (lower.includes('api') || lower.includes('architecture') || lower.includes('throughput')) return 'technical';
  return 'neutral';
}

export function registerBrandIpc(): void {
  const { db } = initDatabase() as { db: Database.Database };

  ipcMain.handle('brand:saveProfile', async (_evt, args: { name: string; sample: string }) => {
    const tone = analyzeTone(args.sample);
    const profile = { tone, keywords: [] };
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO brand_voices (id, name, tone, sample_content, ai_profile, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, args.name, tone, args.sample, JSON.stringify(profile), Date.now());
    return { id, tone };
  });

  ipcMain.handle('brand:listProfiles', async () => {
    const rows = db.prepare(`SELECT id, name, tone, created_at as createdAt FROM brand_voices ORDER BY created_at DESC`).all();
    return rows;
  });
}
