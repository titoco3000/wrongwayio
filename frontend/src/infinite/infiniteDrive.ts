import { emptyLocalData, loadLocalData, saveLocalData } from '../localData'

/** The speeds points are counted at; 'R' is reverse. */
export const DRIVE_GEARS = ['1', '2', '3', '4', '5', 'R'] as const
export type DriveGear = (typeof DRIVE_GEARS)[number]

export const emptyByGear = (): Record<DriveGear, number> => ({ '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, R: 0 })

/** The counter a gear's points go to; neutral and anything unknown count as first gear. */
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
export type Records = Omit<Run, 'ms'>

export type BrokenRecord = { kind: 'gear'; gear: DriveGear } | { kind: 'score' }

/** Records from an account's `drivingHighScores`: best score per gear, in the order of `DRIVE_GEARS`. */
export function recordsFromScores(scores: readonly number[] | null | undefined): Records {
  const byGear = emptyByGear()
  DRIVE_GEARS.forEach((g, i) => (byGear[g] = Number(scores?.[i]) || 0))
  return { score: Math.max(0, ...Object.values(byGear)), byGear }
}

/** The `drivingHighScores` of records, in the order of `DRIVE_GEARS`. */
export const scoresFromRecords = (records: Records): number[] => DRIVE_GEARS.map((g) => records.byGear[g])

/** Fills in whatever a stored value lacks, so old or damaged data still gives usable records. */
export function normalizeRecords(raw: Partial<Records> | null | undefined): Records {
  const records: Records = { score: Number(raw?.score) || 0, byGear: emptyByGear() }
  for (const g of DRIVE_GEARS) records.byGear[g] = Number(raw?.byGear?.[g]) || 0
  return records
}

/** The best of every record after `run`, and which ones the run beat (a run with no points beats nothing). */
export function applyRun(previous: Records, run: Records): { records: Records; broken: BrokenRecord[] } {
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
  return { records, broken }
}

// A logged in user's records live on the user (see `User.drivingHighScores`); the guest has no account, so theirs stay on the device.

/** The guest's records, or null if they have none. */
export function loadGuestRecords(): Records | null {
  const records = recordsFromScores(loadLocalData(null).drivingHighScores)
  return records.score > 0 ? records : null
}

export function saveGuestRecords(records: Records) {
  saveLocalData(null, { ...loadLocalData(null), drivingHighScores: scoresFromRecords(records) })
}

export function clearGuestRecords() {
  saveLocalData(null, { ...loadLocalData(null), drivingHighScores: emptyLocalData().drivingHighScores })
}

/** 83000 -> "1:23" */
export const formatClock = (ms: number) => {
  const total = Math.floor(ms / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
