/**
 * UI 组件统一导出
 * 
 * 提供所有基础 UI 组件的统一入口
 */

// 按钮组件
export { Button, IconButton, ButtonGroup } from './Button';
export type { ButtonProps, IconButtonProps, ButtonGroupProps } from './Button';

// 输入框组件
export { Input, SearchInput, PasswordInput, Textarea } from './Input';
export type { InputProps, SearchInputProps, PasswordInputProps, TextareaProps } from './Input';

// 模态框组件
export { Modal, ConfirmModal, InfoModal } from './Modal';
export type { ModalProps, ConfirmModalProps, InfoModalProps } from './Modal';

// 默认导出（主要组件）
export { Button as default } from './Button';