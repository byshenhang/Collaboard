/**
 * 模态框组件
 * 
 * 提供弹窗功能的模态框组件
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import './Modal.css';

export interface ModalProps {
  /** 是否显示模态框 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 模态框标题 */
  title?: string;
  /** 模态框大小 */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  /** 是否显示关闭按钮 */
  closable?: boolean;
  /** 是否点击遮罩关闭 */
  maskClosable?: boolean;
  /** 是否显示遮罩 */
  mask?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 子元素 */
  children: React.ReactNode;
  /** 底部操作区域 */
  footer?: React.ReactNode;
  /** 是否居中显示 */
  centered?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** z-index 值 */
  zIndex?: number;
}

/**
 * 模态框组件
 */
export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  size = 'medium',
  closable = true,
  maskClosable = true,
  mask = true,
  className = '',
  children,
  footer,
  centered = true,
  draggable = false,
  zIndex = 1000,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  // 处理 ESC 键关闭
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closable) {
      onClose();
    }
  }, [closable, onClose]);

  // 处理遮罩点击
  const handleMaskClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && maskClosable) {
      onClose();
    }
  }, [maskClosable, onClose]);

  // 拖拽功能
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (!draggable || !modalRef.current || !headerRef.current) return;
    
    const modal = modalRef.current;
    const rect = modal.getBoundingClientRect();
    
    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      startY: event.clientY,
      initialX: rect.left,
      initialY: rect.top,
    };
    
    modal.style.position = 'fixed';
    modal.style.left = `${rect.left}px`;
    modal.style.top = `${rect.top}px`;
    modal.style.transform = 'none';
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    event.preventDefault();
  }, [draggable]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !modalRef.current) return;
    
    const deltaX = event.clientX - dragStateRef.current.startX;
    const deltaY = event.clientY - dragStateRef.current.startY;
    
    const newX = dragStateRef.current.initialX + deltaX;
    const newY = dragStateRef.current.initialY + deltaY;
    
    modalRef.current.style.left = `${newX}px`;
    modalRef.current.style.top = `${newY}px`;
  }, []);

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // 监听键盘事件
  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      // 阻止背景滚动
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }
  }, [open, handleKeyDown]);

  // 清理拖拽事件
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  if (!open) return null;

  const modalClasses = [
    'modal',
    `modal--${size}`,
    centered && 'modal--centered',
    draggable && 'modal--draggable',
    className,
  ].filter(Boolean).join(' ');

  const headerClasses = [
    'modal__header',
    draggable && 'modal__header--draggable',
  ].filter(Boolean).join(' ');

  const modalContent = (
    <div className="modal-overlay" style={{ zIndex }} onClick={handleMaskClick}>
      {mask && <div className="modal-mask" />}
      
      <div ref={modalRef} className={modalClasses}>
        {(title || closable) && (
          <div
            ref={headerRef}
            className={headerClasses}
            onMouseDown={handleMouseDown}
          >
            {title && (
              <h3 className="modal__title">
                {title}
              </h3>
            )}
            
            {closable && (
              <button
                className="modal__close"
                onClick={onClose}
                aria-label="关闭"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        <div className="modal__body">
          {children}
        </div>
        
        {footer && (
          <div className="modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

/**
 * 确认对话框组件
 */
export interface ConfirmModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  content: React.ReactNode;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮类型 */
  confirmType?: 'primary' | 'danger';
  /** 是否显示加载状态 */
  loading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  onClose,
  onConfirm,
  title = '确认',
  content,
  confirmText = '确认',
  cancelText = '取消',
  confirmType = 'primary',
  loading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const footer = (
    <div className="modal-confirm__actions">
      <Button
        variant="ghost"
        onClick={onClose}
        disabled={loading}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmType}
        onClick={handleConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
      maskClosable={!loading}
      closable={!loading}
    >
      <div className="modal-confirm__content">
        {content}
      </div>
    </Modal>
  );
};

/**
 * 信息对话框组件
 */
export interface InfoModalProps {
  /** 是否显示 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  content: React.ReactNode;
  /** 按钮文本 */
  buttonText?: string;
  /** 图标类型 */
  type?: 'info' | 'success' | 'warning' | 'error';
}

export const InfoModal: React.FC<InfoModalProps> = ({
  open,
  onClose,
  title,
  content,
  buttonText = '知道了',
  type = 'info',
}) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="modal-info__icon modal-info__icon--success" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22,4 12,14.01 9,11.01" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="modal-info__icon modal-info__icon--warning" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case 'error':
        return (
          <svg className="modal-info__icon modal-info__icon--error" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        );
      default:
        return (
          <svg className="modal-info__icon modal-info__icon--info" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        );
    }
  };

  const footer = (
    <div className="modal-info__actions">
      <Button variant="primary" onClick={onClose}>
        {buttonText}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      footer={footer}
    >
      <div className="modal-info__content">
        {getIcon()}
        <div className="modal-info__text">
          {content}
        </div>
      </div>
    </Modal>
  );
};

export default Modal;