import { DiscreteFilter } from '../../shared/DiscreteFilter'
import { practiceDifficultyLevels } from './usePracticeCatalog'

const labels = practiceDifficultyLevels.map(({ label }) => label)

export function PracticeDifficultyPicker({
  level,
  exact,
  onSelect,
}: {
  level: number
  exact: boolean
  onSelect: (level: number) => void
}) {
  return (
    <DiscreteFilter
      label="难度"
      fieldLabel="题目难度"
      options={labels}
      index={level}
      valueText={exact ? labels[level] : '自定义'}
      onSelect={onSelect}
    />
  )
}
