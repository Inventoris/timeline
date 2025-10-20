import TimelineBlock from '@/components/TimelineBlock'
import { timelineMock } from '@/data/timelineMock'

export default function Page() {
  return (
    <main>
      <TimelineBlock data={timelineMock} />
    </main>
  )
}
