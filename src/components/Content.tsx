import React from 'react';
import { ViewType } from './Header';
import { 
  AdjustmentsHorizontalIcon, 
  ArrowsUpDownIcon,
  PhotoIcon,
  VideoCameraIcon,
  DocumentIcon,
  MusicalNoteIcon
} from '@heroicons/react/24/outline';

/**
 * 资源类型枚举
 */
export enum AssetType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
  Other = 'other'
}

/**
 * 排序字段枚举
 */
export type SortField = 'name' | 'date' | 'size' | 'type';

/**
 * 排序方向枚举
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 资源项接口
 */
export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  thumbnailUrl?: string;
  previewUrl?: string;
  tags: string[];
  folderId?: string;
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  colorSpace?: string;
  sampleRate?: number;
  bitRate?: number;
  frameRate?: number;
  notes?: string;
}

/**
 * Content组件属性接口
 */
interface ContentProps {
  /** 资源列表 */
  assets: Asset[];
  /** 当前视图类型 */
  viewType: ViewType;
  /** 当前排序字段 */
  sortField: SortField;
  /** 当前排序方向 */
  sortDirection: SortDirection;
  /** 选中的资源ID列表 */
  selectedAssetIds: string[];
  /** 是否正在加载 */
  loading: boolean;
  /** 排序变更回调 */
  onSortChange: (field: SortField, direction: SortDirection) => void;
  /** 资源选择回调 */
  onAssetSelect: (assetId: string, multiSelect?: boolean) => void;
  /** 资源双击回调 */
  onAssetDoubleClick: (asset: Asset) => void;
}

/**
 * 获取资源类型图标
 */
function getAssetTypeIcon(type: AssetType) {
  switch (type) {
    case AssetType.Image:
      return <PhotoIcon className="w-5 h-5" />;
    case AssetType.Video:
      return <VideoCameraIcon className="w-5 h-5" />;
    case AssetType.Audio:
      return <MusicalNoteIcon className="w-5 h-5" />;
    case AssetType.Document:
      return <DocumentIcon className="w-5 h-5" />;
    default:
      return <DocumentIcon className="w-5 h-5" />;
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * 资源网格项组件
 */
function AssetGridItem({ 
  asset, 
  isSelected, 
  onSelect, 
  onDoubleClick 
}: { 
  asset: Asset; 
  isSelected: boolean; 
  onSelect: (multiSelect?: boolean) => void; 
  onDoubleClick: () => void; 
}) {
  return (
    <div
      className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5' 
          : 'border-transparent hover:border-base-300 hover:bg-base-200/50'
      }`}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      {/* 缩略图区域 */}
      <div className="aspect-square bg-base-200 rounded-t-lg overflow-hidden">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/40">
            {getAssetTypeIcon(asset.type)}
          </div>
        )}
      </div>

      {/* 信息区域 */}
      <div className="p-2">
        <div className="text-sm font-medium truncate" title={asset.name}>
          {asset.name}
        </div>
        <div className="text-xs text-base-content/60 mt-1">
          {formatFileSize(asset.size)}
        </div>
      </div>

      {/* 选中状态指示器 */}
      {isSelected && (
        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <svg className="w-3 h-3 text-primary-content" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </div>
  );
}

/**
 * 资源列表项组件
 */
function AssetListItem({ 
  asset, 
  isSelected, 
  onSelect, 
  onDoubleClick 
}: { 
  asset: Asset; 
  isSelected: boolean; 
  onSelect: (multiSelect?: boolean) => void; 
  onDoubleClick: () => void; 
}) {
  return (
    <tr
      className={`cursor-pointer hover:bg-base-200 ${
        isSelected ? 'bg-primary/5' : ''
      }`}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      <td className="w-12">
        <div className="w-8 h-8 bg-base-200 rounded overflow-hidden">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base-content/40">
              {getAssetTypeIcon(asset.type)}
            </div>
          )}
        </div>
      </td>
      <td className="font-medium">{asset.name}</td>
      <td className="text-sm text-base-content/60">{asset.type}</td>
      <td className="text-sm text-base-content/60">{formatFileSize(asset.size)}</td>
      <td className="text-sm text-base-content/60">{formatDate(asset.modifiedAt)}</td>
    </tr>
  );
}

/**
 * 主内容区组件
 * 展示缩略图网格或列表，包含排序/筛选工具栏
 * @param props Content组件属性
 * @returns JSX.Element
 */
export default function Content({
  assets,
  viewType,
  sortField,
  sortDirection,
  selectedAssetIds,
  loading,
  onSortChange,
  onAssetSelect,
  onAssetDoubleClick
}: ContentProps) {
  /**
   * 处理排序点击
   */
  const handleSortClick = (field: SortField) => {
    const newDirection = 
      sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(field, newDirection);
  };

  return (
    <main className="flex-1 flex flex-col bg-base-50">
      {/* 工具栏 */}
      <div className="h-12 bg-base-100 border-b border-base-300 flex items-center px-4 gap-4">
        {/* 筛选按钮 */}
        <button className="btn btn-ghost btn-sm">
          <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
          筛选
        </button>

        {/* 排序选择 */}
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
            <ArrowsUpDownIcon className="w-4 h-4 mr-1" />
            排序: {sortField === 'name' ? '名称' : sortField === 'date' ? '日期' : sortField === 'size' ? '大小' : '类型'}
            {sortDirection === 'desc' ? ' ↓' : ' ↑'}
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
            <li><a onClick={() => handleSortClick('name')}>名称</a></li>
            <li><a onClick={() => handleSortClick('date')}>日期</a></li>
            <li><a onClick={() => handleSortClick('size')}>大小</a></li>
            <li><a onClick={() => handleSortClick('type')}>类型</a></li>
          </ul>
        </div>

        {/* 资源统计 */}
        <div className="flex-1" />
        <div className="text-sm text-base-content/60">
          共 {assets.length} 个资源
          {selectedAssetIds.length > 0 && (
            <span className="ml-2">已选择 {selectedAssetIds.length} 个</span>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          /* 加载状态 */
          <div className="flex items-center justify-center h-64">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        ) : assets.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center h-64 text-base-content/60">
            <PhotoIcon className="w-16 h-16 mb-4" />
            <p className="text-lg">暂无资源</p>
            <p className="text-sm">请添加一些资源文件</p>
          </div>
        ) : viewType === 'grid' ? (
          /* 网格视图 */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {assets.map((asset) => (
              <AssetGridItem
                key={asset.id}
                asset={asset}
                isSelected={selectedAssetIds.includes(asset.id)}
                onSelect={(multiSelect) => onAssetSelect(asset.id, multiSelect)}
                onDoubleClick={() => onAssetDoubleClick(asset)}
              />
            ))}
          </div>
        ) : (
          /* 列表视图 */
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th></th>
                  <th 
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => handleSortClick('name')}
                  >
                    名称 {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => handleSortClick('type')}
                  >
                    类型 {sortField === 'type' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => handleSortClick('size')}
                  >
                    大小 {sortField === 'size' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-200"
                    onClick={() => handleSortClick('date')}
                  >
                    修改日期 {sortField === 'date' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => (
                  <AssetListItem
                    key={asset.id}
                    asset={asset}
                    isSelected={selectedAssetIds.includes(asset.id)}
                    onSelect={(multiSelect) => onAssetSelect(asset.id, multiSelect)}
                    onDoubleClick={() => onAssetDoubleClick(asset)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}