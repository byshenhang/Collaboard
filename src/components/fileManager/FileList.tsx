/**
 * 文件列表组件
 * 
 * 提供文件管理系统的文件列表展示和操作功能
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Button, IconButton, SearchInput } from '../ui';
import type {
  FileListItem,
  ViewMode,
  FileSortConfig,
  FileFilterConfig,
  FileSelectionState,
} from '../../types/fileManager';
import {
  getFileTypeInfo,
  isImageFile,
  canPreviewFile,
  getFileNameWithoutExtension,
  getFileExtension,
  formatFileSize,
  formatDate,
  filterFiles,
  sortFiles,
} from '../../utils/fileUtils';
import { FileManagerService } from '../../services/fileManagerService';
import './FileList.css';

export interface FileListProps {
  /** 文件列表数据 */
  files: FileListItem[];
  /** 当前目录ID */
  currentDirectory?: string;
  /** 视图模式 */
  viewMode: ViewMode;
  /** 排序配置 */
  sortConfig: FileSortConfig;
  /** 过滤配置 */
  filterConfig: FileFilterConfig;
  /** 选中的文件 */
  selectedFiles: FileSelectionState;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否显示隐藏文件 */
  showHidden?: boolean;
  /** 是否支持多选 */
  multiSelect?: boolean;
  /** 是否支持预览 */
  enablePreview?: boolean;
  /** 文件点击回调 */
  onFileClick?: (file: FileListItem) => void;
  /** 文件双击回调 */
  onFileDoubleClick?: (file: FileListItem) => void;
  /** 文件选择回调 */
  onFileSelect?: (fileIds: string[], append?: boolean) => void;
  /** 视图模式切换回调 */
  onViewModeChange?: (mode: ViewMode) => void;
  /** 排序配置变更回调 */
  onSortChange?: (config: FileSortConfig) => void;
  /** 过滤配置变更回调 */
  onFilterChange?: (config: FileFilterConfig) => void;
  /** 文件下载回调 */
  onFileDownload?: (file: FileListItem) => void;
  /** 文件删除回调 */
  onFileDelete?: (fileIds: string[]) => void;
  /** 文件重命名回调 */
  onFileRename?: (fileId: string, newName: string) => void;
  /** 文件预览回调 */
  onFilePreview?: (file: FileListItem) => void;
  /** 右键菜单回调 */
  onContextMenu?: (event: React.MouseEvent, file: FileListItem) => void;
  /** 拖拽开始回调 */
  onDragStart?: (event: React.DragEvent, files: FileListItem[]) => void;
  /** 拖拽结束回调 */
  onDragEnd?: (event: React.DragEvent) => void;
}

/**
 * 文件项组件
 */
interface FileItemProps {
  file: FileListItem;
  viewMode: ViewMode;
  isSelected: boolean;
  readonly?: boolean;
  enablePreview?: boolean;
  onFileClick?: (file: FileListItem) => void;
  onFileDoubleClick?: (file: FileListItem) => void;
  onFileSelect?: (fileId: string, append?: boolean) => void;
  onFileDownload?: (file: FileListItem) => void;
  onFileDelete?: (fileId: string) => void;
  onFileRename?: (fileId: string, newName: string) => void;
  onFilePreview?: (file: FileListItem) => void;
  onContextMenu?: (event: React.MouseEvent, file: FileListItem) => void;
  onDragStart?: (event: React.DragEvent, file: FileListItem) => void;
}

const FileItem: React.FC<FileItemProps> = ({
  file,
  viewMode,
  isSelected,
  readonly = false,
  enablePreview = true,
  onFileClick,
  onFileDoubleClick,
  onFileSelect,
  onFileDownload,
  onFileDelete,
  onFileRename,
  onFilePreview,
  onContextMenu,
  onDragStart,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(file.name);
  const [isHovered, setIsHovered] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileTypeInfo = getFileTypeInfo(file.name);
    const isImage = isImageFile(file.name);
    const canPreview = enablePreview && canPreviewFile(file.name);

  // 生成预览URL
  useEffect(() => {
    if (isImage && file.path) {
      FileManagerService.generatePreviewUrl(file).then((url: string | null) => {
        setPreviewUrl(url);
      }).catch((error: any) => {
        console.error('Failed to generate preview URL:', error);
        setPreviewUrl(null);
      });
      
      return () => {
        // Cleanup will be handled when component unmounts
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
      };
    }
  }, [file.path, isImage]);

  // 处理文件点击
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 点击：多选
      onFileSelect?.(file.id, true);
    } else if (event.shiftKey) {
      // Shift + 点击：范围选择（暂时简化为单选）
      onFileSelect?.(file.id, false);
    } else {
      // 普通点击：选中文件
      onFileClick?.(file);
      onFileSelect?.(file.id, false);
    }
  }, [file, onFileClick, onFileSelect]);

  // 处理文件双击
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onFileDoubleClick?.(file);
  }, [file, onFileDoubleClick]);

  // 处理右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu?.(event, file);
  }, [file, onContextMenu]);

  // 处理拖拽开始
  const handleDragStart = useCallback((event: React.DragEvent) => {
    onDragStart?.(event, file);
  }, [file, onDragStart]);

  // 处理重命名
  const handleRename = useCallback(() => {
    if (!readonly) {
      setIsRenaming(true);
      setRenamingValue(getFileNameWithoutExtension(file.name));
    }
  }, [file.name, readonly]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingValue.trim() && renamingValue !== getFileNameWithoutExtension(file.name)) {
      const extension = getFileExtension(file.name);
      const newName = extension ? `${renamingValue.trim()}.${extension}` : renamingValue.trim();
      onFileRename?.(file.id, newName);
    }
    setIsRenaming(false);
  }, [file.id, file.name, renamingValue, onFileRename]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setRenamingValue(getFileNameWithoutExtension(file.name));
  }, [file.name]);

  const handleRenameKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleRenameSubmit();
    } else if (event.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSubmit, handleRenameCancel]);

  // 处理操作按钮
  const handleDownload = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onFileDownload?.(file);
  }, [file, onFileDownload]);

  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onFileDelete?.(file.id);
  }, [file.id, onFileDelete]);

  const handlePreview = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onFilePreview?.(file);
  }, [file, onFilePreview]);

  const itemClasses = [
    'file-item',
    `file-item--${viewMode}`,
    isSelected && 'file-item--selected',
    isHovered && 'file-item--hovered',
    readonly && 'file-item--readonly',
  ].filter(Boolean).join(' ');

  const renderIcon = () => {
    if (isImage && previewUrl) {
      return (
        <div className="file-item__thumbnail">
          <img src={previewUrl} alt={file.name} loading="lazy" />
        </div>
      );
    }

    return (
      <div className="file-item__icon" style={{ color: fileTypeInfo.color }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d={fileTypeInfo.icon} />
        </svg>
      </div>
    );
  };

  const renderName = () => {
    if (isRenaming) {
      return (
        <input
          className="file-item__rename-input"
          value={renamingValue}
          onChange={(e) => setRenamingValue(e.target.value)}
          onBlur={handleRenameSubmit}
          onKeyDown={handleRenameKeyDown}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      );
    }

    return (
      <span
        className="file-item__name"
        onDoubleClick={handleRename}
        title={file.name}
      >
        {file.name}
      </span>
    );
  };

  const renderActions = () => {
    if (readonly || !isHovered || isRenaming) return null;

    return (
      <div className="file-item__actions">
        {canPreview && (
          <IconButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            }
            size="small"
            variant="ghost"
            onClick={handlePreview}
            aria-label="预览"
            title="预览"
          />
        )}
        <IconButton
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
          size="small"
          variant="ghost"
          onClick={handleDownload}
          aria-label="下载"
          title="下载"
        />
        <IconButton
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
            </svg>
          }
          size="small"
          variant="ghost"
          onClick={handleRename}
          aria-label="重命名"
          title="重命名"
        />
        <IconButton
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <polyline points="3,6 5,6 21,6" />
              <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
            </svg>
          }
          size="small"
          variant="ghost"
          onClick={handleDelete}
          aria-label="删除"
          title="删除"
        />
      </div>
    );
  };

  if (viewMode === 'grid') {
    return (
      <div
        className={itemClasses}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        draggable={!readonly}
        onDragStart={handleDragStart}
      >
        {renderIcon()}
        <div className="file-item__info">
          {renderName()}
          <div className="file-item__meta">
            <span className="file-item__size">{formatFileSize(file.size)}</span>
            <span className="file-item__type">{fileTypeInfo.type}</span>
          </div>
        </div>
        {renderActions()}
      </div>
    );
  }

  return (
    <div
      className={itemClasses}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable={!readonly}
      onDragStart={handleDragStart}
    >
      {renderIcon()}
      <div className="file-item__info">
        {renderName()}
      </div>
      <div className="file-item__size">{formatFileSize(file.size)}</div>
      <div className="file-item__type">{fileTypeInfo.type}</div>
      <div className="file-item__modified">{formatDate(file.modified_at)}</div>
      {renderActions()}
    </div>
  );
};

/**
 * 文件列表组件
 */
export const FileList: React.FC<FileListProps> = ({
  files,
  viewMode,
  sortConfig,
  filterConfig,
  selectedFiles,
  loading = false,
  readonly = false,
  showHidden = false,
  multiSelect = true,
  enablePreview = true,
  onFileClick,
  onFileDoubleClick,
  onFileSelect,
  onViewModeChange,
  onSortChange,
  onFilterChange,
  onFileDownload,
  onFileDelete,
  onFileRename,
  onFilePreview,
  onContextMenu,
  onDragStart,
  onDragEnd,
}) => {
  const [searchQuery, setSearchQuery] = useState(filterConfig.searchQuery || '');
  const containerRef = useRef<HTMLDivElement>(null);

  // 过滤和排序文件
  const processedFiles = useMemo(() => {
    let result = [...files];

    // 过滤隐藏文件
    if (!showHidden) {
      result = result.filter(file => !file.name.startsWith('.'));
    }

    // 应用过滤器
    result = filterFiles(result, filterConfig);

    // 应用排序
    result = sortFiles(result, sortConfig);

    return result;
  }, [files, showHidden, filterConfig, sortConfig]);

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    onFilterChange?.({
      ...filterConfig,
      searchQuery: query.trim(),
    });
  }, [filterConfig, onFilterChange]);

  // 处理排序
  const handleSort = useCallback((field: string) => {
    const newDirection = sortConfig.field === field && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSortChange?.({
      field: field as any,
      direction: newDirection,
    });
  }, [sortConfig, onSortChange]);

  // 处理全选
  const handleSelectAll = useCallback(() => {
    const allFileIds = processedFiles.map(file => file.id);
    const isAllSelected = allFileIds.every(id => selectedFiles.selectedFiles.has(id));
    
    if (isAllSelected) {
      onFileSelect?.([], false);
    } else {
      onFileSelect?.(allFileIds, false);
    }
  }, [processedFiles, selectedFiles, onFileSelect]);

  // 处理批量删除
  const handleBatchDelete = useCallback(() => {
    if (selectedFiles.selectedFiles.size > 0) {
      onFileDelete?.(Array.from(selectedFiles.selectedFiles));
    }
  }, [selectedFiles, onFileDelete]);

  // 处理容器点击（取消选择）
  const handleContainerClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onFileSelect?.([], false);
    }
  }, [onFileSelect]);

  const selectedCount = selectedFiles.selectedFiles.size;
  const totalCount = processedFiles.length;
  const isAllSelected = totalCount > 0 && selectedCount === totalCount;
  const isPartialSelected = selectedCount > 0 && selectedCount < totalCount;

  if (loading) {
    return (
      <div className="file-list file-list--loading">
        <div className="file-list__loading">
          <div className="file-list__loading-spinner" />
          <span>加载文件列表...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list">
      {/* 工具栏 */}
      <div className="file-list__toolbar">
        <div className="file-list__toolbar-left">
          <SearchInput
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索文件..."
            size="small"
          />
          
          {multiSelect && selectedCount > 0 && (
            <div className="file-list__selection-info">
              <span>已选择 {selectedCount} 个文件</span>
              {!readonly && (
                <Button
                  variant="danger"
                  size="small"
                  onClick={handleBatchDelete}
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3,6 5,6 21,6" />
                      <path d="m19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2" />
                    </svg>
                  }
                >
                  删除
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="file-list__toolbar-right">
          <div className="file-list__view-modes">
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              }
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => onViewModeChange?.('list')}
              aria-label="列表视图"
              title="列表视图"
            />
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
              }
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="small"
              onClick={() => onViewModeChange?.('grid')}
              aria-label="网格视图"
              title="网格视图"
            />
          </div>
        </div>
      </div>

      {/* 列表头部（仅列表视图） */}
      {viewMode === 'list' && (
        <div className="file-list__header">
          {multiSelect && (
            <div className="file-list__header-cell file-list__header-cell--checkbox">
              <input
                type="checkbox"
                checked={isAllSelected}
                ref={(input) => {
                  if (input) input.indeterminate = isPartialSelected;
                }}
                onChange={handleSelectAll}
                aria-label="全选"
              />
            </div>
          )}
          <div
            className="file-list__header-cell file-list__header-cell--name"
            onClick={() => handleSort('name')}
          >
            名称
            {sortConfig.field === 'name' && (
              <span className={`file-list__sort-icon file-list__sort-icon--${sortConfig.direction}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </span>
            )}
          </div>
          <div
            className="file-list__header-cell file-list__header-cell--size"
            onClick={() => handleSort('size')}
          >
            大小
            {sortConfig.field === 'size' && (
              <span className={`file-list__sort-icon file-list__sort-icon--${sortConfig.direction}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </span>
            )}
          </div>
          <div
            className="file-list__header-cell file-list__header-cell--type"
            onClick={() => handleSort('type')}
          >
            类型
            {sortConfig.field === 'type' && (
              <span className={`file-list__sort-icon file-list__sort-icon--${sortConfig.direction}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </span>
            )}
          </div>
          <div
            className="file-list__header-cell file-list__header-cell--modified"
            onClick={() => handleSort('modified')}
          >
            修改时间
            {sortConfig.field === 'modified' && (
              <span className={`file-list__sort-icon file-list__sort-icon--${sortConfig.direction}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="6,9 12,15 18,9" />
                </svg>
              </span>
            )}
          </div>
          <div className="file-list__header-cell file-list__header-cell--actions">操作</div>
        </div>
      )}

      {/* 文件列表内容 */}
      <div
        ref={containerRef}
        className={`file-list__content file-list__content--${viewMode}`}
        onClick={handleContainerClick}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDragEnd}
      >
        {processedFiles.length === 0 ? (
          <div className="file-list__empty">
            <svg className="file-list__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
            <p className="file-list__empty-text">
              {filterConfig.searchQuery ? '未找到匹配的文件' : '此目录为空'}
            </p>
          </div>
        ) : (
          processedFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              viewMode={viewMode}
              isSelected={selectedFiles.selectedFiles.has(file.id)}
              readonly={readonly}
              enablePreview={enablePreview}
              onFileClick={onFileClick}
              onFileDoubleClick={onFileDoubleClick}
              onFileSelect={(fileId, append) => {
                if (multiSelect && append) {
                  const newSelection = new Set(selectedFiles.selectedFiles);
                  if (newSelection.has(fileId)) {
                    newSelection.delete(fileId);
                  } else {
                    newSelection.add(fileId);
                  }
                  onFileSelect?.(Array.from(newSelection), false);
                } else {
                  onFileSelect?.([fileId], false);
                }
              }}
              onFileDownload={onFileDownload}
              onFileDelete={(fileId) => onFileDelete?.([fileId])}
              onFileRename={onFileRename}
              onFilePreview={onFilePreview}
              onContextMenu={onContextMenu}
              onDragStart={(event, file) => onDragStart?.(event, [file])}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default FileList;