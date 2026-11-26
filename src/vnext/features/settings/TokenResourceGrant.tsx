import { TextField } from '../../shared/FormControls'

export function TokenResourceGrant({
  className,
  resourceId,
  resourceType,
  onResourceIdChange,
  onResourceTypeChange,
}: {
  className?: string
  resourceId: string
  resourceType: string
  onResourceIdChange: (value: string) => void
  onResourceTypeChange: (value: string) => void
}) {
  return (
    <div className={className}>
      <TextField
        label="资源类型"
        maxLength={64}
        onValueChange={onResourceTypeChange}
        placeholder="game"
        value={resourceType}
      />
      <TextField
        label="资源 ID"
        maxLength={128}
        onValueChange={onResourceIdChange}
        placeholder="赛事 ID，例如 42"
        value={resourceId}
      />
    </div>
  )
}

export function TokenResourceList({
  resources,
}: {
  resources?: { resourceType?: string; resourceId?: string }[] | null
}) {
  if (!resources?.length) return <small>未限制</small>
  return resources.map((resource) => (
    <span key={`${resource.resourceType}:${resource.resourceId}`}>
      {resource.resourceType}:{resource.resourceId}
    </span>
  ))
}
