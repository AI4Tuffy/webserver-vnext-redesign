export interface DailyQuote {
  text: string
  source: string
}

/** 每日一言：均为出处明确的古籍原句，按本地日期轮换，不请求外部服务。 */
export const DAILY_QUOTES: DailyQuote[] = [
  { text: '纸上得来终觉浅，绝知此事要躬行。', source: '陆游《冬夜读书示子聿》' },
  { text: '千里之行，始于足下。', source: '《老子》第六十四章' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', source: '《荀子·劝学》' },
  { text: '知己知彼，百战不殆。', source: '《孙子兵法·谋攻》' },
  { text: '学而不思则罔，思而不学则殆。', source: '《论语·为政》' },
  { text: '工欲善其事，必先利其器。', source: '《论语·卫灵公》' },
  { text: '路漫漫其修远兮，吾将上下而求索。', source: '屈原《离骚》' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', source: '韩愈《进学解》' },
  { text: '凡事豫则立，不豫则废。', source: '《礼记·中庸》' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', source: '《荀子·劝学》' },
  { text: '问渠那得清如许？为有源头活水来。', source: '朱熹《观书有感》' },
  { text: '天下难事，必作于易；天下大事，必作于细。', source: '《老子》第六十三章' },
  { text: '温故而知新，可以为师矣。', source: '《论语·为政》' },
  { text: '知之者不如好之者，好之者不如乐之者。', source: '《论语·雍也》' },
]

/** 以本地日期计算序号，同一天内保持不变，零点后换下一句。 */
export function quoteForDate(date: Date) {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000)
  return DAILY_QUOTES[((day % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length]
}
