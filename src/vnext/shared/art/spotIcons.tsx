import styles from './Art.module.css'

/*
 * 小组件手绘图标：64 单位方框，墨线 2、圆头圆角，坐标故意留一点不平整；
 * 每枚只有一处 accent 填充（徽章所在色系的深色），常见做法是线稿物体上压一枚实心圆或实心面。
 * 外层 SpotBadge 会再加一层轻微位移滤镜，让线条像笔画出来的。
 */

const INK = styles.spotInk
const ACCENT = styles.spotAccent
const INK_FILL = styles.spotInkFill
const PAPER = styles.spotPaperFill

function Flag() {
  return (
    <g>
      <path className={ACCENT} d="M21.5 14.5C29 10.5 35.5 18.5 45 14C44.2 21 44.5 27.5 46.5 33.5C37.5 37.5 30 29.5 22 33.5Z" />
      <path className={INK} d="M21 54.5L22 11M12.5 54.5C18 54 24 54.3 30.5 54.8" />
    </g>
  )
}

function Trophy() {
  return (
    <g>
      <path className={INK} d="M20.5 18.8C12.2 18 12.4 30.5 22.2 31.2M43.5 18.6C51.8 18.2 51.4 30.6 41.8 31.4" />
      <path className={ACCENT} d="M19.8 14.2H44.2C44.8 30.5 39 37.8 32 38.2C25 37.8 19.4 30.2 19.8 14.2Z" />
      <path className={INK} d="M32 38.6V46.2M25.2 46.6H38.8L40.6 52.6H23.4Z" />
    </g>
  )
}

function Padlock() {
  return (
    <g>
      <path className={INK} d="M23.2 30.2V22.6C23 14.4 41.2 14.6 40.8 22.8V30.4" />
      <rect className={ACCENT} height="24" rx="4.2" width="31" x="16.5" y="30" />
      <circle className={INK_FILL} cx="32" cy="40" r="3" />
      <path className={INK} d="M32 42.2V47.6" />
    </g>
  )
}

function Terminal() {
  return (
    <g>
      <rect className={ACCENT} height="36" rx="4" width="44" x="10" y="14.5" />
      <path className={INK} d="M10.4 22.8C24 22.4 40 23 53.6 22.6" />
      <path className={INK} d="M18 30.5L24 35.2L18 40.2M28 40.4C31.5 40.2 35 40.5 38.6 40.2" />
    </g>
  )
}

function Target() {
  return (
    <g>
      <circle className={INK} cx="30" cy="34" r="19" />
      <circle className={INK} cx="30" cy="34" r="11.5" />
      <circle className={ACCENT} cx="30" cy="34" r="5" />
      <path className={INK} d="M31 33L49 15M44 14.5L49.5 14.6L49.8 20" />
    </g>
  )
}

function Book() {
  return (
    <g>
      <path className={PAPER} d="M32 20.2C26 15.2 16 15 10 18.6V46.6C16 43.4 26 43.6 32 48.6C38 43.6 48 43.4 54 46.6V18.6C48 15 38 15.2 32 20.2Z" />
      <path className={INK} d="M32 20.6C32.3 30 31.8 39 32 48.2M15 25.2C20 23.6 24 23.8 28 25.2M15 31.2C20 29.6 24 29.8 28 31.2M36 31C40.2 29.6 44.2 29.4 49 31M36 37C40 35.8 44 35.8 48 37" />
      <path className={ACCENT} d="M39 16.6V29.4L42.5 26.6L46 29.4V17.2" />
    </g>
  )
}

function Lightbulb() {
  return (
    <g>
      <path className={PAPER} d="M32 11.5C22 11.6 16.6 20 18.8 28.6C20 33 24 36 25 40.6H39C40 36 44 33 45.2 28.6C47.4 20 42 11.4 32 11.5Z" />
      <path className={INK} d="M26.2 44.6H37.8M27.2 48.6H36.8M29.2 52.6H34.8" />
      <path className={ACCENT} d="M32 17.6L34.2 23.4L39.8 21.8L36.2 26.4L40.2 30.2L34.6 30.2L33.6 35.6L31 30.6L26 33.2L28.4 28L23.8 25L29.4 24Z" />
    </g>
  )
}

function Magnifier() {
  return (
    <g>
      <path className={INK} d="M38.4 38.2L50.4 50.6" strokeWidth="5" />
      <circle className={ACCENT} cx="28" cy="28" r="13.6" />
      <path className={styles.spotGlare} d="M20.6 24.4A8.4 8.4 0 0 1 25.6 19.6" strokeWidth="2" />
    </g>
  )
}

function Hourglass() {
  return (
    <g>
      <path className={ACCENT} d="M24 18.2H40C38.6 24 34.6 27.2 32 29.6C29.4 27.2 25.4 24 24 18.2ZM24.6 52C26 45.6 29.6 43.2 32 43.2C34.4 43.2 38 45.6 39.4 52Z" />
      <path className={INK} d="M17.6 12.2C27 11.8 37 12.4 46.4 12M17.4 52.6C27 52.2 37 52.8 46.6 52.4M21 12.4C21 24 30 28 30 32C30 36 21 40 21 52.4M43 12.4C43 24 34 28 34 32C34 36 43 40 43 52.4" />
    </g>
  )
}

function Checklist() {
  return (
    <g>
      <rect className={PAPER} height="42" rx="3.6" width="32" x="16" y="12.5" />
      <rect className={ACCENT} height="6" rx="2" width="12" x="26" y="9.6" />
      <path className={INK} d="M21 24.6L24 27.6L29 21.4M21 35.6L24 38.6L29 32.6M33.6 25C36.6 24.8 40 25.2 43 25M33.6 36.2C36.6 35.9 40 36.3 43 36M33.6 47.2C36.6 46.9 40 47.3 43 47" />
      <rect className={INK} height="5.6" rx="1" width="5.6" x="21.4" y="44.4" />
    </g>
  )
}

function Chat() {
  return (
    <g>
      <path className={PAPER} d="M24 31C15.5 31.2 10.6 37 11.4 43.4C12 47.8 15.4 51 19.6 51.6L16.6 56.6L24.6 52C33 51.8 37.6 46.4 36.8 40.2C36.2 34.6 31 30.8 24 31Z" />
      <path className={INK} d="M17.4 42.6C19 40 20 44.4 22 41.6C23.6 39.4 24.6 44.6 27.4 41.4" strokeWidth="1.6" />
      <path className={ACCENT} d="M40 9.8C32.4 9.8 27.6 15 28 21.2C28.4 27.2 33.6 31.4 40 31.4C41.6 31.4 43 31.2 44.4 30.8L50.6 34.4L48.8 28.4C51.4 26.4 52.8 23.6 52.6 20.4C52.2 14.2 47 9.8 40 9.8Z" />
      <path className={INK} d="M36.6 23.6V18.4M39.2 24.2H45C46.2 24.2 46.8 23.4 46.8 22.4L47.4 18.8C47.6 17.6 46.8 16.8 45.6 16.8H42.4L43 13.8C43.2 12.6 41.4 12 40.8 13.2L38.8 17.4" strokeWidth="1.6" />
    </g>
  )
}

function Podium() {
  return (
    <g>
      <rect className={PAPER} height="18" width="14" x="12" y="34.6" />
      <rect className={ACCENT} height="28" width="14" x="26" y="24.6" />
      <rect className={PAPER} height="12" width="14" x="40" y="40.6" />
      <path className={INK} d="M8 52.6C24 52.2 41 52.8 57 52.4M33 15.2L34.4 18.6L38 18.8L35.2 21L36.2 24.4L33 22.4L29.8 24.4L30.8 21L28 18.8L31.6 18.6Z" strokeWidth="1.4" />
    </g>
  )
}

function Shield() {
  return (
    <g>
      <path className={ACCENT} d="M32 10.6C37 14.2 43 15.8 49 15.6C49.6 32 43.6 46 32 53.4C20.4 46 14.4 32 15 15.6C21 15.8 27 14.2 32 10.6Z" />
      <path className={INK} d="M24.4 32.2L30 37.8L40.4 26.2" strokeWidth="2.4" />
    </g>
  )
}

function Network() {
  return (
    <g>
      <path className={INK} d="M20 20.4L44 22.6M20.6 21.4L31.4 44.4M43.4 23.4L33 44" />
      <circle className={PAPER} cx="19" cy="19.6" r="6.4" />
      <circle className={PAPER} cx="45" cy="22.4" r="6.4" />
      <circle className={ACCENT} cx="32" cy="45.6" r="7.6" />
    </g>
  )
}

/*
 * 公告的三级图标：通知（喇叭）、赛题更新（铃铛）、战况（奖章）。
 * 同一笔法，accent 分别落在喇叭口、铃身和奖章上，放在一起时一眼能分出级别。
 */
function Megaphone() {
  return (
    <g>
      <path className={ACCENT} d="M15.2 27.2L40.6 15.4C41 26.4 41 37.6 40.6 48.8L15.4 37.2Z" />
      <path className={INK} d="M15.2 26.6C11.4 27 11.2 37.2 15.4 37.6M21.4 39.6L24.6 50.6C25.4 52.8 29 52.2 28.8 49.8L27.4 42" />
      <path className={INK} d="M47 24.6C49.6 22.8 51.6 21.6 54.2 20.8M47.6 32.2C50.4 32 52.6 32.2 55.2 32.6M46.8 39.8C49.6 41.4 51.6 42.8 54 44.4" strokeWidth="1.6" />
    </g>
  )
}

function Bell() {
  return (
    <g>
      <path className={ACCENT} d="M20.4 42.6C22.6 37.4 21.4 30.6 22.6 25.4C24 18.6 28 15.8 32 15.8C36 15.8 40 18.6 41.4 25.4C42.6 30.6 41.4 37.4 43.6 42.6Z" />
      <path className={INK} d="M16.4 43C26.6 42.4 37.4 42.6 47.6 43.2M32 15.6V11.8" />
      <circle className={INK_FILL} cx="32" cy="48.6" r="3.4" />
      <path className={INK} d="M13.4 23.2C14.4 19 16.4 15.8 19.6 13.4M50.6 23.2C49.6 19 47.6 15.8 44.4 13.4" strokeWidth="1.6" />
    </g>
  )
}

function Medal() {
  return (
    <g>
      <path className={PAPER} d="M20.6 10.8H29.4L35 28.6L28.2 30.6Z" />
      <path className={PAPER} d="M43.4 10.8H34.6L29 28.6L35.8 30.6Z" />
      <path className={INK} d="M20.6 10.8H29.4L35 28.6M43.4 10.8H34.6L29 28.6M20.6 10.8L27.4 30.2M43.4 10.8L36.6 30.2" />
      <circle className={ACCENT} cx="32" cy="41.4" r="12.4" />
      <path className={INK} d="M32 34.8L34 39L38.6 39.6L35.2 42.6L36.2 47.2L32 44.8L27.8 47.2L28.8 42.6L25.4 39.6L30 39Z" strokeWidth="1.4" />
    </g>
  )
}

export const SPOT_ICONS = {
  flag: Flag,
  trophy: Trophy,
  padlock: Padlock,
  terminal: Terminal,
  target: Target,
  book: Book,
  lightbulb: Lightbulb,
  magnifier: Magnifier,
  hourglass: Hourglass,
  checklist: Checklist,
  chat: Chat,
  podium: Podium,
  shield: Shield,
  network: Network,
  megaphone: Megaphone,
  bell: Bell,
  medal: Medal,
} as const

export type SpotIconName = keyof typeof SPOT_ICONS
