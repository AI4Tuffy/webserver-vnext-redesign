import {
  ArrowUpRight, Binary, Blocks, Braces, Check, ChevronDown, ChevronLeft, ChevronRight, CircuitBoard, Cpu, FileSearch, Globe2, Grid2X2,
  KeyRound, Layers, List, Radar, Search, Shield, Smartphone, Terminal,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { ActionButton } from '../../shared/Interaction'
import { DataState, StatusPill } from '../../shared/Primitives'
import { SegmentedControl, segmentedItemClassName } from '../../shared/SegmentedControl'
import { SpotTile, type SpotIconName, type SpotPalette } from '../../shared/art/spot'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import type { ExerciseInfoDto } from './api/practiceApi'
import styles from './PracticeCatalog.module.css'
import { PracticeDifficultyPicker } from './PracticeDifficultyPicker'
import { PracticeJournalArt } from './PracticeJournalArt'
import { practiceDifficultyLevels, usePracticeCatalog } from './usePracticeCatalog'

const categoryIcons = {
  Web: Globe2, Pwn: Terminal, Reverse: Binary, Crypto: KeyRound, Misc: Blocks, Forensics: FileSearch,
  Mobile: Smartphone, Blockchain: Layers, Hardware: CircuitBoard, PPC: Braces, AI: Cpu, Pentest: Shield, OSINT: Search, IR: Radar,
}
const categoryArt: Record<string, [SpotIconName, SpotPalette]> = {
  Web: ['network', 'sage'], Pwn: ['terminal', 'sand'], Reverse: ['checklist', 'lavender'], Crypto: ['padlock', 'peach'],
  Misc: ['lightbulb', 'sand'], Forensics: ['magnifier', 'sky'], Mobile: ['chat', 'peach'], Blockchain: ['network', 'lavender'],
  Hardware: ['terminal', 'sage'], PPC: ['checklist', 'sky'], AI: ['lightbulb', 'lavender'], Pentest: ['target', 'peach'],
  OSINT: ['magnifier', 'sand'], IR: ['shield', 'sage'],
}

function PracticeEntry({ exercise, grid }: { exercise: ExerciseInfoDto; grid: boolean }) {
  const [icon, palette] = categoryArt[exercise.category ?? ''] ?? categoryArt.Misc
  const level = practiceDifficultyLevels.find(({ values }) => values.includes(exercise.difficulty ?? ''))

  return (
    <li className={styles.entry}>
      <Link className={styles.entryLink} to={`/practice/challenge/${exercise.id}`}>
        {grid ? <div className={styles.entryArt}><SpotTile icon={icon} palette={palette} seed={exercise.id} /></div> : null}
        <div className={styles.entryCopy}>
          <div className={styles.entryMeta}>
            {exercise.category ? <span>{exercise.category}</span> : null}
            {exercise.difficulty ? <span>{level?.label ?? exercise.difficulty}</span> : null}
            {exercise.solved ? <StatusPill tone="success"><Check aria-hidden="true" size={13} />已完成</StatusPill> : null}
          </div>
          <h2>{exercise.title}</h2>
        </div>
        <ArrowUpRight aria-hidden="true" className={styles.entryArrow} size={18} />
      </Link>
    </li>
  )
}

export function PracticeBrowsePage() {
  const { pathname } = useLocation()
  const title = pathname.endsWith('/browse') ? '题库浏览' : '自主练习'
  useVNextPageTitle(title)
  const catalog = usePracticeCatalog()
  const exercises = catalog.data?.items
  const page = catalog.data?.page ?? catalog.pagination.page
  const pageCount = Math.ceil((catalog.data?.total ?? 0) / catalog.pagination.pageSize)

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <h1>{title}</h1>
        <div className={styles.heroArt}><PracticeJournalArt /></div>
      </header>
      <div className={styles.layout}>
        <aside className={styles.filters}>
          <details className={styles.categoryDisclosure}>
            <summary className={styles.categoryTitle}>
              <span>题目分类{catalog.category ? ` · ${catalog.category}` : ''}</span>
              <ChevronDown aria-hidden="true" size={16} />
            </summary>
          </details>
          <h2 className={styles.desktopCategoryTitle}>题目分类</h2>
          <SegmentedControl activeKey={catalog.category} aria-label="题目分类" className={styles.categoryControl} keepVertical orientation="vertical" role="group">
            <button aria-pressed={!catalog.category} className={segmentedItemClassName} onClick={() => catalog.setCategory(null)} type="button">
              <Grid2X2 aria-hidden="true" size={17} />全部分类
            </button>
            {Object.entries(categoryIcons).map(([category, Icon]) => (
              <button
                aria-pressed={catalog.category === category}
                className={segmentedItemClassName}
                key={category}
                onClick={() => catalog.setCategory(category)}
                type="button"
              >
                <Icon aria-hidden="true" size={17} />{category}
              </button>
            ))}
          </SegmentedControl>
        </aside>
        <section className={styles.catalog} aria-label="练习题目">
          <div className={styles.toolbar}>
            <label className={styles.search}>
              <Search aria-hidden="true" size={18} />
              <input aria-label="搜索题目" onChange={(event) => catalog.search(event.currentTarget.value)} placeholder="搜索题目或标签" type="search" value={catalog.query} />
            </label>
            <div className={styles.tools}>
              <PracticeDifficultyPicker exact={catalog.hasExactDifficultyLevel} level={catalog.difficultyLevel} onSelect={catalog.setDifficulty} />
              <SegmentedControl activeKey={catalog.view} aria-label="题目显示方式" role="group" size="sm">
                <button aria-pressed={catalog.view === 'grid'} className={segmentedItemClassName} onClick={() => catalog.setView('grid')} type="button">
                  <Grid2X2 aria-hidden="true" size={16} />网格
                </button>
                <button aria-pressed={catalog.view === 'list'} className={segmentedItemClassName} onClick={() => catalog.setView('list')} type="button">
                  <List aria-hidden="true" size={16} />列表
                </button>
              </SegmentedControl>
            </div>
          </div>
          {catalog.hasPriorFilters ? (
            <div className={styles.priorFilters}><button onClick={catalog.clearPriorFilters} type="button">清除链接中的附加筛选</button></div>
          ) : null}
          <div aria-busy={catalog.isValidating}>
            {catalog.error ? (
              <DataState description="练习题库暂时不可用，请稍后刷新。" title="题库加载失败" />
            ) : !exercises ? (
              <DataState loading title="题库加载中" />
            ) : exercises.length ? (
              <ul className={styles.entries} data-view={catalog.view} key={catalog.view}>
                {exercises.map((exercise) => <PracticeEntry exercise={exercise} grid={catalog.view === 'grid'} key={exercise.id} />)}
              </ul>
            ) : (
              <div className={styles.empty} role="status">
                <strong>没有符合条件的题目</strong>
                <p>调整关键词或筛选条件后重试。</p>
              </div>
            )}
          </div>
          {!catalog.error && pageCount > 1 ? (
            <nav aria-label="题库分页" className={styles.pagination}>
              <ActionButton aria-label="上一页" disabled={catalog.isValidating || page <= 1} icon={<ChevronLeft aria-hidden="true" size={17} />} onClick={() => catalog.pagination.setPage(page - 1)} tone="ghost" type="button" />
              <span aria-live="polite">{page} / {pageCount}</span>
              <ActionButton aria-label="下一页" disabled={catalog.isValidating || page >= pageCount} icon={<ChevronRight aria-hidden="true" size={17} />} onClick={() => catalog.pagination.setPage(page + 1)} tone="ghost" type="button" />
            </nav>
          ) : null}
        </section>
      </div>
    </div>
  )
}
