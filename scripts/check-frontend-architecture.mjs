import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import process from 'node:process'

const root = process.cwd()
const sourceRoot = join(root, 'src')
const baseline = JSON.parse(readFileSync(join(root, 'scripts/frontend-architecture-baseline.json'), 'utf8'))
const postcssConfig = readFileSync(join(root, 'postcss.config.mjs'), 'utf8')

const walk = (directory) =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })

const tagPattern =
  /(?<![.#\w\-@:])(?:div|span|p|h[1-6]|button|input|select|textarea|label|ul|ol|li|table|thead|tbody|tr|th|td|section|article|header|footer|aside|nav|main|small|strong|em|i|a|img|dl|dt|dd|form|figure|figcaption|progress|dialog)(?![\w\-])/g

function stripFunctionalPseudos(selector) {
  let out = ''
  let depth = 0
  for (let i = 0; i < selector.length; i += 1) {
    const ch = selector[i]
    if (ch === '(') {
      depth += 1
      continue
    }
    if (ch === ')') {
      depth = Math.max(0, depth - 1)
      continue
    }
    if (depth === 0) out += ch
  }
  return out
}

function analyzeCssModule(content) {
  const withoutComments = content.replace(/\/\*[\s\S]*?\*\//g, '')
  const withoutKeyframes = withoutComments.replace(
    /@keyframes\s+[\w-]+\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g,
    ''
  )
  let tagViolations = 0
  let chainViolations = 0

  for (const rawBlock of withoutKeyframes.split('}')) {
    const braceIndex = rawBlock.lastIndexOf('{')
    if (braceIndex < 0) continue
    const selector = rawBlock
      .slice(0, braceIndex)
      .replace(/@media[^{]+\{/g, '')
      .replace(/@supports[^{]+\{/g, '')
      .replace(/@starting-style\s*\{/g, '')
      .trim()
    if (!selector || selector.startsWith('@')) continue

    for (const part of selector.split(',')) {
      const cleaned = stripFunctionalPseudos(part.replace(/\[[^\]]*\]/g, '[]')).trim()
      if (!cleaned) continue
      const tags = cleaned.match(tagPattern)
      if (tags) tagViolations += tags.length
      const combinators = cleaned
        .replace(/\s*([>+~])\s*/g, ' $1 ')
        .trim()
        .split(/\s+/)
        .filter((token) => /^[>+~]$/.test(token)).length
      const spaceTokens = cleaned.replace(/\s*[>+~]\s*/g, '|').trim().split(/\s+/).length - 1
      if (combinators + spaceTokens >= 2) chainViolations += 1
    }
  }

  return {
    lines: content.split(/\r?\n/).length,
    selectorViolations: tagViolations + chainViolations,
    hexColors: (withoutComments.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length,
  }
}

const sourceFiles = walk(sourceRoot).filter((path) => /\.(?:ts|tsx|css)$/.test(path))
const normalized = (path) => relative(root, path).replaceAll('\\', '/')
const failures = []
let inlineStyles = 0
let yinyuClassReferences = 0
let globalCssLines = 0
let vnextInlineStyles = 0

if (/postcss-preset-mantine|mantine-breakpoint/.test(postcssConfig)) {
  failures.push('postcss.config.mjs: vNext build must not depend on Mantine unit or breakpoint transforms')
}

const allowedSvgFiles = new Set(baseline.vnext.allowedSvgFiles ?? [])
const legacyRawTableFiles = new Set(baseline.vnext.legacyRawTableFiles ?? [])
const legacyCssLineBudgets = baseline.vnext.legacyCssLineBudgets ?? {}
const legacyCssSelectorBudgets = baseline.vnext.legacyCssSelectorBudgets ?? {}
const legacyCssHexBudgets = baseline.vnext.legacyCssHexBudgets ?? {}
const sharedMaxCssLines = baseline.vnext.sharedMaxCssLines ?? 220
const featureMaxCssLines = baseline.vnext.featureMaxCssLines ?? 180

for (const path of sourceFiles) {
  const file = normalized(path)
  const content = readFileSync(path, 'utf8')
  const netlabSource = file.startsWith('src/vnext/features/teamlab/workspace/')

  if (/\.(?:ts|tsx)$/.test(path)) {
    if (!netlabSource) inlineStyles += (content.match(/\bstyle=\{/g) || []).length
    yinyuClassReferences += (content.match(/\byy-[a-z0-9-]+/gi) || []).length

    if (
      !file.startsWith('src/api-client/') &&
      !file.startsWith('src/generated/') &&
      /from\s+['"][^'"]*generated\/Api['"]/.test(content)
    ) {
      failures.push(`${file}: generated API must be consumed through @Api`)
    }

    if (
      file.startsWith('src/pages/') &&
      /import\s+['"]\.[^'"]+\.css['"]/.test(content) &&
      !/\.module\.css['"]/.test(content)
    ) {
      failures.push(`${file}: route pages may only import CSS modules`)
    }

    if (file === 'src/App.tsx' && /@mantine\//.test(content)) {
      failures.push(`${file}: the vNext application root may not restore Mantine providers or styles`)
    }

    if (file.startsWith('src/vnext/')) {
      const imports = [...content.matchAll(/(?:from\s+|import\s+)['"]([^'"]+)['"]/g)].map((match) => match[1])
      if (!netlabSource) vnextInlineStyles += (content.match(/\bstyle=\{/g) || []).length

      if (
        file.startsWith('src/vnext/shared/') &&
        imports.some((specifier) => /(?:^|\/)(?:features|app)(?:\/|$)/.test(specifier.replaceAll('\\', '/')))
      ) {
        failures.push(`${file}: src/vnext/shared may not import features or app`)
      }

      if (!netlabSource && imports.some((specifier) => specifier.startsWith('@mantine/'))) {
        failures.push(`${file}: vNext may not depend on Mantine`)
      }
      if (/\byy-[a-z0-9-]+/i.test(content)) failures.push(`${file}: vNext may not use legacy yy-* classes`)
      if (
        imports.some(
          (specifier) =>
            (specifier.startsWith('.') || specifier.startsWith('@')) &&
            /(?:^|\/)(?:components|pages|styles)(?:\/|$)/.test(specifier.replaceAll('\\', '/'))
        )
      ) {
        failures.push(`${file}: vNext may not import legacy visual components, pages, or global styles`)
      }
      if (
        !netlabSource &&
        file.endsWith('.tsx') &&
        imports.some((specifier) => specifier.endsWith('.css') && !specifier.endsWith('.module.css'))
      ) {
        failures.push(`${file}: vNext TSX files may only import CSS modules`)
      }
      if (
        file.endsWith('.tsx') &&
        /import\s+(?!type\s|\{|\*)[A-Za-z_$][\w$]*(?:\s*,\s*\{[^}]*\})?\s+from\s+['"]@Api['"]/s.test(content)
      ) {
        failures.push(`${file}: page and view components must consume generated API through a feature adapter`)
      }
      if (
        file.includes('/features/training/') &&
        imports.some((specifier) => /(?:^|\/)games(?:\/|$)/.test(specifier))
      ) {
        failures.push(`${file}: training must not depend on the games feature`)
      }
      if (
        file.includes('/features/games/') &&
        imports.some((specifier) => /(?:^|\/)training(?:\/|$)/.test(specifier))
      ) {
        failures.push(`${file}: games must not depend on the training feature`)
      }
      if (file.endsWith('.tsx') && /\bfetch\s*\(/.test(content)) {
        failures.push(`${file}: page and view components must call feature API adapters instead of fetch`)
      }
      if (/window\.(?:confirm|prompt)\s*\(/.test(content)) {
        failures.push(`${file}: use VNextConfirmDialog instead of browser confirmation APIs`)
      }
      if (/document\.querySelector/.test(content)) {
        failures.push(`${file}: do not query the document to coordinate React forms or views`)
      }
      if (
        file.endsWith('.tsx') &&
        file !== 'src/vnext/shared/MarkdownContent.tsx' &&
        /dangerouslySetInnerHTML/.test(content)
      ) {
        failures.push(`${file}: sanitized HTML rendering is centralized in MarkdownContent`)
      }
      if (file.endsWith('.tsx')) {
        const lines = content.split(/\r?\n/).length
        if (!netlabSource && lines > baseline.vnext.maxTsxLines) {
          failures.push(`${file}: ${lines} lines exceeds vNext budget ${baseline.vnext.maxTsxLines}`)
        }
        const isTest = /\.(?:test|spec)\.tsx$/.test(file)
        if (!netlabSource && !isTest && !file.startsWith('src/vnext/shared/')) {
          if (/<svg\b/.test(content) && !allowedSvgFiles.has(file)) {
            failures.push(`${file}: use lucide-react or shared/art EditorialPlate/SpotTile instead of raw <svg>`)
          }
          if (/<table\b/.test(content) && !legacyRawTableFiles.has(file)) {
            failures.push(`${file}: use shared DataTable or HairlineList instead of raw <table>`)
          }
        }
      }
    }
  }

  if (file.startsWith('src/vnext/') && !netlabSource && file.endsWith('.module.css')) {
    const metrics = analyzeCssModule(content)
    const isShared = file.startsWith('src/vnext/shared/')
    const lineBudget = isShared ? sharedMaxCssLines : (legacyCssLineBudgets[file] ?? featureMaxCssLines)
    if (metrics.lines > lineBudget) {
      failures.push(`${file}: ${metrics.lines} lines exceeds CSS module budget ${lineBudget}`)
    }

    if (file !== 'src/vnext/shared/MarkdownContent.module.css') {
      const selectorBudget = isShared ? 0 : (legacyCssSelectorBudgets[file] ?? 0)
      if (metrics.selectorViolations > selectorBudget) {
        failures.push(
          `${file}: ${metrics.selectorViolations} bare-tag/deep-nested CSS selectors exceed budget ${selectorBudget}`
        )
      }
    }

    const hexBudget = isShared ? 0 : (legacyCssHexBudgets[file] ?? 0)
    if (metrics.hexColors > hexBudget) {
      failures.push(`${file}: ${metrics.hexColors} hardcoded hex colors exceed budget ${hexBudget}`)
    }
  }

  if (file === 'src/styles/YinyuDesignLab.css' || file === 'src/styles/YinyuTheme.css') {
    globalCssLines += content.split(/\r?\n/).length
  }
}

if (inlineStyles > baseline.maxInlineStyles)
  failures.push(`inline style count ${inlineStyles} exceeds ${baseline.maxInlineStyles}`)
if (yinyuClassReferences > baseline.maxYinyuClassReferences) {
  failures.push(`yy-* reference count ${yinyuClassReferences} exceeds ${baseline.maxYinyuClassReferences}`)
}
if (globalCssLines > baseline.maxGlobalCssLines)
  failures.push(`global CSS lines ${globalCssLines} exceeds ${baseline.maxGlobalCssLines}`)
if (vnextInlineStyles > baseline.vnext.maxInlineStyles) {
  failures.push(`vNext inline style count ${vnextInlineStyles} exceeds ${baseline.vnext.maxInlineStyles}`)
}

for (const [file, budget] of Object.entries({ ...baseline.pageLineBudgets, ...baseline.componentLineBudgets })) {
  const path = join(root, file)
  if (!statSync(path).isFile()) continue
  const lines = readFileSync(path, 'utf8').split(/\r?\n/).length
  if (lines > budget) failures.push(`${file}: ${lines} lines exceeds ${budget}`)
}

console.log(
  `[architecture] inline=${inlineStyles}, yy-classes=${yinyuClassReferences}, global-css=${globalCssLines}, vnext-inline=${vnextInlineStyles}`
)
if (failures.length) {
  console.error(`[architecture] violations:\n${failures.map((item) => `  - ${item}`).join('\n')}`)
  process.exit(1)
}
