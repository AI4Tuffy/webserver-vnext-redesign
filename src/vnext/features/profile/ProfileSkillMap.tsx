import { useMemo, useState } from 'react'
import { DataTable, SectionHeader, SurfaceCard } from '../../shared'
import styles from './ProfileSkillMap.module.css'
import type { UserSkillDimension } from './api/userProfileApi'
import { orderedDimensions, profileDimensionLabel, radarGrid, radarLabelPoint, radarPolygon } from './profileDomain'
import { dimensionDefinition } from './skillDimensionRegistry'

export function ProfileSkillMap({ dimensions }: { dimensions: UserSkillDimension[] }) {
  const ordered = useMemo(() => orderedDimensions(dimensions), [dimensions])
  const [activeId, setActiveId] = useState<string | null>(null)
  const polygon = radarPolygon(ordered)

  return (
    <SurfaceCard>
      <SectionHeader title="分类解题画像" description="按平台 P90 基准归一化" />
      <div className={styles.skillLayout}>
        <div className={styles.radarWrap}>
          <svg aria-label="分类解题雷达图" className={styles.radar} role="img" viewBox="0 0 240 240">
            {[22, 43, 64, 86].map((radius) => (
              <polygon className={styles.radarGrid} key={radius} points={radarGrid(ordered.length, radius)} />
            ))}
            {ordered.map((dimension, index) => {
              const label = radarLabelPoint(index, ordered.length)
              return (
                <g className={styles.axisGroup} data-active={activeId === dimension.id || undefined} key={dimension.id}>
                  <line className={styles.radarAxis} x1="120" x2={label.x} y1="120" y2={label.y} />
                  <text className={styles.radarLabel} textAnchor="middle" x={label.x} y={label.y + 4}>
                    {profileDimensionLabel(dimension.id)}
                  </text>
                </g>
              )
            })}
            <polygon className={styles.radarValue} points={polygon} />
          </svg>
        </div>
        <DataTable
          caption="分类解题统计"
          columns={[
            {
              id: 'category',
              header: '方向',
              render: (dimension) => (
                <span className={styles.dimension} title={dimensionDefinition(dimension.id).description}>
                  {profileDimensionLabel(dimension.id)}
                  {!dimension.sampleSufficient && <small className={styles.sample}>样本不足</small>}
                  <progress
                    className={styles.progress}
                    aria-label={profileDimensionLabel(dimension.id) + '画像值'}
                    value={dimension.radarValue}
                    max={100}
                  />
                </span>
              ),
            },
            { id: 'solved', header: '解题', render: (d) => d.solved, align: 'right' },
            { id: 'attempted', header: '尝试', render: (d) => d.attempted, align: 'right' },
            { id: 'submissions', header: '提交', render: (d) => d.submissions, align: 'right', visibility: 'desktop' },
            { id: 'rate', header: '正确率', render: (d) => d.successRate + '%', align: 'right' },
          ]}
          rows={ordered}
          rowKey={(dimension) => dimension.id}
          onRowHover={(dimension) => setActiveId(dimension?.id ?? null)}
        />
      </div>
    </SurfaceCard>
  )
}
