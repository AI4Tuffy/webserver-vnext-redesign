import {
  ArrowUpRight,
  Binary,
  Blocks,
  Braces,
  Check,
  ChevronDown,
  CircuitBoard,
  Cpu,
  FileSearch,
  Globe2,
  Grid2X2,
  KeyRound,
  Layers,
  List,
  Radar,
  Search,
  Shield,
  Smartphone,
  Terminal,
} from 'lucide-react'
import { Link, useLocation } from 'react-router'
import {
  ActionButton,
  DataState,
  EditorialPlate,
  FilterBar,
  HairlineItem,
  HairlineList,
  PageHeader,
  PageShell,
  PaginationBar,
  SearchInput,
  SegmentedControl,
  segmentedItemClassName,
  SplitWorkspace,
  StatusBadge,
  ToolbarGroup,
} from '../../shared'
import { SpotTile, type SpotIconName, type SpotPalette } from '../../shared/art/spot'
import { useVNextPageTitle } from '../../shared/useVNextPageTitle'
import styles from './PracticeCatalog.module.css'
import { PracticeDifficultyPicker } from './PracticeDifficultyPicker'
import { PracticeJournalArt } from './PracticeJournalArt'
import type { ExerciseInfoDto } from './api/practiceApi'
import { practiceDifficultyLevels, usePracticeCatalog } from './usePracticeCatalog'

const categoryIcons = {
  Web: Globe2,
  Pwn: Terminal,
  Reverse: Binary,
  Crypto: KeyRound,
  Misc: Blocks,
  Forensics: FileSearch,
  Mobile: Smartphone,
  Blockchain: Layers,
  Hardware: CircuitBoard,
  PPC: Braces,
  AI: Cpu,
  Pentest: Shield,
  OSINT: Search,
  IR: Radar,
}
const categoryArt: Record<string, [SpotIconName, SpotPalette]> = {
  Web: ['network', 'sage'],
  Pwn: ['terminal', 'sand'],
  Reverse: ['checklist', 'lavender'],
  Crypto: ['padlock', 'peach'],
  Misc: ['lightbulb', 'sand'],
  Forensics: ['magnifier', 'sky'],
  Mobile: ['chat', 'peach'],
  Blockchain: ['network', 'lavender'],
  Hardware: ['terminal', 'sage'],
  PPC: ['checklist', 'sky'],
  AI: ['lightbulb', 'lavender'],
  Pentest: ['target', 'peach'],
  OSINT: ['magnifier', 'sand'],
  IR: ['shield', 'sage'],
}

function PracticeEntry({ exercise, grid }: { exercise: ExerciseInfoDto; grid: boolean }) {
  const [icon, palette] = categoryArt[exercise.category ?? ''] ?? categoryArt.Misc
  const level = practiceDifficultyLevels.find(({ values }) => values.includes(exercise.difficulty ?? ''))

  const to = `/practice/challenge/${exercise.id}`
  const meta = (
    <span className={styles.entryMeta}>
      {exercise.category && <span>{exercise.category}</span>}
      {exercise.difficulty && <span>{level?.label ?? exercise.difficulty}</span>}
      {exercise.solved && (
        <StatusBadge tone="success" icon={<Check size={13} />}>
          已完成
        </StatusBadge>
      )}
    </span>
  )

  if (!grid) return <HairlineItem to={to} title={exercise.title} meta={meta} />

  return (
    <li>
      <Link className={styles.entryLink} to={to}>
        <div className={styles.entryArt}>
          <SpotTile icon={icon} palette={palette} seed={exercise.id} />
        </div>
        {meta}
        <h2 className={styles.entryTitle}>{exercise.title}</h2>
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
    <PageShell variant="wide">
      <PageHeader
        title={title}
        illustration={
          <EditorialPlate slot="practice-journal" aspect="20/13" alt="从手算草稿到二进制实验记录">
            <PracticeJournalArt />
          </EditorialPlate>
        }
      />
      <SplitWorkspace
        asidePosition="left"
        asideWidth="narrow"
        stickyAside={false}
        mobileAsideFirst
        aside={
          <div className={styles.filters}>
            <details className={styles.categoryDisclosure}>
              <summary className={styles.categoryTitle}>
                <span>题目分类{catalog.category ? ` · ${catalog.category}` : ''}</span>
                <ChevronDown aria-hidden="true" className={styles.disclosureIcon} size={16} />
              </summary>
            </details>
            <h2 className={styles.desktopCategoryTitle}>题目分类</h2>
            <SegmentedControl
              activeKey={catalog.category}
              aria-label="题目分类"
              className={styles.categoryControl}
              keepVertical
              orientation="vertical"
              role="group"
            >
              <button
                aria-pressed={!catalog.category}
                className={segmentedItemClassName}
                onClick={() => catalog.setCategory(null)}
                type="button"
              >
                <Grid2X2 aria-hidden="true" size={17} />
                全部分类
              </button>
              {Object.entries(categoryIcons).map(([category, Icon]) => (
                <button
                  aria-pressed={catalog.category === category}
                  className={segmentedItemClassName}
                  key={category}
                  onClick={() => catalog.setCategory(category)}
                  type="button"
                >
                  <Icon aria-hidden="true" size={17} />
                  {category}
                </button>
              ))}
            </SegmentedControl>
          </div>
        }
      >
        <section className={styles.catalog} aria-label="练习题目">
          <FilterBar>
            <SearchInput
              label="搜索题目"
              placeholder="搜索题目或标签"
              value={catalog.query}
              onValueChange={catalog.search}
            />
            <ToolbarGroup align="end">
              <PracticeDifficultyPicker
                exact={catalog.hasExactDifficultyLevel}
                level={catalog.difficultyLevel}
                onSelect={catalog.setDifficulty}
              />
              <SegmentedControl activeKey={catalog.view} aria-label="题目显示方式" role="group" size="sm">
                <button
                  aria-pressed={catalog.view === 'grid'}
                  className={segmentedItemClassName}
                  onClick={() => catalog.setView('grid')}
                  type="button"
                >
                  <Grid2X2 aria-hidden="true" size={16} />
                  网格
                </button>
                <button
                  aria-pressed={catalog.view === 'list'}
                  className={segmentedItemClassName}
                  onClick={() => catalog.setView('list')}
                  type="button"
                >
                  <List aria-hidden="true" size={16} />
                  列表
                </button>
              </SegmentedControl>
            </ToolbarGroup>
          </FilterBar>
          {catalog.hasPriorFilters ? (
            <div>
              <ActionButton tone="ghost" size="sm" onClick={catalog.clearPriorFilters}>
                清除链接中的附加筛选
              </ActionButton>
            </div>
          ) : null}
          <div aria-busy={catalog.isValidating}>
            {catalog.error ? (
              <DataState description="练习题库暂时不可用，请稍后刷新。" title="题库加载失败" />
            ) : !exercises ? (
              <DataState loading title="题库加载中" />
            ) : exercises.length === 0 ? (
              <div role="status">
                <DataState title="没有符合条件的题目" description="调整关键词或筛选条件后重试。" />
              </div>
            ) : catalog.view === 'list' ? (
              <HairlineList aria-label="练习题目列表" data-view="list">
                {exercises.map((exercise) => (
                  <PracticeEntry exercise={exercise} grid={false} key={exercise.id} />
                ))}
              </HairlineList>
            ) : (
              <ul aria-label="练习题目网格" className={styles.entries} data-view="grid">
                {exercises.map((exercise) => (
                  <PracticeEntry exercise={exercise} grid key={exercise.id} />
                ))}
              </ul>
            )}
          </div>
          {!catalog.error && (
            <PaginationBar
              label="题库分页"
              page={page}
              pageCount={pageCount}
              quiet
              disabled={catalog.isValidating}
              onPageChange={catalog.pagination.setPage}
            />
          )}
        </section>
      </SplitWorkspace>
    </PageShell>
  )
}
