import cron from "node-cron";
import { store } from "./store";

interface Session {
  day: number; // 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  label: string;
  time: string;
  resetDay: number;
  resetTime: string;
}

export function setupScheduler(sessions: Session[]): void {
  // TEMP: fires 2 minutes from now to test
  /*const now = new Date();
  const testMinute = (now.getMinutes() + 1) % 60;
  const testHour = now.getHours() + (now.getMinutes() >= 58 ? 1 : 0);
  cron.schedule(`${testMinute} ${testHour} * * *`, () => {
    console.log("[Scheduler] ✅ TEST CRON FIRED — cron is working!");
    store.reset();
  });
  console.log(`[Scheduler] Test cron scheduled for ${testHour}:${testMinute}`);*/
  for (const session of sessions) {
    const [resetHour, resetMinute] = session.resetTime.split(":").map(Number);
    const cronDay = session.resetDay === 0 ? 0 : session.resetDay; // node-cron: 0=So, 1=Mo...7=So

    // Cron: minute hour * * dayOfWeek
    const cronExpr = `${resetMinute} ${resetHour} * * ${cronDay}`;

    cron.schedule(
      cronExpr,
      () => {
        console.log(
          `[Scheduler] Reset triggered for session: ${session.label} ${session.time}`,
        );
        store.reset();
      },
      {
        timezone: "Europe/Berlin",
      },
    );

    console.log(
      `[Scheduler] Scheduled reset: ${session.label} at ${session.resetTime} (cron: ${cronExpr})`,
    );
  }
}

// Helper: returns the next upcoming training date/time from sessions
export function getNextTraining(sessions: Session[]): {
  label: string;
  date: Date;
  displayStr: string;
} {
  const now = new Date();
  const candidates: { label: string; date: Date; displayStr: string }[] = [];

  for (const session of sessions) {
    const [hour, minute] = session.time.split(":").map(Number);

    // Try this week and next week
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(now);
      candidate.setDate(now.getDate() + offset);
      candidate.setHours(hour, minute, 0, 0);

      const dayOfWeek = candidate.getDay(); // 0=So, 1=Mo...6=Sa
      if (dayOfWeek === session.day && candidate > now) {
        const displayStr =
          candidate.toLocaleDateString("de-DE", {
            weekday: "long",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }) + ` um ${session.time} Uhr`;

        candidates.push({ label: session.label, date: candidate, displayStr });
        break;
      }
    }
  }

  // Return the soonest upcoming training
  candidates.sort((a, b) => a.date.getTime() - b.date.getTime());
  return (
    candidates[0] ?? {
      label: "Nächstes Training",
      date: new Date(),
      displayStr: "Nächstes Training",
    }
  );
}
