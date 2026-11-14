import styles from '../../shared/art/Art.module.css'
import { useArtId } from '../../shared/art/artIds'
import { CaptionBand, EraSplit, Grain, PRINT, PrintDefs, round, url } from '../../shared/art/print'

/*
 * 首页主视觉：一幅年代拼贴，讲「夺旗」这个名字从哪来。
 * 左半是户外夺旗游戏的场地示意图（安全竞赛借用了这个游戏的名字），一面布旗插在接缝旁；
 * 同一面旗跨过接缝，到右半变成终端里的十六进制字节——旗从一块布变成了一串字符。
 */

const W = 480
const H = 300
const AREA = 278
const SPLIT = 240

const CLOTH =
  'M178 52C220 34 262 70 304 52C330 41 356 46 380 56C376 88 378 118 384 150C356 138 330 136 304 148C262 166 220 132 178 148Z'

const FLAG_BYTES = '79 69 6e 79 75 7b 68 65 6c 6c 6f 5f 63 74 66 7d '

/** 场地示意图：两块领地、中线、各自的旗与「监狱」，圆点与叉号代表两队队员。 */
function FieldDiagram({ id }: { id: string }) {
  const players: Array<[number, number, 'o' | 'x']> = [
    [52, 204, 'o'], [78, 236, 'o'], [96, 212, 'o'], [140, 206, 'x'], [158, 240, 'x'], [190, 216, 'x'], [112, 248, 'o'],
  ]
  return (
    <g>
      <text className={styles.serif} fill={PRINT.ink} fontSize="9" fontStyle="italic" x="24" y="176">
        The field game
      </text>
      <rect fill="none" height="80" stroke={PRINT.ink} strokeWidth="1" width="190" x="24" y="184" />
      <rect fill={url(id, 'hatch')} height="80" opacity="0.35" width="95" x="119" y="184" />
      <path d="M119 184V264" stroke={PRINT.ink} strokeDasharray="4 3" strokeWidth="0.9" />
      <rect fill="none" height="16" stroke={PRINT.ink} strokeWidth="0.7" width="16" x="28" y="188" />
      <rect fill="none" height="16" stroke={PRINT.ink} strokeWidth="0.7" width="16" x="194" y="244" />
      <path d="M36 248V232L46 236L36 240" fill={PRINT.riso} stroke={PRINT.ink} strokeWidth="0.7" />
      {players.map(([x, y, team]) =>
        team === 'o' ? (
          <circle cx={x} cy={y} fill="none" key={`${x}-${y}`} r="3" stroke={PRINT.ink} strokeWidth="0.9" />
        ) : (
          <path d={`M${x - 3} ${y - 3}l6 6M${x + 3} ${y - 3}l-6 6`} key={`${x}-${y}`} stroke={PRINT.ink} strokeWidth="0.9" />
        )
      )}
      <path d="M96 212C108 206 124 206 140 206" fill="none" stroke={PRINT.pencil} strokeDasharray="1.5 2" strokeWidth="0.8" />
    </g>
  )
}

export function HomeHeroArt() {
  const id = useArtId('hero')

  const pole = (color: string) => (
    <g>
      <path d="M178 252V44" stroke={color} strokeLinecap="round" strokeWidth="2.6" />
      <circle cx="178" cy="40" fill={PRINT.paper} r="4.5" stroke={color} strokeWidth="1.3" />
    </g>
  )

  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <FieldDiagram id={id} />
      <path d={CLOTH} fill={PRINT.riso} />
      <clipPath id={`${id}-cloth`}>
        <path d={CLOTH} />
      </clipPath>
      <g clipPath={`url(#${id}-cloth)`}>
        <rect className={styles.multiply} fill={url(id, 'hatch')} height="70" opacity="0.6" width="220" x="170" y="104" />
        <path
          d="M188 66C214 56 238 76 262 66M188 92C214 84 238 102 262 92M188 120C214 112 238 128 262 120"
          fill="none"
          stroke={PRINT.ink}
          strokeOpacity="0.35"
          strokeWidth="0.6"
        />
      </g>
      <path d={CLOTH} fill="none" stroke={PRINT.ink} strokeWidth="1.3" />
      {pole(PRINT.ink)}
      <path d="M164 254H194M168 258H190" stroke={PRINT.ink} strokeWidth="0.8" />
    </>
  )

  const rows = Array.from({ length: 12 }, (_, row) => FLAG_BYTES.repeat(4).slice((row * 9) % 48))
  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <path d={CLOTH} fill={PRINT.riso} fillOpacity="0.22" />
      <g clipPath={`url(#${id}-cloth)`}>
        {rows.map((row, index) => (
          <text className={styles.pre} fill={index % 3 === 1 ? '#f0c03e' : '#f28b7c'} fontSize="7.4" key={index} x="168" y={round(46 + index * 9.2)}>
            {row}
          </text>
        ))}
      </g>
      <path d={CLOTH} fill="none" stroke="#f28b7c" strokeDasharray="3 2" strokeWidth="1" />
      {pole('#8b877d')}
      {[
        ['$ nc chall.yinyu 31337', '#9fd6a9'],
        ['> AAAA… ret 0x401196', '#dcd8cc'],
        ['$ cat flag.txt', '#9fd6a9'],
        ['yinyu{hello_ctf}', '#f0c03e'],
      ].map(([line, color], index) => (
        <text className={styles.mono} fill={color} fontSize="8" key={line} x="256" y={196 + index * 16}>
          {line}
        </text>
      ))}
    </>
  )

  return (
    <svg
      aria-label="年代拼贴插图：左半是户外夺旗游戏的场地示意图，两块领地、中线和两队队员，一面红色布旗插在接缝旁；同一面旗跨过接缝，到右半变成终端里的十六进制字节，下方终端读出 flag。"
      className={styles.svg}
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <PrintDefs grain={0.26} id={id} />
      <EraSplit after={after} afterTag="2026" afterTagColor={PRINT.paper} before={before} beforeTag="c. 1900" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Capture the flag: a field game becomes a string" plate="PL. 0" width={W} y={AREA} />
      <Grain height={H} id={id} width={W} />
    </svg>
  )
}
