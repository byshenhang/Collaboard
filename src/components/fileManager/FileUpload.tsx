/**
 * 文件上传组件
 * 
 * 提供文件管理系统的文件上传功能，支持拖拽上传和进度显示
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button, IconButton, Modal } from '../ui';
import type {
  UploadItem,
  FileManagerConfig,
} from '../../types/fileManager';
import {
  getFileTypeInfo,
  isImageFile,
  formatFileSize,
  formatUploadSpeed,
  estimateRemainingTime,
  getFileExtension,
  getFilesFromDragEvent,
  createFilePreview,
  revokeFilePreview,
} from '../../utils/fileUtils';
import './FileUpload.css';

export interface FileUploadProps {
  /** 当前目录ID */
  currentDirectory?: string;
  /** 上传队列 */
  uploadQueue: UploadItem[];
  /** 是否显示上传区域 */
  visible?: boolean;
  /** 是否只读模式 */
  readonly?: boolean;
  /** 文件管理器配置 */
  config?: FileManagerConfig;
  /** 文件上传回调 */
  onFileUpload?: (files: File[], directoryId?: string) => void;
  /** 取消上传回调 */
  onCancelUpload?: (uploadId: string) => void;
  /** 重试上传回调 */
  onRetryUpload?: (uploadId: string) => void;
  /** 清除已完成上传回调 */
  onClearCompleted?: () => void;
  /** 关闭上传区域回调 */
  onClose?: () => void;
}

/**
 * 上传项组件
 */
interface UploadItemComponentProps {
  item: UploadItem;
  onCancel?: (uploadId: string) => void;
  onRetry?: (uploadId: string) => void;
}

const UploadItemComponent: React.FC<UploadItemComponentProps> = ({
  item,
  onCancel,
  onRetry,
}) => {
  const fileTypeInfo = getFileTypeInfo(item.file.name);
  const isImage = isImageFile(item.file.name);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // 生成预览URL
  useEffect(() => {
    if (isImage && item.file) {
      const preview = createFilePreview(item.file);
      const url = preview.url || null;
      setPreviewUrl(url);
      return () => {
        if (url) {
          revokeFilePreview(preview);
        }
      };
    }
  }, [item.file, isImage]);

  const handleCancel = useCallback(() => {
    onCancel?.(item.id);
  }, [item.id, onCancel]);

  const handleRetry = useCallback(() => {
    onRetry?.(item.id);
  }, [item.id, onRetry]);

  const getStatusIcon = () => {
    switch (item.status) {
      case 'pending':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12,6 12,12 16,14" />
          </svg>
        );
      case 'uploading':
        return (
          <div className="upload-item__spinner">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
        );
      case 'completed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      case 'cancelled':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (item.status) {
      case 'pending':
        return '等待上传';
      case 'uploading':
        return `上传中... ${Math.round(item.progress)}%`;
      case 'completed':
        return '上传完成';
      case 'error':
        return `上传失败: ${item.error || '未知错误'}`;
      case 'cancelled':
        return '已取消';
      default:
        return '';
    }
  };

  const itemClasses = [
    'upload-item',
    `upload-item--${item.status}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={itemClasses}>
      {/* 文件图标/缩略图 */}
      <div className="upload-item__icon">
        {isImage && previewUrl ? (
          <div className="upload-item__thumbnail">
            <img src={previewUrl} alt={item.file.name} />
          </div>
        ) : (
          <div className="upload-item__file-icon" style={{ color: fileTypeInfo.color }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d={fileTypeInfo.icon} />
            </svg>
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="upload-item__info">
        <div className="upload-item__name" title={item.file.name}>
          {item.file.name}
        </div>
        <div className="upload-item__meta">
          <span className="upload-item__size">
            {formatFileSize(item.file.size)}
          </span>
          <span className="upload-item__status">
            {getStatusText()}
          </span>
        </div>
        
        {/* 进度条 */}
        {item.status === 'uploading' && (
          <div className="upload-item__progress">
            <div className="upload-item__progress-bar">
              <div
                className="upload-item__progress-fill"
                style={{ width: `${item.progress}%` }}
              />
            </div>
            <div className="upload-item__progress-info">
              {item.speed && (
                <span className="upload-item__speed">
                  {formatUploadSpeed(item.speed)}
                </span>
              )}
              {item.remainingTime && item.speed && (
                <span className="upload-item__remaining">
                  剩余 {estimateRemainingTime(item.loaded || 0, item.file.size, item.speed)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 状态图标 */}
      <div className="upload-item__status-icon">
        {getStatusIcon()}
      </div>

      {/* 操作按钮 */}
      <div className="upload-item__actions">
        {item.status === 'uploading' && (
          <IconButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            }
            size="small"
            variant="ghost"
            onClick={handleCancel}
            aria-label="取消上传"
            title="取消上传"
          />
        )}
        {item.status === 'error' && (
          <IconButton
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="23,4 23,10 17,10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            }
            size="small"
            variant="ghost"
            onClick={handleRetry}
            aria-label="重试上传"
            title="重试上传"
          />
        )}
      </div>
    </div>
  );
};

/**
 * 拖拽上传区域组件
 */
interface DropZoneProps {
  onFileDrop: (files: File[]) => void;
  disabled?: boolean;
  config?: FileManagerConfig;
}

const DropZone: React.FC<DropZoneProps> = ({
  onFileDrop,
  disabled = false,
  config,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    setIsDragOver(false);
  }, [disabled]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    setIsDragOver(false);
    
    const files = getFilesFromDragEvent(event);
    if (files.length > 0) {
      onFileDrop(files);
    }
  }, [disabled, onFileDrop]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onFileDrop(files);
    }
    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onFileDrop]);

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const dropZoneClasses = [
    'drop-zone',
    isDragOver && 'drop-zone--drag-over',
    disabled && 'drop-zone--disabled',
  ].filter(Boolean).join(' ');

  const acceptedTypes = config?.allowedFileTypes?.join(',') || '*';
  const maxFileSize = config?.maxFileSize || 100 * 1024 * 1024; // 100MB
  const maxFiles = config?.maxConcurrentUploads || 10;

  return (
    <div
      className={dropZoneClasses}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />
      
      <div className="drop-zone__content">
        <div className="drop-zone__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17,8 12,3 7,8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>
        
        <div className="drop-zone__text">
          <p className="drop-zone__primary">
            {isDragOver ? '释放文件以上传' : '拖拽文件到此处上传'}
          </p>
          <p className="drop-zone__secondary">
            或者 <button className="drop-zone__browse" onClick={handleBrowseClick}>浏览文件</button>
          </p>
        </div>
        
        {config && (
          <div className="drop-zone__limits">
            <p>最大文件大小: {formatFileSize(maxFileSize)}</p>
            {config.allowedFileTypes && (
              <p>支持格式: {config.allowedFileTypes.join(', ')}</p>
            )}
            <p>最多同时上传: {maxFiles} 个文件</p>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 文件上传组件
 */
export const FileUpload: React.FC<FileUploadProps> = ({
  currentDirectory,
  uploadQueue,
  visible = false,
  readonly = false,
  config,
  onFileUpload,
  onCancelUpload,
  onRetryUpload,
  onClearCompleted,
  onClose,
}) => {
  const [showModal, setShowModal] = useState(false);

  // 处理文件上传
  const handleFileUpload = useCallback((files: File[]) => {
    if (readonly) return;
    
    // 验证文件
    const validFiles = files.filter(file => {
      if (config?.maxFileSize && file.size > config.maxFileSize) {
        console.warn(`文件 ${file.name} 超过大小限制`);
        return false;
      }
      
      if (config?.allowedFileTypes && config.allowedFileTypes.length > 0) {
        const extension = getFileExtension(file.name);
        if (!config.allowedFileTypes.includes(extension)) {
          console.warn(`文件 ${file.name} 格式不支持`);
          return false;
        }
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      onFileUpload?.(validFiles, currentDirectory);
    }
  }, [readonly, config, currentDirectory, onFileUpload]);

  // 处理清除已完成
  const handleClearCompleted = useCallback(() => {
    onClearCompleted?.();
  }, [onClearCompleted]);

  // 处理关闭模态框
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
  }, []);

  // 统计信息
  const stats = {
    total: uploadQueue.length,
    pending: uploadQueue.filter(item => item.status === 'pending').length,
    uploading: uploadQueue.filter(item => item.status === 'uploading').length,
    completed: uploadQueue.filter(item => item.status === 'completed').length,
    error: uploadQueue.filter(item => item.status === 'error').length,
    cancelled: uploadQueue.filter(item => item.status === 'cancelled').length,
  };

  const hasCompletedUploads = stats.completed > 0 || stats.error > 0 || stats.cancelled > 0;

  if (!visible) {
    return null;
  }

  return (
    <>
      {/* 上传区域 */}
      <div className="file-upload">
        <div className="file-upload__header">
          <h3 className="file-upload__title">文件上传</h3>
          <div className="file-upload__actions">
            {hasCompletedUploads && (
              <Button
                variant="ghost"
                size="small"
                onClick={handleClearCompleted}
              >
                清除已完成
              </Button>
            )}
            {uploadQueue.length > 0 && (
              <Button
                variant="ghost"
                size="small"
                onClick={() => setShowModal(true)}
              >
                查看详情
              </Button>
            )}
            <IconButton
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              }
              size="small"
              variant="ghost"
              onClick={onClose}
              aria-label="关闭"
            />
          </div>
        </div>

        {/* 拖拽上传区域 */}
        <DropZone
          onFileDrop={handleFileUpload}
          disabled={readonly}
          config={config}
        />

        {/* 上传统计 */}
        {uploadQueue.length > 0 && (
          <div className="file-upload__stats">
            <div className="file-upload__stats-item">
              <span className="file-upload__stats-label">总计:</span>
              <span className="file-upload__stats-value">{stats.total}</span>
            </div>
            {stats.uploading > 0 && (
              <div className="file-upload__stats-item file-upload__stats-item--uploading">
                <span className="file-upload__stats-label">上传中:</span>
                <span className="file-upload__stats-value">{stats.uploading}</span>
              </div>
            )}
            {stats.completed > 0 && (
              <div className="file-upload__stats-item file-upload__stats-item--completed">
                <span className="file-upload__stats-label">已完成:</span>
                <span className="file-upload__stats-value">{stats.completed}</span>
              </div>
            )}
            {stats.error > 0 && (
              <div className="file-upload__stats-item file-upload__stats-item--error">
                <span className="file-upload__stats-label">失败:</span>
                <span className="file-upload__stats-value">{stats.error}</span>
              </div>
            )}
          </div>
        )}

        {/* 最近上传项（最多显示3个） */}
        {uploadQueue.length > 0 && (
          <div className="file-upload__recent">
            <h4 className="file-upload__recent-title">最近上传</h4>
            <div className="file-upload__recent-list">
              {uploadQueue.slice(0, 3).map((item) => (
                <UploadItemComponent
                  key={item.id}
                  item={item}
                  onCancel={onCancelUpload}
                  onRetry={onRetryUpload}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 详情模态框 */}
      <Modal
        open={showModal}
        onClose={handleCloseModal}
        title="上传详情"
        size="large"
      >
        <div className="file-upload__modal">
          {uploadQueue.length === 0 ? (
            <div className="file-upload__modal-empty">
              <p>暂无上传任务</p>
            </div>
          ) : (
            <div className="file-upload__modal-list">
              {uploadQueue.map((item) => (
                <UploadItemComponent
                  key={item.id}
                  item={item}
                  onCancel={onCancelUpload}
                  onRetry={onRetryUpload}
                />
              ))}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default FileUpload;