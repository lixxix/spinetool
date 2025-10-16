# SpineTool - Spine动画工具箱

SpineTool是一个功能强大的Spine动画处理工具，支持导出、预览、还原和裁剪Spine动画文件。该工具基于Tauri框架构建，结合了React前端和Rust后端，提供了高性能的本地应用程序体验。

![SpineTool界面](src/assets/icon.png)

## 功能特性

- **导出功能**: 支持将Spine文件导出为不同版本和格式
- **预览功能**: 实时预览Spine动画效果
- **还原功能**: 将导出的动画文件还原为可编辑的Spine项目
- **裁剪功能**: 对atlas纹理图集进行裁剪处理
- **多版本支持**: 支持Spine 3.6、3.7、3.8、4.0等多个版本
- **数据统计**: 提供历史数据和今日数据统计功能

## 技术栈

- **前端**: React + TypeScript + Vite
- **UI框架**: Tailwind CSS + shadcn/ui组件库
- **状态管理**: Redux Toolkit
- **图形渲染**: PixiJS + pixi-spine
- **后端**: Rust + Tauri
- **数据库**: SQLite

## 安装依赖

在项目根目录下运行以下命令安装前端依赖：

```bash
npm install
```

## 开发运行

安装依赖后，使用以下命令启动开发服务器：

```bash
npm run tauri dev
```

## 构建应用

要构建生产版本的应用程序，运行：

```bash
npm run tauri build
```

## 功能模块

### 1. 导出模块
- 支持选择Spine文件夹进行批量导出
- 可选择导出版本（3.6、3.7、3.8、4.0等）
- 支持相对路径和绝对路径导出
- 提供导出进度跟踪和状态显示

### 2. 预览模块
- 实时预览Spine动画文件
- 支持动画切换和皮肤切换
- 可调节播放速度和缩放比例
- 提供调试视图功能

### 3. 还原模块
- 将导出的动画文件还原为可编辑格式
- 自动解析版本信息和还原比例
- 支持文件整理功能，将相关文件归类到独立文件夹

### 4. 裁剪模块
- 对atlas纹理图集进行裁剪处理
- 支持自定义输出路径
- 提供裁剪进度跟踪

### 5. 设置模块
- 配置Spine安装目录
- 设置临时文件目录
- 管理导出配置类型

## 目录结构

```
src/                    # 前端源码
├── components/         # React组件
├── pages/              # 页面组件
├── slices/             # Redux状态切片
├── store/              # Redux store配置
└── ...
src-tauri/              # Rust后端代码
├── src/                # Rust源码
├── export/             # 导出配置文件
└── icons/              # 应用图标
```

## 系统要求

- Windows 10/11 (推荐)
- Spine运行时环境
- Node.js 16+
- Rust工具链

## 许可证

[MIT License](LICENSE)