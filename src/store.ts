import fs from 'fs';
import path from 'path';

export interface Absage {
  id: string;
  kindName: string;
  trainerId: string;
  trainerName: string;
  timestamp: Date;
  trainingDate: string;
}

interface StoreData {
  absagen: Absage[];
  lastReset: string; // ISO string
}

const DATA_FILE = path.join(__dirname, '..', 'data', 'absagen.json');

class AbsagenStore {
  private absagen: Absage[] = [];
  private lastReset: Date = new Date();

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw: StoreData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        // Dates are serialized as strings in JSON — restore them
        this.absagen = (raw.absagen ?? []).map(a => ({
          ...a,
          timestamp: new Date(a.timestamp),
        }));
        this.lastReset = new Date(raw.lastReset ?? Date.now());
        console.log(`[Store] Loaded ${this.absagen.length} absagen from ${DATA_FILE}`);
      } else {
        console.log(`[Store] No data file found, starting fresh`);
      }
    } catch (e) {
      console.error('[Store] Failed to load data file, starting fresh:', e);
    }
  }

  private save(): void {
    try {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      const data: StoreData = {
        absagen: this.absagen,
        lastReset: this.lastReset.toISOString(),
      };
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('[Store] Failed to save data file:', e);
    }
  }

  add(absage: Omit<Absage, 'id' | 'timestamp'>): Absage {
    const entry: Absage = {
      ...absage,
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date(),
    };
    this.absagen.push(entry);
    this.save();
    return entry;
  }

  getAll(): Absage[] {
    return [...this.absagen].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  getByTrainer(trainerId: string): Absage[] {
    return this.absagen.filter(a => a.trainerId === trainerId);
  }

  reset(): void {
    console.log(`[Store] reset() called, had ${this.absagen.length} entries`);
    this.absagen = [];
    this.lastReset = new Date();
    this.save();
    console.log(`[Store] reset() done at ${this.lastReset.toISOString()}`);
  }

  getLastReset(): Date {
    return this.lastReset;
  }

  count(): number {
    return this.absagen.length;
  }
}

export const store = new AbsagenStore();
