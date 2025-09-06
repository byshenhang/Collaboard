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
      className={`
        group relative cursor-pointer select-none
        bg-base-200/60 backdrop-blur-sm
        border border-base-300/30
        transition-all
        hover:bg-base-200/80 hover:border-base-300/50
        hover:scale-[1.03] hover:-translate-y-0.5
        ${isSelected ? 'ring-2 ring-primary/50 bg-base-200/80 border-primary/40' : ''}
      `}
      style={{
        borderRadius: 'var(--rounded-lg)',
        boxShadow: isSelected 
          ? 'var(--shadow-glow), var(--shadow-card-hover)' 
          : 'var(--shadow-card)',
        background: isSelected
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(59, 130, 246, 0.03) 100%), var(--gradient-card)'
          : 'var(--gradient-card)',
        transition: 'all var(--transition-smooth)'
      }}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      <div 
        className="relative aspect-square overflow-hidden group-hover:scale-[1.02]"
        style={{
          borderRadius: 'calc(var(--rounded-lg) - 2px)',
          transition: 'transform var(--transition-smooth)'
        }}
      >
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-110 group-hover:brightness-110"
          />
        ) : (
          <div className="text-base-content/40 text-5xl transition-all duration-300 group-hover:text-base-content/60 group-hover:scale-110">
            {getAssetTypeIcon(asset.type)}
          </div>
        )}
        
        {/* 渐变遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* 悬停时的光晕效果 */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

        {/* 选中状态指示器 */}
        {isSelected && (
          <div 
            className="absolute top-2 right-2 w-4 h-4 bg-primary rounded-full flex items-center justify-center z-20"
            style={{
              boxShadow: 'var(--shadow-glow)',
              transition: 'all var(--transition-fast)'
            }}
          >
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        )}

      {/* 文件信息 */}
      <div className="p-2.5 space-y-1.5">
        <div 
          className="text-xs font-medium text-base-content/85 truncate group-hover:text-base-content leading-tight"
          style={{
            transition: 'color var(--transition-fast)'
          }}
          title={asset.name}
        >
          {asset.name}
        </div>
        
        <div className="flex items-center justify-between text-xs text-base-content/55">
          <span className="truncate flex-1 mr-1.5 text-xs">
            {formatFileSize(asset.size)}
          </span>
          
          {/* 类型徽章 */}
          <div 
            className={`
              px-1.5 py-0.5 rounded text-xs font-medium shrink-0
              ${asset.type === AssetType.Image ? 'bg-blue-500/15 text-blue-400' :
                asset.type === AssetType.Video ? 'bg-purple-500/15 text-purple-400' :
                asset.type === AssetType.Audio ? 'bg-green-500/15 text-green-400' :
                asset.type === AssetType.Document ? 'bg-orange-500/15 text-orange-400' :
                'bg-gray-500/15 text-gray-400'}
            `}
            style={{
              borderRadius: 'var(--radius-sm)',
              transition: 'all var(--transition-fast)'
            }}
          >
            {asset.type}
          </div>
        </div>
      </div>
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
      className={`group cursor-pointer ${
        isSelected 
          ? 'bg-gradient-to-r from-primary/20 to-primary/10' 
          : 'hover:bg-base-200/50'
      }`}
      style={{
        transition: 'all var(--transition-fast)',
        boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
      }}
      onClick={(e) => onSelect(e.ctrlKey || e.metaKey)}
      onDoubleClick={onDoubleClick}
    >
      <td className="w-12">
        <div className="w-10 h-10 bg-gradient-to-br from-base-200/50 to-base-300/30 overflow-hidden" style={{borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-soft)'}}>
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
      <td className="font-semibold">
        <div className="flex items-center gap-2">
          {asset.name}
          {isSelected && (
            <div className="badge badge-primary badge-xs">已选择</div>
          )}
        </div>
      </td>
      <td>
        <div className="badge badge-outline badge-sm">{asset.type}</div>
      </td>
      <td className="text-sm text-base-content/60 font-medium">{formatFileSize(asset.size)}</td>
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
    <main className="flex-1 flex flex-col bg-gradient-to-br from-base-100 to-base-200/10">
      {/* 工具栏 */}
      <div className="h-14 border-b border-base-300/30 bg-base-100/90 backdrop-blur-md flex items-center justify-between px-6" style={{boxShadow: 'var(--shadow-soft)'}}>
        <div className="flex items-center gap-4">
          {/* 筛选按钮 */}
          <button className="btn btn-outline btn-sm gap-2 hover:shadow-md" style={{transition: 'all var(--transition-fast)'}}>
            <AdjustmentsHorizontalIcon className="w-4 h-4" />
            筛选
          </button>
          
          {/* 资源统计 */}
          <div className="stats stats-horizontal bg-base-100/60 backdrop-blur-sm" style={{boxShadow: 'var(--shadow-soft)'}}>
            <div className="stat py-2 px-4">
              <div className="stat-value text-lg text-primary">{assets.length}</div>
              <div className="stat-desc text-xs">个资源</div>
            </div>
            {selectedAssetIds.length > 0 && (
              <div className="stat py-2 px-4">
                <div className="stat-value text-lg text-secondary">{selectedAssetIds.length}</div>
                <div className="stat-desc text-xs">已选择</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 排序选择 */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-sm btn-outline gap-2">
              <ArrowsUpDownIcon className="w-4 h-4" />
              <span className="text-sm">
                排序: {sortField === 'name' ? '名称' : sortField === 'date' ? '日期' : sortField === 'size' ? '大小' : '类型'}
                {sortDirection === 'desc' ? ' ↓' : ' ↑'}
              </span>
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300">
              <li><a onClick={() => handleSortClick('name')} className={sortField === 'name' ? 'active' : ''}>名称</a></li>
              <li><a onClick={() => handleSortClick('date')} className={sortField === 'date' ? 'active' : ''}>日期</a></li>
              <li><a onClick={() => handleSortClick('size')} className={sortField === 'size' ? 'active' : ''}>大小</a></li>
              <li><a onClick={() => handleSortClick('type')} className={sortField === 'type' ? 'active' : ''}>类型</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        {/* 减少内边距以增加内容显示区域 */}
        {loading ? (
          /* 加载状态 */
          <div className="flex flex-col items-center justify-center h-64">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm text-base-content/60 mt-4">加载中...</p>
          </div>
        ) : assets.length === 0 ? (
          /* 空状态 */
          <div className="flex flex-col items-center justify-center h-64 text-base-content/50">
            <div className="w-20 h-20 bg-base-200 rounded-full flex items-center justify-center mb-6">
              <PhotoIcon className="w-10 h-10 text-base-content/30" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-base-content/70">暂无资源</h3>
            <p className="text-sm text-center max-w-md">请添加一些资源文件来开始管理您的数字资产</p>
          </div>
        ) : viewType === 'grid' ? (
          /* 网格视图 */
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 2xl:grid-cols-11 gap-3">
            {/* 优化后的网格布局：更紧凑的间距，更多列数以匹配Eagle风格 */}
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
          </div>
        ) : (
          /* 列表视图 */
          <div className="flex-1 overflow-y-auto">
            <div className="overflow-x-auto">
            <table className="table table-sm table-zebra bg-base-100/90 backdrop-blur-sm" style={{borderRadius: 'var(--rounded-lg)', boxShadow: 'var(--shadow-soft)'}}>
              <thead>
                <tr className="bg-base-200/70">
                  <th></th>
                  <th 
                    className="cursor-pointer hover:bg-base-300/50"
                    style={{transition: 'background-color var(--transition-fast)'}}
                    onClick={() => handleSortClick('name')}
                  >
                    名称 {sortField === 'name' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-300/50"
                    style={{transition: 'background-color var(--transition-fast)'}}
                    onClick={() => handleSortClick('type')}
                  >
                    类型 {sortField === 'type' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-300/50"
                    style={{transition: 'background-color var(--transition-fast)'}}
                    onClick={() => handleSortClick('size')}
                  >
                    大小 {sortField === 'size' && (sortDirection === 'desc' ? '↓' : '↑')}
                  </th>
                  <th 
                    className="cursor-pointer hover:bg-base-300/50"
                    style={{transition: 'background-color var(--transition-fast)'}}
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
          </div>
        )}
      </div>
    </main>
  );
}