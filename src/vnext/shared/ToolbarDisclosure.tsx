import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { IconButton } from './Toolbar'
import styles from './ToolbarDisclosure.module.css'

/** Group adjacent disclosure buttons under a common end-aligned popover anchor. */
export function ToolbarDisclosureGroup({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `${styles.group} ${className}` : styles.group}>{children}</div>
}

export function ToolbarDisclosure({
  label,
  icon,
  heading,
  detail,
  indicator = false,
  wide = false,
  onOpen,
  children,
}: {
  label: string
  icon: ReactNode
  heading?: string
  detail?: string
  indicator?: boolean
  wide?: boolean
  onOpen?: () => void
  children: (close: () => void) => ReactNode
}) {
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])

  const close = () => {
    trigger.current?.focus()
    setOpen(false)
  }

  return (
    <div
      className={styles.root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.stopPropagation()
          close()
        }
      }}
      ref={root}
    >
      <IconButton
        active={open}
        aria-controls={id}
        aria-expanded={open}
        className={styles.trigger}
        label={label}
        onClick={() => {
          if (!open) onOpen?.()
          setOpen(!open)
        }}
        ref={trigger}
        tone="ghost"
      >
        {icon}
        {indicator && <span aria-hidden="true" className={styles.indicator} />}
      </IconButton>
      <div className={styles.panel} data-wide={wide || undefined} hidden={!open} id={id}>
        {heading && (
          <div className={styles.heading}>
            <strong>{heading}</strong>
            {detail && <span className={styles.detail}>{detail}</span>}
          </div>
        )}
        {children(close)}
      </div>
    </div>
  )
}
