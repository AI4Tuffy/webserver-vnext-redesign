import { useId } from 'react'

/** 生成可用于 SVG url(#id) 引用的唯一前缀，避免同页多份插图的图案 id 冲突。 */
export function useArtId(name: string) {
  return `${name}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
}

/** 手绘星号：横、竖、两条斜线。 */
export function asteriskPath(x: number, y: number, size = 7) {
  const d = Math.round(size * 0.7)
  return `M${x - size} ${y}h${size * 2}M${x} ${y - size}v${size * 2}M${x - d} ${y - d}l${d * 2} ${d * 2}M${x - d} ${y + d}l${d * 2} ${-d * 2}`
}

export const ART = {
  ink: '#1b1b19',
  paper: '#efe8d8',
  kraft: '#d9c29c',
  blue: '#7fa4e2',
  green: '#2f8a5b',
  pink: '#eba7b7',
  ochre: '#e4ae45',
  red: '#d3472c',
  termGreen: '#8fd6a6',
  termBar: '#2e2e2a',
} as const
