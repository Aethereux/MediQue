/* MediQue.ph — date picker options, anchored to "today" in Asia/Manila. */

export interface DateOpt {
  iso: string;
  dow: string;
  day: number;
  month: string;
  monthFull: string;
  weekday: string;
  year: number;
  isToday: boolean;
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function buildDates(count = 14): DateOpt[] {
  // en-CA formats as YYYY-MM-DD
  const todayIso = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
  const [y, m, d] = todayIso.split('-').map(Number);
  const out: DateOpt[] = [];
  for (let i = 0; i < count; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i));
    out.push({
      iso: dt.toISOString().slice(0, 10),
      dow: DOW[dt.getUTCDay()],
      day: dt.getUTCDate(),
      month: MON[dt.getUTCMonth()],
      monthFull: MON_FULL[dt.getUTCMonth()],
      weekday: WEEKDAY[dt.getUTCDay()],
      year: dt.getUTCFullYear(),
      isToday: i === 0,
    });
  }
  return out;
}

export function todayOpt(): DateOpt {
  return buildDates(1)[0];
}

export function longLabel(d: DateOpt): string {
  return `${d.weekday}, ${d.monthFull} ${d.day}, ${d.year}`;
}
