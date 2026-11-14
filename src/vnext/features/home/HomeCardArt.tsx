import styles from '../../shared/art/Art.module.css'
import { ART, asteriskPath, useArtId } from '../../shared/art/artIds'

const CARD_VIEWBOX = '0 0 400 280'

function Asterisks({ points, color, width = 2 }: { points: Array<[number, number]>; color: string; width?: number }) {
  return (
    <g fill="none" stroke={color} strokeLinecap="round" strokeWidth={width}>
      {points.map(([x, y]) => (
        <path d={asteriskPath(x, y)} key={`${x}-${y}`} />
      ))}
    </g>
  )
}

/** 进行中的赛事：星图连线，点亮的那颗插着小旗。 */
export function GameCardArt() {
  const dotsId = useArtId('game-dots')
  return (
    <svg aria-hidden="true" className={styles.svg} preserveAspectRatio="xMidYMid slice" viewBox={CARD_VIEWBOX}>
      <defs>
        <pattern height="10" id={dotsId} patternUnits="userSpaceOnUse" width="10">
          <circle cx="5" cy="5" fill={ART.paper} r="2.2" />
        </pattern>
      </defs>
      <rect fill={ART.ink} height="280" width="400" />
      <circle cx="340" cy="248" fill={`url(#${dotsId})`} r="96" />
      <path
        d="M70 206 L128 150 L196 174 L250 98"
        fill="none"
        stroke={ART.paper}
        strokeDasharray="8 7"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <Asterisks
        color={ART.paper}
        points={[
          [70, 206],
          [128, 150],
          [196, 174],
        ]}
      />
      <circle cx="250" cy="98" fill={ART.ochre} r="8" />
      <path d="M250 98 C251 78 249 60 250 36" fill="none" stroke={ART.ochre} strokeLinecap="round" strokeWidth="3" />
      <path d="M250 38 C266 32 278 46 298 40 L294 68 C278 74 266 62 251 68 Z" fill={ART.ochre} />
      <text className={styles.mono} fill={ART.paper} fillOpacity="0.7" fontSize="11" x="36" y="264">
        CHALLENGE MAP
      </text>
      <text className={styles.hand} fill={ART.paper} fontSize="34" transform="rotate(-5 36 64)" x="36" y="64">
        capture the flag
      </text>
    </svg>
  )
}

/** 学习中的课程：HTTP 笔记纸，红笔把 Cookie 改成管理员。 */
export function CourseCardArt() {
  return (
    <svg aria-hidden="true" className={styles.svg} preserveAspectRatio="xMidYMid slice" viewBox={CARD_VIEWBOX}>
      <rect fill={ART.blue} height="280" width="400" />
      <path d="M400 280 L400 140 A140 140 0 0 0 260 280 Z" fill={ART.ochre} />
      <g transform="rotate(3 170 140)">
        <rect fill={ART.paper} height="218" width="220" x="62" y="34" />
        <path d="M76 76H268M76 102H268M76 128H268M76 174H268M76 200H268" stroke={ART.ink} strokeOpacity="0.15" />
        <path d="M246 34 V86 L256 78 L266 86 V34 Z" fill={ART.green} />
        {[
          ['GET /flag HTTP/1.1', 68, 400],
          ['Host: yinyu.ctf', 94, 400],
          ['Cookie: admin=0', 120, 400],
          ['HTTP/1.1 200 OK', 166, 400],
          ['yinyu{c00kie}', 192, 600],
        ].map(([line, y, weight]) => (
          <text className={styles.pre} fill={ART.ink} fontSize="14" fontWeight={weight} key={line} x="80" y={y}>
            {line}
          </text>
        ))}
        <g fill="none" stroke={ART.red} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <path d="M194 122 L212 106" />
          <path d="M150 158 C156 144 212 142 218 158 C224 172 196 178 176 176 C152 175 144 166 152 154" />
        </g>
        <text className={styles.hand} fill={ART.red} fontSize="30" x="212" y="108">
          1
        </text>
        <text className={styles.hand} fill={ART.ink} fillOpacity="0.75" fontSize="26" x="82" y="236">
          admin=1 ;)
        </text>
      </g>
    </svg>
  )
}

/** 即将开始的赛事：极光与撕页日历，日期来自赛事开始时间。 */
export function UpcomingCardArt({ month, day }: { month: string; day: string }) {
  return (
    <svg aria-hidden="true" className={styles.svg} preserveAspectRatio="xMidYMid slice" viewBox={CARD_VIEWBOX}>
      <rect fill={ART.green} height="280" width="400" />
      <g fill="none" strokeLinecap="round">
        <path d="M-10 92 C70 60 130 120 210 76 S320 40 410 84" stroke={ART.paper} strokeOpacity="0.7" strokeWidth="1.6" />
        <path d="M-10 120 C60 80 120 150 200 100 S330 60 410 110" stroke={ART.pink} strokeWidth="7" />
        <path d="M-10 145 C70 105 130 175 210 125 S330 90 410 135" stroke={ART.paper} strokeWidth="2.6" />
        <path d="M-10 170 C60 136 140 198 220 152 S340 118 410 162" stroke={ART.ochre} strokeWidth="4" />
      </g>
      <g transform="translate(34 30) rotate(-5)">
        <rect fill={ART.ink} height="30" width="138" />
        <text className={styles.mono} fill={ART.paper} fontSize="12" x="12" y="20">
          NEXT FIELD
        </text>
      </g>
      <g transform="rotate(-5 292 186)">
        <rect fill={ART.paper} height="128" width="120" x="232" y="122" />
        <rect fill={ART.red} height="30" width="120" x="232" y="122" />
        <circle cx="258" cy="122" fill={ART.ink} r="5" />
        <circle cx="326" cy="122" fill={ART.ink} r="5" />
        <text className={styles.mono} fill={ART.paper} fontSize="13" textAnchor="middle" x="292" y="143">
          {month}
        </text>
        <text className={styles.serif} fill={ART.ink} fontSize="64" textAnchor="middle" x="292" y="226">
          {day}
        </text>
      </g>
      <text className={styles.hand} fill={ART.paper} fontSize="38" transform="rotate(-4 34 236)" x="34" y="236">
        warm up!
      </text>
    </svg>
  )
}
