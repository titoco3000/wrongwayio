/** The speeds points are counted at. Reverse counts as first gear. */
export const DRIVE_GEARS = ['1', '2', '3', '4', '5'] as const
export type DriveGear = (typeof DRIVE_GEARS)[number]

export const emptyByGear = (): Record<DriveGear, number> => ({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 })

/** The counter a gear's points go to. */
export const driveGear = (gear: string): DriveGear => ((DRIVE_GEARS as readonly string[]).includes(gear) ? (gear as DriveGear) : '1')

/** One run of infinite driving. */
export type Run = {
  /** correct answers */
  score: number
  /** how long the run lasted, ms */
  ms: number
  /** correct answers given while in each gear */
  byGear: Record<DriveGear, number>
}

/** Best values ever reached; each is its own record, a run can break any of them. */
export type Records = Run

export type BrokenRecord = { kind: 'gear'; gear: DriveGear } | { kind: 'score' } | { kind: 'time' }

/** Fills in whatever a stored value lacks, so old or damaged data still gives usable records. */
export function normalizeRecords(raw: Partial<Records> | null | undefined): Records {
  const records: Records = { score: Number(raw?.score) || 0, ms: Number(raw?.ms) || 0, byGear: emptyByGear() }
  for (const g of DRIVE_GEARS) records.byGear[g] = Number(raw?.byGear?.[g]) || 0
  return records
}

/** The best of every record after `run`, and which ones the run beat (a run with no points beats nothing). */
export function applyRun(previous: Records, run: Run): { records: Records; broken: BrokenRecord[] } {
  const records = normalizeRecords(previous)
  const broken: BrokenRecord[] = []
  for (const gear of DRIVE_GEARS) {
    if (run.byGear[gear] > records.byGear[gear]) {
      records.byGear[gear] = run.byGear[gear]
      broken.push({ kind: 'gear', gear })
    }
  }
  if (run.score > records.score) {
    records.score = run.score
    broken.push({ kind: 'score' })
  }
  if (run.score > 0 && run.ms > records.ms) {
    records.ms = run.ms
    broken.push({ kind: 'time' })
  }
  return { records, broken }
}

// A logged in user's records live on the user (see `User.infiniteRecords`); the guest has no account, so theirs stay here.
const GUEST_KEY = 'infiniteDrive:guest'

export function loadGuestRecords(): Records | null {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_KEY) ?? 'null')
    return saved ? normalizeRecords(saved) : null
  } catch {
    return null
  }
}

export function saveGuestRecords(records: Records) {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(records))
  } catch {
    // storage unavailable: the records just aren't remembered
  }
}

export function clearGuestRecords() {
  try {
    localStorage.removeItem(GUEST_KEY)
  } catch {
    // storage unavailable: nothing to clear
  }
}

/** 83000 -> "1:23" */
export const formatClock = (ms: number) => {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
