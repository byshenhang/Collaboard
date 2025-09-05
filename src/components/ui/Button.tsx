/**
 * 按钮组件
 * 
 * 提供多种样式和状态的按钮组件
 */

import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';
  /** 按钮大小 */
  size?: 'small' | 'medium' | 'large';
  /** 是否为加载状态 */
  loading?: boolean;
  /** 是否为全宽度 */
  fullWidth?: boolean;
  /** 图标（在文本前） */
  icon?: React.ReactNode;
  /** 图标（在文本后） */
  iconAfter?: React.ReactNode;
  /** 子元素 */
  children?: React.ReactNode;
}

/**
 * 按钮组件
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  loading = false,
  fullWidth = false,
  icon,
  iconAfter,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth && 'btn--full-width',
    loading && 'btn--loading',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="btn__spinner">
          <svg className="btn__spinner-icon" viewBox="0 0 24 24">
            <circle
              className="btn__spinner-path"
              cx="12"
              cy="12"
              r="10"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="31.416"
              strokeDashoffset="31.416"
            />
          </svg>
        </span>
      )}
      
      {!loading && icon && (
        <span className="btn__icon btn__icon--before">
          {icon}
        </span>
      )}
      
      {children && (
        <span className="btn__text">
          {children}
        </span>
      )}
      
      {!loading && iconAfter && (
        <span className="btn__icon btn__icon--after">
          {iconAfter}
        </span>
      )}
    </button>
  );
};

/**
 * 图标按钮组件
 */
export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /** 图标 */
  icon: React.ReactNode;
  /** 无障碍标签 */
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  variant = 'ghost',
  size = 'medium',
  className = '',
  ...props
}) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={`btn--icon-only ${className}`}
      icon={icon}
      {...props}
    />
  );
};

/**
 * 按钮组组件
 */
export interface ButtonGroupProps {
  /** 子元素 */
  children: React.ReactNode;
  /** 方向 */
  direction?: 'horizontal' | 'vertical';
  /** 间距 */
  spacing?: 'small' | 'medium' | 'large';
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end' | 'stretch';
  /** 自定义类名 */
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  direction = 'horizontal',
  spacing = 'medium',
  align = 'start',
  className = '',
}) => {
  const classes = [
    'btn-group',
    `btn-group--${direction}`,
    `btn-group--spacing-${spacing}`,
    `btn-group--align-${align}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      {children}
    </div>
  );
};

export default Button;