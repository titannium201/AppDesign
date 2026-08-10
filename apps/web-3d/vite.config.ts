import { defineConfig, loadEnv, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promises as fs } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const FALLBACK_MODEL_DIRS = [
  'G:/Xbotpark/赵宇轩/软件设计/肌肉建模_二创版/public/models',
  'G:/Xbotpark/赵宇轩/软件设计/肌肉建模_原版/public/models',
]

function normalizeFsPath(input?: string): string | undefined {
  if (!input) return undefined
  return input.replace(/\\/g, '/').trim()
}

function getAllowedDirs(modelPath?: string): string[] {
  const dirs = [__dirname, path.resolve(__dirname, '../../..')]

  const normalized = normalizeFsPath(modelPath)
  if (normalized) {
    const dir = path.dirname(normalized)
    dirs.push(dir)
  }

  FALLBACK_MODEL_DIRS.forEach((dir) => dirs.push(dir))

  return Array.from(new Set(dirs))
}

function localModelPlugin(modelPath: string | undefined): Plugin {
  return {
    name: 'local-model-server',
    configureServer(server) {
      if (!modelPath) return

      server.middlewares.use('/__local-model/body.glb', async (req, res, next) => {
        try {
          const data = await fs.readFile(modelPath)
          res.setHeader('Content-Type', 'model/gltf-binary')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(data)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          res.statusCode = 404
          res.setHeader('Content-Type', 'text/plain; charset=utf-8')
          res.end(`Model file not found: ${message}`)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_')

  return {
    plugins: [react(), localModelPlugin(env.VITE_MODEL_PATH)],
    server: {
      fs: {
        allow: getAllowedDirs(env.VITE_MODEL_PATH),
      },
    },
    envPrefix: 'VITE_',
  }
})
