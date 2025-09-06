/**
 * 文件管理器页面组件
 * 
 * 整合目录树、文件列表、文件上传等组件，提供完整的文件管理功能
 */

import React, { useState, useCallback, useEffect } from 'react';
import { DirectoryTree, FileList, FileUpload } from '../components/fileManager';
import { Button, IconButton, SearchInput } from '../components/ui';
import { useFileManager, useFileManagerConfig } from '../hooks/useFileManager';
import type {
  ViewMode,
  FileSortConfig,
  FileFilterConfig,
} from '../types/fileManager';
import './FileManager.css';

/**
 * 文件管理器页面组件
 */
export const FileManager: React.FC = () => {
  // 文件管理器Hook
  const {
    // 状态
    state,
    directoryTree,
    currentFiles,
    uploadQueue,
    selectedFiles,
    expandedDirectories,
    storageStats,
    loading,
    error,
    
    // 操作方法
    loadDirectoryTree,
    loadDirectoryFiles,
    uploadFiles,
    deleteFiles,
    deleteDirectory,
    createDirectory,
    toggleDirectoryExpansion,
    selectFiles,
    clearSelection,
    cancelUpload,
    retryUpload,
    clearCompletedUploads,
    searchFiles,
    getStorageStats,
  } = useFileManager();

  // 从state中获取currentDirectory
  const currentDirectory = state.currentDirectory;

  // 选中的目录 - 默认使用当前目录
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(currentDirectory || null);
  const [showUpload, setShowUpload] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 当currentDirectory变化时，更新selectedDirectory
  useEffect(() => {
    if (currentDirectory && !selectedDirectory) {
      setSelectedDirectory(currentDirectory);
    }
  }, [currentDirectory, selectedDirectory]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortConfig, setSortConfig] = useState<FileSortConfig>({
    field: 'name',
    direction: 'asc',
  });
  const [filterConfig, setFilterConfig] = useState<FileFilterConfig>({
    showHidden: false,
    fileTypes: [],
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 文件管理器配置
  const { config } = useFileManagerConfig({
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip'],
    maxConcurrentUploads: 5,
    enablePreview: true,
    enableThumbnails: true,
  });

  // 初始化加载
  useEffect(() => {
    loadDirectoryTree();
    getStorageStats();
  }, [loadDirectoryTree, getStorageStats]);

  // 加载选中目录的文件
  useEffect(() => {
    if (selectedDirectory) {
      loadDirectoryFiles(selectedDirectory);
    }
  }, [selectedDirectory, loadDirectoryFiles]);

  // 搜索文件
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchFiles(searchQuery, selectedDirectory || undefined);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else if (selectedDirectory) {
      loadDirectoryFiles(selectedDirectory);
    }
  }, [searchQuery, selectedDirectory, searchFiles, loadDirectoryFiles]);

  // 处理目录选择
  const handleDirectorySelect = useCallback((directoryIds: string[]) => {
    if (directoryIds.length > 0) {
      setSelectedDirectory(directoryIds[0]);
      clearSelection();
    }
  }, [clearSelection]);

  // 处理目录创建
  const handleDirectoryCreate = useCallback(async (parentId?: string) => {
    // 这里应该弹出对话框让用户输入目录名，暂时使用默认名称
    const name = prompt('请输入目录名称:') || '新建文件夹';
    try {
      await createDirectory(name, parentId || selectedDirectory || undefined);
      // 重新加载目录树
      await loadDirectoryTree();
    } catch (error) {
      console.error('创建目录失败:', error);
    }
  }, [createDirectory, selectedDirectory, loadDirectoryTree]);

  // 处理目录删除
  const handleDirectoryDelete = useCallback(async (directoryId: string) => {
    try {
      await deleteDirectory(directoryId);
      // 如果删除的是当前选中目录，清空选择
      if (directoryId === selectedDirectory) {
        setSelectedDirectory(null);
      }
      // 重新加载目录树
      await loadDirectoryTree();
    } catch (error) {
      console.error('删除目录失败:', error);
    }
  }, [deleteDirectory, selectedDirectory, loadDirectoryTree]);

  // 处理文件上传
  const handleFileUpload = useCallback((files: File[], directoryId?: string) => {
    const targetDirectory = directoryId || selectedDirectory;
    if (targetDirectory) {
      uploadFiles(files, targetDirectory);
    } else {
      // 如果没有选中目录，提示用户先选择目录
      alert('请先选择一个目录来上传文件');
      console.warn('No directory selected for file upload');
    }
  }, [uploadFiles, selectedDirectory]);

  // 处理文件删除
  const handleFileDelete = useCallback(async (fileIds: string[]) => {
    try {
      await deleteFiles(fileIds);
      // 重新加载当前目录文件
      if (selectedDirectory) {
        await loadDirectoryFiles(selectedDirectory);
      }
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }, [deleteFiles, selectedDirectory, loadDirectoryFiles]);

  // 处理批量删除选中文件
  const handleDeleteSelected = useCallback(async () => {
    if (selectedFiles.size > 0) {
      const fileIds = Array.from(selectedFiles);
      await handleFileDelete(fileIds);
      clearSelection();
    }
  }, [selectedFiles, handleFileDelete, clearSelection]);

  // 处理视图模式切换
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // 处理排序配置变更
  const handleSortChange = useCallback((config: FileSortConfig) => {
    setSortConfig(config);
  }, []);

  // 处理过滤配置变更
  const handleFilterChange = useCallback((config: FileFilterConfig) => {
    setFilterConfig(config);
  }, []);

  // 处理侧边栏折叠
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  // 处理上传区域显示
  const handleUploadToggle = useCallback(() => {
    setShowUpload(prev => !prev);
  }, []);

  // 处理搜索
  const handleSearch = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  // 计算布局类名
  const layoutClasses = [
    'file-manager',
    sidebarCollapsed && 'file-manager--sidebar-collapsed',
    showUpload && 'file-manager--upload-visible',
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClasses}>
      {/* 头部工具栏 */}
      <header className="file-manager__header">
        <div className="file-manager__header-left">
          <IconButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            }
            onClick={handleSidebarToggle}
            aria-label={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          />
          <h1 className="file-manager__title">文件管理器</h1>
        </div>

        <div className="file-manager__header-center">
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            placeholder="搜索文件和文件夹..."
            className="file-manager__search"
          />
        </div>

        <div className="file-manager__header-right">
          {selectedFiles.size > 0 && (
            <>
              <span className="file-manager__selection-count">
                已选择 {selectedFiles.size} 个文件
              </span>
              <Button
                variant="secondary"
                size="small"
                onClick={handleDeleteSelected}
                className="file-manager__delete-selected"
              >
                删除选中
              </Button>
              <Button
                variant="ghost"
                size="small"
                onClick={clearSelection}
              >
                取消选择
              </Button>
            </>
          )}
          
          <Button
            variant="primary"
            size="small"
            onClick={handleUploadToggle}
            className="file-manager__upload-toggle"
          >
            {showUpload ? '隐藏上传' : '上传文件'}
          </Button>
        </div>
      </header>

      {/* 主要内容区域 */}
      <div className="file-manager__content">
        {/* 侧边栏 - 目录树 */}
        <aside className="file-manager__sidebar">
          <div className="file-manager__sidebar-header">
            <h2 className="file-manager__sidebar-title">目录</h2>
            {storageStats && (
              <div className="file-manager__storage-stats">
                <div className="file-manager__storage-used">
                  文件总数: {storageStats.total_files}
                </div>
                <div className="file-manager__storage-used">
                  目录总数: {storageStats.total_directories}
                </div>
                <div className="file-manager__storage-used">
                  总大小: {Math.round(storageStats.total_size / 1024 / 1024)}MB
                </div>
              </div>
            )}
          </div>
          
          <div className="file-manager__sidebar-content">
            <DirectoryTree
              tree={directoryTree}
              currentDirectory={selectedDirectory || undefined}
              expandState={expandedDirectories}
              selectedDirectories={new Set(selectedDirectory ? [selectedDirectory] : [])}
              loading={loading}
              readonly={false}
              onDirectorySelect={handleDirectorySelect}
              onToggleExpand={toggleDirectoryExpansion}
              onCreateDirectory={handleDirectoryCreate}
              onDeleteDirectory={handleDirectoryDelete}
            />
          </div>
        </aside>

        {/* 主内容区域 */}
        <main className="file-manager__main">
          {/* 文件上传区域 */}
          {showUpload && (
            <div className="file-manager__upload-section">
              <FileUpload
                currentDirectory={selectedDirectory || undefined}
                uploadQueue={uploadQueue}
                visible={showUpload}
                readonly={false}
                config={config}
                onFileUpload={handleFileUpload}
                onCancelUpload={cancelUpload}
                onRetryUpload={retryUpload}
                onClearCompleted={clearCompletedUploads}
                onClose={() => setShowUpload(false)}
              />
            </div>
          )}

          {/* 文件列表区域 */}
          <div className="file-manager__file-section">
            <FileList
              files={currentFiles}
              selectedFiles={{
                selectedFiles: selectedFiles,
                selectedDirectories: new Set()
              }}
              viewMode={viewMode}
              sortConfig={sortConfig}
              filterConfig={filterConfig}
              loading={loading}
              readonly={false}
              onFileSelect={selectFiles}
              onFileDelete={handleFileDelete}
              onViewModeChange={handleViewModeChange}
              onSortChange={handleSortChange}
              onFilterChange={handleFilterChange}
            />
          </div>
        </main>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="file-manager__error">
          <div className="file-manager__error-content">
            <span className="file-manager__error-message">{error}</span>
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              }
              size="small"
              variant="ghost"
              onClick={() => {/* 清除错误的逻辑需要在Hook中实现 */}}
              aria-label="关闭错误提示"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;