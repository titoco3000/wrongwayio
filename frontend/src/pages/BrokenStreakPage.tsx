import { Button } from '../components/general/ButtonsRow'
import Container from '../components/general/Container'
import Pigeon from '../components/general/Pigeon'
import { useI18n } from '../i18n'

type Props = {
  /** days of the streak that was lost */
  streak: number
  onDone: () => void
}

/** Shown when the app opens and yesterday's daily challenge was missed, ending a running streak. */
export default function BrokenStreakPage({ streak, onDone }: Props) {
  const { t } = useI18n()
  return (
    <Container
      scroll={false}
      body={
        <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
          <Pigeon className="size-32" />
          <h1 className="text-4xl">{t('brokenStreak.title')}</h1>
          <p className="text-gray-dark">{t('brokenStreak.body', { count: streak })}</p>
          <p className="text-gray-dark">{t('brokenStreak.hint')}</p>
          <div className="w-full">
            <Button className="w-full" onClick={onDone}>
              {t('brokenStreak.action')}
            </Button>
          </div>
        </div>
      }
    />
  )
}
