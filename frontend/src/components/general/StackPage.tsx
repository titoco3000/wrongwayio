import { keySoundProps } from './keySound'
import type { ReactNode } from 'react'
import Container from './Container'
import { useStack } from './PagesStack'
import { useI18n } from '../../i18n'

type Props = {
  /** back arrow pops this page; close button removes every page */
  nav: 'back' | 'close'
  /** content shown in the header next to the nav button */
  header?: ReactNode
  body: ReactNode
  footer?: ReactNode
}

/** A Container whose header starts with a back arrow or close button. */
export default function StackPage({ nav, header, body, footer }: Props) {
  const { pop, close } = useStack()
  const { t } = useI18n()

  return (
    <Container
      header={
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            type="button"
            {...keySoundProps(nav === 'back' ? pop : close)}
            aria-label={nav === 'back' ? t('common.back') : t('common.close')}
            className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-2xl text-gray-dark hover:bg-gray-soft"
          >
            {nav === 'back' ? '←' : '✕'}
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">{header}</div>
        </div>
      }
      body={body}
      footer={footer}
    />
  )
}
