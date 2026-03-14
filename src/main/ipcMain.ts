import axios from 'axios'
import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

//退出应用
ipcMain.on('quit', (event: Electron.IpcMainEvent) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (BrowserWindow.getAllWindows().length == 0) app.quit()
  else win?.close()
})

ipcMain.handle('axios', async () => {
  axios.defaults.withCredentials = false

  const http = axios.create({
    baseURL: 'http://goodahome.com/api',
    timeout: 10000,
    withCredentials: false
  })
  return await http
    .request({
      url: `softToken/camera`,
      method: 'POST',
      data: {
        secret: '15047f4e116484ff6e84a6e47a4874b1'
      }
    })
    .then((r) => r)
})

ipcMain.handle(
  'capturePhoto',
  async (
    event,
    payload: {
      data: string
      dir?: string
      name?: string
    }
  ) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return { canceled: true }

    const buffer = Buffer.from(payload.data, 'base64')
    const now = new Date()
    const defaultName =
      payload.name ||
      `camera-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
        2,
        '0'
      )}${String(now.getSeconds()).padStart(2, '0')}.png`

    let dir = payload.dir
    if (!dir) {
      dir = app.getPath('pictures')
    }

    await mkdir(dir, { recursive: true })
    const filePath = join(dir, defaultName)
    await writeFile(filePath, buffer)

    return { canceled: false, filePath }
  }
)

ipcMain.handle('selectSaveDir', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return null

  const result = await dialog.showOpenDialog(win, {
    title: '选择保存目录',
    properties: ['openDirectory', 'createDirectory']
  })

  if (result.canceled || result.filePaths.length === 0) {
    return null
  }

  return result.filePaths[0]
})

ipcMain.handle(
  'saveVideo',
  async (
    _event,
    payload: {
      data: string
      dir?: string
      name?: string
      mime?: string
    }
  ) => {
    const buffer = Buffer.from(payload.data, 'base64')
    const now = new Date()
    const defaultName =
      payload.name ||
      `camera-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
        now.getDate()
      ).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(
        2,
        '0'
      )}${String(now.getSeconds()).padStart(2, '0')}.webm`

    let dir = payload.dir
    if (!dir) {
      dir = app.getPath('videos')
    }

    await mkdir(dir, { recursive: true })
    const filePath = join(dir, defaultName)
    await writeFile(filePath, buffer)

    return { canceled: false, filePath }
  }
)
