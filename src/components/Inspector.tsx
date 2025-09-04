import React, { useState } from 'react';
import { Asset } from './Content';
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  DocumentIcon, 
  MusicalNoteIcon,
  TagIcon,
  CalendarIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  PencilIcon,
  TrashIcon
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
 * Inspector组件属性接口
 */
interface InspectorProps {
  /** 选中的资源 */
  selectedAsset?: Asset;
  /** 可用标签列表 */
  availableTags: { id: string; name: string; color: string }[];
  /** 资源备注更新回调 */
  onNotesUpdate: (assetId: string, notes: string) => void;
  /** 标签添加回调 */
  onTagAdd: (assetId: string, tagId: string) => void;
  /** 标签移除回调 */
  onTagRemove: (assetId: string, tagId: string) => void;
  /** 导出回调 */
  onExport: (asset: Asset) => void;
  /** 分享回调 */
  onShare: (asset: Asset) => void;
  /** 删除回调 */
  onDelete: (asset: Asset) => void;
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
 * 格式化日期时间
 */
function formatDateTime(date: Date): string {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 获取资源类型图标
 */
function getAssetTypeIcon(type: AssetType, className = "w-6 h-6") {
  switch (type) {
    case 'image':
      return <PhotoIcon className={className} />;
    case 'video':
      return <VideoCameraIcon className={className} />;
    case 'audio':
      return <MusicalNoteIcon className={className} />;
    case 'document':
      return <DocumentIcon className={className} />;
    default:
      return <DocumentIcon className={className} />;
  }
}

/**
 * 资源预览组件
 */
function AssetPreview({ asset }: { asset: Asset }) {
  if (asset.type === 'image' && asset.thumbnailUrl) {
    return (
      <div className="aspect-square bg-base-200 rounded-lg overflow-hidden">
        <img
          src={asset.thumbnailUrl}
          alt={asset.name}
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  if (asset.type === 'video' && asset.thumbnailUrl) {
    return (
      <div className="aspect-video bg-base-200 rounded-lg overflow-hidden relative">
        <img
          src={asset.thumbnailUrl}
          alt={asset.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 bg-black/50 rounded-full flex items-center justify-center">
            <VideoCameraIcon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    );
  }

  // 默认预览
  return (
    <div className="aspect-square bg-base-200 rounded-lg flex items-center justify-center">
      <div className="text-center">
        {getAssetTypeIcon(asset.type, "w-16 h-16 text-base-content/40")}
        <p className="text-sm text-base-content/60 mt-2">无预览</p>
      </div>
    </div>
  );
}

/**
 * 右侧信息栏组件
 * 显示选中资源的预览和元信息，提供操作按钮
 * @param props Inspector组件属性
 * @returns JSX.Element
 */
export default function Inspector({
  selectedAsset,
  availableTags,
  onNotesUpdate,
  onTagAdd,
  onTagRemove,
  onExport,
  onShare,
  onDelete
}: InspectorProps) {
  const [notes, setNotes] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  // 当选中资源变化时，更新备注
  React.useEffect(() => {
    if (selectedAsset) {
      setNotes(selectedAsset.notes || '');
    }
  }, [selectedAsset]);

  /**
   * 保存备注
   */
  const handleSaveNotes = () => {
    if (selectedAsset) {
      onNotesUpdate(selectedAsset.id, notes);
      setIsEditingNotes(false);
    }
  };

  if (!selectedAsset) {
    return (
      <aside className="w-80 bg-gradient-to-b from-base-100 to-base-200/30 border-l border-base-300/50 flex items-center justify-center shadow-sm">
        <div className="text-center text-base-content/60 p-6">
          <div className="w-24 h-24 bg-base-200 rounded-full flex items-center justify-center mb-6 mx-auto">
            <PhotoIcon className="w-12 h-12 text-base-content/30" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-base-content/70">未选择资源</h3>
          <p className="text-sm text-center max-w-xs">选择一个资源来查看详细信息和进行编辑</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-gradient-to-b from-base-100 to-base-200/30 border-l border-base-300/50 flex flex-col shadow-sm">
      {/* 预览区域 */}
      <div className="p-6 border-b border-base-300/50">
        <div className="mb-6">
          <AssetPreview asset={selectedAsset} />
        </div>
        
        <h3 className="font-bold text-xl mb-3 truncate bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent" title={selectedAsset.name}>
          {selectedAsset.name}
        </h3>
      </div>

      {/* 操作按钮 */}
      <div className="p-6 border-b border-base-300/50">
        <div className="grid grid-cols-3 gap-3">
          <div className="tooltip" data-tip="导出">
            <button
              className="btn btn-sm btn-primary shadow-md hover:shadow-lg transition-shadow w-full"
              onClick={() => onExport(selectedAsset)}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="tooltip" data-tip="分享">
            <button
              className="btn btn-sm btn-secondary shadow-md hover:shadow-lg transition-shadow w-full"
              onClick={() => onShare(selectedAsset)}
            >
              <ShareIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="tooltip" data-tip="删除">
            <button
              className="btn btn-sm btn-error shadow-md hover:shadow-lg transition-shadow w-full"
              onClick={() => onDelete(selectedAsset)}
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* 文件信息 */}
          <div className="card bg-base-100/50 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-base flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                基本信息
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  {getAssetTypeIcon(selectedAsset.type, "w-4 h-4")}
                  <span className="font-medium truncate" title={selectedAsset.name}>
                    {selectedAsset.name}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60 font-medium">类型:</span>
                    <div className="badge badge-primary badge-sm">{selectedAsset.type}</div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base-content/60 font-medium">大小:</span>
                    <span className="font-semibold">{formatFileSize(selectedAsset.size)}</span>
                  </div>
                  
                  {selectedAsset.width && selectedAsset.height && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60 font-medium">宽度:</span>
                        <span className="font-semibold">{selectedAsset.width}px</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-base-content/60 font-medium">高度:</span>
                        <span className="font-semibold">{selectedAsset.height}px</span>
                      </div>
                    </>
                  )}
                  
                  {selectedAsset.duration && (
                    <div className="col-span-2 flex justify-between items-center">
                      <span className="text-base-content/60 font-medium">时长:</span>
                      <span className="font-semibold">{Math.floor(selectedAsset.duration / 60)}:{(selectedAsset.duration % 60).toString().padStart(2, '0')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 日期信息 */}
          <div className="card bg-base-100/50 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-secondary" />
                日期信息
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60 font-medium">创建:</span>
                  <span className="font-semibold">{formatDateTime(selectedAsset.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-base-content/60 font-medium">修改:</span>
                  <span className="font-semibold">{formatDateTime(selectedAsset.modifiedAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 标签 */}
          <div className="card bg-base-100/50 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-accent" />
                标签
              </h4>
              
              {/* 已有标签 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedAsset.tags.map((tagId) => {
                  const tag = availableTags.find(t => t.id === tagId);
                  if (!tag) return null;
                  
                  return (
                    <div
                      key={tagId}
                      className="badge badge-sm gap-1 hover:badge-secondary transition-colors"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}
                    >
                      {tag.name}
                      <button
                        className="btn btn-ghost btn-xs p-0 w-3 h-3 hover:text-error"
                        onClick={() => onTagRemove(selectedAsset.id, tagId)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
              
              {/* 添加标签 */}
              <div className="dropdown dropdown-top w-full">
                <div tabIndex={0} role="button" className="btn btn-ghost btn-sm w-full hover:btn-primary transition-colors">
                  + 添加标签
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-full max-h-40 overflow-y-auto border border-base-300">
                  {availableTags
                    .filter(tag => !selectedAsset.tags.includes(tag.id))
                    .map((tag) => (
                      <li key={tag.id}>
                        <a onClick={() => onTagAdd(selectedAsset.id, tag.id)} className="hover:bg-primary/10">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: tag.color }}
                          />
                          {tag.name}
                        </a>
                      </li>
                    ))
                  }
                </ul>
              </div>
            </div>
          </div>

          {/* 备注 */}
          <div className="card bg-base-100/50 shadow-sm">
            <div className="card-body p-4">
              <h4 className="card-title text-base flex items-center gap-2">
                <PencilIcon className="w-4 h-4 text-warning" />
                备注
              </h4>
              
              {isEditingNotes ? (
                <div className="space-y-3">
                  <textarea
                    className="textarea textarea-bordered textarea-sm w-full h-24 resize-none bg-base-100/70 focus:bg-base-100 transition-colors"
                    placeholder="添加备注..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary btn-sm flex-1 shadow-md hover:shadow-lg transition-shadow"
                      onClick={handleSaveNotes}
                    >
                      保存
                    </button>
                    <button
                      className="btn btn-ghost btn-sm shadow-md hover:shadow-lg transition-shadow"
                      onClick={() => {
                        setIsEditingNotes(false);
                        setNotes(selectedAsset.notes || '');
                      }}
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="min-h-[4rem] p-3 bg-base-200/50 rounded-lg cursor-pointer text-sm hover:bg-base-200 transition-colors border border-dashed border-base-300"
                  onClick={() => setIsEditingNotes(true)}
                >
                  {notes || (
                    <span className="text-base-content/60 italic">点击添加备注...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}