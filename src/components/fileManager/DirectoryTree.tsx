/**
 * 目录树组件
 * 
 * 提供文件管理系统的目录树形结构展示和交互操作
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button, IconButton } from '../ui';
import type {
  DirectoryTreeNode,
  DirectoryExpandState,
  FileManagerState,
} from '../../types/fileManager';
import './DirectoryTree.css';

export interface DirectoryTreeProps {
  /** 目录树数据 */
  tree: DirectoryTreeNode[];
  /** 当前选中的目录ID */
  currentDirectory?: string;
  /** 展开状态 */
  expandState: DirectoryExpandState;
  /** 选中的目录集合 */
  selectedDirectories: Set<string>;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 是否显示根目录 */
  showRoot?: boolean;
  /** 最大展开层级 */
  maxDepth?: number;
  /** 目录点击回调 */
  onDirectoryClick?: (directoryId: string) => void;
  /** 目录选择回调 */
  onDirectorySelect?: (directoryIds: string[], append?: boolean) => void;
  /** 展开状态切换回调 */
  onToggleExpand?: (directoryId: string) => void;
  /** 创建目录回调 */
  onCreateDirectory?: (parentId?: string) => void;
  /** 删除目录回调 */
  onDeleteDirectory?: (directoryId: string) => void;
  /** 重命名目录回调 */
  onRenameDirectory?: (directoryId: string, newName: string) => void;
  /** 右键菜单回调 */
  onContextMenu?: (event: React.MouseEvent, directoryId: string) => void;
}

/**
 * 目录树节点组件
 */
interface DirectoryTreeNodeProps {
  node: DirectoryTreeNode;
  level: number;
  currentDirectory?: string;
  expandState: DirectoryExpandState;
  selectedDirectories: Set<string>;
  readonly?: boolean;
  maxDepth?: number;
  onDirectoryClick?: (directoryId: string) => void;
  onDirectorySelect?: (directoryIds: string[], append?: boolean) => void;
  onToggleExpand?: (directoryId: string) => void;
  onCreateDirectory?: (parentId?: string) => void;
  onDeleteDirectory?: (directoryId: string) => void;
  onRenameDirectory?: (directoryId: string, newName: string) => void;
  onContextMenu?: (event: React.MouseEvent, directoryId: string) => void;
}

const DirectoryTreeNode: React.FC<DirectoryTreeNodeProps> = ({
  node,
  level,
  currentDirectory,
  expandState,
  selectedDirectories,
  readonly = false,
  maxDepth,
  onDirectoryClick,
  onDirectorySelect,
  onToggleExpand,
  onCreateDirectory,
  onDeleteDirectory,
  onRenameDirectory,
  onContextMenu,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingValue, setRenamingValue] = useState(node.name);
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = expandState[node.id] || false;
  const isSelected = selectedDirectories.has(node.id);
  const isCurrent = currentDirectory === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren && (!maxDepth || level < maxDepth);

  // 处理目录点击
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + 点击：多选
      onDirectorySelect?.([node.id], true);
    } else if (event.shiftKey) {
      // Shift + 点击：范围选择（暂时简化为单选）
      onDirectorySelect?.([node.id], false);
    } else {
      // 普通点击：选中并进入目录
      onDirectoryClick?.(node.id);
      onDirectorySelect?.([node.id], false);
    }
  }, [node.id, onDirectoryClick, onDirectorySelect]);

  // 处理展开/收起
  const handleToggleExpand = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (canExpand) {
      onToggleExpand?.(node.id);
    }
  }, [node.id, canExpand, onToggleExpand]);

  // 处理右键菜单
  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onContextMenu?.(event, node.id);
  }, [node.id, onContextMenu]);

  // 处理重命名
  const handleRename = useCallback(() => {
    if (!readonly) {
      setIsRenaming(true);
      setRenamingValue(node.name);
    }
  }, [node.name, readonly]);

  const handleRenameSubmit = useCallback(() => {
    if (renamingValue.trim() && renamingValue !== node.name) {
      onRenameDirectory?.(node.id, renamingValue.trim());
    }
    setIsRenaming(false);
  }, [node.id, node.name, renamingValue, onRenameDirectory]);

  const handleRenameCancel = useCallback(() => {
    setIsRenaming(false);
    setRenamingValue(node.name);
  }, [node.name]);

  const handleRenameKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleRenameSubmit();
    } else if (event.key === 'Escape') {
      handleRenameCancel();
    }
  }, [handleRenameSubmit, handleRenameCancel]);

  // 处理创建子目录
  const handleCreateChild = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onCreateDirectory?.(node.id);
  }, [node.id, onCreateDirectory]);

  // 处理删除目录
  const handleDelete = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteDirectory?.(node.id);
  }, [node.id, onDeleteDirectory]);

  const nodeClasses = [
    'directory-tree-node',
    isSelected && 'directory-tree-node--selected',
    isCurrent && 'directory-tree-node--current',
    isHovered && 'directory-tree-node--hovered',
    readonly && 'directory-tree-node--readonly',
  ].filter(Boolean).join(' ');

  const contentClasses = [
    'directory-tree-node__content',
    `directory-tree-node__content--level-${level}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={nodeClasses}>
      <div
        className={contentClasses}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {/* 展开/收起按钮 */}
        <button
          className="directory-tree-node__expand"
          onClick={handleToggleExpand}
          disabled={!canExpand}
          aria-label={isExpanded ? '收起' : '展开'}
        >
          {canExpand ? (
            <svg
              className={`directory-tree-node__expand-icon ${
                isExpanded ? 'directory-tree-node__expand-icon--expanded' : ''
              }`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <polyline points="9,18 15,12 9,6" />
            </svg>
          ) : (
            <span className="directory-tree-node__expand-placeholder" />
          )}
        </button>

        {/* 目录图标 */}
        <span className="directory-tree-node__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        </span>

        {/* 目录名称 */}
        {isRenaming ? (
          <input
            className="directory-tree-node__rename-input"
            value={renamingValue}
            onChange={(e) => setRenamingValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleRenameKeyDown}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="directory-tree-node__name"
            onDoubleClick={handleRename}
            title={node.name}
          >
            {node.name}
          </span>
        )}

        {/* 操作按钮 */}
        {!readonly && isHovered && !isRenaming && (
          <div className="directory-tree-node__actions">
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
              size="small"
              variant="ghost"
              onClick={handleCreateChild}
              aria-label="创建子目录"
              title="创建子目录"
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
              aria-label="删除目录"
              title="删除目录"
            />
          </div>
        )}
      </div>

      {/* 子目录 */}
      {isExpanded && hasChildren && (
        <div className="directory-tree-node__children">
          {node.children!.map((child) => (
            <DirectoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              currentDirectory={currentDirectory}
              expandState={expandState}
              selectedDirectories={selectedDirectories}
              readonly={readonly}
              maxDepth={maxDepth}
              onDirectoryClick={onDirectoryClick}
              onDirectorySelect={onDirectorySelect}
              onToggleExpand={onToggleExpand}
              onCreateDirectory={onCreateDirectory}
              onDeleteDirectory={onDeleteDirectory}
              onRenameDirectory={onRenameDirectory}
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * 目录树组件
 */
export const DirectoryTree: React.FC<DirectoryTreeProps> = ({
  tree,
  currentDirectory,
  expandState,
  selectedDirectories,
  loading = false,
  readonly = false,
  showRoot = true,
  maxDepth,
  onDirectoryClick,
  onDirectorySelect,
  onToggleExpand,
  onCreateDirectory,
  onDeleteDirectory,
  onRenameDirectory,
  onContextMenu,
}) => {
  // 处理根目录创建
  const handleCreateRoot = useCallback(() => {
    onCreateDirectory?.();
  }, [onCreateDirectory]);

  // 渲染的树数据
  const renderTree = useMemo(() => {
    if (showRoot || tree.length === 0) {
      return tree;
    }
    // 如果不显示根目录，则展开第一层
    return tree.reduce<DirectoryTreeNode[]>((acc, node) => {
      if (node.children) {
        acc.push(...node.children);
      } else {
        acc.push(node);
      }
      return acc;
    }, []);
  }, [tree, showRoot]);

  if (loading) {
    return (
      <div className="directory-tree directory-tree--loading">
        <div className="directory-tree__loading">
          <div className="directory-tree__loading-spinner" />
          <span>加载目录树...</span>
        </div>
      </div>
    );
  }

  if (tree.length === 0) {
    return (
      <div className="directory-tree directory-tree--empty">
        <div className="directory-tree__empty">
          <svg className="directory-tree__empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p className="directory-tree__empty-text">暂无目录</p>
          {!readonly && (
            <Button
              variant="primary"
              size="small"
              onClick={handleCreateRoot}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
            >
              创建目录
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="directory-tree">
      <div className="directory-tree__header">
        <h3 className="directory-tree__title">目录</h3>
        {!readonly && (
          <IconButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            size="small"
            variant="ghost"
            onClick={handleCreateRoot}
            aria-label="创建根目录"
            title="创建根目录"
          />
        )}
      </div>
      
      <div className="directory-tree__content">
        {renderTree.map((node) => (
          <DirectoryTreeNode
            key={node.id}
            node={node}
            level={0}
            currentDirectory={currentDirectory}
            expandState={expandState}
            selectedDirectories={selectedDirectories}
            readonly={readonly}
            maxDepth={maxDepth}
            onDirectoryClick={onDirectoryClick}
            onDirectorySelect={onDirectorySelect}
            onToggleExpand={onToggleExpand}
            onCreateDirectory={onCreateDirectory}
            onDeleteDirectory={onDeleteDirectory}
            onRenameDirectory={onRenameDirectory}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </div>
  );
};

export default DirectoryTree;