export interface Absage {
  id: string;
  kindName: string;
  trainerId: string;
  trainerName: string;
  timestamp: Date;
  trainingDate: string; // "Mittwoch, 04.06.2025 um 18:00 Uhr"
}

class AbsagenStore {
  private absagen: Absage[] = [];
  private lastReset: Date = new Date();

  add(absage: Omit<Absage, 'id' | 'timestamp'>): Absage {
    const entry: Absage = {
      ...absage,
      id: Math.random().toString(36).slice(2, 9),
      timestamp: new Date(),
    };
    this.absagen.push(entry);
    return entry;
  }

  getAll(): Absage[] {
    return [...this.absagen].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getByTrainer(trainerId: string): Absage[] {
    return this.absagen.filter(a => a.trainerId === trainerId);
  }

  reset(): void {
    this.absagen = [];
    this.lastReset = new Date();
    console.log(`[Store] Reset at ${this.lastReset.toISOString()}`);
  }

  getLastReset(): Date {
    return this.lastReset;
  }

  count(): number {
    return this.absagen.length;
  }
}

export const store = new AbsagenStore();
