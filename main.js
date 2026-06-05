const { app, BrowserWindow } = require('electron')
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
    },
    title: 'LORE FORGE',
    backgroundColor: '#1a1520',
  })

  win.loadFile('index.html')
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
