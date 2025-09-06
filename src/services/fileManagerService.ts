/**
 * 文件管理服务层
 * 
 * 封装与 Tauri 后端的通信，提供类型安全的 API 调用
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  CommandResponse,
  UploadFileRequest,
  UploadFileResponse,
  CreateDirectoryRequest,
  CreateDirectoryResponse,
  DeleteFileCommand,
  DeleteDirectoryCommand,
  GetDirectoryFilesCommand,
  GetFileInfoCommand,
  ReadFileContentCommand,
  DirectoryTreeNode,
  FileListItem,
  StorageStats,
} from '../types/fileManager';

/**
 * 文件管理服务类
 */
export class FileManagerService {
  /**
   * 上传单个文件
   */
  static async uploadFile(
    fileData: Uint8Array,
    originalName: string,
    directoryId?: string
  ): Promise<UploadFileResponse> {
    console.log(`[FileManagerService] 开始上传文件: ${originalName}, 大小: ${fileData.length} bytes, 目录ID: ${directoryId || 'root'}`);
    
    const request: UploadFileRequest = {
      file_data: Array.from(fileData),
      original_name: originalName,
      directory_id: directoryId,
    };

    console.log('[FileManagerService] 调用 Tauri upload_file 命令');
    try {
      const response = await invoke<CommandResponse<UploadFileResponse>>(
        'upload_file',
        { command: request }
      );

      console.log('[FileManagerService] Tauri 响应:', response);
      
      if (!response.success || !response.data) {
        console.error('[FileManagerService] 上传失败:', response.error);
        throw new Error(response.error || 'Upload failed');
      }

      console.log(`[FileManagerService] 上传成功: 文件ID=${response.data.file_id}`);
      return response.data;
    } catch (error) {
      console.error('[FileManagerService] 上传异常:', error);
      throw error;
    }
  }

  /**
   * 批量上传文件
   */
  static async uploadMultipleFiles(
    files: Array<{
      fileData: Uint8Array;
      originalName: string;
      directoryId?: string;
    }>
  ): Promise<UploadFileResponse[]> {
    const requests = files.map(({ fileData, originalName, directoryId }) => ({
      file_data: Array.from(fileData),
      original_name: originalName,
      directory_id: directoryId,
    }));

    const response = await invoke<CommandResponse<UploadFileResponse[]>>(
      'upload_multiple_files',
      { files: requests }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Batch upload failed');
    }

    return response.data;
  }

  /**
   * 创建目录
   */
  static async createDirectory(
    name: string,
    parentId?: string
  ): Promise<CreateDirectoryResponse> {
    console.log('[FileManagerService] 创建目录开始', { name, parentId });
    
    const request: CreateDirectoryRequest = {
      name,
      parent_id: parentId,
    };

    console.log('[FileManagerService] 调用 Tauri create_directory 命令', request);
    const response = await invoke<CommandResponse<CreateDirectoryResponse>>(
      'create_directory',
      { command: request }
    );

    console.log('[FileManagerService] Tauri 响应:', response);
    
    if (!response.success || !response.data) {
      console.error('[FileManagerService] 创建目录失败:', response.error);
      throw new Error(response.error || 'Directory creation failed');
    }

    console.log('[FileManagerService] 创建目录成功:', response.data);
    return response.data;
  }

  /**
   * 删除文件
   */
  static async deleteFile(fileId: string): Promise<void> {
    const command: DeleteFileCommand = {
      file_id: fileId,
    };

    const response = await invoke<CommandResponse<void>>('delete_file', { command });

    if (!response.success) {
      throw new Error(response.error || 'File deletion failed');
    }
  }

  /**
   * 删除目录
   */
  static async deleteDirectory(directoryId: string): Promise<void> {
    const command: DeleteDirectoryCommand = {
      directory_id: directoryId,
    };

    const response = await invoke<CommandResponse<void>>('delete_directory', { command });

    if (!response.success) {
      throw new Error(response.error || 'Directory deletion failed');
    }
  }

  /**
   * 获取目录树
   */
  static async getDirectoryTree(): Promise<DirectoryTreeNode[]> {
    const response = await invoke<CommandResponse<DirectoryTreeNode[]>>(
      'get_directory_tree'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to load directory tree');
    }

    return response.data;
  }

  /**
   * 获取目录中的文件列表
   */
  static async getDirectoryFiles(directoryId: string): Promise<FileListItem[]> {
    const command: GetDirectoryFilesCommand = {
      directory_id: directoryId,
    };

    const response = await invoke<CommandResponse<FileListItem[]>>(
      'get_directory_files',
      { command }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to load directory files');
    }

    return response.data;
  }

  /**
   * 获取文件信息
   */
  static async getFileInfo(fileId: string): Promise<FileListItem | null> {
    const command: GetFileInfoCommand = {
      file_id: fileId,
    };

    const response = await invoke<CommandResponse<FileListItem | null>>(
      'get_file_info',
      { command }
    );

    if (!response.success) {
      throw new Error(response.error || 'Failed to get file info');
    }

    return response.data || null;
  }

  /**
   * 搜索文件
   */
  static async searchFiles(
    query: string,
    directoryId?: string
  ): Promise<FileListItem[]> {
    const response = await invoke<CommandResponse<FileListItem[]>>(
      'search_files',
      {
        query,
        directory_id: directoryId,
      }
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Search failed');
    }

    return response.data;
  }

  /**
   * 获取存储统计信息
   */
  static async getStorageStats(): Promise<StorageStats> {
    const response = await invoke<CommandResponse<StorageStats>>(
      'get_storage_stats'
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to get storage stats');
    }

    return response.data;
  }

  /**
   * 验证文件类型
   */
  static async validateFileType(filename: string): Promise<boolean> {
    const response = await invoke<CommandResponse<boolean>>(
      'validate_file_type',
      { filename }
    );

    if (!response.success) {
      throw new Error(response.error || 'File type validation failed');
    }

    return response.data || false;
  }

  /**
   * 读取文件内容
   */
  static async readFileContent(fileId: string): Promise<Uint8Array> {
    const command: ReadFileContentCommand = {
      file_id: fileId,
    };
    
    const response = await invoke<CommandResponse<number[]>>('read_file_content', { command });
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to read file content');
    }

    return new Uint8Array(response.data);
  }

  /**
   * 生成文件预览 URL（如果支持）
   */
  static async generatePreviewUrl(file: FileListItem): Promise<string | null> {
    if (!FileUtils.isImageFile(file.name)) {
      return null;
    }
    
    try {
      // 读取文件内容
      const fileContent = await FileManagerService.readFileContent(file.id);
      
      // 创建 Blob URL
      const blob = new Blob([fileContent], { type: file.mime_type });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Failed to generate preview URL:', error);
      return null;
    }
  }
}

/**
 * 文件读取工具函数
 */
export class FileUtils {
  /**
   * 将 File 对象转换为 Uint8Array
   */
  static async fileToUint8Array(file: File): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 获取文件类型信息
   */
  static getFileTypeInfo(filename: string, mimeType?: string): {
    type: 'image' | 'video' | 'document' | 'archive' | 'other';
    icon: string;
    color: string;
  } {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    
    // 图片类型
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension)) {
      return {
        type: 'image',
        icon: '🖼️',
        color: 'text-green-500',
      };
    }
    
    // 视频类型
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return {
        type: 'video',
        icon: '🎥',
        color: 'text-red-500',
      };
    }
    
    // 文档类型
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'md'].includes(extension)) {
      return {
        type: 'document',
        icon: '📄',
        color: 'text-blue-500',
      };
    }
    
    // 压缩文件
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
      return {
        type: 'archive',
        icon: '📦',
        color: 'text-yellow-500',
      };
    }
    
    // 其他类型
    return {
      type: 'other',
      icon: '📁',
      color: 'text-gray-500',
    };
  }

  /**
   * 检查是否为图片文件
   */
  static isImageFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension);
  }

  /**
   * 检查是否为视频文件
   */
  static isVideoFile(filename: string): boolean {
    const extension = filename.split('.').pop()?.toLowerCase() || '';
    return ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension);
  }



  /**
   * 验证文件名
   */
  static validateFileName(filename: string): { valid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
      return { valid: false, error: '文件名不能为空' };
    }
    
    if (filename.length > 255) {
      return { valid: false, error: '文件名过长（最大255字符）' };
    }
    
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      return { valid: false, error: '文件名包含非法字符' };
    }
    
    return { valid: true };
  }

  /**
   * 生成唯一的上传 ID
   */
  static generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 计算上传进度
   */
  static calculateProgress(loaded: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((loaded / total) * 100);
  }

  /**
   * 格式化日期时间
   */
  static formatDateTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return '今天 ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays === 1) {
      return '昨天 ' + date.toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  }
}

/**
 * 错误处理工具
 */
export class FileManagerError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'FileManagerError';
  }

  static fromResponse(response: CommandResponse<any>): FileManagerError {
    return new FileManagerError(
      response.error || 'Unknown error',
      'COMMAND_ERROR',
      response
    );
  }
}