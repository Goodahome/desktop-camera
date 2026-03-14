import { Menu, shell, Tray } from 'electron'
import path from 'path'
const createTray = () => {
  const tray = new Tray(
    path.resolve(
      __dirname,
      process.platform == 'darwin'
        ? '../../resources/trayTemplate@2x.png'
        : '../../resources/windowTray.png'
    )
  )
  const contextMenu = Menu.buildFromTemplate([
    { label: '退出程序', role: 'quit' },
    { type: 'separator' },
    { label: '问题反馈', click: () => shell.openExternal('https://github.com/Goodahome/desktop-camera') }
  ])
  tray.setToolTip('桌面相机')
  tray.setContextMenu(contextMenu)
}

export { createTray }
