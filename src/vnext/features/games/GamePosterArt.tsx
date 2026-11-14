import { useState } from 'react'
import { posterIcon, SpotPalette, SpotTile } from '../../shared/art/spot'
import type { GameListStatus } from './gameCatalog'

const STATUS_PALETTE: Record<GameListStatus, SpotPalette> = {
  ongoing: 'peach',
  upcoming: 'lavender',
  ended: 'sand',
}

/** 赛事占位图：手绘图标卡，色调按状态区分（进行中桃色、即将开始薰衣草、已结束沙色），图标按编号轮换。纯装饰。 */
export function GamePosterArt({ seed, status }: { seed: number; status: GameListStatus }) {
  return <SpotTile icon={posterIcon('game', seed)} palette={STATUS_PALETTE[status]} seed={seed} />
}

/** 赛事海报；没有海报或加载失败时显示占位海报。 */
export function GamePoster({
  seed,
  src,
  status,
  title,
}: {
  seed: number
  src?: string | null
  status: GameListStatus
  title?: string | null
}) {
  const [failed, setFailed] = useState(false)
  if (src && !failed) {
    return <img alt={`${title || '赛事'}海报`} loading="lazy" onError={() => setFailed(true)} src={src} />
  }
  return <GamePosterArt seed={seed} status={status} />
}
