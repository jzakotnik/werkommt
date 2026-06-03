import fs from "fs";
import path from "path";

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
  lastReset: Date;
}

const DATA_FILE = path.join(__dirname, "..", "data", "absagen.json");

// --- persistence ---
function read(): StoreData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      return {
        // Dates are serialized as strings in JSON — restore them
        absagen: (raw.absagen ?? []).map((a: Absage) => ({
          ...a,
          timestamp: new Date(a.timestamp),
        })),
        lastReset: new Date(raw.lastReset ?? Date.now()),
      };
    }
  } catch (e) {
    console.error("[Store] Failed to read data file, returning empty:", e);
  }
  return { absagen: [], lastReset: new Date() };
}

function write(data: StoreData): void {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(
        { absagen: data.absagen, lastReset: data.lastReset.toISOString() },
        null,
        2,
      ),
      "utf-8",
    );
  } catch (e) {
    console.error("[Store] Failed to write data file:", e);
  }
}

// --- operations ---
export function add(absage: Omit<Absage, "id" | "timestamp">): Absage {
  const data = read(); // re-read so we don't clobber concurrent writes
  const entry: Absage = {
    ...absage,
    id: Math.random().toString(36).slice(2, 9),
    timestamp: new Date(),
  };
  data.absagen.push(entry);
  write(data);
  return entry;
}

export function getAll(): Absage[] {
  return read().absagen.sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
  );
}

export function getByTrainer(trainerId: string): Absage[] {
  return read().absagen.filter((a) => a.trainerId === trainerId);
}

export function reset(): void {
  const { absagen } = read();
  console.log(`[Store] reset() called, had ${absagen.length} entries`);
  const lastReset = new Date();
  write({ absagen: [], lastReset });
  console.log(`[Store] reset() done at ${lastReset.toISOString()}`);
}

export function getLastReset(): Date {
  return read().lastReset;
}

export function count(): number {
  return read().absagen.length;
}

// optional: bundled object so existing `store.add(...)` call sites keep working
export const store = {
  add,
  getAll,
  getByTrainer,
  reset,
  getLastReset,
  count,
};
