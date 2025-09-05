# 文件管理系统对齐文档

## 项目上下文分析

### 现有项目架构
- **前端**: React 19 + TypeScript + Vite + Tailwind CSS + DaisyUI
- **后端**: Rust + Tauri 2.0 桌面应用框架
- **现有功能**: Eagle 风格界面、TGA 图像处理、基础 Tauri 命令
- **依赖**: 已集成 image crate、tauri-plugin-dialog、tauri-plugin-opener

### 现有代码模式
- Tauri 命令模式：使用 `#[tauri::command]` 宏定义 API
- 前端组件化：Header、Sidebar、Content、Inspector 组件
- 样式系统：Tailwind + 自定义 CSS 类
- 异步处理：tokio 异步运行时

## 原始需求分析

### 核心需求
1. **前端页面框架设计完善适配**
   - 文件管理界面集成到现有 Eagle 风格界面
   - 文件操作的用户交互设计
   - 响应式布局适配

2. **Rust 结合原生能力**
   - 利用 Rust 的文件系统操作能力
   - 集成 Windows 原生文件 API
   - 高性能文件操作

3. **基础文件操作功能**
   - 创建目录
   - 删除目录
   - 添加文件
   - 删除文件
   - 本地持久化存储

4. **平台限制**
   - 主要针对 Windows 平台
   - 无需考虑跨平台兼容性

## 需求理解确认

### 功能边界
- ✅ 基础 CRUD 文件操作
- ✅ 目录树结构管理
- ✅ Windows 平台优化
- ❌ 文件内容编辑
- ❌ 文件版本控制
- ❌ 网络同步功能

### 技术约束
- 必须集成到现有 Tauri 应用
- 保持 Eagle 风格界面一致性
- 使用现有技术栈，避免引入新框架
- Windows 平台原生性能优化

## 疑问澄清

### 需要确认的关键决策点

1. **文件存储位置**
   - 是否在应用数据目录下创建专用文件夹？
   - 是否允许用户选择自定义存储路径？
   - 建议：默认使用 `%APPDATA%/Collaboard/files` 目录

2. **文件管理界面集成方式**
   - 是否作为新的侧边栏标签页？
   - 是否替换现有的文件夹视图？
   - 建议：在现有侧边栏添加"文件管理"标签页

3. **文件操作权限**
   - 是否需要管理员权限？
   - 是否限制操作范围在应用目录内？
   - 建议：限制在应用数据目录内，避免权限问题

4. **持久化数据格式**
   - ✅ 确认：使用 SQLite 数据库存储文件目录路径信息
   - ✅ 确认：图片文件使用 IO 直接保存到本地文件系统
   - 方案：SQLite 管理元数据 + 文件系统存储实际文件

5. **错误处理策略**
   - 文件操作失败时的用户反馈？
   - 是否需要操作日志记录？
   - 建议：Toast 通知 + 简单日志记录

## 技术实现方向

### 前端架构
```typescript
// 新增组件结构
components/
├── FileManager/
│   ├── FileTree.tsx          // 文件树组件
│   ├── FileOperations.tsx    // 文件操作按钮组
│   ├── CreateDialog.tsx      // 创建文件/文件夹对话框
│   └── ConfirmDialog.tsx     // 删除确认对话框
```

### 后端 API 设计
```rust
// 新增 Tauri 命令 - SQLite + 文件系统
#[tauri::command]
async fn create_directory(name: String, parent_id: Option<i64>) -> Result<DirectoryInfo, String>

#[tauri::command]
async fn delete_directory(id: i64) -> Result<(), String>

#[tauri::command]
async fn upload_file(file_data: Vec<u8>, name: String, directory_id: i64) -> Result<FileInfo, String>

#[tauri::command]
async fn delete_file(id: i64) -> Result<(), String>

#[tauri::command]
async fn get_directory_tree() -> Result<Vec<DirectoryNode>, String>

#[tauri::command]
async fn get_files_in_directory(directory_id: i64) -> Result<Vec<FileInfo>, String>

// 数据结构
#[derive(Serialize, Deserialize)]
struct DirectoryInfo {
    id: i64,
    name: String,
    parent_id: Option<i64>,
    full_path: String,
    created_at: String,
}

#[derive(Serialize, Deserialize)]
struct FileInfo {
    id: i64,
    name: String,
    directory_id: i64,
    file_path: String,
    file_size: i64,
    file_type: String,
    created_at: String,
}
```

### 数据持久化方案
```sql
-- SQLite 数据库结构
CREATE TABLE directories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    full_path TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES directories(id)
);

CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    directory_id INTEGER NOT NULL,
    file_path TEXT NOT NULL UNIQUE,
    file_size INTEGER,
    file_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (directory_id) REFERENCES directories(id)
);

-- 文件系统结构
%APPDATA%/Collaboard/
├── database.db          -- SQLite 数据库
└── files/               -- 实际文件存储
    ├── images/
    ├── documents/
    └── others/
```

## 验收标准

### 功能验收
- [ ] 能够创建新文件夹
- [ ] 能够删除空文件夹和非空文件夹
- [ ] 能够创建新文件（支持常见格式）
- [ ] 能够删除文件
- [ ] 文件树实时更新显示
- [ ] 操作结果有明确的用户反馈

### 性能验收
- [ ] 文件操作响应时间 < 500ms
- [ ] 大量文件（1000+）加载时间 < 2s
- [ ] 界面操作流畅，无明显卡顿

### 集成验收
- [ ] 与现有界面风格保持一致
- [ ] 不影响现有功能正常使用
- [ ] 错误处理不会导致应用崩溃

## 风险评估

### 技术风险
- **中等**: Windows 文件权限问题
- **低**: Tauri 文件 API 兼容性
- **低**: 前端状态管理复杂度

### 解决方案
- 使用应用数据目录避免权限问题
- 充分测试 Tauri 文件操作 API
- 采用简单的状态管理模式

---

**状态**: 等待关键决策点确认
**下一步**: 根据确认结果生成 CONSENSUS 文档