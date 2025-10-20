export type EventItem = {
  id: string
  year: string
  description: string
}

export type RangeItem = {
  id: string
  from: string
  to: string
  category: string
  events: EventItem[]
}

export type TimelineData = {
  title: string
  ranges: RangeItem[]
}
