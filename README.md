# 🚀 Tauri 全栈应用示例

一个功能丰富的 Tauri 桌面应用，展示了现代前端技术栈与系统级编程的完美结合。

## ✨ 项目特色

### 🎯 核心技术栈
- **前端框架**: React 19 + TypeScript + Vite
- **UI 组件库**: DaisyUI + Tailwind CSS
- **动画库**: Framer Motion
- **桌面框架**: Tauri 2.0
- **后端语言**: Rust
- **系统集成**: C++ FFI (STB Image)

### 🎨 功能展示

#### 1. 🎪 UI 组件展示
- **DaisyUI 组件库**完整展示
- 响应式设计和主题切换
- 现代化的卡片、按钮、表单组件
- 数据可视化图表

#### 2. ✨ 动画效果
- **Framer Motion** 动画库集成
- 淡入淡出、弹簧动画、旋转缩放
- 手势交互：拖拽、悬停、点击
- 页面过渡和状态动画

#### 3. 🔧 Tauri 系统交互
- 系统信息获取
- 文件对话框操作
- 计算器功能演示
- 随机数生成
- 异步任务处理

#### 4. 🖼️ 图片处理 (C++ 集成)
- **TGA 图片格式**支持
- C++ STB Image 库集成
- Rust FFI 跨语言调用
- 内存安全管理
- Base64 编码转换

## 🛠️ 开发环境

### 必需工具
- **Node.js** (v18+)
- **Rust** (latest stable)
- **C++ 编译器** (MSVC on Windows)
- **Yarn** 包管理器

### 推荐 IDE
- [VS Code](https://code.visualstudio.com/)
- [Tauri Extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [Rust Analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [TypeScript Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-typescript-next)

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd tauri-app
```

### 2. 安装依赖
```bash
# 安装前端依赖
yarn install

# 安装 Tauri CLI (如果未安装)
cargo install tauri-cli
```

### 3. 开发模式
```bash
# 启动开发服务器
yarn tauri dev

# 或使用 npm
npm run tauri dev
```

### 4. 构建应用
```bash
# 构建生产版本
yarn tauri build

# 构建后的文件在 src-tauri/target/release/bundle/
```

## 📁 项目结构

```
tauri-app/
├── src/                    # React 前端源码
│   ├── components/         # React 组件
│   │   ├── AnimationDemo.tsx    # Framer Motion 动画展示
│   │   └── ThemeToggle.tsx      # 主题切换组件
│   ├── App.tsx            # 主应用组件
│   └── main.tsx           # 应用入口
├── src-tauri/             # Tauri 后端源码
│   ├── src/
│   │   ├── lib.rs         # Rust 库和 FFI 绑定
│   │   └── main.rs        # Tauri 主程序
│   ├── build.rs           # 构建脚本 (C++ 编译)
│   └── Cargo.toml         # Rust 依赖配置
├── cpp/                   # C++ 源码
│   ├── tga_loader.cpp     # TGA 图片加载器
│   └── stb_image.h        # STB Image 库
├── public/                # 静态资源
└── package.json           # Node.js 依赖配置
```

## 🎯 核心功能详解

### Framer Motion 动画系统
- **Variants 系统**: 统一的动画状态管理
- **手势识别**: whileHover, whileTap, drag 支持
- **页面过渡**: AnimatePresence 组件
- **物理动画**: 弹簧和阻尼效果

### C++ 库集成
- **FFI 绑定**: 安全的 Rust-C++ 互操作
- **内存管理**: RAII 模式和显式释放
- **图片处理**: STB Image 库集成
- **错误处理**: 完整的错误传播链

### Tauri 系统能力
- **文件系统**: 文件选择和读取
- **系统信息**: 硬件和操作系统信息
- **窗口管理**: 原生窗口控制
- **安全沙箱**: 权限控制和 API 限制

## 🔧 自定义配置

### 主题配置
项目使用 DaisyUI 主题系统，支持多种预设主题：
- Light / Dark 模式
- 彩色主题变体
- 自定义 CSS 变量

### 构建配置
- **Vite 配置**: `vite.config.ts`
- **Tauri 配置**: `src-tauri/tauri.conf.json`
- **TypeScript 配置**: `tsconfig.json`
- **Tailwind 配置**: `tailwind.config.js`

## 📚 学习资源

### 官方文档
- [Tauri 官方文档](https://tauri.app/)
- [React 官方文档](https://react.dev/)
- [Framer Motion 文档](https://www.framer.com/motion/)
- [DaisyUI 组件库](https://daisyui.com/)

### 技术指南
- [C++ 库集成指南](./C++库集成指南.md) - 详细的 FFI 集成教程
- [Rust FFI 最佳实践](https://doc.rust-lang.org/nomicon/ffi.html)
- [Tauri 安全指南](https://tauri.app/v1/guides/features/command)

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- [Tauri Team](https://github.com/tauri-apps/tauri) - 优秀的桌面应用框架
- [STB Libraries](https://github.com/nothings/stb) - 轻量级图片处理库
- [DaisyUI](https://daisyui.com/) - 美观的 Tailwind CSS 组件库
- [Framer Motion](https://www.framer.com/motion/) - 强大的 React 动画库

---

**⭐ 如果这个项目对你有帮助，请给个 Star！**
