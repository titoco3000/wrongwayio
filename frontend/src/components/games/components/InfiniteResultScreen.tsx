import { Button } from '../../general/ButtonsRow'
import Container from '../../general/Container'
import Pigeon from '../../general/Pigeon'
import { DRIVE_GEARS, formatClock, type BrokenRecord, type Run } from '../../../infinite/infiniteDrive'
import { useI18n } from '../../../i18n'

type Props = {
  /** why the run ended */
  cause: 'wrong' | 'crash'
  run: Run
  /** records the run beat, announced on top */
  broken: BrokenRecord[]
  onContinue: () => void
}

/** End of an infinite run: what ended it, the score, the time, the points of each gear and the records beaten. */
export default function InfiniteResultScreen({ cause, run, broken, onContinue }: Props) {
  const { t } = useI18n()
  const message = (record: BrokenRecord) =>
    record.kind === 'gear'
      ? t('infinite.record.gear', { gear: t(`gear.${record.gear}`) })
      : record.kind === 'score'
        ? t('infinite.record.score')
        : t('infinite.record.time')
  return (
    <Container
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-5 p-6 text-center">
          <h1 className="text-4xl text-brand-red">{cause === 'crash' ? t('result.crashed') : t('result.lost')}</h1>
          <Pigeon className="size-24 grayscale" />
          <div>
            <p className="text-7xl text-brand-blue">{run.score}</p>
            <p className="text-xl">{t('infinite.points', { count: run.score })}</p>
            <p className="text-gray-dark">{t('infinite.timeLine', { time: formatClock(run.ms) })}</p>
          </div>
          {broken.length > 0 && (
            <ul className="flex flex-col gap-1 text-xl text-brand-blue">
              {broken.map((r) => (
                <li key={r.kind === 'gear' ? r.gear : r.kind}>★ {message(r)}</li>
              ))}
            </ul>
          )}
          <div className="w-full max-w-xs">
            <p className="mb-1 text-gray-dark">{t('infinite.perGear')}</p>
            <ul>
              {DRIVE_GEARS.map((g) => (
                <li key={g} className="flex justify-between border-b-2 border-gray-soft py-1">
                  <span>{t(`gear.${g}`)}</span>
                  <b>{run.byGear[g]}</b>
                </li>
              ))}
            </ul>
          </div>
          <Button className="w-full flex-none!" onClick={onContinue}>
            {t('common.continue')}
          </Button>
        </div>
      }
    />
  )
}
