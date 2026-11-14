import styles from '../../../shared/art/Art.module.css'
import { useArtId } from '../../../shared/art/artIds'
import { CaptionBand, EraSplit, Grain, PRINT, PrintDefs, round } from '../../../shared/art/print'

export interface PodiumEntry {
  rank: number
  score: number
  mine: boolean
}

interface ScoreboardArtProps {
  podium: PodiumEntry[]
  receipt: PodiumEntry[]
  teamCount: number
  flagCount: number
  bloodCount: number
  leaderBloods: number
  gapToNext?: { rank: number; points: number }
}

/*
 * 排行榜主视觉：年代拼贴。左半是车站里那种翻牌显示屏（为实时更新而生），
 * 右半是同一行名次延续成今天的点阵 LED。名次、分数、提交数等全部来自当前积分榜。
 */

const W = 760
const H = 560
const AREA = 524
const SPLIT = 380
const ROW_TOP = 118
const ROW_H = 58
const AMBER = '#f2a93b'

/** 5×7 点阵数字。 */
const LED: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

/** 一格翻牌：上下两片，中间一道缝。 */
function Flap({ x, y, char, accent = false }: { x: number; y: number; char: string; accent?: boolean }) {
  return (
    <g>
      <rect fill={accent ? PRINT.riso : '#2b2a27'} height="40" rx="3" width="28" x={x} y={y} />
      <path d={`M${x} ${y + 20}H${x + 28}`} stroke="#121211" strokeWidth="1.4" />
      <text className={styles.mono} fill={PRINT.paper} fontSize="22" fontWeight="600" textAnchor="middle" x={x + 14} y={y + 28}>
        {char}
      </text>
    </g>
  )
}

/** 点阵数字：亮点为琥珀色，暗点保留淡淡的底色。 */
function LedDigits({ x, y, value }: { x: number; y: number; value: string }) {
  const dots: Array<[number, number, boolean]> = []
  ;[...value].forEach((char, index) => {
    const glyph = LED[char] ?? ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
    glyph.forEach((line, row) => {
      ;[...line].forEach((bit, column) => {
        dots.push([round(x + index * 36 + column * 6), round(y + row * 6), bit === '1'])
      })
    })
  })
  return (
    <g>
      {dots.map(([cx, cy, on]) => (
        <circle cx={cx} cy={cy} fill={on ? AMBER : '#3a2f1c'} key={`${cx}-${cy}`} r="2.3" />
      ))}
    </g>
  )
}

export function ScoreboardArt({
  podium,
  receipt,
  teamCount,
  flagCount,
  bloodCount,
  leaderBloods,
  gapToNext,
}: ScoreboardArtProps) {
  const id = useArtId('scoreboard')
  const rows = receipt.slice(0, 6)
  const mineIndex = rows.findIndex((entry) => entry.mine)

  const header = (color: string) => (
    <>
      <text className={styles.mono} fill={color} fontSize="13" fontWeight="600" letterSpacing="0.16em" x="40" y="70">
        YINYU-CTF SCOREBOARD
      </text>
      <text className={styles.mono} fill={color} fillOpacity="0.7" fontSize="12" letterSpacing="0.12em" textAnchor="end" x="720" y="70">
        LIVE · {pad(teamCount)} TEAMS
      </text>
      <path d="M40 84H720" stroke={color} strokeOpacity="0.3" strokeWidth="1" />
    </>
  )

  const before = (
    <>
      <rect fill="#191917" height={AREA} width={W} />
      {header(PRINT.paper)}
      {rows.map((entry, index) => {
        const y = ROW_TOP + index * ROW_H
        const team = entry.mine ? 'YOU ' : '----'
        return (
          <g key={entry.rank}>
            {[...pad(entry.rank)].map((char, charIndex) => (
              <Flap char={char} key={charIndex} x={40 + charIndex * 31} y={y} />
            ))}
            {[...team].map((char, charIndex) => (
              <Flap accent={entry.mine && char !== ' '} char={char} key={charIndex} x={128 + charIndex * 31} y={y} />
            ))}
          </g>
        )
      })}
    </>
  )

  const after = (
    <>
      <rect fill="#0f0f0e" height={AREA} width={W} />
      {header(AMBER)}
      {rows.map((entry, index) => {
        const y = ROW_TOP + index * ROW_H
        return (
          <g key={entry.rank}>
            {entry.mine ? <path d={`M${SPLIT + 32} ${y + 11}l12 9l-12 9z`} fill={PRINT.riso} /> : null}
            <LedDigits value={String(entry.score).padStart(4, ' ')} x={SPLIT + 70} y={y + 4} />
          </g>
        )
      })}
    </>
  )

  return (
    <svg
      aria-label={`积分榜插图：领奖台前三名分别为 ${podium.map((entry) => `${entry.score} 分`).join('、') || '暂无'}；翻牌屏与点阵屏上列出前几名与本队，共 ${teamCount} 支队伍、${flagCount} 次正确提交。`}
      className={styles.svg}
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <PrintDefs grain={0.26} id={id} />
      <EraSplit after={after} afterTag="2026" afterTagColor={AMBER} before={before} beforeTag="1956" beforeTagColor={PRINT.paper} height={AREA} id={id} split={SPLIT} width={W} />

      {leaderBloods > 0 ? (
        <g transform="translate(40 96)">
          <rect fill={PRINT.riso} height="16" rx="2" width="128" />
          <text className={styles.mono} fill={PRINT.paper} fontSize="10" fontWeight="700" letterSpacing="0.08em" x="8" y="11.5">
            FIRST BLOOD ×{leaderBloods}
          </text>
        </g>
      ) : null}

      {mineIndex >= 0 ? (
        <text className={styles.serif} fill={PRINT.riso} fontSize="24" fontStyle="italic" x={SPLIT + 230} y={ROW_TOP + mineIndex * ROW_H + 30}>
          us!
        </text>
      ) : null}

      <path d={`M40 ${AREA - 50}H720`} stroke={PRINT.paper} strokeOpacity="0.2" strokeWidth="1" />
      <text className={styles.pre} fill={PRINT.paper} fillOpacity="0.85" fontSize="13" letterSpacing="0.08em" x="40" y={AREA - 24}>
        {`FLAGS ${flagCount}   BLOODS ${bloodCount}`}
      </text>
      {gapToNext ? (
        <text className={styles.mono} fill={AMBER} fontSize="13" letterSpacing="0.08em" textAnchor="end" x="720" y={AREA - 24}>
          {gapToNext.points} pts to #{gapToNext.rank}
        </text>
      ) : null}

      <CaptionBand height={H} note="Split-flap board, 1956 → LED matrix" plate="PL. 13" width={W} y={AREA} />
      <Grain height={H} id={id} width={W} />
    </svg>
  )
}
