import styles from './Art.module.css'
import { PRINT, round, url } from './print'

/*
 * 大幅图版里用到的两件铜版画主体：挂锁（培训图版）与密码盘（Crypto 图版）。
 * 排线图案来自 print.tsx 的 PrintDefs，需要传入同一个图版 id。
 */

function polar(cx: number, cy: number, r: number, angle: number) {
  return `${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`
}

/** suffix 用于同一图版里画两次挂锁时区分裁切路径的 id。 */
export function Padlock({ id, suffix = '' }: { id: string; suffix?: string }) {
  return (
    <g fill="none" stroke={PRINT.ink} strokeLinejoin="round">
      <path
        d="M122 104V78A38 38 0 0 1 198 78V104H185V78A25 25 0 0 0 135 78V104Z"
        fill={url(id, 'hatch')}
        strokeWidth="1.5"
      />
      <path d="M128.5 104V78A31.5 31.5 0 0 1 191.5 78V104" strokeOpacity="0.55" strokeWidth="0.6" />
      <path d="M185 104V78A25 25 0 0 0 175 58" strokeWidth="3" />
      <clipPath id={`${id}-body${suffix}`}>
        <rect height="88" rx="7" width="116" x="102" y="102" />
      </clipPath>
      <g clipPath={`url(#${id}-body${suffix})`}>
        <rect fill={url(id, 'vlines')} height="88" opacity="0.18" width="116" x="102" y="102" />
        <rect fill={url(id, 'vlines')} height="88" opacity="0.55" width="22" x="196" y="102" />
        <rect fill={url(id, 'cross')} height="88" width="10" x="208" y="102" />
        <rect fill={url(id, 'hatch')} height="12" opacity="0.7" width="116" x="102" y="178" />
      </g>
      <rect height="88" rx="7" strokeWidth="1.6" width="116" x="102" y="102" />
      <rect height="74" rx="4" strokeWidth="0.6" width="102" x="109" y="109" />
      <path d="M109 124H211M109 168H211" strokeWidth="0.5" />
      {[
        [116, 116],
        [204, 116],
        [116, 176],
        [204, 176],
      ].map(([cx, cy]) => (
        <circle cx={cx} cy={cy} fill={PRINT.paper} key={`${cx}-${cy}`} r="2.6" strokeWidth="0.9" />
      ))}
      <circle cx="160" cy="138" fill={PRINT.ink} r="8" stroke="none" />
      <path d="M155 142L151.5 162H168.5L165 142Z" fill={PRINT.ink} stroke="none" />
    </g>
  )
}

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

/** 密码盘：外圈与内圈字母错开三位，中心环排线，顶部红色指针。原点为圆心，半径 72。 */
export function CipherDisk({ id, stroke = PRINT.ink }: { id: string; stroke?: string }) {
  return (
    <g fill="none" stroke={stroke} strokeLinecap="round">
      <circle r="72" strokeWidth="1.8" />
      <circle r="68" strokeOpacity="0.5" strokeWidth="0.6" />
      <circle r="52" strokeWidth="1.3" />
      <circle r="34" strokeWidth="1.3" />
      <path d="M-34 0a34 34 0 1 0 68 0a34 34 0 1 0 -68 0ZM-12 0a12 12 0 1 1 24 0a12 12 0 1 1 -24 0Z" fill={url(id, 'hatch')} fillRule="evenodd" stroke="none" />
      <circle r="12" strokeWidth="1.1" />
      <circle fill={stroke} r="3" stroke="none" />
      {ALPHABET.map((letter, index) => {
        const angle = (index / 26) * Math.PI * 2 - Math.PI / 2
        const tick = angle + Math.PI / 26
        const turn = round((angle * 180) / Math.PI + 90)
        const outer = [round(60 * Math.cos(angle)), round(60 * Math.sin(angle))]
        const inner = [round(43 * Math.cos(angle)), round(43 * Math.sin(angle))]
        return (
          <g key={letter}>
            <path d={`M${polar(0, 0, 52, tick)}L${polar(0, 0, 68, tick)}`} strokeOpacity="0.55" strokeWidth="0.5" />
            <path d={`M${polar(0, 0, 34, tick)}L${polar(0, 0, 52, tick)}`} strokeOpacity="0.4" strokeWidth="0.5" />
            <text
              className={styles.serif}
              dominantBaseline="central"
              fill={stroke}
              fontSize="10"
              stroke="none"
              textAnchor="middle"
              transform={`rotate(${turn} ${outer[0]} ${outer[1]})`}
              x={outer[0]}
              y={outer[1]}
            >
              {letter}
            </text>
            <text
              className={styles.serif}
              dominantBaseline="central"
              fill={stroke}
              fontSize="8"
              stroke="none"
              textAnchor="middle"
              transform={`rotate(${turn} ${inner[0]} ${inner[1]})`}
              x={inner[0]}
              y={inner[1]}
            >
              {ALPHABET[(index + 3) % 26]}
            </text>
          </g>
        )
      })}
      <path d="M0 -76L-6 -88H6Z" fill={PRINT.riso} strokeWidth="1" />
    </g>
  )
}
