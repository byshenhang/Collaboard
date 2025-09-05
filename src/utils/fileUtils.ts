/**
 * 文件管理工具函数
 * 
 * 提供文件操作相关的工具函数
 */

import type {
  FileListItem,
  FileSortConfig,
  FileFilterConfig,
  FilePreview,
} from '../types/fileManager';

/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 获取文件类型信息
 */
export function getFileTypeInfo(filename: string): {
  type: string;
  category: 'image' | 'document' | 'archive' | 'video' | 'audio' | 'code' | 'other';
  icon: string;
  color: string;
} {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // 图片文件
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'image',
      icon: '🖼️',
      color: '#4CAF50',
    };
  }
  
  // 文档文件
  if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf', 'odt'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'document',
      icon: '📄',
      color: '#2196F3',
    };
  }
  
  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'archive',
      icon: '📦',
      color: '#FF9800',
    };
  }
  
  // 视频文件
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'video',
      icon: '🎬',
      color: '#E91E63',
    };
  }
  
  // 音频文件
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'audio',
      icon: '🎵',
      color: '#9C27B0',
    };
  }
  
  // 代码文件
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'scss', 'json', 'xml', 'py', 'java', 'cpp', 'c', 'rs', 'go'].includes(extension)) {
    return {
      type: extension.toUpperCase(),
      category: 'code',
      icon: '💻',
      color: '#607D8B',
    };
  }
  
  // 其他文件
  return {
    type: extension.toUpperCase() || 'FILE',
    category: 'other',
    icon: '📁',
    color: '#757575',
  };
}

/**
 * 检查文件是否为图片
 */
export function isImageFile(filename: string): boolean {
  const { category } = getFileTypeInfo(filename);
  return category === 'image';
}

/**
 * 生成文件预览 URL
 */
export function generatePreviewUrl(file: FileListItem): string | null {
  if (!isImageFile(file.name)) {
    return null;
  }
  
  // 这里应该根据实际的文件存储方式生成预览 URL
  // 暂时返回一个占位符
  return `/api/files/${file.id}/preview`;
}

/**
 * 文件排序函数
 */
export function sortFiles(files: FileListItem[], sortConfig: FileSortConfig): FileListItem[] {
  const { field, direction } = sortConfig;
  
  return [...files].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (field) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'size':
        aValue = a.file_size;
        bValue = b.file_size;
        break;
      case 'modified':
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
        break;
      case 'type':
        aValue = getFileTypeInfo(a.name).type;
        bValue = getFileTypeInfo(b.name).type;
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) {
      return direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return direction === 'asc' ? 1 : -1;
    }
    return 0;
  });
}

/**
 * 文件过滤函数
 */
export function filterFiles(files: FileListItem[], filterConfig: FileFilterConfig): FileListItem[] {
  let filteredFiles = files;
  
  // 按文件类型过滤
  if (filterConfig.fileTypes && filterConfig.fileTypes.length > 0) {
    filteredFiles = filteredFiles.filter(file => {
      const { category } = getFileTypeInfo(file.name);
      return filterConfig.fileTypes!.includes(category);
    });
  }
  
  // 按文件大小过滤
  if (filterConfig.minSize !== undefined) {
    filteredFiles = filteredFiles.filter(file => file.file_size >= filterConfig.minSize!);
  }
  
  if (filterConfig.maxSize !== undefined) {
    filteredFiles = filteredFiles.filter(file => file.file_size <= filterConfig.maxSize!);
  }
  
  // 按修改时间过滤
  if (filterConfig.dateRange) {
    const { start, end } = filterConfig.dateRange;
    filteredFiles = filteredFiles.filter(file => {
      const fileDate = new Date(file.updated_at);
      return fileDate >= start && fileDate <= end;
    });
  }
  
  // 按搜索关键词过滤
  if (filterConfig.searchQuery) {
    const query = filterConfig.searchQuery.toLowerCase();
    filteredFiles = filteredFiles.filter(file => 
      file.name.toLowerCase().includes(query)
    );
  }
  
  return filteredFiles;
}

/**
 * 格式化日期
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return '今天 ' + d.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays === 1) {
    return '昨天 ' + d.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return d.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
}

/**
 * 生成唯一 ID
 */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 验证文件名
 */
export function validateFileName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: '文件名不能为空' };
  }
  
  if (name.length > 255) {
    return { valid: false, error: '文件名过长（最大255字符）' };
  }
  
  // 检查非法字符
  const invalidChars = /[<>:"/\\|?*]/;
  if (invalidChars.test(name)) {
    return { valid: false, error: '文件名包含非法字符' };
  }
  
  // 检查保留名称
  const reservedNames = [
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9',
    'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'
  ];
  
  const nameWithoutExt = name.split('.')[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return { valid: false, error: '文件名为系统保留名称' };
  }
  
  return { valid: true };
}

/**
 * 验证目录名
 */
export function validateDirectoryName(name: string): { valid: boolean; error?: string } {
  const result = validateFileName(name);
  
  if (!result.valid) {
    return result;
  }
  
  // 目录名不能包含扩展名
  if (name.includes('.')) {
    return { valid: false, error: '目录名不能包含扩展名' };
  }
  
  return { valid: true };
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

/**
 * 获取文件名（不含扩展名）
 */
export function getFileNameWithoutExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.slice(0, -1).join('.') : filename;
}

/**
 * 检查文件是否可以预览
 */
export function canPreviewFile(filename: string): boolean {
  const { category } = getFileTypeInfo(filename);
  return ['image', 'document'].includes(category);
}

/**
 * 生成文件缩略图 URL
 */
export function generateThumbnailUrl(file: FileListItem, size: number = 150): string | null {
  if (!isImageFile(file.name)) {
    return null;
  }
  
  return `/api/files/${file.id}/thumbnail?size=${size}`;
}

/**
 * 计算文件上传进度
 */
export function calculateUploadProgress(loaded: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
}

/**
 * 格式化上传速度
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond) + '/s';
}

/**
 * 估算剩余上传时间
 */
export function estimateRemainingTime(loaded: number, total: number, speed: number): string {
  if (speed === 0 || loaded >= total) return '0秒';
  
  const remaining = (total - loaded) / speed;
  
  if (remaining < 60) {
    return `${Math.ceil(remaining)}秒`;
  } else if (remaining < 3600) {
    return `${Math.ceil(remaining / 60)}分钟`;
  } else {
    return `${Math.ceil(remaining / 3600)}小时`;
  }
}

/**
 * 检查拖拽数据是否包含文件
 */
export function hasFiles(dataTransfer: DataTransfer): boolean {
  return Array.from(dataTransfer.types).includes('Files');
}

/**
 * 从拖拽事件中提取文件
 */
export function getFilesFromDragEvent(event: React.DragEvent | DragEvent): File[] {
  const files: File[] = [];
  
  if (event.dataTransfer?.files) {
    Array.from(event.dataTransfer.files).forEach(file => {
      files.push(file);
    });
  }
  
  return files;
}

/**
 * 创建文件预览对象
 */
export function createFilePreview(file: File): FilePreview {
  const fileTypeInfo = getFileTypeInfo(file.name);
  return {
    id: generateId(),
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    preview: isImageFile(file.name) ? URL.createObjectURL(file) : undefined,
    isImage: fileTypeInfo.category === 'image',
    isVideo: fileTypeInfo.category === 'video',
    isDocument: fileTypeInfo.category === 'document',
  };
}

/**
 * 清理文件预览 URL
 */
export function revokeFilePreview(preview: FilePreview): void {
  if (preview.preview) {
    URL.revokeObjectURL(preview.preview);
  }
}

/**
 * 批量清理文件预览 URL
 */
export function revokeFilePreviews(previews: FilePreview[]): void {
  previews.forEach(revokeFilePreview);
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    Object.keys(obj).forEach(key => {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    });
    return cloned;
  }
  
  return obj;
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, wait);
    }
  };
}