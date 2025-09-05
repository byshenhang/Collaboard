# 文件管理系统共识文档

## 需求描述

### 核心功能
- **文件目录管理**: 创建、删除文件夹，支持层级结构
- **文件操作**: 上传、删除文件，支持图片等多种格式
- **数据持久化**: SQLite 存储目录路径信息，文件系统存储实际文件
- **界面集成**: 集成到现有 Eagle 风格界面中
- **平台支持**: 专注 Windows 平台优化

## 技术实现方案

### 架构设计
```
前端 (React + TypeScript)
    ↓ Tauri IPC
后端 (Rust + SQLite)
    ↓ 文件系统操作
本地存储 (%APPDATA%/Collaboard/)
```

### 数据存储策略

**SQLite 数据库** (`database.db`)
- 存储目录结构和层级关系
- 存储文件元信息（路径、大小、类型等）
- 支持快速查询和索引

**文件系统** (`files/` 目录)
- 存储实际的图片和文件内容
- 按类型分类存储（images/, documents/, others/）
- 使用 UUID 命名避免冲突

### 数据库设计

```sql
-- 目录表
CREATE TABLE directories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    full_path TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES directories(id)
);

-- 文件表
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

-- 索引优化
CREATE INDEX idx_directories_parent ON directories(parent_id);
CREATE INDEX idx_files_directory ON files(directory_id);
CREATE INDEX idx_files_type ON files(file_type);
```

### Rust 后端 API

```rust
// 目录操作
#[tauri::command]
async fn create_directory(name: String, parent_id: Option<i64>) -> Result<DirectoryInfo, String>

#[tauri::command]
async fn delete_directory(id: i64) -> Result<(), String>

#[tauri::command]
async fn get_directory_tree() -> Result<Vec<DirectoryNode>, String>

// 文件操作
#[tauri::command]
async fn upload_file(file_data: Vec<u8>, name: String, directory_id: i64) -> Result<FileInfo, String>

#[tauri::command]
async fn delete_file(id: i64) -> Result<(), String>

#[tauri::command]
async fn get_files_in_directory(directory_id: i64) -> Result<Vec<FileInfo>, String>

// 数据结构
#[derive(Serialize, Deserialize, Debug)]
struct DirectoryInfo {
    id: i64,
    name: String,
    parent_id: Option<i64>,
    full_path: String,
    created_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct FileInfo {
    id: i64,
    name: String,
    directory_id: i64,
    file_path: String,
    file_size: i64,
    file_type: String,
    created_at: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct DirectoryNode {
    info: DirectoryInfo,
    children: Vec<DirectoryNode>,
    files: Vec<FileInfo>,
}
```

### 前端组件设计

```typescript
// 组件结构
components/FileManager/
├── FileManagerPanel.tsx     // 主面板组件
├── DirectoryTree.tsx        // 目录树组件
├── FileList.tsx            // 文件列表组件
├── UploadZone.tsx          // 文件上传区域
├── CreateDirectoryDialog.tsx // 创建目录对话框
└── ConfirmDeleteDialog.tsx  // 删除确认对话框

// 状态管理
interface FileManagerState {
  directories: DirectoryNode[];
  currentDirectory: DirectoryInfo | null;
  files: FileInfo[];
  selectedItems: (DirectoryInfo | FileInfo)[];
  isLoading: boolean;
}
```

## 技术约束

### 依赖要求

**Rust 后端新增依赖**
```toml
[dependencies]
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1.0", features = ["v4"] }
tokio = { version = "1", features = ["fs"] }
serde_json = "1.0"
chrono = { version = "0.4", features = ["serde"] }
```

**前端新增依赖**
```json
{
  "react-dropzone": "^14.2.3",
  "@heroicons/react": "^2.2.0"
}
```

### 集成方案

1. **侧边栏集成**: 在现有 Sidebar 组件中添加"文件管理"标签页
2. **样式一致性**: 使用现有的 Tailwind CSS 类和 Eagle 风格设计
3. **状态管理**: 使用 React useState 和 useEffect，避免引入额外状态管理库
4. **错误处理**: 统一的 Toast 通知系统

## 任务边界

### 包含功能
- ✅ 目录的创建、删除、层级显示
- ✅ 文件的上传、删除、列表显示
- ✅ SQLite 数据库初始化和操作
- ✅ 文件系统 IO 操作
- ✅ 基础的错误处理和用户反馈
- ✅ 与现有界面的集成

### 不包含功能
- ❌ 文件内容编辑
- ❌ 文件版本控制
- ❌ 网络同步功能
- ❌ 高级搜索功能
- ❌ 文件权限管理
- ❌ 批量操作（第一版）

## 验收标准

### 功能验收
1. **目录操作**
   - [ ] 能够创建新目录
   - [ ] 能够删除空目录和非空目录
   - [ ] 目录树正确显示层级关系
   - [ ] 目录信息正确存储到 SQLite

2. **文件操作**
   - [ ] 能够上传图片文件（PNG, JPG, GIF）
   - [ ] 能够删除文件
   - [ ] 文件列表正确显示
   - [ ] 文件实际保存到文件系统

3. **数据持久化**
   - [ ] SQLite 数据库正确初始化
   - [ ] 目录和文件信息正确存储
   - [ ] 应用重启后数据保持一致

4. **界面集成**
   - [ ] 文件管理面板集成到侧边栏
   - [ ] 界面风格与现有设计一致
   - [ ] 操作响应及时，有适当的加载状态

### 性能验收
- [ ] 目录创建/删除响应时间 < 200ms
- [ ] 文件上传响应时间 < 1s（10MB以内）
- [ ] 目录树加载时间 < 500ms
- [ ] 支持至少 1000 个文件的管理

### 质量验收
- [ ] 所有 Rust 函数有完整的错误处理
- [ ] 前端组件有适当的 TypeScript 类型定义
- [ ] 数据库操作有事务保护
- [ ] 文件操作有适当的权限检查

## 风险评估与缓解

### 技术风险
1. **SQLite 并发访问**: 使用连接池和事务管理
2. **文件系统权限**: 限制在应用数据目录内操作
3. **大文件上传**: 实现分块上传和进度显示
4. **内存使用**: 文件数据流式处理，避免全量加载

### 缓解策略
- 充分的错误处理和用户反馈
- 渐进式功能实现，先核心后扩展
- 详细的测试覆盖，包括边界条件
- 性能监控和优化

---

**状态**: 共识达成，准备进入架构设计阶段
**确认时间**: 2024-01-15
**下一步**: 生成详细的系统架构设计文档