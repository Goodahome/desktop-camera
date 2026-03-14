# 桌面摄像头

<img src="./assets/xj.jpg" alt="xj-small" style="border-radius: 10px;object-fit: cover;height:200px;" />

基于 Electron+Vue3+Vite 开发的桌面摄像头软件，方便直播录课、短视频拍摄等场景。

## 功能特点

- 支持摄像头切换
- 摄像头窗口置顶
- 配置边框宽度
- 定义边框颜色
- 支持圆角与横屏显示
- Window、Mac、Linux 多系统支持

## 软件下载

你可以从 [Github](https://github.com/Goodahome/desktop-camera/release) 下载软件。

你也可以 clone 项目后，在本地根据自行编译软件使用，请进入项目根目录执行以下命令，你也可以在项目的 package.json 文件中看到更多命令。

```
# 安装依赖包
pnpm i

# Mac系统编译命令
pnpm build:mac-x86
pnpm build:mac-arm64

# Window系统编译命令
pnpm build:win

# Linux系统编译命令
pnpm build:linux
```

如果你在编译过程中出错失败，一般是你没有正确设置 electron 或 electron-build 镜像，
# 修复步骤（针对 electron@41.0.2 + electron-vite@5.0.0）
## 确认 electron 确切安装路径
在项目根目录运行这个 PowerShell 命令，找到 electron 的 node_modules 位置：PowerShellGet-ChildItem -Recurse -Path "node_modules\.pnpm" -Filter "electron@41.0.2" -Directory | Select-Object FullName输出类似：textC:\Users\Gooda\Documents\Project\camera\node_modules\.pnpm\electron@41.0.2+abc123\node_modules\electron记住这个完整路径（尤其是 @41.0.2 后面的 +hash，如果有）。
## 手动放置 dist（重新确认）
去 https://github.com/electron/electron/releases/tag/v41.0.2 下载 electron-v41.0.0-win32-x64.zip（注意版本是 41.0.2，但 zip 可能标 41.0.0 或 41.0.2，选最接近的 x64 win32 版）
解压 zip，里面直接就是 electron.exe、LICENSE 等文件（不要有外层文件夹）
把这些文件全部复制（覆盖）到：
你的electron路径\node_modules\electron\dist\
如果 dist 不存在 → 新建
确保 electron.exe 就在 dist\electron.exe
## 创建/修正 path.txt（最关键！）
在你的electron路径\node_modules\electron\ （不是 dist 里面）下创建文件 path.txt（纯文本，用 Notepad++ 或 VSCode 创建，避免记事本加 BOM）。文件内容 只写这一行（无空格、无换行符在末尾）：textelectron.exe
保存后，用记事本打开确认里面就是 "electron.exe" 四个字 + 回车，无多余东西。
如果你之前创建过，删掉重来。

## 效果展示

摄像头角效果

<img src="./assets/image-20230303145607103.jpeg" alt="image-20230303145607103"  />

支持横屏样式

![image-20230308152129044](./assets/image-20230308152129044.jpeg)

支持多种参数的配置

<img src="./assets/image-20230303145726417.jpeg" alt="image-20230303145726417"  />

支持多摄像头选择

<img src="./assets/image-20230303145754324.jpeg" alt="image-20230303145754324"  />
