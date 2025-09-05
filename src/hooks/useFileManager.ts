/**
 * 文件管理器 Hook
 * 
 * 提供文件管理的状态管理和业务逻辑
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { FileManagerService, FileUtils as ServiceFileUtils } from '../services/fileManagerService';
import { generateId } from '../utils/fileUtils';
import type {
  FileManagerState,
  FileListItem,
  UploadItem,
  ViewMode,
  FileSortConfig,
  FileFilterConfig,
  StorageStats,
  UseFileManagerReturn,
} from '../types/fileManager';

/**
 * 初始状态
 */
const initialState: FileManagerState = {
  directoryTree: [],
  currentDirectory: undefined,
  files: [],
  viewMode: 'grid',
  sortConfig: {
    field: 'name',
    direction: 'asc',
  },
  filterConfig: {
    fileTypes: [],
  },
  expandState: {},
  selectionState: {
    selectedFiles: new Set(),
    selectedDirectories: new Set(),
  },
  uploadQueue: [],
  isUploading: false,
  loading: false,
};

/**
 * 文件管理器 Hook
 */
export function useFileManager(): UseFileManagerReturn {
  const [state, setState] = useState<FileManagerState>(initialState);
  const uploadQueueRef = useRef<Map<string, UploadItem>>(new Map());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  /**
   * 更新状态的辅助函数
   */
  const updateState = useCallback((updates: Partial<FileManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * 设置错误状态
   */
  const setError = useCallback((error: string | Error) => {
    const errorMessage = error instanceof Error ? error.message : error;
    updateState({ error: errorMessage, loading: false });
  }, [updateState]);

  /**
   * 加载目录树
   */
  const loadDirectoryTree = useCallback(async () => {
    try {
      updateState({ loading: true, error: undefined });
      const tree = await FileManagerService.getDirectoryTree();
      updateState({ directoryTree: tree, loading: false });
    } catch (error) {
      setError(error as Error);
    }
  }, [updateState, setError]);

  /**
   * 加载目录文件
   */
  const loadDirectoryFiles = useCallback(async (directoryId: string) => {
    try {
      updateState({ loading: true, error: undefined });
      const files = await FileManagerService.getDirectoryFiles(directoryId);
      updateState({ 
        files, 
        currentDirectory: directoryId, 
        loading: false 
      });
    } catch (error) {
      setError(error as Error);
    }
  }, [updateState, setError]);

  /**
   * 刷新当前目录
   */
  const refreshCurrentDirectory = useCallback(async () => {
    if (state.currentDirectory) {
      await loadDirectoryFiles(state.currentDirectory);
    }
  }, [state.currentDirectory, loadDirectoryFiles]);

  /**
   * 创建上传项
   */
  const createUploadItem = useCallback((file: File, directoryId?: string): UploadItem => {
    const id = generateId();
    return {
      id,
      file,
      status: 'pending',
      progress: 0,
    };
  }, []);

  /**
   * 更新上传项状态
   */
  const updateUploadItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    const item = uploadQueueRef.current.get(id);
    if (item) {
      const updatedItem = { ...item, ...updates };
      uploadQueueRef.current.set(id, updatedItem);
      
      // 更新状态中的上传队列
      setState(prev => ({
        ...prev,
        uploadQueue: Array.from(uploadQueueRef.current.values()),
      }));
    }
  }, []);

  /**
   * 上传单个文件
   */
  const uploadSingleFile = useCallback(async (
    uploadItem: UploadItem, 
    directoryId?: string
  ): Promise<void> => {
    const { id, file } = uploadItem;
    
    try {
      // 更新状态为上传中
      updateUploadItem(id, { status: 'uploading', progress: 0 });
      
      // 验证文件类型
      const isValidType = await FileManagerService.validateFileType(file.name);
      if (!isValidType) {
        throw new Error(`不支持的文件类型: ${file.name}`);
      }
      
      // 读取文件数据
      const fileData = await ServiceFileUtils.fileToUint8Array(file);
      
      // 模拟上传进度（实际应用中应该有真实的进度回调）
      const progressInterval = setInterval(() => {
        const currentItem = uploadQueueRef.current.get(id);
        if (currentItem && currentItem.progress < 90) {
          updateUploadItem(id, { progress: currentItem.progress + 10 });
        }
      }, 100);
      
      // 执行上传
      const result = await FileManagerService.uploadFile(
        fileData,
        file.name,
        directoryId
      );
      
      clearInterval(progressInterval);
      
      // 更新为成功状态
      updateUploadItem(id, {
        status: 'completed',
        progress: 100,
        result,
      });
      
    } catch (error) {
      // 更新为错误状态
      updateUploadItem(id, {
        status: 'error',
        progress: 0,
        error: error instanceof Error ? error.message : '上传失败',
      });
      throw error;
    }
  }, [updateUploadItem]);

  /**
   * 上传文件
   */
  const uploadFiles = useCallback(async (
    files: File[], 
    directoryId?: string
  ): Promise<void> => {
    if (files.length === 0) return;
    
    try {
      updateState({ isUploading: true, error: undefined });
      
      // 创建上传项
      const uploadItems = files.map(file => createUploadItem(file, directoryId));
      
      // 添加到上传队列
      uploadItems.forEach(item => {
        uploadQueueRef.current.set(item.id, item);
      });
      
      updateState({ uploadQueue: Array.from(uploadQueueRef.current.values()) });
      
      // 并发上传（限制并发数）
      const maxConcurrent = 3;
      const uploadPromises: Promise<void>[] = [];
      
      for (let i = 0; i < uploadItems.length; i += maxConcurrent) {
        const batch = uploadItems.slice(i, i + maxConcurrent);
        const batchPromises = batch.map(item => 
          uploadSingleFile(item, directoryId).catch(error => {
            console.error(`Upload failed for ${item.file.name}:`, error);
          })
        );
        uploadPromises.push(...batchPromises);
        
        // 等待当前批次完成再继续
        await Promise.all(batchPromises);
      }
      
      await Promise.all(uploadPromises);
      
      // 刷新当前目录
      if (directoryId === state.currentDirectory) {
        await refreshCurrentDirectory();
      }
      
      updateState({ isUploading: false });
      
    } catch (error) {
      updateState({ isUploading: false });
      setError(error as Error);
    }
  }, [createUploadItem, uploadSingleFile, state.currentDirectory, refreshCurrentDirectory, updateState, setError]);

  /**
   * 删除文件
   */
  const deleteFiles = useCallback(async (fileIds: string[]): Promise<void> => {
    try {
      updateState({ loading: true, error: undefined });
      
      // 并发删除
      await Promise.all(
        fileIds.map(id => FileManagerService.deleteFile(id))
      );
      
      // 刷新当前目录
      await refreshCurrentDirectory();
      
      // 清除选择状态
      setState(prev => ({
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedFiles: new Set(
            Array.from(prev.selectionState.selectedFiles).filter(
              id => !fileIds.includes(id)
            )
          ),
        },
        loading: false,
      }));
      
    } catch (error) {
      setError(error as Error);
    }
  }, [refreshCurrentDirectory, setError]);

  /**
   * 删除目录
   */
  const deleteDirectories = useCallback(async (directoryIds: string[]): Promise<void> => {
    try {
      updateState({ loading: true, error: undefined });
      
      // 并发删除
      await Promise.all(
        directoryIds.map(id => FileManagerService.deleteDirectory(id))
      );
      
      // 重新加载目录树
      await loadDirectoryTree();
      
      // 如果当前目录被删除，清除当前目录
      if (directoryIds.includes(state.currentDirectory || '')) {
        updateState({ currentDirectory: undefined, files: [] });
      }
      
      // 清除选择状态
      setState(prev => ({
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedDirectories: new Set(
            Array.from(prev.selectionState.selectedDirectories).filter(
              id => !directoryIds.includes(id)
            )
          ),
        },
        loading: false,
      }));
      
    } catch (error) {
      setError(error as Error);
    }
  }, [loadDirectoryTree, state.currentDirectory, updateState, setError]);

  /**
   * 创建目录
   */
  const createDirectory = useCallback(async (
    name: string, 
    parentId?: string
  ): Promise<void> => {
    try {
      updateState({ loading: true, error: undefined });
      
      await FileManagerService.createDirectory(name, parentId);
      
      // 重新加载目录树
      await loadDirectoryTree();
      
      updateState({ loading: false });
      
    } catch (error) {
      setError(error as Error);
    }
  }, [loadDirectoryTree, updateState, setError]);

  /**
   * 设置视图模式
   */
  const setViewMode = useCallback((mode: ViewMode) => {
    updateState({ viewMode: mode });
  }, [updateState]);

  /**
   * 设置排序配置
   */
  const setSortConfig = useCallback((config: FileSortConfig) => {
    updateState({ sortConfig: config });
  }, [updateState]);

  /**
   * 设置过滤配置
   */
  const setFilterConfig = useCallback((config: FileFilterConfig) => {
    updateState({ filterConfig: config });
  }, [updateState]);

  /**
   * 切换目录展开状态
   */
  const toggleDirectoryExpand = useCallback((directoryId: string) => {
    setState(prev => ({
      ...prev,
      expandState: {
        ...prev.expandState,
        [directoryId]: !prev.expandState[directoryId],
      },
    }));
  }, []);

  /**
   * 选择文件
   */
  const selectFiles = useCallback((fileIds: string[], append = false) => {
    setState(prev => {
      const newSelectedFiles = append 
        ? new Set([...prev.selectionState.selectedFiles, ...fileIds])
        : new Set(fileIds);
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedFiles: newSelectedFiles,
          lastSelected: fileIds[fileIds.length - 1],
        },
      };
    });
  }, []);

  /**
   * 选择目录
   */
  const selectDirectories = useCallback((directoryIds: string[], append = false) => {
    setState(prev => {
      const newSelectedDirectories = append 
        ? new Set([...prev.selectionState.selectedDirectories, ...directoryIds])
        : new Set(directoryIds);
      
      return {
        ...prev,
        selectionState: {
          ...prev.selectionState,
          selectedDirectories: newSelectedDirectories,
          lastSelected: directoryIds[directoryIds.length - 1],
        },
      };
    });
  }, []);

  /**
   * 清除选择
   */
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectionState: {
        selectedFiles: new Set(),
        selectedDirectories: new Set(),
      },
    }));
  }, []);

  /**
   * 搜索文件
   */
  const searchFiles = useCallback(async (
    query: string, 
    directoryId?: string
  ): Promise<FileListItem[]> => {
    try {
      return await FileManagerService.searchFiles(query, directoryId);
    } catch (error) {
      setError(error as Error);
      return [];
    }
  }, [setError]);

  /**
   * 获取存储统计
   */
  const getStorageStats = useCallback(async (): Promise<StorageStats> => {
    try {
      return await FileManagerService.getStorageStats();
    } catch (error) {
      setError(error as Error);
      return {
        total_files: 0,
        total_directories: 0,
        total_size: 0,
        largest_file_size: 0,
      };
    }
  }, [setError]);

  /**
   * 清理上传队列
   */
  const clearUploadQueue = useCallback(() => {
    uploadQueueRef.current.clear();
    updateState({ uploadQueue: [] });
  }, [updateState]);

  /**
   * 移除上传项
   */
  const removeUploadItem = useCallback((id: string) => {
    uploadQueueRef.current.delete(id);
    updateState({ uploadQueue: Array.from(uploadQueueRef.current.values()) });
  }, [updateState]);

  /**
   * 初始化时加载目录树
   */
  useEffect(() => {
    loadDirectoryTree();
  }, [loadDirectoryTree]);

  /**
   * 清理函数
   */
  useEffect(() => {
    return () => {
      // 取消所有进行中的上传
      abortControllersRef.current.forEach(controller => {
        controller.abort();
      });
      abortControllersRef.current.clear();
    };
  }, []);

  return {
    state,
    // 状态属性（直接暴露以便解构）
    directoryTree: state.directoryTree,
    currentFiles: state.files,
    uploadQueue: state.uploadQueue,
    selectedFiles: state.selectionState.selectedFiles,
    expandedDirectories: state.expandState,
    storageStats: undefined, // 需要异步获取
    loading: state.loading,
    error: state.error,
    
    loadDirectoryTree,
    loadDirectoryFiles,
    refreshCurrentDirectory,
    uploadFiles,
    deleteFiles,
    deleteDirectories,
    deleteDirectory: async (directoryId: string) => {
      await deleteDirectories([directoryId]);
    },
    createDirectory,
    setViewMode,
    setSortConfig,
    setFilterConfig,
    toggleDirectoryExpand,
    toggleDirectoryExpansion: toggleDirectoryExpand, // 别名
    selectFiles,
    selectDirectories,
    clearSelection,
    
    // 上传操作
    cancelUpload: (uploadId: string) => {
      const controller = abortControllersRef.current.get(uploadId);
      if (controller) {
        controller.abort();
        abortControllersRef.current.delete(uploadId);
      }
      updateUploadItem(uploadId, { status: 'cancelled' });
    },
    retryUpload: async (uploadId: string) => {
      const item = uploadQueueRef.current.get(uploadId);
      if (item && item.status === 'error') {
        updateUploadItem(uploadId, { status: 'pending', progress: 0, error: undefined });
        await uploadSingleFile(item);
      }
    },
    clearCompletedUploads: () => {
      const completedIds: string[] = [];
      uploadQueueRef.current.forEach((item, id) => {
        if (item.status === 'completed' || item.status === 'cancelled') {
          completedIds.push(id);
        }
      });
      completedIds.forEach(id => {
        uploadQueueRef.current.delete(id);
      });
      updateState({ uploadQueue: Array.from(uploadQueueRef.current.values()) });
    },
    
    searchFiles,
    getStorageStats,
    // 额外的工具方法
    clearUploadQueue,
    removeUploadItem,
  };
}

/**
 * 文件管理器配置 Hook
 */
export function useFileManagerConfig(initialConfig?: Partial<{
  maxFileSize: number;
  allowedFileTypes: string[];
  maxConcurrentUploads: number;
  enablePreview: boolean;
  enableThumbnails: boolean;
  defaultViewMode: ViewMode;
  showHiddenFiles: boolean;
  thumbnailSize: number;
  enableDragDrop: boolean;
  enableContextMenu: boolean;
  enableKeyboardShortcuts: boolean;
}>) {
  const [config, setConfig] = useState({
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: [
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg',
      'pdf', 'txt', 'md', 'doc', 'docx',
      'zip', 'rar', '7z'
    ],
    maxConcurrentUploads: 3,
    defaultViewMode: 'grid' as ViewMode,
    showHiddenFiles: false,
    thumbnailSize: 150,
    enableDragDrop: true,
    enableContextMenu: true,
    enableKeyboardShortcuts: true,
    enablePreview: true,
    enableThumbnails: true,
    ...initialConfig, // 合并初始配置
  });

  const updateConfig = useCallback((updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return { config, updateConfig };
}