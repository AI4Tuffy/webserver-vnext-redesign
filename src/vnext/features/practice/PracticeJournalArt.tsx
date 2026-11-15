import art from '../../shared/art/Art.module.css'
import { useArtId } from '../../shared/art/artIds'
import { Grain, PrintDefs } from '../../shared/art/print'

const mapping = [['1101', 'D'], ['0110', '6'], ['1001', '9']]
const waveform = [
  'M28 26h14V15h22v11h24V15h35v11h20V15h20v11h28V15h35',
  'M28 43h28V32h16v11h36V32h15v11h35V32h17v11h25V32h26',
  'M28 60h14V49h19v11h26V49h22v11h24V49h29v11h25V49h39',
]

export function PracticeJournalArt() {
  const id = useArtId('practice-journal')
  const ink = '#33312b'
  const pencil = '#555047'
  const ochre = '#ad771b'

  return (
    <svg aria-label="早期计算练习的纸张拼贴。左侧是推导 D69 的手写草稿，右侧是二进制映射表、实验波形与打印记录。" role="img" viewBox="0 0 680 442">
      <PrintDefs grain={0.29} id={id} />
      <defs>
        <pattern height="12" id={`${id}-blue-rules`} patternUnits="userSpaceOnUse" width="12">
          <path d="M12 0H0V12" fill="none" stroke="#768e88" strokeOpacity=".46" strokeWidth=".45" />
        </pattern>
      </defs>
      <rect fill="#929f94" height="442" width="680" />
      <path d="M160 -8Q166 106 159 176T168 453M-12 48Q176 63 400 30T694 38" fill="none" stroke="#c9c4aa" strokeOpacity=".43" />

      <g transform="translate(252 65) rotate(-7) scale(1.12)">
        <path d="M4 8L48 2 141 6 226 1 307 2 361 0 370 15 367 100 371 167 361 211 312 216 258 211 161 215 92 212 21 213 10 201 8 168 11 91Z" fill="#5e6558" opacity=".5" />
        <path d="M2 4L48 0 141 3 226 -2 306 0 358 -4 367 11 364 96 368 162 359 206 312 211 257 206 162 210 91 207 17 209 8 197 6 165 8 88Z" fill="#ebddbc" stroke="#b3a582" />
        <path d="M358 -4l-2 12 11 3M17 209l9-13-18 1M26 166q147-6 328 1" fill="none" stroke="#b4a480" />
        <g fill={ink}>
          <text className={art.serif} fontSize="17" letterSpacing="1.8" x="32" y="38">BINARY REPRESENTATION</text>
          <path d="M32 44H296" stroke={ink} strokeWidth=".7" />
          <text className={art.mono} fontSize="12" x="33" y="63">(1101 0110 1001)₂ = (D69)₁₆</text>
          <text className={art.serif} fontSize="8" x="34" y="78">Group the input into four-bit words.</text>
          <text className={art.serif} fontSize="8" x="34" y="89">Read each group against the table below.</text>
          <text className={art.serif} fontSize="9" fontStyle="italic" x="310" y="28">rev. 2</text>
          <path d="M307 31l28-4" fill="none" stroke={pencil} strokeWidth=".7" />
        </g>
        <g className={art.mono} fill={ink} fontSize="9" transform="translate(185 75)">
          <path d="M0 0H153V52H0ZM82 0V52M0 13H153M0 26H153M0 39H153" fill="none" stroke={ink} strokeWidth=".55" />
          <text x="12" y="10">Binary</text>
          <text x="98" y="10">Hex</text>
          {mapping.map(([binary, hex], index) => (
            <g key={binary} transform={`translate(0 ${23 + 13 * index})`}>
              <text x="17">{binary}</text>
              <text x="108">{hex}</text>
            </g>
          ))}
        </g>
      </g>

      <g transform="translate(375 347) rotate(-7) scale(1.08)">
        <path d="M0 2L91 0l78 3 111-2v51l-37 2-85-2-76 3L0 52Z" fill="#c4c5a4" stroke="#a9aa8d" />
        <path d="M13 9H265M13 45H268" fill="none" stroke="#706c6d" strokeDasharray="1 3" />
        {[13, 27, 43].map((y) => <g fill="#928d70" key={y}><circle cx="9" cy={y} r="2.7" /><circle cx="271" cy={y} r="2.7" /></g>)}
        <text className={art.mono} fill={ink} fontSize="13" letterSpacing="3" x="140" y="37">D69</text>
      </g>

      <g transform="translate(345 251) rotate(-6) scale(1.19)">
        <path d="M2 8L48 3 110 4 182 0 247 4 253 13 249 69 236 74 171 72 106 75 21 73 6 69Z" fill="#e2cfa6" stroke="#b7a37b" />
        <path d="M2 8L48 3 110 4 182 0 247 4 253 13 249 69 236 74 171 72 106 75 21 73 6 69Z" fill={`url(#${id}-blue-rules)`} />
        <text className={art.serif} fill={pencil} fontSize="9" fontStyle="italic" x="18" y="14">Fig. 3 · Test trace</text>
        <path d="M45 17V64M122 17V64M183 17V64M225 17V64" fill="none" stroke={pencil} strokeDasharray="1.4 2.4" strokeOpacity=".7" />
        {waveform.map((line) => <path d={line} fill="none" key={line} stroke={ink} strokeWidth=".9" transform="translate(0 3)" />)}
      </g>

      <g transform="translate(-20 128) rotate(12) scale(1.08)">
        <path d="M-15 3L78 0l50 3 74-1 63 3 50-1 21 7 3 13-1 83 3 49-5 85H-16Z" fill="#786b51" opacity=".5" />
        <path d="M-15 0L78 -3l50 3 74-1 63 3 50-1 19 7 3 13-1 83 3 49-5 85H-16Z" fill="#dec499" stroke="#bda579" />
        <path d="M-15 0L78 -3l50 3 74-1 63 3 50-1 19 7 3 13-1 83 3 49-5 85H-16Z" fill={`url(#${id}-blue-rules)`} />
        <path d="M315 1q15 8 22 20M-10 175q113-17 346 18" fill="none" stroke="#b79966" opacity=".65" />
        <g className={art.hand} fill={pencil} fontSize="23" letterSpacing="1.2">
          <text x="32" y="38">(110101101001)₂ = (?)₁₆</text>
          <text x="39" y="74">1101　0110　1001</text>
          <text x="57" y="100">D　　 6　　 9</text>
          <text opacity=".68" x="27" y="139">1101　0110　0011</text>
          <text fontSize="30" x="247" y="116">[D69]</text>
        </g>
        <path d="M37 80l51-2m13 2l56-1m12 2l53-1M23 139q44-11 97-3t91 1M28 144l146-12 25 7-78 4-87 3" fill="none" stroke={pencil} strokeLinecap="round" strokeWidth="1.4" />
        <path d="M162 119q40-44 81-19m-14-12 14 12-17 4M253 124l73 1" fill="none" stroke={ochre} strokeLinecap="round" strokeWidth="2.3" />
      </g>
      <path d="M274 315Q310 309 319 225T363 123m-14 6 14-6-4 12" fill="none" stroke={ochre} strokeLinecap="round" strokeWidth="1.55" />
      <Grain height={442} id={id} width={680} />
    </svg>
  )
}
