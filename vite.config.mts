import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import process from 'process'
import { defineConfig, loadEnv } from 'vite'
import banner from 'vite-plugin-banner'
import { optimizeCssModules } from 'vite-plugin-optimize-css-modules'
import webfontDownload from 'vite-plugin-webfont-dl'
import { i18nVirtualManifest } from './plugins/vite-i18n-virtual-manifest'
import { sanitizeGeneratedOutput } from './plugins/vite-sanitize-generated-output'
import { backendOrigin, backendPathPattern } from './server/routes.mjs'
import { renderIndex } from './server/html.mjs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const TARGET = backendOrigin(env.BACKEND_URL ?? env.VITE_BACKEND_URL)
  const current = new Date()
  const buildId = (env.VITE_APP_BUILD_TIMESTAMP ?? current.toISOString()).replace(/[^0-9A-Za-z]+/g, '').slice(0, 14)

  const BANNER =
    `/* YINYU CTF Platform @${env.VITE_APP_GIT_NAME ?? 'unknown'}\n *\n` +
    ` * Commit    : ${env.VITE_APP_GIT_SHA ?? 'Unofficial build version'}\n` +
    ` * Build     : ${env.VITE_APP_BUILD_TIMESTAMP ?? current.toISOString()}\n` +
    ` */`

  console.log(`Using backend URL: ${TARGET}`)

  return {
    server: {
      port: 63000,
      proxy: {
        [backendPathPattern]: { target: TARGET, ws: true, changeOrigin: false },
      },
    },
    resolve: {
      tsconfigPaths: true,
    },
    preview: { port: 64000 },
    build: {
      outDir: 'build',
      assetsDir: 'static',
      cssMinify: 'esbuild',
      cssCodeSplit: false,
      chunkSizeWarningLimit: 2400,
      reportCompressedSize: true,
      rolldownOptions: {
        output: {
          hashCharacters: 'base36',
          chunkFileNames: (chunk) => {
            const netlab = chunk.moduleIds.some((id) =>
              /features\/teamlab\/workspace\/|node_modules\/.*@mantine\//.test(id.replaceAll('\\', '/'))
            )
            return `static/${netlab ? 'netlab-' : ''}[name].${buildId}.[hash].js`
          },
          assetFileNames: `static/[name].${buildId}.[hash].[ext]`,
          entryFileNames: `static/[name].${buildId}.[hash].js`,
        },
      },
    },
    html: { cspNonce: '%nonce%' },
    plugins: [
      react(),
      {
        name: 'standalone-dev-html',
        apply: 'serve',
        transformIndexHtml: { order: 'post', handler: (html) => renderIndex(html).html },
      },
      {
        name: 'scope-netlab-mantine',
        enforce: 'pre',
        transform(code, id) {
          if (id.replaceAll('\\', '/').includes('/@mantine/') && /\.css(?:$|\?)/.test(id))
            return { code: `@scope ([data-netlab-workspace]) { ${code} }`, map: null }
        },
      },
      banner(BANNER),
      webfontDownload(
        [
          'https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&family=Lexend:wght@100..900&display=swap',
          'https://fonts.googleapis.com/css2?family=Fira+Code:wght@300;400;500;600;700&family=Share+Tech+Mono&display=swap',
          'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@125,700;125,800&family=Caveat:wght@600;700&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Noto+Serif+SC:wght@400&display=swap',
        ],
        {
          injectAsStyleTag: false,
          async: false,
        }
      ),
      i18nVirtualManifest(),
      sanitizeGeneratedOutput(),
      optimizeCssModules(),
      tailwindcss(),
    ],
  }
})
