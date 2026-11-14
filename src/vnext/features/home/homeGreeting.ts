/** 按本地小时返回问候语：5–11 点早上好，11–13 点中午好，13–18 点下午好，18–23 点晚上好，其余夜深了。 */
export function greetingFor(hour: number) {
  if (hour >= 5 && hour < 11) return '早上好'
  if (hour >= 11 && hour < 13) return '中午好'
  if (hour >= 13 && hour < 18) return '下午好'
  if (hour >= 18 && hour < 23) return '晚上好'
  return '夜深了'
}
