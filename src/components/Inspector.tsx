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
      <aside className="w-80 bg-base-100 border-l border-base-300 flex items-center justify-center">
        <div className="text-center text-base-content/60">
          <PhotoIcon className="w-16 h-16 mx-auto mb-4" />
          <p>选择一个资源</p>
          <p className="text-sm">查看详细信息</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-base-100 border-l border-base-300 flex flex-col">
      {/* 预览区域 */}
      <div className="p-4 border-b border-base-300">
        <AssetPreview asset={selectedAsset} />
      </div>

      {/* 操作按钮 */}
      <div className="p-4 border-b border-base-300">
        <div className="grid grid-cols-3 gap-2">
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => onExport(selectedAsset)}
            title="导出"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost"
            onClick={() => onShare(selectedAsset)}
            title="分享"
          >
            <ShareIcon className="w-4 h-4" />
          </button>
          <button
            className="btn btn-sm btn-ghost text-error"
            onClick={() => onDelete(selectedAsset)}
            title="删除"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 基本信息 */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* 文件名 */}
          <div>
            <h3 className="font-semibold text-base-content mb-2">基本信息</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                {getAssetTypeIcon(selectedAsset.type, "w-4 h-4")}
                <span className="font-medium truncate" title={selectedAsset.name}>
                  {selectedAsset.name}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-base-content/60">
                <div>类型: {selectedAsset.type}</div>
                <div>大小: {formatFileSize(selectedAsset.size)}</div>
                
                {selectedAsset.width && selectedAsset.height && (
                  <>
                    <div>宽度: {selectedAsset.width}px</div>
                    <div>高度: {selectedAsset.height}px</div>
                  </>
                )}
                
                {selectedAsset.duration && (
                  <div className="col-span-2">
                    时长: {Math.floor(selectedAsset.duration / 60)}:{(selectedAsset.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 日期信息 */}
          <div>
            <h4 className="font-medium text-base-content mb-2 flex items-center gap-1">
              <CalendarIcon className="w-4 h-4" />
              日期信息
            </h4>
            <div className="space-y-1 text-sm text-base-content/60">
              <div>创建: {formatDateTime(selectedAsset.createdAt)}</div>
              <div>修改: {formatDateTime(selectedAsset.modifiedAt)}</div>
            </div>
          </div>

          {/* 标签 */}
          <div>
            <h4 className="font-medium text-base-content mb-2 flex items-center gap-1">
              <TagIcon className="w-4 h-4" />
              标签
            </h4>
            
            {/* 已有标签 */}
            <div className="flex flex-wrap gap-1 mb-2">
              {selectedAsset.tags.map((tagId) => {
                const tag = availableTags.find(t => t.id === tagId);
                if (!tag) return null;
                
                return (
                  <div
                    key={tagId}
                    className="badge badge-sm gap-1"
                    style={{ backgroundColor: tag.color + '20', color: tag.color }}
                  >
                    {tag.name}
                    <button
                      className="btn btn-ghost btn-xs p-0 w-3 h-3"
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
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm w-full">
                + 添加标签
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-full max-h-40 overflow-y-auto">
                {availableTags
                  .filter(tag => !selectedAsset.tags.includes(tag.id))
                  .map((tag) => (
                    <li key={tag.id}>
                      <a onClick={() => onTagAdd(selectedAsset.id, tag.id)}>
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

          {/* 备注 */}
          <div>
            <h4 className="font-medium text-base-content mb-2 flex items-center gap-1">
              <PencilIcon className="w-4 h-4" />
              备注
            </h4>
            
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  className="textarea textarea-bordered textarea-sm w-full h-20 resize-none"
                  placeholder="添加备注..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
                <div className="flex gap-2">
                  <button
                    className="btn btn-primary btn-sm flex-1"
                    onClick={handleSaveNotes}
                  >
                    保存
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
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
                className="min-h-[3rem] p-2 bg-base-200 rounded cursor-pointer text-sm"
                onClick={() => setIsEditingNotes(true)}
              >
                {notes || (
                  <span className="text-base-content/60">点击添加备注...</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}