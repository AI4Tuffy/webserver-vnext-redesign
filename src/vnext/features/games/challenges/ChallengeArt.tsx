import { ChallengeCategory } from '@Api'
import styles from '../../../shared/art/Art.module.css'
import { useArtId } from '../../../shared/art/artIds'
import { CipherDisk } from '../../../shared/art/engravings'
import { CaptionBand, EraSplit, Grain, PRINT, PrintDefs, round, url } from '../../../shared/art/print'

/*
 * 题目头图：每个方向一幅「年代拼贴」图版。左半是该领域最初被记录或实践时的画法，
 * 右半是今天的样子，同一物体跨过接缝延续：
 *   Pwn       1996 年蓝图上的栈帧 → 加了 canary、NX、ASLR 的今天
 *   Crypto    1467 年的密码盘 → 2001 年 AES 的 S 盒
 *   Web       1989 年提案里的文档互链图 → 浏览器窗口
 *   Reverse   绿条打印纸上的反汇编清单 → 控制流图
 *   Forensics 1901 年起的十指指纹卡 → 自动指纹识别的细节点匹配
 *   Misc      1928 年的 80 列打孔卡 → 1994 年的二维码
 *   其他      1963 年的电传打字机纸卷 → 终端模拟器
 * 仅作装饰，不包含题目答案。画布 320×200，下方 22 单位为图注条，容器裁成 3:2。
 */

type ArtKind = 'web' | 'crypto' | 'forensics' | 'misc' | 'pwn' | 'reverse' | 'shell'

const KIND_BY_CATEGORY: Partial<Record<ChallengeCategory, ArtKind>> = {
  [ChallengeCategory.Web]: 'web',
  [ChallengeCategory.Crypto]: 'crypto',
  [ChallengeCategory.Forensics]: 'forensics',
  [ChallengeCategory.IR]: 'forensics',
  [ChallengeCategory.OSINT]: 'forensics',
  [ChallengeCategory.Misc]: 'misc',
  [ChallengeCategory.PPC]: 'misc',
  [ChallengeCategory.Pwn]: 'pwn',
  [ChallengeCategory.Reverse]: 'reverse',
  [ChallengeCategory.Mobile]: 'reverse',
  [ChallengeCategory.Hardware]: 'reverse',
}

const W = 320
const H = 200
const AREA = 178
const SPLIT = 160

interface PlateProps {
  id: string
}

/* ---------- Pwn ---------- */

const STACK: Array<[string, string, number]> = [
  ['args / env', 'rw-', 14],
  ['ret addr', 'ret · ASLR', 18],
  ['saved rbp', 'rbp', 18],
  ['', 'canary', 12],
  ['buf[64]', 'NX stack', 50],
  ['locals', '', 14],
]

function stackRows() {
  let top = 24
  return STACK.map(([before, after, height]) => {
    const row = { before, after, y: top, height }
    top += height
    return row
  })
}

function PwnPlate({ id }: PlateProps) {
  const rows = stackRows()
  const [, ret, , canary, buf] = rows
  const bottom = rows[rows.length - 1].y + rows[rows.length - 1].height
  const before = (
    <>
      <rect fill={PRINT.prussian} height={AREA} width={W} />
      <rect fill={url(id, 'blueGrid')} height={AREA} width={W} />
      <g fill="none" stroke={PRINT.blueprintLine} strokeWidth="0.9">
        {rows.map((row) => (
          <rect height={row.height} key={row.y} strokeDasharray={row === canary ? '2 2' : undefined} width="180" x="70" y={row.y} />
        ))}
        <rect fill={url(id, 'hatchLight')} height={buf.height} stroke="none" width="180" x="70" y={buf.y} />
        <path d={`M56 ${buf.y}V${buf.y + buf.height}M52 ${buf.y}H68M52 ${buf.y + buf.height}H68`} strokeWidth="0.6" />
      </g>
      {rows.map((row) => (
        <text className={styles.mono} fill={PRINT.blueprintLine} fontSize="7" key={row.y} x="76" y={row.y + row.height / 2 + 2.5}>
          {row.before}
        </text>
      ))}
      <text className={styles.mono} fill={PRINT.blueprintLine} fontSize="6" textAnchor="middle" transform={`rotate(-90 48 ${buf.y + buf.height / 2})`} x="48" y={buf.y + buf.height / 2 + 2}>
        64 B
      </text>
      <path d={`M134 ${buf.y + buf.height - 8}C150 ${buf.y + 10} 148 ${ret.y + 24} 138 ${ret.y + ret.height / 2}`} fill="none" stroke={PRINT.riso} strokeLinecap="round" strokeWidth="1.6" />
      <path d={`M138 ${ret.y + ret.height / 2}l1 8l5 -5.5z`} fill={PRINT.riso} />
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <rect fill={url(id, 'grid')} height={AREA} width={W} />
      <rect className={styles.multiply} fill={PRINT.riso} fillOpacity="0.85" height={canary.height} width="180" x="70" y={canary.y} />
      <g fill="none" stroke={PRINT.ink} strokeWidth="0.9">
        {rows.map((row) => (
          <rect height={row.height} key={row.y} width="180" x="70" y={row.y} />
        ))}
      </g>
      {rows.map((row) => (
        <text className={styles.mono} fill={PRINT.ink} fontSize="7" key={row.y} textAnchor="end" x="244" y={row.y + row.height / 2 + 2.5}>
          {row.after}
        </text>
      ))}
      <path d={`M182 ${buf.y + buf.height - 8}C196 ${buf.y + 22} 196 ${buf.y + 6} 188 ${canary.y + canary.height + 3}`} fill="none" stroke={PRINT.ink} strokeLinecap="round" strokeWidth="1.2" />
      <path d={`M182 ${canary.y + 1}l10 10M192 ${canary.y + 1}l-10 10`} stroke={PRINT.ink} strokeWidth="1.6" />
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="6" x="258" y={bottom}>
        0x7ffd…
      </text>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="1996" beforeTagColor={PRINT.blueprintLine} height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Stack frame, 1996 → canary, NX and ASLR" plate="PL. 1" width={W} y={AREA} />
    </>
  )
}

/* ---------- Crypto ---------- */

const SBOX = '637c777bf26b6fc53001672bfed7ab76ca82c97dfa5947f0add4a2af9ca472c0b7fd9326363ff7cc34a5e5f171d8311504c723c31896059a071280e2eb27b275'

function CryptoPlate({ id }: PlateProps) {
  const bytes = SBOX.match(/../g) ?? []
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <g transform="translate(160 92) scale(0.98)">
        <CipherDisk id={id} />
      </g>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.risoBlue} height={AREA} width={W} />
      {bytes.map((byte, index) => (
        <text className={styles.mono} fill={PRINT.paper} fillOpacity={index % 9 === 4 ? 1 : 0.62} fontSize="6.6" key={index} x={round(168 + (index % 8) * 17.5)} y={round(34 + Math.floor(index / 8) * 16.5)}>
          {byte}
        </text>
      ))}
      <g fill="none" stroke={PRINT.paper} strokeOpacity="0.85">
        <circle cx="160" cy="92" r="70.5" strokeWidth="1.6" />
        <circle cx="160" cy="92" r="51" strokeWidth="0.8" />
        <circle cx="160" cy="92" r="33.3" strokeWidth="0.8" />
      </g>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2001" afterTagColor={PRINT.paper} before={before} beforeTag="1467" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Cipher disk, 1467 → AES S-box, 2001" plate="PL. 2" width={W} y={AREA} />
    </>
  )
}

/* ---------- Web ---------- */

function WebPlate({ id }: PlateProps) {
  const before = (
    <>
      <rect fill={PRINT.newsprint} height={AREA} width={W} />
      <g fill="none" stroke={PRINT.ink} strokeWidth="0.9">
        <path d="M58 46Q70 66 98 86M58 138Q70 118 98 100" />
        <rect fill={PRINT.newsprint} height="20" width="70" x="22" y="30" />
        <rect fill={PRINT.newsprint} height="20" width="70" x="22" y="130" />
        <ellipse cx="118" cy="93" fill={PRINT.newsprint} rx="42" ry="13" />
      </g>
      <rect className={styles.multiply} fill={PRINT.risoYellow} fillOpacity="0.8" height="11" rx="1.5" transform="rotate(-2 118 93)" width="64" x="86" y="87" />
      {[
        ['hypertext', 57, 43],
        ['browser', 57, 143],
        ['this document', 118, 95.5],
      ].map(([label, x, y]) => (
        <text className={styles.mono} fill={PRINT.ink} fontSize="7.4" key={label} textAnchor="middle" x={x} y={y}>
          {label}
        </text>
      ))}
      <text className={styles.serif} fill={PRINT.pencil} fontSize="7" fontStyle="italic" x="78" y="62">
        describes
      </text>
      <text className={styles.serif} fill={PRINT.pencil} fontSize="7" fontStyle="italic" x="80" y="128">
        renders
      </text>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <g transform="translate(176 26)">
        <rect fill="#fbfaf6" height="130" rx="6" stroke={PRINT.ink} strokeOpacity="0.5" strokeWidth="0.8" width="132" />
        <path d="M0 18H132" stroke={PRINT.ink} strokeOpacity="0.3" strokeWidth="0.6" />
        <circle cx="9" cy="9" fill={PRINT.riso} r="2.4" />
        <circle cx="17" cy="9" fill={PRINT.risoYellow} r="2.4" />
        <circle cx="25" cy="9" fill={PRINT.sage} r="2.4" />
        <rect fill={PRINT.newsprint} height="10" rx="5" width="92" x="34" y="4" />
        <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.7" fontSize="5.6" x="40" y="11">
          https://ctf.yinyu/doc
        </text>
        <rect fill={PRINT.ink} height="6" rx="1" width="70" x="12" y="30" />
        {[44, 54, 64].map((y, index) => (
          <rect fill={PRINT.ink} fillOpacity="0.18" height="4" key={y} rx="1" width={[104, 96, 80][index]} x="12" y={y} />
        ))}
        <path d="M12 80H58" stroke={PRINT.risoBlue} strokeWidth="1.4" />
        <text className={styles.mono} fill={PRINT.risoBlue} fontSize="6" x="12" y="77">
          linked page
        </text>
        <rect fill={PRINT.ink} fillOpacity="0.08" height="28" rx="2" width="108" x="12" y="90" />
      </g>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" before={before} beforeTag="1989" height={AREA} id={id} split={SPLIT} width={W} />
      <path d="M160 93C172 93 176 104 188 103" fill="none" stroke={PRINT.ink} strokeDasharray="3 2" strokeWidth="0.9" />
      <CaptionBand height={H} note="Linked documents, 1989 proposal → the browser" plate="PL. 3" width={W} y={AREA} />
    </>
  )
}

/* ---------- Reverse ---------- */

const LISTING = ['401126  PUSH RBP', '401127  MOV  RBP,RSP', '40112A  SUB  RSP,0X40', '40112E  CALL CHECK', '401133  TEST EAX,EAX', '401135  JE   FAIL', '401137  LEA  RDI,[MSG]', '40113E  CALL PUTS', '401143  RET']

function CfgBlock({ x, y, lines, width = 96 }: { x: number; y: number; lines: string[]; width?: number }) {
  return (
    <g>
      <rect fill="#2b2a27" height={10 + lines.length * 9} rx="2" stroke="#5c5a55" strokeWidth="0.7" width={width} x={x} y={y} />
      {lines.map((line, index) => (
        <text className={styles.mono} fill="#dcd8cc" fontSize="6" key={line} x={x + 6} y={y + 11 + index * 9}>
          {line}
        </text>
      ))}
    </g>
  )
}

function ReversePlate({ id }: PlateProps) {
  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      {Array.from({ length: 7 }, (_, index) => (
        <rect fill={PRINT.greenbar} height="12" key={index} width={W} x="22" y={18 + index * 24} />
      ))}
      <path d="M22 0V178" stroke={PRINT.ink} strokeDasharray="1.5 2.5" strokeOpacity="0.45" strokeWidth="0.6" />
      {Array.from({ length: 15 }, (_, index) => (
        <circle cx="11" cy={6 + index * 12} fill={PRINT.newsprint} key={index} r="3.2" stroke={PRINT.ink} strokeOpacity="0.35" strokeWidth="0.5" />
      ))}
      {LISTING.map((line, index) => (
        <text className={styles.pre} fill={PRINT.ink} fillOpacity={0.62 + (index % 3) * 0.12} fontSize="7.4" key={line} x="34" y={27 + index * 12}>
          {line}
        </text>
      ))}
      <ellipse cx="72" cy="84" fill="none" rx="44" ry="8" stroke={PRINT.pencil} strokeWidth="1.1" transform="rotate(-1.5 72 84)" />
      <text className={styles.serif} fill={PRINT.pencil} fontSize="10" fontStyle="italic" x="120" y="88">
        why?
      </text>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <CfgBlock lines={['push rbp', 'mov rbp, rsp', 'call check', 'test eax, eax', 'je fail']} x={196} y={22} />
      <CfgBlock lines={['lea rdi, [msg]', 'call puts', 'ret']} width={74} x={168} y={116} />
      <CfgBlock lines={['fail:', 'mov eax, 1', 'ret']} width={66} x={248} y={116} />
      <g fill="none" strokeWidth="1.2">
        <path d="M222 77V96H205V114" stroke={PRINT.riso} />
        <path d="M270 77V96H281V114" stroke="#7fbf8e" />
      </g>
      <path d="M205 115l-3 -6h6zM281 115l-3 -6h6z" fill="#dcd8cc" />
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" afterTagColor={PRINT.paper} before={before} beforeTag="c. 1975" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Green-bar listing → control-flow graph" plate="PL. 4" width={W} y={AREA} />
    </>
  )
}

/* ---------- Forensics ---------- */

function ridgePaths(cx: number, cy: number) {
  return Array.from({ length: 15 }, (_, index) => {
    const r = 2.5 + index * 2.6
    const points = Array.from({ length: 33 }, (_, step) => {
      const angle = (step / 32) * Math.PI * 2
      const wobble = 1 + 0.07 * Math.sin(angle * 3 + index * 0.4) + 0.04 * Math.sin(angle * 5 - 1)
      const loop = index > 4 ? 0.32 * Math.max(0, Math.sin(angle - 0.5)) : 0
      return `${round(cx + r * 0.8 * wobble * Math.cos(angle) + loop * r * 0.4)} ${round(cy + r * wobble * Math.sin(angle))}`
    })
    return `M${points.join('L')}`
  })
}

const MINUTIAE: Array<[number, number]> = [
  [172, 70], [186, 92], [178, 118], [196, 76], [168, 104], [192, 132], [204, 104],
]

function ForensicsPlate({ id }: PlateProps) {
  const ridges = ridgePaths(160, 92)
  const pad = (
    <clipPath id={`${id}-pad`}>
      <ellipse cx="160" cy="92" rx="34" ry="46" />
    </clipPath>
  )
  const before = (
    <>
      <rect fill={PRINT.paperWarm} height={AREA} width={W} />
      <rect fill="none" height="132" stroke={PRINT.ink} strokeWidth="0.6" width="300" x="10" y="24" />
      <path d="M68 24V156M126 24V156" stroke={PRINT.ink} strokeWidth="0.6" />
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.75" fontSize="5.4" x="14" y="32">
        1 R. THUMB
      </text>
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.75" fontSize="5.4" x="130" y="32">
        2 R. INDEX
      </text>
      <ellipse cx="39" cy="96" fill={PRINT.ink} fillOpacity="0.07" rx="18" ry="24" />
      {pad}
      <g clipPath={`url(#${id}-pad)`} fill="none" stroke={PRINT.ink} strokeOpacity="0.85" strokeWidth="1.1">
        {ridges.map((d, index) => (
          <path d={d} key={index} strokeDasharray={index % 4 === 3 ? '7 1.8' : undefined} />
        ))}
      </g>
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="5.4" x="14" y="168">
        CLASS. 1 U 1 0
      </text>
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <rect fill={url(id, 'grid')} height={AREA} width={W} />
      <g clipPath={`url(#${id}-pad)`} fill="none" stroke={PRINT.pencil} strokeOpacity="0.55" strokeWidth="0.5">
        {ridges.map((d, index) => (
          <path d={d} key={index} />
        ))}
      </g>
      <g fill="none" stroke={PRINT.riso} strokeWidth="0.7">
        {MINUTIAE.map(([x, y], index) => {
          const [nx, ny] = MINUTIAE[(index + 2) % MINUTIAE.length]
          return <path d={`M${x} ${y}L${nx} ${ny}`} key={`${x}-${y}`} strokeOpacity="0.5" />
        })}
      </g>
      {MINUTIAE.map(([x, y], index) => (
        <g key={`${x}-${y}`} stroke={PRINT.riso} strokeWidth="1.1">
          {index % 2 ? <circle cx={x} cy={y} fill="none" r="3" /> : <rect fill="none" height="6" width="6" x={x - 3} y={y - 3} />}
          <path d={`M${x} ${y}l${index % 2 ? 7 : -6} -5`} />
        </g>
      ))}
      <text className={styles.mono} fill={PRINT.ink} fontSize="6.5" x="232" y="60">
        MINUTIAE 07
      </text>
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="6.5" x="232" y="72">
        SCORE 0.94
      </text>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="AFIS" before={before} beforeTag="1901" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Ten-print card, 1901 → minutiae matching" plate="PL. 5" width={W} y={AREA} />
    </>
  )
}

/* ---------- Misc ---------- */

const PUNCHES: Array<[number, number[]]> = [
  [1, [-1, 8]], [2, [-2, 9]], [3, [-2, 5]], [4, [-2, 8]], [5, [0, 4]], [7, [-1, 3]], [8, [0, 3]], [9, [-1, 6]],
  [11, [7]], [12, [0]], [13, [1]], [15, [-1, 2]], [17, [3, 8]], [18, [5]], [19, [-2, 1]],
]

function qrModule(row: number, column: number) {
  const finder = (r: number, c: number) => {
    const inside = r >= 0 && r < 7 && c >= 0 && c < 7
    if (!inside) return null
    const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3))
    return ring === 3 || ring <= 1
  }
  const corners = [finder(row, column), finder(row, column - 14), finder(row - 14, column)]
  const fixed = corners.find((value) => value !== null)
  if (fixed !== undefined && fixed !== null) return fixed
  if ((row === 7 && column < 8) || (column === 7 && row < 8) || (row === 7 && column > 12) || (column === 13 && row < 8) || (row === 13 && column < 8) || (column === 7 && row > 12)) return false
  return (row * 13 + column * 7 + row * column) % 5 < 2
}

function MiscPlate({ id }: PlateProps) {
  const card = 'M30 22H302V160H18V34Z'
  const rowY = (row: number) => 40 + (row + 2) * 9.6
  const before = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <path d={card} fill="#efe2bf" />
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.8" fontSize="6" letterSpacing="0.18em" x="36" y="32">
        YINYU CTF MISC
      </text>
      {Array.from({ length: 10 }, (_, digit) =>
        Array.from({ length: 21 }, (_, column) => (
          <text className={styles.mono} fill={PRINT.riso} fillOpacity="0.55" fontSize="4.4" key={`${digit}-${column}`} textAnchor="middle" x={round(28 + column * 6.6)} y={round(rowY(digit) + 1.6)}>
            {digit}
          </text>
        ))
      )}
      {PUNCHES.flatMap(([column, rows]) =>
        rows.map((row) => <rect fill={PRINT.night} height="6.6" key={`${column}-${row}`} width="3.2" x={round(26.4 + column * 6.6)} y={round(rowY(row) - 3.4)} />)
      )}
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <path d={card} fill={PRINT.paper} />
      <g fill={PRINT.ink}>
        {Array.from({ length: 21 }, (_, row) =>
          Array.from({ length: 21 }, (_, column) =>
            qrModule(row, column) ? <rect height="5.6" key={`${row}-${column}`} width="5.6" x={round(178 + column * 5.6)} y={round(32 + row * 5.6)} /> : null
          )
        )}
      </g>
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="1994" afterTagColor={PRINT.paper} before={before} beforeTag="1928" beforeTagColor={PRINT.paper} height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="80-column card, 1928 → QR code, 1994" plate="PL. 6" width={W} y={AREA} />
    </>
  )
}

/* ---------- 其他方向 ---------- */

const SESSION_BEFORE = ['LOGIN: GUEST', '$ NC CHALL 31337', 'CONNECTED.', '> LS', 'FLAG.TXT  NOTES', '> CAT FLAG.TXT', 'PERMISSION DENIED']
const SESSION_AFTER: Array<[string, string]> = [
  ['> nc chall 31337', '#9fd6a9'],
  ['connected', '#dcd8cc'],
  ['> ls', '#9fd6a9'],
  ['flag.txt  notes', '#8fb5e8'],
  ['> cat flag.txt', '#9fd6a9'],
  ['permission denied', '#f28b7c'],
  ['> _', '#9fd6a9'],
]

function ShellPlate({ id }: PlateProps) {
  const torn = Array.from({ length: 12 }, (_, index) => `L${round(150 - index * 10)} ${index % 2 ? 160 : 166}`).join('')
  const before = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <path d={`M34 0H150V164${torn}L34 164Z`} fill={PRINT.paper} />
      {SESSION_BEFORE.map((line, index) => (
        <text className={styles.pre} fill={PRINT.ink} fillOpacity={0.55 + ((index * 3) % 4) * 0.12} fontSize="7.6" key={line} x="42" y={30 + index * 17}>
          {line}
        </text>
      ))}
    </>
  )
  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <rect fill="#262522" height="140" rx="6" stroke="#3e3c38" strokeWidth="0.8" width="138" x="170" y="20" />
      <path d="M170 36H308" stroke="#3e3c38" strokeWidth="0.8" />
      {[180, 188, 196].map((cx) => (
        <circle cx={cx} cy="28" fill="#55524c" key={cx} r="2.2" />
      ))}
      {SESSION_AFTER.map(([line, color], index) => (
        <text className={styles.mono} fill={color} fontSize="7.4" key={line} x="178" y={52 + index * 15}>
          {line}
        </text>
      ))}
    </>
  )
  return (
    <>
      <EraSplit after={after} afterTag="2026" afterTagColor={PRINT.paper} before={before} beforeTag="1963" beforeTagColor={PRINT.paper} height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Teletype roll, 1963 → terminal emulator" plate="PL. 7" width={W} y={AREA} />
    </>
  )
}

export function ChallengeArt({ category }: { category?: ChallengeCategory | string | null }) {
  const id = useArtId('challenge')
  const kind = KIND_BY_CATEGORY[category as ChallengeCategory] ?? 'shell'
  return (
    <svg aria-hidden="true" className={styles.svg} preserveAspectRatio="xMidYMid slice" viewBox={`0 0 ${W} ${H}`}>
      <PrintDefs grain={0.24} id={id} />
      {kind === 'pwn' ? <PwnPlate id={id} /> : null}
      {kind === 'crypto' ? <CryptoPlate id={id} /> : null}
      {kind === 'web' ? <WebPlate id={id} /> : null}
      {kind === 'reverse' ? <ReversePlate id={id} /> : null}
      {kind === 'forensics' ? <ForensicsPlate id={id} /> : null}
      {kind === 'misc' ? <MiscPlate id={id} /> : null}
      {kind === 'shell' ? <ShellPlate id={id} /> : null}
      <Grain height={H} id={id} width={W} />
    </svg>
  )
}
