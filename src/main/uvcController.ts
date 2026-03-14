/**
 * UVC 摄像头控制（主进程），使用 uvc-control 库
 */
import { join } from 'path'

function getAppRoot(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app } = require('electron')
    if (app?.getAppPath) return app.getAppPath()
  } catch {}
  return process.cwd()
}

type UVCControlInstance = { setRaw: (name: string, buf: Buffer, cb: (err: Error | null) => void) => void; set: (name: string, value: number, cb: (err: Error | null) => void) => void; range: (name: string, cb: (err: Error | null, range?: number[]) => void) => void; close: () => void }
let UVCControl: (new (vid: number, pid: number) => UVCControlInstance) | null = null
try {
  UVCControl = require(join(getAppRoot(), 'node_modules', 'uvc-control'))
} catch (e) {
  console.error('[UVC] uvc-control 加载失败', e)
}

let camera: UVCControlInstance | null = null
let zoomMin = 0
let zoomMax = 100

let currentPan = 0
let currentTilt = 0
let currentZoom = 0
const panTiltStep = 8
const panTiltLimit = 70

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v))
}

/** 设备列表用 usb 枚举（与 uvc-control 同源） */
export async function uvcListDevices(): Promise<Array<{ vendorId: number; productId: number; name: string }>> {
  let usb: { getDeviceList: () => unknown[] }
  try {
    const root = getAppRoot()
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    usb = require(join(root, 'node_modules', 'usb'))
  } catch (e) {
    console.error('[UVC] usb 模块未找到，请运行: pnpm run rebuild', e)
    return []
  }
  try {
    const list = usb.getDeviceList()
    const result: Array<{ vendorId: number; productId: number; name: string }> = []
    for (const dev of list) {
      try {
        const d = dev as {
          deviceDescriptor?: { idVendor: number; idProduct: number; bDeviceClass: number }
        }
        const desc = d.deviceDescriptor
        if (!desc) continue
        const deviceClass = desc.bDeviceClass ?? 0
        if (deviceClass !== 0 && deviceClass !== 0xef) continue
        const vid = desc.idVendor
        const pid = desc.idProduct
        result.push({ vendorId: vid, productId: pid, name: `USB 0x${vid.toString(16)}:0x${pid.toString(16)}` })
      } catch {
        // skip
      }
    }
    return result
  } catch (e) {
    console.error('[UVC] uvcListDevices', e)
    return []
  }
}

export function uvcConnect(vendorId: number, productId: number): Promise<{ ok: boolean; error?: string }> {
  return new Promise(async (resolve) => {
    await uvcDisconnect()
    if (!UVCControl) {
      resolve({ ok: false, error: 'uvc-control 未安装或加载失败' })
      return
    }
    try {
      camera = new UVCControl(vendorId, productId)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      console.error('[UVC] uvc-control 连接失败', e)
      resolve({ ok: false, error: msg })
      return
    }
    if (!camera) {
      resolve({ ok: false, error: '设备不可用' })
      return
    }
    currentPan = 0
    currentTilt = 0
    currentZoom = 0
    zoomMin = 0
    zoomMax = 100
    // 探测设备是否支持 UVC 控制：先试变焦，再试云台（任一成功即视为可用）
    const cam = camera
    cam.range('absoluteZoom', (errZoom: Error | null, range?: number[]) => {
      if (!errZoom && range && range.length >= 2) {
        zoomMin = range[0]
        zoomMax = range[1]
        currentZoom = zoomMin
        console.log('[UVC] 已连接 (uvc-control)', vendorId, productId)
        resolve({ ok: true })
        return
      }
      cam.range('absolutePanTilt', (errPan: Error | null) => {
        if (errPan) {
          console.log('[UVC] 设备不支持控制或非当前摄像头', vendorId, productId, errZoom?.message || errPan?.message)
          uvcDisconnect()
          resolve({ ok: false, error: errZoom?.message || errPan?.message || '设备不支持云台/变焦' })
          return
        }
        console.log('[UVC] 已连接 (uvc-control)', vendorId, productId)
        resolve({ ok: true })
      })
    })
  })
}

export async function uvcDisconnect(): Promise<void> {
  if (camera) {
    try {
      camera.close()
    } catch (e) {
      console.error('[UVC] camera.close', e)
    }
    camera = null
  }
}

export function uvcPanTiltRelative(direction: 'up' | 'down' | 'left' | 'right'): Promise<{ ok: boolean; error?: string }> {
  const cam = camera
  if (!cam) {
    console.log('[UVC] panTilt 未连接')
    return Promise.resolve({ ok: false, error: '未连接 UVC 摄像头' })
  }
  return new Promise((resolve) => {
    switch (direction) {
      case 'left':
        currentPan = clamp(currentPan - panTiltStep, -panTiltLimit, panTiltLimit)
        break
      case 'right':
        currentPan = clamp(currentPan + panTiltStep, -panTiltLimit, panTiltLimit)
        break
      case 'up':
        currentTilt = clamp(currentTilt + panTiltStep, -panTiltLimit, panTiltLimit)
        break
      case 'down':
        currentTilt = clamp(currentTilt - panTiltStep, -panTiltLimit, panTiltLimit)
        break
    }
    const buf = Buffer.allocUnsafe(8)
    buf.writeInt32LE(currentPan, 0)
    buf.writeInt32LE(currentTilt, 4)
    cam.setRaw('absolutePanTilt', buf, (err: Error | null) => {
      if (err) console.log('[UVC] panTilt 失败', direction, err.message)
      resolve(err ? { ok: false, error: err.message } : { ok: true })
    })
  })
}

export function uvcZoomRelative(delta: number): Promise<{ ok: boolean; error?: string }> {
  const cam = camera
  if (!cam) {
    console.log('[UVC] zoom 未连接')
    return Promise.resolve({ ok: false, error: '未连接 UVC 摄像头' })
  }
  return new Promise((resolve) => {
    currentZoom = clamp(currentZoom + delta, zoomMin, zoomMax)
    cam.set('absoluteZoom', currentZoom, (err: Error | null) => {
      if (err) console.log('[UVC] zoom 失败', err.message)
      resolve(err ? { ok: false, error: err.message } : { ok: true })
    })
  })
}

export function uvcIsConnected(): boolean {
  return !!camera
}

/** 自动尝试连接：按设备列表倒序尝试（外接摄像头通常在后），且仅当设备支持控制才视为成功 */
export async function uvcAutoConnect(): Promise<{
  ok: boolean
  vendorId?: number
  productId?: number
  error?: string
}> {
  const list = await uvcListDevices()
  const ordered = [...list].reverse()
  console.log('[UVC] autoConnect: 候选设备数 =', list.length, '（倒序尝试）', ordered.map((d) => `0x${d.vendorId.toString(16)}:0x${d.productId.toString(16)}`))
  for (const d of ordered) {
    const res = await uvcConnect(d.vendorId, d.productId)
    console.log('[UVC] 尝试连接', d.name, '=>', res.ok ? '成功' : res.error)
    if (res.ok) {
      console.log('[UVC] 已连接控制协议 (uvc-control):', d.name)
      return { ok: true, vendorId: d.vendorId, productId: d.productId }
    }
  }
  console.log('[UVC] autoConnect: 无可用设备或均不支持控制')
  return { ok: false, error: '未找到可用的 UVC 摄像头或设备不支持云台/变焦' }
}
