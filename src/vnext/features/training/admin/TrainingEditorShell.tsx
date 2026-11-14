import { ReactNode } from 'react'
import styles from './TrainingEditorShell.module.css'

export function TrainingEditorShell({
  eyebrow,
  title,
  description,
  meta,
  actions,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  meta?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          {description ? <p>{description}</p> : null}
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
        {actions ? <div className={styles.headerActions}>{actions}</div> : null}
      </header>
      {children}
    </div>
  )
}

export function EditorSection({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className={styles.section}>
      <header>
        <h2>{title}</h2>
        {description ? <p>{description}</p> : null}
      </header>
      <div>{children}</div>
    </section>
  )
}

export function EditorActionBar({ children, status }: { children: ReactNode; status?: ReactNode }) {
  return (
    <footer className={styles.actionBar}>
      <div>{status}</div>
      <div>{children}</div>
    </footer>
  )
}
