'use client'

import React, { useEffect, useId, useRef, useState } from 'react'
import { TimelineData } from '@/types/timeline'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import gsap from 'gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'

gsap.registerPlugin(MotionPathPlugin)

export default function TimelineBlock({ data }: { data: TimelineData }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const id = useId()

  const totalRanges = data.ranges.length
  const activeRange = data.ranges[activeIndex]

  const rootRef = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLSpanElement>(null)
  const toRef = useRef<HTMLSpanElement>(null)
  const swiperRef = useRef<HTMLDivElement>(null)

  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const trackerRef = useRef<{ item: number }>({ item: 0 })
  const itemsRef = useRef<Element[]>([])
  const itemStepRef = useRef(0)

  const utilsRef = useRef({
    wrapProgress: (v: number) => v,
    snap: (v: number) => v,
    wrapTracker: (v: number) => v
  })

  const animateNumbers = (from: number, to: number, element: HTMLElement | null) => {
    if (!element || from === to) return

    const fromValue = { value: from }

    gsap.to(fromValue, {
      value: to,
      duration: Math.min(Math.abs(to - from) * 0.05, 1.2),
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(fromValue.value).toString()
      }
    })
  }

  useEffect(() => {
    const fromElement = fromRef.current
    const toElement = toRef.current
    const swiperElement = swiperRef.current
    const prev = data.ranges[activeIndex - 1] || data.ranges[activeIndex + 1] || activeRange

    animateNumbers(Number(prev.from), Number(activeRange.from), fromElement)
    animateNumbers(Number(prev.to), Number(activeRange.to), toElement)

    swiperElement &&
      gsap.fromTo(swiperElement, { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power2.out' })
  }, [activeIndex])

  useEffect(() => {
    const root = rootRef.current

    if (!root) return

    const holder = root.querySelector(`#holder-${id}`) as SVGCircleElement

    if (!holder) return

    const circlePath = MotionPathPlugin.convertToPath(holder, false)[0]
    circlePath.id = `circlePath-${id}`

    root.querySelector('svg')?.prepend(circlePath)

    const items = gsap.utils.toArray<HTMLElement>(
      root.querySelectorAll('.timeline-ellipse__dot')
    )
    itemsRef.current = items

    const numItems = items.length
    const itemStep = 1 / numItems
    itemStepRef.current = itemStep

    const wrapProgress = gsap.utils.wrap(0, 1)
    const snap = gsap.utils.snap(itemStep)
    const wrapTracker = gsap.utils.wrap(0, numItems)

    utilsRef.current = { wrapProgress, snap, wrapTracker }

    const tracker = { item: 0 }
    trackerRef.current = tracker

    const ACTIVE_ANGLE_DEG = -67
    const startProgress = ACTIVE_ANGLE_DEG / 360

    gsap.set(items, {
      motionPath: {
        path: circlePath,
        align: circlePath,
        alignOrigin: [0.5, 0.5],
        start: startProgress,
        end: index => startProgress + index / numItems
      }
    })

    const tl = gsap.timeline({ paused: true, reversed: true })

    tl
      .to(root.querySelector('.timeline-ellipse'), {
        rotation: 360,
        transformOrigin: 'center',
        duration: 1,
        ease: 'none'
      })
      .to(
        items,
        {
          rotation: '-=360',
          transformOrigin: 'center center',
          duration: 1,
          ease: 'none'
        },
        0
      )
      .to(
        tracker,
        {
          item: numItems,
          duration: 1,
          ease: 'none',
          modifiers: { item: v => wrapTracker(numItems - Math.round(Number(v))) }
        },
        0
      )

    timelineRef.current = tl
  }, [])

  const moveWheel = (amount: number) => {
    const tl = timelineRef.current
    const tracker = trackerRef.current
    const items = itemsRef.current
    const { wrapProgress, snap } = utilsRef.current

    if (!tl || !items.length) return

    const progress = tl.progress()
    const next = tracker.item

    tl.progress(wrapProgress(snap(progress + amount)))
    tl.progress(progress)

    const root = rootRef.current
    root?.querySelector('.timeline-ellipse__dot_active')?.classList.remove('timeline-ellipse__dot_active')

    items[next].classList.add('timeline-ellipse__dot_active')

    gsap.to(tl, {
      progress: snap(tl.progress() + amount),
      modifiers: { progress: wrapProgress }
    })
  }

  const goTo = (index: number) => {
    const current = trackerRef.current.item
    const diff = current - index

    setActiveIndex(index)

    const total = itemsRef.current.length
    const step = itemStepRef.current

    if (Math.abs(diff) < total / 2) {
      moveWheel(diff * step)
    } else {
      const direction = diff > 0 ? -1 : 1
      const amount = (total - Math.abs(diff)) * step

      moveWheel(direction * amount)
    }
  }

  const goPrev = () => activeIndex > 0 && (setActiveIndex(index => index - 1), moveWheel(itemStepRef.current))
  const goNext = () => activeIndex < totalRanges - 1 && (setActiveIndex(index => index + 1), moveWheel(-itemStepRef.current))

  const isPrevInactive = activeIndex === 0
  const isNextInactive = activeIndex === totalRanges - 1

  return (
    <div className="timeline" ref={rootRef}>
      {/* Шапка */}
      <span className="timeline__title">{data.title}</span>
      <div className="timeline__range timeline-range">
        <span ref={fromRef} className="timeline-range__from">{activeRange.from}</span>
        <span ref={toRef} className="timeline-range__to">{activeRange.to}</span>
      </div>
      <span className="timeline__category">{activeRange.category}</span>

      {/* Круг с категориями событий (только для десктопа) */}
      <div className="timeline__ellipse timeline-ellipse">
        {data.ranges.map((range, index) => (
          <div
            key={index}
            className={`timeline-ellipse__dot ${index === activeIndex ? 'timeline-ellipse__dot_active' : ''}`}
            onClick={() => goTo(index)}
          >
            <div className="timeline-ellipse__tooltip">
              <div className="timeline-ellipse__number">{index + 1}</div>
              <span className="timeline-ellipse__category">{range.category}</span>
            </div>
          </div>
        ))}
        <svg width="530" height="530" viewBox="0 0 530 530" fill="none">
          <circle id={`holder-${id}`} opacity="0.2" cx="265" cy="265" r="264.5" stroke="#42567A" />
        </svg>
      </div>

      <hr />

      <div className="timeline__content">
        {/* События во временном промежутке */}
        <div className="timeline__swiper-container" ref={swiperRef}>
          <Swiper
            modules={[Navigation]}
            navigation
            slidesPerView={1.63}
            spaceBetween={12}
            breakpoints={{
              1200: { slidesPerView: 3.18, spaceBetween: 80 }
            }}
          >
            {activeRange.events.map(event => (
              <SwiperSlide key={event.id}>
                <div className="timeline__event timeline-event">
                  <span className="timeline-event__year">{event.year}</span>
                  <p className="timeline-event__description">{event.description}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Внешнее управление слайдером */}
        <div className="timeline__controls timeline-controls">
          <div className="timeline-controls__wrapper">
            <span className="timeline-controls__progress-numbers">
              {String(activeIndex + 1).padStart(2, '0')}/{String(totalRanges).padStart(2, '0')}
            </span>
            <div className="timeline-controls__buttons">
              <button
                onClick={goPrev}
                className={`timeline-controls__button timeline-controls__button_prev ${isPrevInactive ? 'timeline-controls__button_inactive' : ''}`}
                disabled={isPrevInactive}
              />
              <button
                onClick={goNext}
                className={`timeline-controls__button timeline-controls__button_next ${isNextInactive ? 'timeline-controls__button_inactive' : ''}`}
                disabled={isNextInactive}
              />
            </div>
          </div>
          <div className="timeline-controls__progress-dots">
            {data.ranges.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`timeline-controls__progress-dot ${index === activeIndex ? 'timeline-controls__progress-dot_active' : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
