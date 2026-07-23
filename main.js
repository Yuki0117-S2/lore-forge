const { app, BrowserWindow, session } = require('electron')
const path = require('path')
const http = require('http')
const fs = require('fs')

const LOCAL_PORT = 47837
const LOCAL_ORIGIN = `http://127.0.0.1:${LOCAL_PORT}`

// Windows 작업표시줄 아이콘 정확히 박히게 (이거 없으면 가끔 Electron 기본 아이콘 뜸)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.kyeoul.loreforge')
}

let staticServer = null

function contentType(filePath) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.html') return 'text/html; charset=utf-8'
  if (ext === '.js') return 'text/javascript; charset=utf-8'
  if (ext === '.css') return 'text/css; charset=utf-8'
  if (ext === '.json') return 'application/json; charset=utf-8'
  if (ext === '.ico') return 'image/x-icon'
  if (ext === '.png') return 'image/png'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.svg') return 'image/svg+xml; charset=utf-8'
  return 'application/octet-stream'
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    if (staticServer) {
      resolve()
      return
    }

    staticServer = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, LOCAL_ORIGIN)
        let pathname = decodeURIComponent(url.pathname)
        if (pathname === '/') pathname = '/index.html'

        const root = __dirname
        const requested = path.normalize(path.join(root, pathname))
        const rel = path.relative(root, requested)
        if (rel.startsWith('..') || path.isAbsolute(rel)) {
          res.writeHead(403)
          res.end('Forbidden')
          return
        }

        fs.readFile(requested, (err, data) => {
          if (err) {
            res.writeHead(404)
            res.end('Not found')
            return
          }
          res.writeHead(200, {
            'Content-Type': contentType(requested),
            'Cache-Control': 'no-store'
          })
          res.end(data)
        })
      } catch (e) {
        res.writeHead(500)
        res.end('Server error')
      }
    })

    staticServer.once('error', reject)
    staticServer.listen(LOCAL_PORT, '127.0.0.1', () => resolve())
  })
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, 'LoreForge.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:loreforge', // 명시적 영속 세션 (localStorage 영속화)
    },
    title: 'LORE FORGE',
    backgroundColor: '#1a1520',
  })

  // Google OAuth Authorized JavaScript origins에 넣을 고정 origin:
  // http://127.0.0.1:47837
  win.loadURL(LOCAL_ORIGIN + '/lobby.html')

  // F12 / Ctrl+Shift+I → DevTools 토글 (디버깅용)
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return
    const isF12 = input.key === 'F12'
    const isCtrlShiftI = input.control && input.shift && (input.key === 'I' || input.key === 'i')
    if (isF12 || isCtrlShiftI) {
      win.webContents.toggleDevTools()
      event.preventDefault()
    }
  })

  // 진단용: 시작 시 자동 오픈하려면 아래 줄 주석 해제
  // win.webContents.openDevTools()
}

app.whenReady().then(async () => {
  try {
    await startLocalServer()
    createWindow()
  } catch (e) {
    console.error('[LoreForge] 로컬 서버 시작 실패:', e)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// 종료 직전 디스크에 강제 flush (이중 안전장치)
app.on('before-quit', async (event) => {
  event.preventDefault()
  try {
    const persistSession = session.fromPartition('persist:loreforge')
    await persistSession.flushStorageData()
  } catch (e) {
    // flush 실패해도 종료는 진행
  }
  if (staticServer) {
    try { staticServer.close() } catch (e) {}
  }
  app.exit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
