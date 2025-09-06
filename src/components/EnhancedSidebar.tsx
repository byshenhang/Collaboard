import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronRightIcon, 
  ChevronDownIcon, 
  FolderIcon, 
  TagIcon,
  PlusIcon,
  TrashIcon,
  FolderPlusIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import { useFileManagerContext } from '../contexts/FileManagerContext';
import type { DirectoryTreeNode } from '../types/fileManager';

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
 * 右键菜单项接口
 */
interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<any>;
  onClick: () => void;
  disabled?: boolean;
  separator?: boolean;
}

/**
 * 右键菜单组件
 */
function ContextMenu({ 
  x, 
  y, 
  items, 
  onClose 
}: { 
  x: number; 
  y: number; 
  items: ContextMenuItem[]; 
  onClose: () => void; 
}) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-base-100 border border-base-300 rounded-lg shadow-lg py-1 min-w-48"
      style={{
        left: x,
        top: y,
        boxShadow: 'var(--shadow-soft)'
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="border-t border-base-300 my-1" />;
        }
        
        return (
          <button
            key={item.id}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-base-200 flex items-center gap-2 ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
            onClick={() => {
              if (!item.disabled) {
                item.onClick();
                onClose();
              }
            }}
            disabled={item.disabled}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * 增强版Sidebar组件属性接口
 */
interface EnhancedSidebarProps {
  /** 标签列表 */
  tags: Tag[];
  /** 当前选中的目录ID */
  selectedDirectoryId?: string;
  /** 当前选中的标签ID列表 */
  selectedTagIds: string[];
  /** 目录选择回调 */
  onDirectorySelect: (directoryId: string) => void;
  /** 标签选择回调 */
  onTagToggle: (tagId: string) => void;
}

/**
 * 目录树节点组件
 */
function DirectoryTreeNode({
  node,
  level = 0,
  selectedDirectoryId,
  expandedDirectories,
  onDirectorySelect,
  onToggleExpand,
  onContextMenu
}: {
  node: DirectoryTreeNode;
  level?: number;
  selectedDirectoryId?: string;
  expandedDirectories: { [key: string]: boolean };
  onDirectorySelect: (directoryId: string) => void;
  onToggleExpand: (directoryId: string) => void;
  onContextMenu: (event: React.MouseEvent, directoryId: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedDirectories[node.id] || false;
  const isSelected = selectedDirectoryId === node.id;

  const handleClick = useCallback(() => {
    onDirectorySelect(node.id);
  }, [node.id, onDirectorySelect]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleExpand(node.id);
    }
  }, [hasChildren, node.id, onToggleExpand]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContextMenu(e, node.id);
  }, [node.id, onContextMenu]);

  return (
    <div>
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group ${
          isSelected 
            ? 'bg-gradient-to-r from-primary/25 to-primary/15 text-primary border-l-2 border-primary' 
            : 'hover:bg-base-200/80'
        }`}
        style={{
          paddingLeft: `${level * 16 + 8}px`,
          transition: 'all var(--transition-fast)',
          boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
        }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* 展开/收起图标 */}
        <button
          className="w-4 h-4 flex items-center justify-center hover:bg-base-300/80 rounded"
          style={{transition: 'background-color var(--transition-fast)'}}
          onClick={handleToggle}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-3 h-3 text-base-content/70" />
            ) : (
              <ChevronRightIcon className="w-3 h-3 text-base-content/70" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </button>

        {/* 文件夹图标 */}
        <FolderIcon className={`w-4 h-4 ${
          isSelected ? 'text-primary' : 'text-warning group-hover:text-warning/80'
        }`} style={{transition: 'color var(--transition-fast)'}} />

        {/* 文件夹名称 */}
        <span className="flex-1 text-sm truncate font-medium">{node.name}</span>

        {/* 文件数量 */}
        {node.file_count !== undefined && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isSelected 
              ? 'bg-primary/25 text-primary' 
              : 'bg-base-content/10 text-base-content/60 group-hover:bg-base-content/20'
          }`} style={{transition: 'all var(--transition-fast)'}}>
            {node.file_count}
          </span>
        )}
      </div>

      {/* 子目录 */}
      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <DirectoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedDirectoryId={selectedDirectoryId}
              expandedDirectories={expandedDirectories}
              onDirectorySelect={onDirectorySelect}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 增强版左侧边栏组件
 * 集成真实文件系统目录树和右键菜单功能
 */
export default function EnhancedSidebar({
  tags,
  selectedDirectoryId,
  selectedTagIds,
  onDirectorySelect,
  onTagToggle
}: EnhancedSidebarProps) {
  const [activeTab, setActiveTab] = useState<'folders' | 'tags'>('folders');
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    directoryId: string;
  } | null>(null);
  const [newDirectoryName, setNewDirectoryName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [parentDirectoryId, setParentDirectoryId] = useState<string | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用文件管理器上下文
  const {
    directoryTree,
    expandedDirectories,
    loading,
    error,
    loadDirectoryTree,
    toggleDirectoryExpansion,
    createDirectory,
    deleteDirectory,
    loadDirectoryFiles,
    uploadFiles
  } = useFileManagerContext();

  // 初始化加载目录树
  useEffect(() => {
    loadDirectoryTree();
  }, [loadDirectoryTree]);

  // 处理目录选择
  const handleDirectorySelect = useCallback((directoryId: string) => {
    onDirectorySelect(directoryId);
    // 加载目录文件
    loadDirectoryFiles(directoryId);
  }, [onDirectorySelect, loadDirectoryFiles]);

  // 处理目录展开/收起
  const handleToggleExpand = useCallback((directoryId: string) => {
    toggleDirectoryExpansion(directoryId);
  }, [toggleDirectoryExpansion]);

  // 处理右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent, directoryId: string) => {
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      directoryId
    });
  }, []);

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // 创建子目录
  const handleCreateSubdirectory = useCallback(() => {
    console.log('[EnhancedSidebar] 创建子目录被触发', { contextMenu });
    if (contextMenu) {
      console.log('[EnhancedSidebar] 设置父目录ID:', contextMenu.directoryId);
      setParentDirectoryId(contextMenu.directoryId);
      setShowCreateDialog(true);
      closeContextMenu();
    }
  }, [contextMenu, closeContextMenu]);

  // 删除目录
  const handleDeleteDirectory = useCallback(async () => {
    if (contextMenu) {
      const confirmed = window.confirm('确定要删除这个目录吗？此操作不可撤销。');
      if (confirmed) {
        try {
          await deleteDirectory(contextMenu.directoryId);
          // 重新加载目录树
          await loadDirectoryTree();
        } catch (error) {
          console.error('删除目录失败:', error);
          alert('删除目录失败，请重试。');
        }
      }
      closeContextMenu();
    }
  }, [contextMenu, deleteDirectory, loadDirectoryTree, closeContextMenu]);

  // 确认创建目录
  const handleConfirmCreate = useCallback(async () => {
    console.log('[EnhancedSidebar] 确认创建目录', { 
      newDirectoryName: newDirectoryName.trim(), 
      parentDirectoryId 
    });
    if (newDirectoryName.trim()) {
      try {
        console.log('[EnhancedSidebar] 调用 createDirectory');
        await createDirectory(newDirectoryName.trim(), parentDirectoryId);
        console.log('[EnhancedSidebar] createDirectory 调用成功');
        // 重新加载目录树
        console.log('[EnhancedSidebar] 重新加载目录树');
        await loadDirectoryTree();
        console.log('[EnhancedSidebar] 目录树加载完成');
        setNewDirectoryName('');
        setShowCreateDialog(false);
        setParentDirectoryId(undefined);
        console.log('[EnhancedSidebar] 创建目录流程完成');
      } catch (error) {
        console.error('[EnhancedSidebar] 创建目录失败:', error);
        alert('创建目录失败，请重试。');
      }
    }
  }, [newDirectoryName, parentDirectoryId, createDirectory, loadDirectoryTree]);

  // 取消创建目录
  const handleCancelCreate = useCallback(() => {
    setNewDirectoryName('');
    setShowCreateDialog(false);
    setParentDirectoryId(undefined);
  }, []);

  // 处理上传按钮点击
  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 处理文件选择
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const fileArray = Array.from(files);
        console.log('[EnhancedSidebar] 开始上传文件:', fileArray.map(f => f.name));
        await uploadFiles(fileArray, selectedDirectoryId);
        console.log('[EnhancedSidebar] 文件上传完成');
        // 重新加载目录树和当前目录文件
        await loadDirectoryTree();
        if (selectedDirectoryId) {
          await loadDirectoryFiles(selectedDirectoryId);
        }
      } catch (error) {
        console.error('[EnhancedSidebar] 文件上传失败:', error);
        alert('文件上传失败，请重试。');
      }
    }
    // 清空文件输入
    if (event.target) {
      event.target.value = '';
    }
  }, [selectedDirectoryId, uploadFiles, loadDirectoryTree, loadDirectoryFiles]);

  // 右键菜单项
  const contextMenuItems: ContextMenuItem[] = [
    {
      id: 'create-subdirectory',
      label: '创建子目录',
      icon: FolderPlusIcon,
      onClick: handleCreateSubdirectory
    },
    {
      id: 'separator-1',
      label: '',
      separator: true,
      onClick: () => {}
    },
    {
      id: 'delete-directory',
      label: '删除目录',
      icon: TrashIcon,
      onClick: handleDeleteDirectory
    }
  ];

  return (
    <aside className="w-72 bg-gradient-to-b from-base-100 to-base-200/20 border-r border-base-300/30 flex flex-col" style={{boxShadow: 'var(--shadow-soft)'}}>
      {/* 标签页切换和上传按钮 */}
      <div className="flex items-center justify-between m-2">
        <div className="tabs tabs-boxed bg-base-200/50 backdrop-blur-sm flex-1" style={{boxShadow: 'var(--shadow-soft)'}}>
          <button
            className={`tab tab-sm flex-1 ${
              activeTab === 'folders' ? 'tab-active' : 'hover:bg-base-200/80'
            }`}
            style={{
              transition: 'all var(--transition-fast)',
              boxShadow: activeTab === 'folders' ? 'var(--shadow-soft)' : 'none'
            }}
            onClick={() => setActiveTab('folders')}
          >
            <FolderIcon className="w-4 h-4 mr-1" />
            文件夹
          </button>
          <button
            className={`tab tab-sm flex-1 ${
              activeTab === 'tags' ? 'tab-active' : 'hover:bg-base-200/80'
            }`}
            style={{
              transition: 'all var(--transition-fast)',
              boxShadow: activeTab === 'tags' ? 'var(--shadow-soft)' : 'none'
            }}
            onClick={() => setActiveTab('tags')}
          >
            <TagIcon className="w-4 h-4 mr-1" />
            标签
          </button>
        </div>
        {activeTab === 'folders' && (
          <button
            onClick={handleUploadClick}
            className="ml-2 p-2 text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="上传文件"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {activeTab === 'folders' ? (
          /* 目录树 */
          <div className="space-y-0.5">
            {loading && (
              <div className="flex items-center justify-center py-4">
                <div className="loading loading-spinner loading-sm"></div>
                <span className="ml-2 text-sm text-base-content/60">加载中...</span>
              </div>
            )}
            {error && (
              <div className="alert alert-error alert-sm">
                <span className="text-xs">{error}</span>
              </div>
            )}
            {!loading && !error && directoryTree.map((directory) => (
              <DirectoryTreeNode
                key={directory.id}
                node={directory}
                selectedDirectoryId={selectedDirectoryId}
                expandedDirectories={expandedDirectories}
                onDirectorySelect={handleDirectorySelect}
                onToggleExpand={handleToggleExpand}
                onContextMenu={handleContextMenu}
              />
            ))}
          </div>
        ) : (
          /* 标签列表 */
          <div className="space-y-1">
            {tags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <div
                  key={tag.id}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer group ${
                    isSelected 
                      ? 'bg-gradient-to-r from-primary/25 to-primary/15 border-l-2 border-primary' 
                      : 'hover:bg-base-200/80'
                  }`}
                  style={{
                    transition: 'all var(--transition-fast)',
                    boxShadow: isSelected ? 'var(--shadow-soft)' : 'none'
                  }}
                  onClick={() => onTagToggle(tag.id)}
                >
                  {/* 标签颜色指示器 */}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ 
                      backgroundColor: tag.color,
                      boxShadow: 'var(--shadow-soft)'
                    }}
                  />

                  {/* 标签名称 */}
                  <span className="flex-1 text-sm truncate font-medium">{tag.name}</span>

                  {/* 资源数量 */}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isSelected 
                      ? 'bg-primary/25 text-primary' 
                      : 'bg-base-content/10 text-base-content/60 group-hover:bg-base-content/20'
                  }`} style={{transition: 'all var(--transition-fast)'}}>
                    {tag.count}
                  </span>

                  {/* 选中状态 */}
                  {isSelected && (
                    <div className="w-2 h-2 bg-primary rounded-full" style={{boxShadow: 'var(--shadow-soft)'}} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenuItems}
          onClose={closeContextMenu}
        />
      )}

      {/* 创建目录对话框 */}
      {showCreateDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-base-100 rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">创建新目录</h3>
            <input
              type="text"
              className="input input-bordered w-full mb-4"
              placeholder="输入目录名称"
              value={newDirectoryName}
              onChange={(e) => setNewDirectoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleConfirmCreate();
                } else if (e.key === 'Escape') {
                  handleCancelCreate();
                }
              }}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="btn btn-ghost"
                onClick={handleCancelCreate}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleConfirmCreate}
                disabled={!newDirectoryName.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入元素 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept="*/*"
      />
    </aside>
  );
}