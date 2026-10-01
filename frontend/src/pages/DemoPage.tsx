import { useState, type ReactNode } from 'react'
import { Button, ButtonsRow } from '../components/ButtonsRow'
import PagesStack, { useStack } from '../components/PagesStack'
import Pigeon from '../components/Pigeon'
import { Option, Select } from '../components/Select'
import SpeechBubble from '../components/SpeechBubble'
import StackPage from '../components/StackPage'
import ThemeToggle from '../components/ThemeToggle'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg text-gray-dark">{title}</h2>
      {children}
    </section>
  )
}

/** A page of the demo's own stack (stack B); `depth` shows how deep we are. */
function InnerPage({ depth, nav }: { depth: number; nav: 'back' | 'close' }) {
  const { push } = useStack()
  return (
    <StackPage
      nav={nav}
      header={<h1 className="text-xl">Page {depth}</h1>}
      body={
        <div className="flex flex-col gap-3 p-4">
          <p>This page covers the whole screen, including the page that hosts this stack.</p>
          <p>Back arrow pops this page, close button removes all pages of this stack.</p>
          <Button onClick={() => push(<InnerPage depth={depth + 1} nav="back" />)}>Push back-page</Button>
          <Button variant="danger" onClick={() => push(<InnerPage depth={depth + 1} nav="close" />)}>
            Push close-page
          </Button>
        </div>
      }
    />
  )
}

function DemoStack() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open nested stack</Button>
      {open && <PagesStack initial={<InnerPage depth={1} nav="close" />} onEmpty={() => setOpen(false)} />}
    </>
  )
}

function ScrollPage() {
  const rows = Array.from({ length: 40 }, (_, i) => `Body line ${i + 1}`)
  return (
    <StackPage
      nav="back"
      header={<h1 className="text-xl">Container</h1>}
      body={
        <ul className="p-4">
          {rows.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      }
      footer={<div className="p-4">Footer (always visible)</div>}
    />
  )
}

function DemoBody() {
  const { push } = useStack()
  const [submitted, setSubmitted] = useState('none')
  const [selected, setSelected] = useState('none')

  return (
    <div className="flex flex-col gap-8 p-4">
      <Section title="Splash icon">
        <Pigeon className="size-20" />
      </Section>

      <Section title="ButtonsRow & Button">
        <ButtonsRow onSubmit={setSubmitted}>
          <Button value="left">Left</Button>
          <Button value="right" variant="danger">Right</Button>
          <Button value="neither" variant="neutral">Neither</Button>
        </ButtonsRow>
        <p>onSubmit value: <b>{submitted}</b></p>
      </Section>

      <Section title="Select & Option">
        <Select onChange={setSelected}>
          <Option value="left">Left</Option>
          <Option value="right">Right</Option>
          <Option value="up">Up (wrong)</Option>
        </Select>
        <p>onChange value: <b>{selected}</b></p>
      </Section>

      <Section title="SpeechBubble">
        <SpeechBubble side="left">Tail on the left.</SpeechBubble>
        <SpeechBubble side="right">Tail on the right.</SpeechBubble>
        <div className="h-4" />
      </Section>

      <Section title="Container">
        <Button onClick={() => push(<ScrollPage />)}>Open scrolling container</Button>
      </Section>

      <Section title="PagesStack & StackPage (nested stack)">
        <DemoStack />
      </Section>
    </div>
  )
}

export default function DemoPage() {
  return (
    <StackPage
      nav="back"
      header={
        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-xl">Demo</h1>
          <ThemeToggle />
        </div>
      }
      body={<DemoBody />}
    />
  )
}
