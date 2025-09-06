import React, { useMemo } from 'react';
import { ViewType } from './Header';
import { useFileManagerContext } from '../contexts/FileManagerContext';
import type { FileListItem, FileSortField, SortDirection } from '../types/fileManager';
import { 
  AdjustmentsHorizontalIcon, 
  ArrowsUpDownIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon,
  FolderIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

/**
 * 增强版Content组件属性接口
 */
interface EnhancedContentProps {
  /** 当前视图类型 */
  viewType: ViewType;
  /** 当前排序字段 */
  sortField: FileSortField;
  /** 当前排序方向 */
  sortDirection: SortDirection;
  /** 选中的文件ID列表 */
  selectedFileIds: string[];
  /** 当前选中的目录ID */
  selectedDirectoryId?: string;
  /** 排序变更回调 */
  onSortChange: (field: FileSortField, direction: SortDirection) => void;
  /** 文件选择回调 */
  onFileSelect: (fileId: string, multiSelect?: boolean) => void;
  /** 文件双击回调 */
  onFileDoubleClick: (file: FileListItem) => void;
}

/**
 * 获取文件类型图标和颜色
 */
function getFileTypeInfo(file: FileListItem): {
  icon: React.ReactNode;
  color: string;
  type: string;
} {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const mimeType = file.mime_type.toLowerCase();

  // 图片文件
  if (mimeType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(extension)) {
    return {
      icon: <PhotoIcon className="w-5 h-5" />,
      color: 'text-green-500',
      type: 'image'
    };
  }

  // 视频文件
  if (mimeType.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
    return {
      icon: <VideoCameraIcon className="w-5 h-5" />,
      color: 'text-red-500',
      type: 'video'
    };
  }

  // 音频文件
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(extension)) {
    return {
      icon: <MusicalNoteIcon className="w-5 h-5" />,
      color: 'text-purple-500',
      type: 'audio'
    };
  }

  // 压缩文件
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(extension)) {
    return {
      icon: <ArchiveBoxIcon className="w-5 h-5" />,
      color: 'text-orange-500',
      type: 'archive'
    };
  }

  // 文档文件
  return {
    icon: <DocumentIcon className="w-5 h-5" />,
    color: 'text-blue-500',
    type: 'document'
  };
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * 格式化日期
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 文件网格项组件
 */
function FileGridItem({ 
  file, 
  isSelected, 
  onSelect, 
  onDoubleClick 
}: { 
  file: FileListItem; 
  isSelected: boolean; 
  onSelect: (multiSelect?: boolean) => void; 
  onDoubleClick: () => void; 
}) {
  const { icon, color, type } = getFileTypeInfo(file);

  return (
    <div
      className={`group relative bg-base-100 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-primary shadow-lg scale-105' 
          : 'border-base-300/50 hover:border-primary/50 hover:shadow-md'
      }`}
      style={{
        aspectRatio: '1',
        boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
      }}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      {/* 选中状态指示器 */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
          <div className="w-3 h-3 bg-white rounded-full" />
        </div>
      )}

      {/* 文件内容区域 */}
      <div className="h-full flex flex-col p-4">
        {/* 文件图标区域 */}
        <div className="flex-1 flex items-center justify-center mb-3">
          {type === 'image' ? (
            <div className="w-16 h-16 bg-base-200 rounded-lg flex items-center justify-center overflow-hidden">
              {/* 这里可以添加缩略图预览 */}
              <div className={`${color}`}>
                {icon}
              </div>
            </div>
          ) : (
            <div className={`w-16 h-16 flex items-center justify-center ${color}`}>
              {icon}
            </div>
          )}
        </div>

        {/* 文件信息 */}
        <div className="space-y-1">
          <h3 className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </h3>
          <p className="text-xs text-base-content/60">
            {formatFileSize(file.file_size)}
          </p>
          <p className="text-xs text-base-content/50">
            {formatDate(file.created_at)}
          </p>
        </div>
      </div>

      {/* 悬停效果 */}
      <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );
}

/**
 * 文件列表项组件
 */
function FileListItem({ 
  file, 
  isSelected, 
  onSelect, 
  onDoubleClick 
}: { 
  file: FileListItem; 
  isSelected: boolean; 
  onSelect: (multiSelect?: boolean) => void; 
  onDoubleClick: () => void; 
}) {
  const { icon, color } = getFileTypeInfo(file);

  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-lg border transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'bg-primary/10 border-primary' 
          : 'bg-base-100 border-base-300/50 hover:bg-base-200/50 hover:border-primary/30'
      }`}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      {/* 选中状态 */}
      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
        isSelected ? 'bg-primary border-primary' : 'border-base-content/30'
      }`}>
        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
      </div>

      {/* 文件图标 */}
      <div className={color}>
        {icon}
      </div>

      {/* 文件名 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={file.name}>
          {file.name}
        </p>
      </div>

      {/* 文件大小 */}
      <div className="w-20 text-right">
        <p className="text-sm text-base-content/70">
          {formatFileSize(file.file_size)}
        </p>
      </div>

      {/* 修改日期 */}
      <div className="w-32 text-right">
        <p className="text-sm text-base-content/70">
          {formatDate(file.updated_at)}
        </p>
      </div>
    </div>
  );
}

/**
 * 增强版内容区域组件
 * 显示真实文件系统的文件
 */
export default function EnhancedContent({
  viewType,
  sortField,
  sortDirection,
  selectedFileIds,
  selectedDirectoryId,
  onSortChange,
  onFileSelect,
  onFileDoubleClick
}: EnhancedContentProps) {
  // 使用文件管理器上下文
  const {
    currentFiles,
    loading,
    error
  } = useFileManagerContext();

  // 排序和过滤文件
  const sortedFiles = useMemo(() => {
    let filteredFiles = [...currentFiles];

    // 根据选中的目录过滤文件（如果需要的话，这里可以添加额外的过滤逻辑）
    // 注意：currentFiles 已经是当前目录的文件了

    // 排序
    filteredFiles.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime();
          bValue = new Date(b.updated_at).getTime();
          break;
        case 'modified':
          aValue = new Date(a.modified_at || a.updated_at).getTime();
          bValue = new Date(b.modified_at || b.updated_at).getTime();
          break;
        case 'type':
          aValue = a.mime_type;
          bValue = b.mime_type;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filteredFiles;
  }, [currentFiles, sortField, sortDirection]);

  // 排序选项
  const sortOptions: { field: FileSortField; label: string }[] = [
    { field: 'name', label: '名称' },
    { field: 'size', label: '大小' },
    { field: 'created_at', label: '创建时间' },
    { field: 'updated_at', label: '修改时间' },
    { field: 'type', label: '类型' }
  ];

  const handleSortFieldChange = (field: FileSortField) => {
    if (field === sortField) {
      // 如果点击的是当前排序字段，则切换排序方向
      onSortChange(field, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 如果点击的是新字段，则使用升序
      onSortChange(field, 'asc');
    }
  };

  return (
    <main className="flex-1 flex flex-col bg-base-50/30 overflow-hidden">
      {/* 工具栏 */}
      <div className="flex items-center justify-between px-6 py-4 bg-base-100/80 backdrop-blur-sm border-b border-base-300/30">
        <div className="flex items-center gap-4">
          {/* 文件统计 */}
          <div className="text-sm text-base-content/70">
            {loading ? (
              <span>加载中...</span>
            ) : (
              <span>
                {sortedFiles.length} 个文件
                {selectedFileIds.length > 0 && (
                  <span className="ml-2 text-primary font-medium">
                    已选择 {selectedFileIds.length} 个
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* 排序控制 */}
        <div className="flex items-center gap-2">
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-2">
              <ArrowsUpDownIcon className="w-4 h-4" />
              排序: {sortOptions.find(opt => opt.field === sortField)?.label}
              {sortDirection === 'desc' && ' ↓'}
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              {sortOptions.map((option) => (
                <li key={option.field}>
                  <button
                    className={`flex items-center justify-between ${
                      sortField === option.field ? 'active' : ''
                    }`}
                    onClick={() => handleSortFieldChange(option.field)}
                  >
                    <span>{option.label}</span>
                    {sortField === option.field && (
                      <span className="text-xs">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-6">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="flex items-center gap-3">
              <div className="loading loading-spinner loading-md"></div>
              <span className="text-base-content/70">加载文件中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="alert alert-error max-w-md">
              <span>{error}</span>
            </div>
          </div>
        )}

        {!loading && !error && sortedFiles.length === 0 && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <FolderIcon className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/70 mb-2">此目录为空</p>
              <p className="text-sm text-base-content/50">拖拽文件到这里开始上传</p>
            </div>
          </div>
        )}

        {!loading && !error && sortedFiles.length > 0 && (
          <div className={`${
            viewType === 'grid' 
              ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4' 
              : 'space-y-2'
          }`}>
            {sortedFiles.map((file) => {
              const isSelected = selectedFileIds.includes(file.id);
              
              if (viewType === 'grid') {
                return (
                  <FileGridItem
                    key={file.id}
                    file={file}
                    isSelected={isSelected}
                    onSelect={(multiSelect) => onFileSelect(file.id, multiSelect)}
                    onDoubleClick={() => onFileDoubleClick(file)}
                  />
                );
              } else {
                return (
                  <FileListItem
                    key={file.id}
                    file={file}
                    isSelected={isSelected}
                    onSelect={(multiSelect) => onFileSelect(file.id, multiSelect)}
                    onDoubleClick={() => onFileDoubleClick(file)}
                  />
                );
              }
            })}
          </div>
        )}
      </div>
    </main>
  );
}