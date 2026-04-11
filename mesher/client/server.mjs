import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { createReadStream } from 'node:fs'
import { access, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import handler from './dist/server/server.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const clientRoot = path.join(__dirname, 'dist/client')
const port = Number(process.env.PORT || 3000)

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
])

async function fileExists(filePath) {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

function resolveClientAsset(url) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname)
  const relativePath = pathname.replace(/^\/+/, '')
  const candidate = path.resolve(clientRoot, relativePath)

  if (!candidate.startsWith(clientRoot)) {
    return null
  }

  return candidate
}

async function maybeServeStatic(req, res) {
  const candidate = resolveClientAsset(req.url || '/')

  if (!candidate || !(await fileExists(candidate))) {
    return false
  }

  const info = await stat(candidate)
  if (!info.isFile()) {
    return false
  }

  const ext = path.extname(candidate)
  res.statusCode = 200
  res.setHeader('Content-Length', info.size)
  res.setHeader('Content-Type', contentTypes.get(ext) || 'application/octet-stream')
  createReadStream(candidate).pipe(res)
  return true
}

function toRequest(req) {
  const url = new URL(req.url || '/', `http://${req.headers.host || `127.0.0.1:${port}`}`)
  const init = {
    method: req.method,
    headers: req.headers,
  }

  if (req.method && !['GET', 'HEAD'].includes(req.method)) {
    init.body = Readable.toWeb(req)
    init.duplex = 'half'
  }

  return new Request(url, init)
}

function applyHeaders(res, headers) {
  const setCookie = typeof headers.getSetCookie === 'function' ? headers.getSetCookie() : []

  for (const [key, value] of headers.entries()) {
    if (key.toLowerCase() === 'set-cookie') {
      continue
    }
    res.setHeader(key, value)
  }

  if (setCookie.length > 0) {
    res.setHeader('set-cookie', setCookie)
  }
}

async function sendResponse(res, response) {
  res.statusCode = response.status
  res.statusMessage = response.statusText
  applyHeaders(res, response.headers)

  if (!response.body) {
    res.end()
    return
  }

  Readable.fromWeb(response.body).pipe(res)
}

const server = createServer(async (req, res) => {
  try {
    if (await maybeServeStatic(req, res)) {
      return
    }

    const request = toRequest(req)
    const response = await handler.fetch(request)
    await sendResponse(res, response)
  } catch (error) {
    console.error(error)
    res.statusCode = 500
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.end('Internal Server Error')
  }
})

server.listen(port, () => {
  console.log(`TanStack Start server listening on http://localhost:${port}`)
})
