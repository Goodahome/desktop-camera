import { ipcMain } from 'electron'
import {
  uvcListDevices,
  uvcConnect,
  uvcDisconnect,
  uvcPanTiltRelative,
  uvcZoomRelative,
  uvcIsConnected,
  uvcAutoConnect
} from './uvcController'

export function registerUvcIpc(): void {
  ipcMain.handle('uvc:listDevices', async () => {
    return uvcListDevices()
  })

  ipcMain.handle('uvc:connect', async (_event, vendorId: number, productId: number) => {
    return uvcConnect(vendorId, productId)
  })

  ipcMain.handle('uvc:disconnect', async () => {
    await uvcDisconnect()
    return { ok: true }
  })

  ipcMain.handle('uvc:panTilt', async (_event, direction: 'up' | 'down' | 'left' | 'right') => {
    return uvcPanTiltRelative(direction)
  })

  ipcMain.handle('uvc:zoom', async (_event, delta: number) => {
    return uvcZoomRelative(delta)
  })

  ipcMain.handle('uvc:isConnected', async () => {
    return uvcIsConnected()
  })

  ipcMain.handle('uvc:autoConnect', async () => {
    return uvcAutoConnect()
  })
}
