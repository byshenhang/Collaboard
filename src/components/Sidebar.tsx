import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon, FolderIcon, TagIcon } from '@heroicons/react/24/outline';

/**
 * 文件夹节点接口
 */
export interface FolderNode {
  id: string;
  name: string;
  children?: FolderNode[];
  isExpanded?: boolean;
  assetCount?: number;
}

/**
 * 标签接口
 */
export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
}

/**
 * Sidebar组件属性接口
 */
interface SidebarProps {
  /** 文件夹树数据 */
  folders: FolderNode[];
  /** 标签列表 */
  tags: Tag[];
  /** 当前选中的文件夹ID */
  selectedFolderId?: string;
  /** 当前选中的标签ID列表 */
  selectedTagIds: string[];
  /** 文件夹选择回调 */
  onFolderSelect: (folderId: string) => void;
  /** 文件夹展开/收起回调 */
  onFolderToggle: (folderId: string) => void;
  /** 标签选择回调 */
  onTagToggle: (tagId: string) => void;
}

/**
 * 文件夹树节点组件
 */
function FolderTreeNode({
  node,
  level = 0,
  selectedFolderId,
  onFolderSelect,
  onFolderToggle
}: {
  node: FolderNode;
  level?: number;
  selectedFolderId?: string;
  onFolderSelect: (folderId: string) => void;
  onFolderToggle: (folderId: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedFolderId === node.id;

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-base-200 ${
          isSelected ? 'bg-primary/10 text-primary' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => onFolderSelect(node.id)}
      >
        {/* 展开/收起图标 */}
        <button
          className="w-4 h-4 flex items-center justify-center hover:bg-base-300 rounded"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              onFolderToggle(node.id);
            }
          }}
        >
          {hasChildren ? (
            node.isExpanded ? (
              <ChevronDownIcon className="w-3 h-3" />
            ) : (
              <ChevronRightIcon className="w-3 h-3" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </button>

        {/* 文件夹图标 */}
        <FolderIcon className="w-4 h-4 text-warning" />

        {/* 文件夹名称 */}
        <span className="flex-1 text-sm truncate">{node.name}</span>

        {/* 资源数量 */}
        {node.assetCount !== undefined && (
          <span className="text-xs text-base-content/60 bg-base-200 px-1 rounded">
            {node.assetCount}
          </span>
        )}
      </div>

      {/* 子文件夹 */}
      {hasChildren && node.isExpanded && (
        <div>
          {node.children!.map((child) => (
            <FolderTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedFolderId={selectedFolderId}
              onFolderSelect={onFolderSelect}
              onFolderToggle={onFolderToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 左侧边栏组件
 * 显示文件夹树和标签列表
 * @param props Sidebar组件属性
 * @returns JSX.Element
 */
export default function Sidebar({
  folders,
  tags,
  selectedFolderId,
  selectedTagIds,
  onFolderSelect,
  onFolderToggle,
  onTagToggle
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');

  return (
    <aside className="w-80 bg-base-100 border-r border-base-300 flex flex-col">
      {/* 标签页切换 */}
      <div className="tabs tabs-boxed m-2">
        <button
          className={`tab tab-sm flex-1 ${
            activeTab === 'folders' ? 'tab-active' : ''
          }`}
          onClick={() => setActiveTab('folders')}
        >
          <FolderIcon className="w-4 h-4 mr-1" />
          文件夹
        </button>
        <button
          className={`tab tab-sm flex-1 ${
            activeTab === 'tags' ? 'tab-active' : ''
          }`}
          onClick={() => setActiveTab('tags')}
        >
          <TagIcon className="w-4 h-4 mr-1" />
          标签
        </button>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'folders' ? (
          /* 文件夹树 */
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderTreeNode
                key={folder.id}
                node={folder}
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                onFolderToggle={onFolderToggle}
              />
            ))}
          </div>
        ) : (
          /* 标签列表 */
          <div className="space-y-2">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer hover:bg-base-200 ${
                    isSelected ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => onTagToggle(tag.id)}
                >
                  {/* 标签颜色指示器 */}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />

                  {/* 标签名称 */}
                  <span className="flex-1 text-sm truncate">{tag.name}</span>

                  {/* 资源数量 */}
                  <span className="text-xs text-base-content/60 bg-base-200 px-1 rounded">
                    {tag.count}
                  </span>

                  {/* 选中状态 */}
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}