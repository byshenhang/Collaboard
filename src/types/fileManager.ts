/**
 * 文件管理系统类型定义
 * 
 * 定义前端与后端通信的数据结构
 */

// ============= 基础类型 =============

/**
 * 命令响应包装器
 */
export interface CommandResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 文件上传请求
 */
export interface UploadFileRequest {
  file_data: number[];
  original_name: string;
  directory_id?: string;
}

/**
 * 文件上传响应
 */
export interface UploadFileResponse {
  file_id: string;
  file_name: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  directory_id: string;
  created_at: string;
}

/**
 * 创建目录请求
 */
export interface CreateDirectoryRequest {
  name: string;
  parent_id?: string;
}

/**
 * 创建目录响应
 */
export interface CreateDirectoryResponse {
  directory_id: string;
  name: string;
  parent_id?: string;
  path: string;
  created_at: string;
}

/**
 * 目录树节点
 */
export interface DirectoryTreeNode {
  id: string;
  name: string;
  parent_id?: string;
  path: string;
  children: DirectoryTreeNode[];
  file_count: number;
  created_at: string;
}

/**
 * 文件列表项
 */
export interface FileListItem {
  id: string;
  name: string;
  path: string;
  original_name: string;
  file_size: number;
  size: number; // 添加size属性用于排序和过滤
  mime_type: string;
  created_at: string;
  updated_at: string;
  modified_at: string; // 添加modified_at属性用于排序
}

/**
 * 存储统计信息
 */
export interface StorageStats {
  total_files: number;
  total_directories: number;
  total_size: number;
  largest_file_size: number;
  most_recent_upload?: string;
}

// ============= 前端扩展类型 =============

/**
 * 上传状态
 */
export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'cancelled' | 'error';

/**
 * 上传项
 */
export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number;
  loaded?: number; // 已上传字节数
  speed?: number; // 上传速度（字节/秒）
  remainingTime?: number; // 剩余时间（秒）
  error?: string;
  result?: UploadFileResponse;
}

/**
 * 文件预览信息
 */
export interface FilePreview {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  thumbnail?: string;
  preview?: string; // 添加preview属性
  lastModified?: number; // 添加lastModified属性
  isImage: boolean;
  isVideo: boolean;
  isDocument: boolean;
}

/**
 * 目录展开状态
 */
export interface DirectoryExpandState {
  [directoryId: string]: boolean;
}

/**
 * 文件选择状态
 */
export interface FileSelectionState {
  selectedFiles: Set<string>;
  selectedDirectories: Set<string>;
  lastSelected?: string;
}

/**
 * 文件管理器视图模式
 */
export type ViewMode = 'grid' | 'list' | 'tree';

/**
 * 文件排序字段
 */
export type FileSortField = 'name' | 'size' | 'type' | 'created_at' | 'updated_at' | 'modified';

/**
 * 排序方向
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 文件排序配置
 */
export interface FileSortConfig {
  field: FileSortField;
  direction: SortDirection;
}

/**
 * 文件过滤配置
 */
export interface FileFilterConfig {
  fileTypes: string[];
  showHidden?: boolean; // 添加showHidden属性
  minSize?: number; // 添加minSize属性
  maxSize?: number; // 添加maxSize属性
  sizeRange?: {
    min: number;
    max: number;
  };
  dateRange?: {
    start: Date;
    end: Date;
  };
  searchQuery?: string;
}

/**
 * 文件管理器状态
 */
export interface FileManagerState {
  // 数据状态
  directoryTree: DirectoryTreeNode[];
  currentDirectory?: string;
  files: FileListItem[];
  
  // UI 状态
  viewMode: ViewMode;
  sortConfig: FileSortConfig;
  filterConfig: FileFilterConfig;
  expandState: DirectoryExpandState;
  selectionState: FileSelectionState;
  
  // 上传状态
  uploadQueue: UploadItem[];
  isUploading: boolean;
  
  // 加载状态
  loading: boolean;
  error?: string;
}

/**
 * 文件操作类型
 */
export type FileOperation = 'upload' | 'delete' | 'rename' | 'move' | 'copy';

/**
 * 文件操作结果
 */
export interface FileOperationResult {
  operation: FileOperation;
  success: boolean;
  message?: string;
  affectedFiles: string[];
}

/**
 * 拖拽数据类型
 */
export interface DragData {
  type: 'file' | 'directory';
  ids: string[];
  sourceDirectory?: string;
}

/**
 * 上下文菜单项
 */
export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  separator?: boolean;
  children?: ContextMenuItem[];
  onClick?: () => void;
}

/**
 * 文件管理器配置
 */
export interface FileManagerConfig {
  // 上传配置
  maxFileSize: number;
  allowedFileTypes: string[];
  maxConcurrentUploads: number;
  
  // 显示配置
  defaultViewMode: ViewMode;
  showHiddenFiles: boolean;
  thumbnailSize: number;
  
  // 功能配置
  enableDragDrop: boolean;
  enableContextMenu: boolean;
  enableKeyboardShortcuts: boolean;
}

// ============= 工具函数类型 =============

/**
 * 文件大小格式化函数类型
 */
export type FormatFileSizeFunction = (bytes: number) => string;

/**
 * 文件类型检测函数类型
 */
export type GetFileTypeFunction = (filename: string, mimeType?: string) => {
  type: 'image' | 'video' | 'document' | 'archive' | 'other';
  icon: string;
  color: string;
};

/**
 * 文件预览URL生成函数类型
 */
export type GeneratePreviewUrlFunction = (fileId: string, type: 'thumbnail' | 'preview') => string;

// ============= 事件类型 =============

/**
 * 文件选择事件
 */
export interface FileSelectEvent {
  fileIds: string[];
  directoryIds: string[];
  ctrlKey: boolean;
  shiftKey: boolean;
}

/**
 * 文件拖拽事件
 */
export interface FileDragEvent {
  dragData: DragData;
  targetDirectory?: string;
  position: { x: number; y: number };
}

/**
 * 文件上传事件
 */
export interface FileUploadEvent {
  files: File[];
  targetDirectory?: string;
}

/**
 * 目录切换事件
 */
export interface DirectoryChangeEvent {
  directoryId: string;
  path: string;
}

// ============= Hook 返回类型 =============

/**
 * 文件管理器 Hook 返回类型
 */
export interface UseFileManagerReturn {
  // 状态
  state: FileManagerState;
  
  // 状态属性（直接暴露以便解构）
  directoryTree: DirectoryTreeNode[];
  currentFiles: FileListItem[];
  uploadQueue: UploadItem[];
  selectedFiles: Set<string>;
  expandedDirectories: DirectoryExpandState;
  storageStats?: StorageStats;
  loading: boolean;
  error?: string;
  
  // 数据操作
  loadDirectoryTree: () => Promise<void>;
  loadDirectoryFiles: (directoryId: string) => Promise<void>;
  refreshCurrentDirectory: () => Promise<void>;
  
  // 文件操作
  uploadFiles: (files: File[], directoryId?: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  deleteDirectories: (directoryIds: string[]) => Promise<void>;
  deleteDirectory: (directoryId: string) => Promise<void>;
  createDirectory: (name: string, parentId?: string) => Promise<void>;
  
  // UI 操作
  setViewMode: (mode: ViewMode) => void;
  setSortConfig: (config: FileSortConfig) => void;
  setFilterConfig: (config: FileFilterConfig) => void;
  toggleDirectoryExpand: (directoryId: string) => void;
  toggleDirectoryExpansion: (directoryId: string) => void;
  selectFiles: (fileIds: string[], append?: boolean) => void;
  selectDirectories: (directoryIds: string[], append?: boolean) => void;
  clearSelection: () => void;
  
  // 上传操作
  cancelUpload: (uploadId: string) => void;
  retryUpload: (uploadId: string) => void;
  clearCompletedUploads: () => void;
  clearUploadQueue: () => void;
  removeUploadItem: (uploadId: string) => void;
  
  // 搜索
  searchFiles: (query: string, directoryId?: string) => Promise<FileListItem[]>;
  
  // 统计
  getStorageStats: () => Promise<StorageStats>;
}