const { app, BrowserWindow, session } = require('electron')
const path = require('path')

// Windows 작업표시줄 아이콘 정확히 박히게 (이거 없으면 가끔 Electron 기본 아이콘 뜸)
if (process.platform === 'win32') {
  app.setAppUserModelId('com.kyeoul.loreforge')
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      partition: 'persist:loreforge', // 명시적 영속 세션 (localStorage 영속화)
    },
    title: 'LORE FORGE',
    backgroundColor: '#1a1520',
  })

  win.loadFile('index.html')

  // 진단용: 필요할 때만 주석 풀어서 사용. 평소엔 주석 처리.
  // win.webContents.openDevTools()
}

app.whenReady().then(() => {
  createWindow()
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
  app.exit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
