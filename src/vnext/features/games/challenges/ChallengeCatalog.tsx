import { Check, ChevronDown, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ChallengeInfo, SubmissionType } from '@Api'
import { ActionButton, SearchInput, ToggleField } from '../../../shared'
import styles from './ChallengeCatalog.module.css'
import { categoryMeta } from './challengeCategories'

export interface ChallengeGroup {
  category: string
  challenges: ChallengeInfo[]
}

export function ChallengeCatalog({
  groups,
  selectedId,
  solvedTypes,
  query,
  hideSolved,
  onQueryChange,
  onHideSolvedChange,
  onSelect,
}: {
  groups: ChallengeGroup[]
  selectedId: number | null
  solvedTypes: Map<number, SubmissionType>
  query: string
  hideSolved: boolean
  onQueryChange: (value: string) => void
  onHideSolvedChange: (value: boolean) => void
  onSelect: (challenge: ChallengeInfo) => void
}) {
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
  const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN')
  const visibleGroups = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          challenges: group.challenges.filter((challenge) => {
            const solvedType = solvedTypes.get(challenge.id)
            const solved = solvedType !== undefined && solvedType !== SubmissionType.Unaccepted
            if (hideSolved && solved) return false
            if (!normalizedQuery) return true
            return challenge.title.toLocaleLowerCase('zh-CN').includes(normalizedQuery)
          }),
        }))
        .filter((group) => group.challenges.length > 0),
    [groups, hideSolved, normalizedQuery, solvedTypes]
  )

  const isOpen = (category: string) => Boolean(normalizedQuery) || !collapsed.has(category)

  const toggleCategory = (category: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(category)) next.delete(category)
      else next.add(category)
      return next
    })
  }

  return (
    <div className={styles.catalog}>
      <div className={styles.catalogControls}>
        <SearchInput label="搜索题目" onValueChange={onQueryChange} size="sm" value={query} />
        <ToggleField checked={hideSolved} label="隐藏已解题目" onChange={onHideSolvedChange} />
      </div>
      <div className={styles.groupList}>
        {visibleGroups.map((group) => {
          const meta = categoryMeta(group.category)
          const open = isOpen(group.category)
          return (
            <section key={group.category}>
              <ActionButton
                aria-expanded={open}
                tone="ghost"
                className={styles.categoryRow}
                onClick={() => toggleCategory(group.category)}
                type="button"
              >
                <span className={styles.categoryContent}>
                  {open ? <ChevronDown aria-hidden="true" size={14} /> : <ChevronRight aria-hidden="true" size={14} />}
                  <span className={styles.categoryCode}>{group.category}</span>
                  <span>{meta.label}</span>
                </span>
              </ActionButton>
              {open ? (
                <div>
                  {group.challenges.map((challenge) => {
                    const solvedType = solvedTypes.get(challenge.id)
                    const solved = solvedType !== undefined && solvedType !== SubmissionType.Unaccepted
                    return (
                      <ActionButton
                        aria-current={challenge.id === selectedId ? 'true' : undefined}
                        className={styles.challengeRow}
                        tone="ghost"
                        aria-label={`${challenge.title}，${challenge.score} 分${solved ? '，已解' : ''}`}
                        key={challenge.id}
                        onClick={() => onSelect(challenge)}
                        type="button"
                      >
                        <span className={styles.challengeContent}>
                          <span aria-hidden="true" className={styles.mark} data-solved={solved || undefined}>
                            {solved && <Check size={12} />}
                          </span>
                          <span className={styles.challengeName}>{challenge.title}</span>
                          <span className={styles.challengeScore}>{challenge.score}</span>
                        </span>
                      </ActionButton>
                    )
                  })}
                </div>
              ) : null}
            </section>
          )
        })}
        {!visibleGroups.length ? <div className={styles.emptyCatalog}>没有符合条件的题目。</div> : null}
      </div>
    </div>
  )
}
