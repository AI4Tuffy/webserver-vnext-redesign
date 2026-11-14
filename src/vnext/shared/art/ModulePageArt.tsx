import styles from './Art.module.css'
import { useArtId } from './artIds'
import { Padlock } from './engravings'
import { CaptionBand, EraSplit, Grain, PRINT, PrintDefs, round, url } from './print'

/*
 * 模块页标题旁的大幅插图（400×260，下方 24 单位为图注条）。每幅是一张「年代拼贴」：
 *   赛事   纸上打字的淘汰赛对阵表 → 解题赛题板
 *   练习   报纸棋题专栏 → 引擎分析
 *   培训   百科全书锁匠图版（1751）→ 视频课
 *   战队   社会关系图（1934）→ 团队聊天
 *   组网   手绘网络草图（1969）→ 云上拓扑
 */

const W = 400
const H = 260
const AREA = 236
const SPLIT = 200

interface PlateProps {
  id: string
}

/* ---------- 赛事 ---------- */

const CATEGORIES = ['WEB', 'PWN', 'CRYPTO', 'REV', 'MISC']

function GamesPlate({ id }: PlateProps) {
  const teams = ['TEAM A', 'TEAM B', 'TEAM C', 'TEAM D', 'TEAM E', 'TEAM F', 'TEAM G', 'TEAM H']
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      {teams.map((team, index) => (
        <text className={styles.pre} fill={PRINT.ink} fillOpacity="0.8" fontSize="8" key={team} x="16" y={36 + index * 24}>
          {team}
        </text>
      ))}
      <g fill="none" stroke={PRINT.ink} strokeWidth="0.9">
        {[0, 1, 2, 3].map((pair) => {
          const top = 33 + pair * 48
          return <path d={`M60 ${top}H76V${top + 24}H60M76 ${top + 12}H100`} key={pair} />
        })}
        {[0, 1].map((pair) => {
          const top = 45 + pair * 96
          return <path d={`M100 ${top}H118V${top + 48}H100M118 ${top + 24}H140`} key={pair} />
        })}
        <path d="M140 69H158V165H140M158 117H230" />
      </g>
      <text className={styles.serif} fill={PRINT.pencil} fontSize="11" fontStyle="italic" x="164" y="110">
        final
      </text>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      {CATEGORIES.map((category, column) => (
        <text className={styles.mono} fill={PRINT.paper} fillOpacity="0.75" fontSize="6.5" key={category} textAnchor="middle" x={round(229 + column * 34)} y="40">
          {category}
        </text>
      ))}
      {[100, 200, 300, 400].map((points, row) =>
        CATEGORIES.map((category, column) => {
          const x = 214 + column * 34
          const y = 50 + row * 40
          const solved = (row * 3 + column * 2) % 5 < 2
          const blood = row === 1 && column === 1
          return (
            <g key={`${category}-${points}`}>
              <rect fill={blood ? PRINT.riso : solved ? '#3a3834' : '#2a2926'} height="34" rx="2" width="30" x={x} y={y} />
              <text className={styles.mono} fill={PRINT.paper} fillOpacity={solved && !blood ? 0.35 : 0.95} fontSize="8" textAnchor="middle" x={x + 15} y={y + 20}>
                {points}
              </text>
              {solved && !blood ? <path d={`M${x + 6} ${y + 28}L${x + 24} ${y + 6}`} stroke={PRINT.paper} strokeOpacity="0.4" strokeWidth="0.8" /> : null}
            </g>
          )
        })
      )}
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" afterTagColor={PRINT.paper} before={before} beforeTag="1996" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Bracket on paper → jeopardy board" plate="PL. 8" width={W} y={AREA} />
    </>
  )
}

/* ---------- 练习 ---------- */

const PIECES: Array<[string, number, number]> = [
  ['♚', 6, 0], ['♜', 5, 0], ['♟', 5, 1], ['♟', 6, 1], ['♟', 7, 2], ['♛', 2, 2],
  ['♕', 3, 5], ['♙', 5, 6], ['♙', 6, 6], ['♙', 7, 6], ['♖', 0, 7], ['♔', 6, 7],
]

function PracticePlate({ id }: PlateProps) {
  const size = 22
  const left = 112
  const top = 26
  const squares = (dark: string, light: string, hatch: boolean) =>
    Array.from({ length: 64 }, (_, index) => {
      const column = index % 8
      const row = Math.floor(index / 8)
      const isDark = (row + column) % 2 === 1
      return (
        <rect
          fill={isDark ? (hatch ? url(id, 'hatch') : dark) : light}
          height={size}
          key={index}
          width={size}
          x={left + column * size}
          y={top + row * size}
        />
      )
    })
  const pieces = PIECES.map(([glyph, column, row]) => (
    <text fill={PRINT.ink} fontSize="17" key={`${glyph}-${column}-${row}`} textAnchor="middle" x={left + column * size + size / 2} y={top + row * size + 17}>
      {glyph}
    </text>
  ))
  const before = (
    <>
      <rect fill={PRINT.newsprint} height={AREA} width={W} />
      {squares(PRINT.ink, PRINT.newsprint, true)}
      <rect fill="none" height={size * 8} stroke={PRINT.ink} strokeWidth="1.4" width={size * 8} x={left} y={top} />
      {pieces}
      <text className={styles.serif} fill={PRINT.ink} fontSize="9" fontStyle="italic" x="14" y="40">
        Problem No. 7
      </text>
      <text className={styles.serif} fill={PRINT.ink} fontSize="9" fontStyle="italic" x="14" y="214">
        White to play and win.
      </text>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      {squares('#a9b78f', '#eef0e2', false)}
      {pieces}
      <path d={`M${left + 3.5 * size} ${top + 5.5 * size}L${left + 7.2 * size} ${top + 1.8 * size}`} stroke={PRINT.risoBlue} strokeLinecap="round" strokeOpacity="0.85" strokeWidth="5" />
      <path d={`M${left + 7.5 * size} ${top + 1.5 * size}l-11 2l9 9z`} fill={PRINT.risoBlue} fillOpacity="0.85" />
      <rect fill={PRINT.ink} height={size * 8} width="9" x="306" y={top} />
      <rect fill="#fbfaf6" height={round(size * 8 * 0.68)} stroke={PRINT.ink} strokeWidth="0.6" width="9" x="306" y={round(top + size * 8 * 0.32)} />
      <text className={styles.mono} fill={PRINT.ink} fontSize="8" x="322" y={round(top + size * 8 * 0.32 + 3)}>
        +1.8
      </text>
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.7" fontSize="7" x="212" y="214">
        depth 24 · Qh7+
      </text>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="c. 1850" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Newspaper chess problem → engine analysis" plate="PL. 9" width={W} y={AREA} />
    </>
  )
}

/* ---------- 培训 ---------- */

function TrainingPlate({ id }: PlateProps) {
  const lock = (suffix: string) => (
    <g transform="translate(40 -8)">
      <Padlock id={id} suffix={suffix} />
    </g>
  )
  const callouts: Array<[string, number, number, number, number]> = [
    ['1', 166, 50, 60, 46],
    ['2', 146, 138, 60, 150],
    ['3', 196, 136, 60, 196],
    ['4', 156, 108, 60, 104],
  ]
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      {lock('a')}
      <g stroke={PRINT.ink} strokeWidth="0.5">
        {callouts.map(([label, x, y, lx, ly]) => (
          <path d={`M${x} ${y}L${lx + 10} ${ly - 3}`} key={label} />
        ))}
      </g>
      {callouts.map(([label, , , lx, ly]) => (
        <text className={styles.serif} fill={PRINT.ink} fontSize="10" key={label} textAnchor="middle" x={lx} y={ly}>
          {label}
        </text>
      ))}
      <text className={styles.serif} fill={PRINT.ink} fontSize="11" letterSpacing="0.12em" x="14" y="222">
        SERRURIER, PL. III
      </text>
    </>
  )
  const after = (
    <>
      <rect fill="#dfe2dc" height={AREA} width={W} />
      {lock('b')}
      <rect fill={PRINT.night} fillOpacity="0.82" height="16" rx="2" width="150" x="216" y="189" />
      <text className={styles.uiText} fill={PRINT.paper} fontSize="8" textAnchor="middle" x="291" y="200">
        the pins line up at the shear line
      </text>
      <rect fill={PRINT.night} height="26" width={W} y="210" />
      <path d="M212 218v10l9 -5z" fill={PRINT.paper} />
      <rect fill="#4a4843" height="3" rx="1.5" width="120" x="230" y="221.5" />
      <rect fill={PRINT.riso} height="3" rx="1.5" width="42" x="230" y="221.5" />
      <circle cx="272" cy="223" fill={PRINT.paper} r="3.6" />
      <text className={styles.mono} fill={PRINT.paper} fillOpacity="0.8" fontSize="6" x="356" y="225">
        04:12
      </text>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="1751" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Encyclopaedia plate, 1751 → video lesson" plate="PL. 10" width={W} y={AREA} />
    </>
  )
}

/* ---------- 战队 ---------- */

const MEMBERS: Array<{ label: string; x: number; y: number; shape: 'circle' | 'triangle' }> = [
  { label: 'A', x: 60, y: 70, shape: 'circle' },
  { label: 'B', x: 120, y: 52, shape: 'triangle' },
  { label: 'C', x: 150, y: 118, shape: 'circle' },
  { label: 'D', x: 74, y: 150, shape: 'triangle' },
  { label: 'E', x: 128, y: 190, shape: 'circle' },
]

function TeamsPlate({ id }: PlateProps) {
  const mutual: Array<[number, number]> = [[0, 1], [2, 3]]
  const oneWay: Array<[number, number]> = [[1, 2], [3, 0], [4, 2], [4, 3]]
  const node = (member: (typeof MEMBERS)[number]) =>
    member.shape === 'circle' ? (
      <circle cx={member.x} cy={member.y} fill={PRINT.paper} r="11" stroke={PRINT.ink} strokeWidth="1.1" />
    ) : (
      <path d={`M${member.x} ${member.y - 12}L${member.x + 12} ${member.y + 9}H${member.x - 12}Z`} fill={PRINT.paper} stroke={PRINT.ink} strokeWidth="1.1" />
    )
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <rect fill={url(id, 'grid')} height={AREA} width={W} />
      <g fill="none" strokeWidth="0.9">
        {mutual.map(([a, b]) => (
          <path d={`M${MEMBERS[a].x} ${MEMBERS[a].y}L${MEMBERS[b].x} ${MEMBERS[b].y}`} key={`${a}-${b}`} stroke={PRINT.riso} strokeWidth="2" />
        ))}
        {oneWay.map(([a, b]) => (
          <path d={`M${MEMBERS[a].x} ${MEMBERS[a].y}L${MEMBERS[b].x} ${MEMBERS[b].y}`} key={`${a}-${b}`} stroke={PRINT.ink} strokeDasharray="3 2" />
        ))}
      </g>
      {MEMBERS.map((member) => (
        <g key={member.label}>
          {node(member)}
          <text className={styles.serif} fill={PRINT.ink} fontSize="9" textAnchor="middle" x={member.x} y={member.y + 3.5}>
            {member.label}
          </text>
        </g>
      ))}
    </>
  )
  const messages: Array<[string, number, string]> = [
    ['A', 44, PRINT.riso],
    ['C', 96, PRINT.risoBlue],
    ['E', 148, PRINT.sage],
  ]
  const after = (
    <>
      <rect fill={PRINT.newsprint} height={AREA} width={W} />
      <rect fill="#fbfaf6" height="190" rx="6" stroke={PRINT.ink} strokeOpacity="0.3" strokeWidth="0.8" width="168" x="218" y="24" />
      <text className={styles.uiText} fill={PRINT.ink} fontSize="8" x="230" y="40">
        # team-pwn
      </text>
      <path d="M218 48H386" stroke={PRINT.ink} strokeOpacity="0.15" strokeWidth="0.8" />
      {messages.map(([label, y, color], index) => (
        <g key={label}>
          <circle cx="238" cy={y + 20} fill={color} r="9" />
          <text className={styles.uiText} fill={PRINT.paper} fontSize="8" textAnchor="middle" x="238" y={y + 23}>
            {label}
          </text>
          <rect fill={PRINT.ink} fillOpacity="0.75" height="4" rx="2" width="34" x="254" y={y + 12} />
          <rect fill={PRINT.ink} fillOpacity="0.16" height="4" rx="2" width={[110, 92, 120][index]} x="254" y={y + 22} />
          <rect fill={PRINT.ink} fillOpacity="0.16" height="4" rx="2" width={[72, 104, 60][index]} x="254" y={y + 30} />
        </g>
      ))}
      <rect fill={PRINT.risoBlue} fillOpacity="0.15" height="12" rx="3" width="38" x="254" y="196" />
      <text className={styles.uiText} fill={PRINT.risoBlue} fontSize="7" x="258" y="205">
        @team
      </text>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="1934" height={AREA} id={id} split={SPLIT} width={W} />
      <g fill="none" stroke={PRINT.ink} strokeDasharray="2 3" strokeOpacity="0.5" strokeWidth="0.8">
        <path d="M71 68C140 40 190 50 229 64" />
        <path d="M161 118C190 120 200 116 229 116" />
        <path d="M139 190C190 200 200 172 229 168" />
      </g>
      <CaptionBand height={H} note="Sociogram, 1934 → team chat" plate="PL. 11" width={W} y={AREA} />
    </>
  )
}

/* ---------- 组网环境 ---------- */

function TeamLabPlate({ id }: PlateProps) {
  const nodes: Array<[string, number, number]> = [
    ['NODE 1', 52, 60],
    ['NODE 2', 140, 76],
    ['NODE 3', 70, 168],
    ['NODE 4', 154, 160],
  ]
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <rect fill={url(id, 'grid')} height={AREA} width={W} />
      <g fill="none" stroke={PRINT.pencil} strokeLinecap="round" strokeWidth="1.2">
        <path d="M52 60C90 58 110 70 140 76M52 60C58 100 62 130 70 168M140 76C146 110 150 134 154 160M70 168C100 170 126 164 154 160" />
        {nodes.map(([label, x, y]) => (
          <g key={label}>
            <circle cx={x} cy={y} fill={PRINT.paper} r="15" />
            <rect height="9" width="9" x={x - 4.5} y={y - 4.5} />
          </g>
        ))}
      </g>
      {nodes.map(([label, x, y]) => (
        <text className={styles.serif} fill={PRINT.pencil} fontSize="8" fontStyle="italic" key={label} textAnchor="middle" x={x} y={y + 27}>
          {label}
        </text>
      ))}
    </>
  )
  const after = (
    <>
      <rect fill="#f7f6f2" height={AREA} width={W} />
      <rect fill="none" height="176" rx="6" stroke={PRINT.risoBlue} strokeDasharray="4 3" strokeWidth="1" width="174" x="214" y="28" />
      <text className={styles.mono} fill={PRINT.risoBlue} fontSize="6.5" x="222" y="42">
        vpc 10.0.0.0/16
      </text>
      {[0, 1].map((subnet) => {
        const y = 52 + subnet * 76
        return (
          <g key={subnet}>
            <rect fill={subnet ? '#eef2f8' : '#f1f5ee'} height="64" rx="4" stroke={PRINT.ink} strokeOpacity="0.3" strokeWidth="0.8" width="132" x="246" y={y} />
            <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="6" x="252" y={y + 12}>
              {subnet ? 'subnet · targets' : 'subnet · players'}
            </text>
            {[0, 1, 2].map((box) => (
              <rect fill={box === 1 && subnet ? PRINT.riso : PRINT.ink} fillOpacity={box === 1 && subnet ? 0.9 : 0.75} height="22" key={box} rx="2" width="30" x={256 + box * 40} y={y + 22} />
            ))}
          </g>
        )
      })}
      <circle cx="226" cy="118" fill={PRINT.paper} r="9" stroke={PRINT.ink} strokeWidth="1" />
      <path d="M221 118H231M226 113V123" stroke={PRINT.ink} strokeWidth="1" />
      <path d="M235 118H246M231 112L246 86M231 124L246 150" fill="none" stroke={PRINT.ink} strokeOpacity="0.5" strokeWidth="0.8" />
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="1969" height={AREA} id={id} split={SPLIT} width={W} />
      <path d="M169 158C192 150 198 124 217 119" fill="none" stroke={PRINT.pencil} strokeDasharray="3 2" strokeWidth="1" />
      <CaptionBand height={H} note="Network sketch, 1969 → cloud topology" plate="PL. 12" width={W} y={AREA} />
    </>
  )
}

export type ModuleArtKind = 'games' | 'practice' | 'training' | 'teams' | 'teamlab'

export function ModulePageArt({ kind }: { kind: ModuleArtKind }) {
  const id = useArtId(`module-${kind}`)
  return (
    <svg aria-hidden="true" className={styles.svg} preserveAspectRatio="xMidYMid slice" viewBox={`0 0 ${W} ${H}`}>
      <PrintDefs grain={0.24} id={id} />
      {kind === 'games' ? <GamesPlate id={id} /> : null}
      {kind === 'practice' ? <PracticePlate id={id} /> : null}
      {kind === 'training' ? <TrainingPlate id={id} /> : null}
      {kind === 'teams' ? <TeamsPlate id={id} /> : null}
      {kind === 'teamlab' ? <TeamLabPlate id={id} /> : null}
      <Grain height={H} id={id} width={W} />
    </svg>
  )
}
