import express, { Request, Response } from 'express';
import path from 'path';
import config from '../config.json';
import { store } from './store';
import { createMailer } from './mailer';
import { setupScheduler, getNextTraining } from './scheduler';

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const mailer = createMailer(config.smtp);

// Setup cron-based resets
setupScheduler(config.training.sessions);

// ── API ──────────────────────────────────────────────────────────────────────

// GET /api/config  – public config (no secrets)
app.get('/api/config', (_req: Request, res: Response) => {
  const next = getNextTraining(config.training.sessions);
  res.json({
    club: config.club,
    trainers: config.trainers.map(t => ({ id: t.id, name: t.name })),
    nextTraining: {
      displayStr: next.displayStr,
      label: next.label,
      isoDate: next.date.toISOString(),
    },
    baseUrl: config.app.baseUrl,
  });
});

// GET /api/absagen  – all current absences
app.get('/api/absagen', (_req: Request, res: Response) => {
  const all = store.getAll();
  const byTrainer: Record<string, typeof all> = {};

  for (const trainer of config.trainers) {
    byTrainer[trainer.id] = all.filter(a => a.trainerId === trainer.id);
  }

  res.json({
    total: store.count(),
    lastReset: store.getLastReset().toISOString(),
    byTrainer,
    all,
  });
});

// POST /api/absagen  – submit new absence
app.post('/api/absagen', async (req: Request, res: Response) => {
  const { kindName, trainerId } = req.body as { kindName: string; trainerId: string };

  if (!kindName?.trim() || !trainerId?.trim()) {
    res.status(400).json({ error: 'kindName und trainerId sind erforderlich.' });
    return;
  }

  const trainer = config.trainers.find(t => t.id === trainerId);
  if (!trainer) {
    res.status(400).json({ error: 'Unbekannter Trainer.' });
    return;
  }

  const next = getNextTraining(config.training.sessions);

  const absage = store.add({
    kindName: kindName.trim(),
    trainerId,
    trainerName: trainer.name,
    trainingDate: next.displayStr,
  });

  // Send email (non-blocking, log errors)
  mailer.sendAbsageEmail(absage, trainer.email).catch(err => {
    console.error('[Mail] Failed to send:', err.message);
  });

  res.status(201).json({ success: true, absage });
});

// DELETE /api/absagen  – manual reset
app.delete('/api/absagen', (_req: Request, res: Response) => {
  store.reset();
  res.json({ success: true, message: 'Alle Absagen wurden zurückgesetzt.' });
});

// ── Start ────────────────────────────────────────────────────────────────────

const PORT = config.app.port ?? 3000;
app.listen(PORT, () => {
  console.log(`\n🏓 TT Absagen-System läuft auf http://localhost:${PORT}`);
  console.log(`   Übersicht: http://localhost:${PORT}/overview.html\n`);
});
