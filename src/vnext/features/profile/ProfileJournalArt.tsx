import styles from '../../shared/art/Art.module.css'
import { useArtId } from '../../shared/art/artIds'
import { CaptionBand, EraSplit, Grain, PRINT, PrintDefs, url } from '../../shared/art/print'

/*
 * 个人档案的年代拼贴：左半是方格实验记录本的一页，按惯例写着页码、内容与见证人签名栏；
 * 右半是同样几件事在今天留下的提交记录。纯装饰，不代表任何用户数据。
 */

const W = 640
const H = 400
const AREA = 368
const SPLIT = 320

const CHECKLIST: Array<[string, boolean]> = [
  ['warm-up: web', true],
  ['pwn: ret2win', true],
  ['read 2 writeups', true],
  ['crypto: rsa', false],
]

const COMMITS: Array<[string, string, string]> = [
  ['e7b415', 'wip: crypto rsa (tmrw)', PRINT.riso],
  ['4c8d0a', 'notes: read 2 writeups', '#dcd8cc'],
  ['9b2e71', 'solve: pwn ret2win', '#9fd6a9'],
  ['a1f3c2', 'solve: warm-up web', '#9fd6a9'],
]

export function ProfileJournalArt() {
  const id = useArtId('journal')

  const before = (
    <>
      <rect fill={PRINT.paper} height={AREA} width={W} />
      <rect fill={url(id, 'grid')} height={AREA} width={W} />
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="9" textAnchor="end" x="300" y="34">
        p. 37
      </text>
      <text className={styles.serif} fill={PRINT.ink} fontSize="30" fontStyle="italic" x="40" y="78">
        solve log
      </text>
      <path d="M40 90H200" stroke={PRINT.ink} strokeWidth="1.1" />
      {CHECKLIST.map(([item, done], index) => {
        const y = 134 + index * 44
        return (
          <g key={item}>
            <rect fill="none" height="15" stroke={PRINT.ink} strokeWidth="1.2" width="15" x="40" y={y - 12} />
            {done ? (
              <>
                <path d={`M43 ${y - 4}L48 ${y + 1}L58 ${y - 13}`} fill="none" stroke={PRINT.riso} strokeLinecap="round" strokeWidth="2" />
                <path d={`M70 ${y - 5}H${70 + item.length * 8.6}`} stroke={PRINT.ink} strokeOpacity="0.55" strokeWidth="1.1" />
              </>
            ) : null}
            <text className={styles.mono} fill={PRINT.ink} fillOpacity={done ? 0.55 : 1} fontSize="14" x="70" y={y}>
              {item}
            </text>
          </g>
        )
      })}
      <text className={styles.serif} fill={PRINT.riso} fontSize="15" fontStyle="italic" x="196" y="268">
        → tmrw
      </text>
      <path d="M40 330H180M210 330H300" stroke={PRINT.ink} strokeWidth="0.7" />
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="8" x="40" y="344">
        WITNESSED BY
      </text>
      <text className={styles.mono} fill={PRINT.ink} fillOpacity="0.6" fontSize="8" x="210" y="344">
        DATE
      </text>
    </>
  )

  const after = (
    <>
      <rect fill={PRINT.night} height={AREA} width={W} />
      <path d="M368 70V300" stroke="#55524c" strokeWidth="2" />
      <path d="M368 220C368 200 392 196 392 176V140C392 120 368 116 368 100" fill="none" stroke={PRINT.risoBlue} strokeWidth="2" />
      {COMMITS.map(([hash, message, color], index) => {
        const y = 86 + index * 60
        return (
          <g key={hash}>
            <circle cx={index === 1 || index === 2 ? 392 : 368} cy={y} fill={PRINT.night} r="6.5" stroke={color} strokeWidth="2" />
            <text className={styles.mono} fill="#8b877d" fontSize="11" x="414" y={y + 4}>
              {hash}
            </text>
            <text className={styles.mono} fill={color} fontSize="11" x="470" y={y + 4}>
              {message}
            </text>
          </g>
        )
      })}
      <rect fill={PRINT.riso} height="16" rx="2" width="40" x="560" y="40" />
      <text className={styles.mono} fill={PRINT.paper} fontSize="9" fontWeight="700" textAnchor="middle" x="580" y="51">
        HEAD
      </text>
      <text className={styles.mono} fill="#8b877d" fontSize="10" x="348" y="336">
        $ git log --graph --oneline
      </text>
    </>
  )

  return (
    <svg
      aria-label="年代拼贴插图：左半是一页方格实验记录本，标题 solve log，清单里三项已打勾划掉、一项留到明天，页脚有见证人签名栏；右半是同样几件事在今天的提交记录图。"
      className={styles.svg}
      role="img"
      viewBox={`0 0 ${W} ${H}`}
    >
      <PrintDefs grain={0.24} id={id} />
      <EraSplit after={after} afterTag="2026" afterTagColor={PRINT.paper} before={before} beforeTag="c. 1910" height={AREA} id={id} split={SPLIT} width={W} />
      <CaptionBand height={H} note="Laboratory notebook → commit history" plate="PL. 14" width={W} y={AREA} />
      <Grain height={H} id={id} width={W} />
    </svg>
  )
}
