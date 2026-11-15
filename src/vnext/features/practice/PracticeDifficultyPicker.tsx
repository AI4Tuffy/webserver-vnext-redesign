import { ChevronDown, RotateCcw, Signal } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import styles from './PracticeCatalog.module.css'
import { practiceDifficultyLevels } from './usePracticeCatalog'

export function PracticeDifficultyPicker({ level, exact, onSelect }: {
  level: number
  exact: boolean
  onSelect: (level: number) => void
}) {
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const label = exact ? practiceDifficultyLevels[level].label : '自定义'

  useEffect(() => {
    const trigger = triggerRef.current
    const panel = panelRef.current
    if (!trigger || !panel) return

    const placeAbove = () => {
      if (!panel.matches(':popover-open')) return
      const triggerBounds = trigger.getBoundingClientRect()
      const { offsetWidth, offsetHeight } = panel
      const viewportWidth = document.documentElement.clientWidth
      panel.style.setProperty('--difficulty-left', `${Math.max(8, Math.min(triggerBounds.right - offsetWidth, viewportWidth - offsetWidth - 8))}px`)
      panel.style.setProperty('--difficulty-top', `${Math.max(8, triggerBounds.top - offsetHeight - 8)}px`)
      panel.dataset.positioned = 'true'
    }

    const clearPosition = () => { delete panel.dataset.positioned }
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
      <button aria-label={`难度 ${label}`} className={styles.difficultyTrigger} popoverTarget={panelId} ref={triggerRef} type="button">
        <Signal aria-hidden="true" size={17} />
        <span>难度</span>
        <strong>{label}</strong>
        <ChevronDown aria-hidden="true" size={14} />
      </button>
      <div className={styles.difficultyPopover} id={panelId} popover="auto" ref={panelRef}>
        <div className={styles.difficultyHeading}>
          <label htmlFor={`${panelId}-range`}>题目难度</label>
          <output htmlFor={`${panelId}-range`}>{label}</output>
          <button aria-label="重置难度" className={styles.difficultyReset} onClick={() => onSelect(0)} type="button">
            <RotateCcw aria-hidden="true" size={16} />
          </button>
        </div>
        <div className={styles.difficultySlider} data-level={level}>
          <span aria-hidden="true" className={styles.difficultyRail}>
            <span className={styles.difficultyStops}>
              {practiceDifficultyLevels.map(({ label: stop }, index) => (
                <span data-passed={index < level} key={stop} />
              ))}
            </span>
          </span>
          <input
            aria-valuetext={label}
            className={styles.difficultyRange}
            id={`${panelId}-range`}
            max={practiceDifficultyLevels.length - 1}
            min={0}
            onChange={(event) => onSelect(event.currentTarget.valueAsNumber)}
            step={1}
            type="range"
            value={level}
          />
        </div>
      </div>
    </>
  )
}
