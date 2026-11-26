import { LoaderCircle, X } from 'lucide-react'
import { ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Interaction.module.css'
import overlayStyles from './Overlay.module.css'

export type ActionTone = 'primary' | 'secondary' | 'danger' | 'ghost'
export type DrawerSide = 'left' | 'right'
export type DrawerSize = 'narrow' | 'medium' | 'wide'
export type DrawerRequestClose = (afterClose?: () => void) => void
type DrawerContent = ReactNode | ((requestClose: DrawerRequestClose) => ReactNode)

const drawerCloseFallbackMs = 1000
let bodyScrollLockCount = 0
let bodyOverflowBeforeLock = ''

function acquireBodyScrollLock() {
  if (bodyScrollLockCount === 0) {
    bodyOverflowBeforeLock = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bodyScrollLockCount += 1
  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1)
    if (bodyScrollLockCount === 0) document.body.style.overflow = bodyOverflowBeforeLock
  }
}

export function ActionButton({
  children,
  tone = 'secondary',
  shape = 'rounded',
  size = 'md',
  icon,
  className,
  loading = false,
  loadingLabel,
  disabled,
  onClick,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {
  tone?: ActionTone
  shape?: 'rounded' | 'pill'
  size?: 'sm' | 'md'
  icon?: ReactNode
  loading?: boolean
  loadingLabel?: string
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => unknown
}) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  const pendingRef = useRef(false)
  const busy = loading || pending
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading || pendingRef.current) {
      event.preventDefault()
      return
    }
    setFailed(false)
    try {
      const result = onClick?.(event)
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        pendingRef.current = true
        setPending(true)
        await result
      }
    } catch {
      // Feature controllers own domain errors. Keep an uncaught action failure visible too.
      setFailed(true)
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  return (
    <>
      <button
        {...props}
        aria-busy={busy || undefined}
        className={`${styles.actionButton} ${styles[`actionButton_${tone}`]} ${className ?? ''}`}
        data-shape={shape}
        data-size={size}
        disabled={disabled || busy}
        onClick={handleClick}
      >
        {busy ? (
          <LoaderCircle
            aria-hidden="true"
            className={`${styles.actionSpinner} ${!icon && !loadingLabel ? styles.actionSpinnerOverlay : ''}`}
            size={16}
          />
        ) : (
          icon
        )}
        <span className={busy && !icon && !loadingLabel ? styles.actionLabelPending : undefined}>
          {busy && loadingLabel ? loadingLabel : children}
        </span>
      </button>
      {busy ? (
        <span className={styles.actionAnnouncement} role="status">
          正在处理，请稍候
        </span>
      ) : null}
      {failed ? (
        <span className={styles.actionError} role="alert">
          操作未完成，请重试。
        </span>
      ) : null}
    </>
  )
}

export function InlineFeedback({
  tone = 'neutral',
  children,
}: {
  tone?: 'success' | 'danger' | 'neutral'
  children: ReactNode
}) {
  return (
    <div
      aria-live={tone === 'danger' ? 'assertive' : 'polite'}
      className={`${styles.feedback} ${styles[`feedback_${tone}`]}`}
      role={tone === 'danger' ? 'alert' : 'status'}
    >
      {children}
    </div>
  )
}

export function VNextDialog({
  open,
  eyebrow,
  title,
  description,
  onClose,
  children,
  footer,
  wide = false,
  closeDisabled = false,
}: {
  open: boolean
  eyebrow?: string
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
  closeDisabled?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    return acquireBodyScrollLock()
  }, [open])

  return createPortal(
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={`${overlayStyles.dialog} ${wide ? overlayStyles.dialogWide : ''}`}
      onCancel={(event) => {
        event.preventDefault()
        if (!closeDisabled) onClose()
      }}
      onClick={(event) => {
        if (!closeDisabled && event.currentTarget === event.target) onClose()
      }}
      ref={ref}
    >
      <div className={overlayStyles.dialogPanel}>
        <header className={overlayStyles.dialogHeader}>
          <div className={overlayStyles.dialogHeadingCopy}>
            {eyebrow ? <span className={overlayStyles.dialogEyebrow}>{eyebrow}</span> : null}
            <h2 className={overlayStyles.dialogTitle} id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className={overlayStyles.dialogDescription} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="关闭"
            className={overlayStyles.dialogClose}
            disabled={closeDisabled}
            onClick={onClose}
            type="button"
          >
            <X size={19} />
          </button>
        </header>
        <div className={overlayStyles.dialogBody}>{children}</div>
        {footer ? <footer className={overlayStyles.dialogFooter}>{footer}</footer> : null}
      </div>
    </dialog>,
    document.body
  )
}

export function VNextConfirmDialog({
  open,
  title,
  description,
  message,
  confirmLabel = '确认',
  confirmationText,
  onClose,
  onConfirm,
  tone = 'danger',
}: {
  open: boolean
  title: string
  description?: string
  message: ReactNode
  confirmLabel?: string
  confirmationText?: string
  onClose: () => void
  onConfirm: () => boolean | void | Promise<boolean | void>
  tone?: Extract<ActionTone, 'primary' | 'danger'>
}) {
  const [input, setInput] = useState('')
  const [confirming, setConfirming] = useState(false)
  const accepted = !confirmationText || input === confirmationText

  useEffect(() => {
    if (!open) setInput('')
  }, [open])

  const confirm = async () => {
    if (!accepted || confirming) return
    setConfirming(true)
    try {
      const result = await onConfirm()
      if (result !== false) onClose()
    } finally {
      setConfirming(false)
    }
  }

  return (
    <VNextDialog
      closeDisabled={confirming}
      description={description}
      footer={
        <>
          <ActionButton disabled={confirming} onClick={onClose} type="button">
            取消
          </ActionButton>
          <ActionButton disabled={!accepted} loading={confirming} onClick={confirm} tone={tone} type="button">
            {confirming ? '正在处理' : confirmLabel}
          </ActionButton>
        </>
      }
      onClose={() => {
        if (!confirming) onClose()
      }}
      open={open}
      title={title}
    >
      <div className={overlayStyles.confirmContent}>
        <p className={overlayStyles.confirmMessage}>{message}</p>
        {confirmationText ? (
          <label className={overlayStyles.confirmField}>
            <span className={overlayStyles.confirmFieldLabel}>请输入“{confirmationText}”确认</span>
            <input
              autoComplete="off"
              className={overlayStyles.confirmInput}
              onChange={(event) => setInput(event.currentTarget.value)}
              value={input}
            />
          </label>
        ) : null}
      </div>
    </VNextDialog>
  )
}

export function VNextDrawer({
  open,
  eyebrow,
  title,
  description,
  onClose,
  children,
  footer,
  side = 'right',
  size = 'wide',
  bodyPadding = 'default',
}: {
  open: boolean
  eyebrow?: string
  title: string
  description?: string
  onClose: () => void
  children: DrawerContent
  footer?: DrawerContent
  side?: DrawerSide
  size?: DrawerSize
  bodyPadding?: 'default' | 'none'
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const closeTimeoutRef = useRef<number | null>(null)
  const closeRequestedRef = useRef(false)
  const afterCloseRef = useRef<(() => void) | null>(null)
  const titleId = useId()
  const descriptionId = useId()
  const [drawerState, setDrawerState] = useState<'closed' | 'opening' | 'open' | 'closing'>('closed')

  const finishClose = () => {
    if (!closeRequestedRef.current) return
    closeRequestedRef.current = false
    if (closeTimeoutRef.current !== null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    const afterClose = afterCloseRef.current
    afterCloseRef.current = null
    const drawer = ref.current
    if (drawer?.open) drawer.close()
    setDrawerState('closed')
    onClose()
    afterClose?.()
    requestAnimationFrame(() => returnFocusRef.current?.focus())
  }

  const requestClose: DrawerRequestClose = (afterClose) => {
    if (drawerState === 'closing') return
    afterCloseRef.current = afterClose ?? null
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose()
      afterCloseRef.current = null
      afterClose?.()
      return
    }
    closeRequestedRef.current = true
    if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current)
    setDrawerState('closing')
    closeTimeoutRef.current = window.setTimeout(() => {
      closeTimeoutRef.current = null
      finishClose()
    }, drawerCloseFallbackMs)
  }

  useLayoutEffect(() => {
    const drawer = ref.current
    if (!drawer) return
    if (open) {
      closeRequestedRef.current = false
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      if (!drawer.open) {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
        drawer.showModal()
      }
      setDrawerState(window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'open' : 'opening')
      return
    }
    if (!open && drawer.open) {
      closeRequestedRef.current = false
      afterCloseRef.current = null
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      drawer.close()
      setDrawerState('closed')
      requestAnimationFrame(() => returnFocusRef.current?.focus())
    }
  }, [open])

  useEffect(
    () => () => {
      if (closeTimeoutRef.current !== null) window.clearTimeout(closeTimeoutRef.current)
    },
    []
  )

  useEffect(() => {
    if (!open) return undefined
    return acquireBodyScrollLock()
  }, [open])

  return (
    <dialog
      aria-describedby={description ? descriptionId : undefined}
      aria-labelledby={titleId}
      className={`${overlayStyles.drawer} ${overlayStyles[`drawer_${side}`]} ${overlayStyles[`drawer_${size}`]} ${
        drawerState === 'opening'
          ? overlayStyles.drawerOpening
          : drawerState === 'open'
            ? overlayStyles.drawerOpen
            : drawerState === 'closing'
              ? overlayStyles.drawerClosing
              : ''
      }`}
      onCancel={(event) => {
        event.preventDefault()
        requestClose()
      }}
      onClick={(event) => {
        if (event.currentTarget === event.target) requestClose()
      }}
      ref={ref}
    >
      <div
        className={`${overlayStyles.drawerPanel} ${
          drawerState === 'opening'
            ? overlayStyles.drawerPanelOpening
            : drawerState === 'closing'
              ? overlayStyles.drawerPanelClosing
              : ''
        }`}
        onAnimationEnd={(event) => {
          if (event.currentTarget !== event.target) return
          if (closeRequestedRef.current) {
            finishClose()
            return
          }
          if (drawerState === 'opening') setDrawerState('open')
        }}
      >
        <header className={overlayStyles.dialogHeader}>
          <div className={overlayStyles.dialogHeadingCopy}>
            {eyebrow ? <span className={overlayStyles.dialogEyebrow}>{eyebrow}</span> : null}
            <h2 className={overlayStyles.dialogTitle} id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className={overlayStyles.dialogDescription} id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <button
            aria-label="关闭"
            className={overlayStyles.dialogClose}
            onClick={() => requestClose()}
            type="button"
          >
            <X size={19} />
          </button>
        </header>
        <div className={`${overlayStyles.drawerBody} ${bodyPadding === 'none' ? overlayStyles.drawerBodyFlush : ''}`}>
          {typeof children === 'function' ? children(requestClose) : children}
        </div>
        {footer ? (
          <footer className={overlayStyles.dialogFooter}>
            {typeof footer === 'function' ? footer(requestClose) : footer}
          </footer>
        ) : null}
      </div>
    </dialog>
  )
}

/** 通用实体详情侧抽屉：前后台详情预览共用，默认不强制渲染英文 eyebrow。 */
export function DetailDrawer({
  open,
  title,
  description,
  eyebrow,
  onClose,
  children,
  footer,
}: {
  open: boolean
  title: string
  description?: string
  eyebrow?: string
  onClose: () => void
  children: DrawerContent
  footer?: DrawerContent
}) {
  return (
    <VNextDrawer
      description={description}
      eyebrow={eyebrow}
      footer={footer}
      onClose={onClose}
      open={open}
      size="wide"
      title={title}
    >
      {children}
    </VNextDrawer>
  )
}
