// "Today" for an Indian garage. Workers run in UTC, where a new day starts at
// 5:30am IST — so a plain `new Date()` day boundary files late-night work under
// yesterday and resets the dashboard hours after the workshop opened.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

/** Today's date in IST, YYYY-MM-DD. */
export function todayIST(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10)
}

/** The instant today began in IST, as an ISO string comparable with created_at. */
export function startOfTodayIST(): string {
  return new Date(Date.parse(`${todayIST()}T00:00:00.000Z`) - IST_OFFSET_MS).toISOString()
}
