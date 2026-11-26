import { Download, Paperclip } from 'lucide-react'
import { MarkdownContent } from '../../shared/MarkdownContent'
import styles from './GameReadme.module.css'

export interface GameAttachmentLink {
  name: string
  url: string
  extension: string
}

const FILE_EXTENSIONS = new Set([
  '7z', 'apk', 'bin', 'csv', 'doc', 'docx', 'elf', 'exe', 'gz', 'img', 'iso', 'json', 'md', 'pcap', 'pcapng',
  'pdf', 'ppt', 'pptx', 'rar', 'tar', 'tgz', 'txt', 'xls', 'xlsx', 'xz', 'zip',
])

function fileExtension(url: string) {
  try {
    const path = new URL(url, window.location.origin).pathname
    const match = /\.([a-z0-9]{1,6})$/i.exec(path)
    return match ? match[1].toLowerCase() : ''
  } catch {
    return ''
  }
}

function fileName(url: string) {
  try {
    const segment = new URL(url, window.location.origin).pathname.split('/').filter(Boolean).at(-1) ?? ''
    return decodeURIComponent(segment)
  } catch {
    return url
  }
}

/**
 * 比赛附件：后端的比赛数据没有单独的附件字段，管理员会把上传好的文件以链接形式写进比赛说明。
 * 这里从说明里挑出指向文件的链接（已知文件扩展名或站内 /assets 路径），图片嵌入不算附件。
 */
export function extractGameAttachments(markdown: string): GameAttachmentLink[] {
  const seen = new Set<string>()
  const links: GameAttachmentLink[] = []
  const pattern = /(!?)\[([^\]]*)\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g
  for (const match of markdown.matchAll(pattern)) {
    const [, bang, text, url] = match
    if (bang || seen.has(url)) continue
    const extension = fileExtension(url)
    const isAsset = /^\/(api\/)?assets\//.test(url)
    if (!FILE_EXTENSIONS.has(extension) && !isAsset) continue
    seen.add(url)
    links.push({ name: text.trim() || fileName(url), url, extension })
  }
  return links
}

/**
 * 比赛说明：一个文档框。有附件时，框顶是一条附件栏，列出可下载的文件；没有附件时不显示这条栏。
 */
/** 说明正文若以一级或二级标题开头（如「## 赛事说明」），这一节本身就是说明，去掉这行标题再显示。 */
export function withoutLeadingHeading(markdown: string) {
  return markdown.replace(/^\s*#{1,2}\s+[^\n]*\n*/, '')
}

export function GameReadme({ source }: { source: string }) {
  const attachments = extractGameAttachments(source)
  const body = withoutLeadingHeading(source) || source
  return (
    <section aria-labelledby="game-rules-title" className={styles.readme}>
      <h2 className={styles.srOnly} id="game-rules-title">
        比赛说明
      </h2>

      {attachments.length ? (
        <div aria-label="比赛附件" className={styles.attachments} role="group">
          <span className={styles.attachmentsLabel}>
            <Paperclip aria-hidden="true" size={15} />
            附件
          </span>
          <ul className={styles.attachmentList}>
            {attachments.map((attachment) => (
              <li className={styles.attachment} key={attachment.url}>
                <a className={styles.download} download href={attachment.url} rel="noreferrer noopener" target="_blank">
                  <span aria-hidden="true" className={styles.fileBadge}>
                    {attachment.extension || 'file'}
                  </span>
                  <span className={styles.fileName}>{attachment.name}</span>
                  <Download aria-hidden="true" className={styles.downloadIcon} size={15} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={styles.readmeBody}>
        <MarkdownContent source={body} />
      </div>
    </section>
  )
}
