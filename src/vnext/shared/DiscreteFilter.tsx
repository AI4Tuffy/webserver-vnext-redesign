import { ChevronDown, RotateCcw, Signal } from 'lucide-react'
import { useEffect, useLayoutEffect, useId, useRef } from 'react'
import styles from './DiscreteFilter.module.css'
import { ActionButton } from './Interaction'
import { IconButton } from './Toolbar'

export function DiscreteFilter({
  label,
  fieldLabel,
  options,
  index,
  valueText = options[index],
  onSelect,
}: {
  label: string
  fieldLabel: string
  options: readonly string[]
  index: number
  valueText?: string
  onSelect: (index: number) => void
}) {
  const panelId = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const sliderRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const progress = options.length > 1 ? index / (options.length - 1) : 0
    sliderRef.current?.style.setProperty('--range-fill', `${progress * 100}%`)
  }, [index, options.length])

  useEffect(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const placeAbove = () => {
      if (!panel.matches(':popover-open')) return
      const triggerBounds = trigger.getBoundingClientRect()
      const { offsetWidth, offsetHeight } = panel
      const viewportWidth = document.documentElement.clientWidth
      panel.style.setProperty(
        '--difficulty-left',
        `${Math.max(8, Math.min(triggerBounds.right - offsetWidth, viewportWidth - offsetWidth - 8))}px`
      )
      panel.style.setProperty('--difficulty-top', `${Math.max(8, triggerBounds.top - offsetHeight - 8)}px`)
      panel.dataset.positioned = 'true'
    }

    const clearPosition = () => {
      delete panel.dataset.positioned
    }
    panel.addEventListener('beforetoggle', clearPosition)
    panel.addEventListener('toggle', placeAbove)
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(placeAbove) : undefined
    observer?.observe(trigger)
    window.addEventListener('resize', placeAbove)
    window.addEventListener('scroll', placeAbove, true)
    return () => {
      panel.removeEventListener('beforetoggle', clearPosition)
      panel.removeEventListener('toggle', placeAbove)
      observer?.disconnect()
      window.removeEventListener('resize', placeAbove)
      window.removeEventListener('scroll', placeAbove, true)
    }
  }, [])

  return (
    <>
      <span className={styles.triggerAnchor} ref={triggerRef}>
        <ActionButton
          aria-label={`${label} ${valueText}`}
          icon={<Signal aria-hidden="true" size={17} />}
          popoverTarget={panelId}
          shape="pill"
          type="button"
        >
          <span className={styles.triggerText}>
            {label} <strong>{valueText}</strong>
            <ChevronDown aria-hidden="true" className={styles.chevron} size={14} />
          </span>
        </ActionButton>
      </span>
      <div className={styles.difficultyPopover} id={panelId} popover="auto" ref={panelRef}>
        <div className={styles.difficultyHeading}>
          <label htmlFor={`${panelId}-range`}>{fieldLabel}</label>
          <output className={styles.value} htmlFor={`${panelId}-range`}>
            {valueText}
          </output>
          <IconButton
            label={`重置${label}`}
            className={styles.reset}
            onClick={() => onSelect(0)}
            size="sm"
            tone="ghost"
          >
            <RotateCcw aria-hidden="true" size={16} />
          </IconButton>
        </div>
        <div className={styles.difficultySlider} ref={sliderRef}>
          <span aria-hidden="true" className={styles.difficultyRail}>
            <span className={styles.difficultyStops}>
              {options.map((stop, stopIndex) => (
                <span className={styles.stop} data-passed={stopIndex < index} key={stop} />
              ))}
            </span>
          </span>
          <input
            aria-valuetext={valueText}
            className={styles.difficultyRange}
            id={`${panelId}-range`}
            max={options.length - 1}
            min={0}
            onChange={(event) => onSelect(event.currentTarget.valueAsNumber)}
            step={1}
            type="range"
            value={index}
          />
        </div>
      </div>
    </>
  )
}
