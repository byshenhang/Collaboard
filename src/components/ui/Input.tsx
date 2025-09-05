/**
 * 输入框组件
 * 
 * 提供多种类型和状态的输入框组件
 */

import React, { forwardRef, useState } from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** 输入框标签 */
  label?: string;
  /** 输入框大小 */
  size?: 'small' | 'medium' | 'large';
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 前缀图标 */
  prefixIcon?: React.ReactNode;
  /** 后缀图标 */
  suffixIcon?: React.ReactNode;
  /** 是否显示清除按钮 */
  clearable?: boolean;
  /** 是否全宽度 */
  fullWidth?: boolean;
  /** 清除回调 */
  onClear?: () => void;
}

/**
 * 输入框组件
 */
export const Input = forwardRef<HTMLInputElement, InputProps>((
  {
    label,
    size = 'medium',
    error,
    helperText,
    prefixIcon,
    suffixIcon,
    clearable = false,
    fullWidth = false,
    className = '',
    disabled,
    value,
    onClear,
    ...props
  },
  ref
) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';
  const showClearButton = clearable && hasValue && !disabled;

  const containerClasses = [
    'input-container',
    `input-container--${size}`,
    fullWidth && 'input-container--full-width',
    error && 'input-container--error',
    focused && 'input-container--focused',
    disabled && 'input-container--disabled',
    className,
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input',
    prefixIcon && 'input--with-prefix',
    (suffixIcon || showClearButton) && 'input--with-suffix',
  ].filter(Boolean).join(' ');

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className="input-label">
          {label}
        </label>
      )}
      
      <div className="input-wrapper">
        {prefixIcon && (
          <span className="input-icon input-icon--prefix">
            {prefixIcon}
          </span>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          value={value}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          {...props}
        />
        
        {showClearButton && (
          <button
            type="button"
            className="input-clear"
            onClick={handleClear}
            tabIndex={-1}
            aria-label="清除输入"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        
        {suffixIcon && !showClearButton && (
          <span className="input-icon input-icon--suffix">
            {suffixIcon}
          </span>
        )}
      </div>
      
      {(error || helperText) && (
        <div className="input-message">
          {error ? (
            <span className="input-error">{error}</span>
          ) : (
            <span className="input-helper">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

/**
 * 搜索输入框组件
 */
export interface SearchInputProps extends Omit<InputProps, 'type' | 'prefixIcon'> {
  /** 搜索回调 */
  onSearch?: (value: string) => void;
  /** 搜索延迟（毫秒） */
  searchDelay?: number;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  searchDelay = 300,
  placeholder = '搜索...',
  ...props
}) => {
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    props.onChange?.(e);

    if (onSearch) {
      if (searchTimer) {
        clearTimeout(searchTimer);
      }

      const timer = setTimeout(() => {
        onSearch(value);
      }, searchDelay);

      setSearchTimer(timer);
    }
  };

  const searchIcon = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );

  return (
    <Input
      type="search"
      placeholder={placeholder}
      prefixIcon={searchIcon}
      clearable
      {...props}
      onChange={handleChange}
    />
  );
};

/**
 * 密码输入框组件
 */
export interface PasswordInputProps extends Omit<InputProps, 'type' | 'suffixIcon'> {
  /** 是否显示切换按钮 */
  showToggle?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showToggle = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleIcon = showPassword ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const suffixIcon = showToggle ? (
    <button
      type="button"
      className="input-toggle"
      onClick={togglePassword}
      tabIndex={-1}
      aria-label={showPassword ? '隐藏密码' : '显示密码'}
    >
      {toggleIcon}
    </button>
  ) : undefined;

  return (
    <Input
      type={showPassword ? 'text' : 'password'}
      suffixIcon={suffixIcon}
      {...props}
    />
  );
};

/**
 * 文本域组件
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** 文本域标签 */
  label?: string;
  /** 错误信息 */
  error?: string;
  /** 帮助文本 */
  helperText?: string;
  /** 是否全宽度 */
  fullWidth?: boolean;
  /** 是否自动调整高度 */
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>((
  {
    label,
    error,
    helperText,
    fullWidth = false,
    autoResize = false,
    className = '',
    disabled,
    ...props
  },
  ref
) => {
  const [focused, setFocused] = useState(false);

  const containerClasses = [
    'textarea-container',
    fullWidth && 'textarea-container--full-width',
    error && 'textarea-container--error',
    focused && 'textarea-container--focused',
    disabled && 'textarea-container--disabled',
    className,
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    'textarea',
    autoResize && 'textarea--auto-resize',
  ].filter(Boolean).join(' ');

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    if (autoResize) {
      const target = e.target as HTMLTextAreaElement;
      target.style.height = 'auto';
      target.style.height = target.scrollHeight + 'px';
    }
    props.onInput?.(e);
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label className="textarea-label">
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        className={textareaClasses}
        disabled={disabled}
        onFocus={(e) => {
          setFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          props.onBlur?.(e);
        }}
        onInput={handleInput}
        {...props}
      />
      
      {(error || helperText) && (
        <div className="textarea-message">
          {error ? (
            <span className="textarea-error">{error}</span>
          ) : (
            <span className="textarea-helper">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Input;