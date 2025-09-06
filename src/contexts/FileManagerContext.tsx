import React, { createContext, useContext, ReactNode } from 'react';
import { useFileManager } from '../hooks/useFileManager';
import type { UseFileManagerReturn } from '../types/fileManager';

/**
 * 文件管理器上下文
 */
const FileManagerContext = createContext<UseFileManagerReturn | null>(null);

/**
 * 文件管理器上下文提供者属性
 */
interface FileManagerProviderProps {
  children: ReactNode;
}

/**
 * 文件管理器上下文提供者
 */
export function FileManagerProvider({ children }: FileManagerProviderProps) {
  const fileManager = useFileManager();

  return (
    <FileManagerContext.Provider value={fileManager}>
      {children}
    </FileManagerContext.Provider>
  );
}

/**
 * 使用文件管理器上下文的Hook
 */
export function useFileManagerContext(): UseFileManagerReturn {
  const context = useContext(FileManagerContext);
  if (!context) {
    throw new Error('useFileManagerContext must be used within a FileManagerProvider');
  }
  return context;
}