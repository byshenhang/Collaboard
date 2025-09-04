import React from 'react';
import { MagnifyingGlassIcon, Cog6ToothIcon, Squares2X2Icon, ListBulletIcon } from '@heroicons/react/24/outline';

/**
 * 视图类型枚举
 */
export type ViewType = 'grid' | 'list';

/**
 * Header组件属性接口
 */
interface HeaderProps {
  /** 当前选中的资源库 */
  currentLibrary: string;
  /** 可用的资源库列表 */
  libraries: string[];
  /** 搜索关键词 */
  searchQuery: string;
  /** 当前视图类型 */
  viewType: ViewType;
  /** 资源库切换回调 */
  onLibraryChange: (library: string) => void;
  /** 搜索回调 */
  onSearchChange: (query: string) => void;
  /** 视图切换回调 */
  onViewTypeChange: (type: ViewType) => void;
  /** 设置按钮点击回调 */
  onSettingsClick: () => void;
}

/**
 * 顶部导航栏组件
 * 包含logo、资源库切换、搜索框、视图切换、设置入口
 * @param props Header组件属性
 * @returns JSX.Element
 */
export default function Header({
  currentLibrary,
  libraries,
  searchQuery,
  viewType,
  onLibraryChange,
  onSearchChange,
  onViewTypeChange,
  onSettingsClick
}: HeaderProps) {
  return (
    <header className="h-16 bg-base-100 border-b border-base-300 flex items-center px-4 gap-4">
      {/* Logo区域 */}
      <div className="flex items-center gap-2 min-w-fit">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-primary-content font-bold text-sm">EA</span>
        </div>
        <h1 className="text-lg font-semibold text-base-content hidden sm:block">
          Eagle Assets
        </h1>
      </div>

      {/* 资源库切换 */}
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
          <span className="text-sm">{currentLibrary}</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
          {libraries.map((library) => (
            <li key={library}>
              <a 
                onClick={() => onLibraryChange(library)}
                className={library === currentLibrary ? 'active' : ''}
              >
                {library}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 搜索框 */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/60" />
          <input
            type="text"
            placeholder="搜索资源..."
            className="input input-bordered input-sm w-full pl-10 pr-4"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 视图切换 */}
      <div className="join">
        <button
          className={`btn btn-sm join-item ${
            viewType === 'grid' ? 'btn-active' : 'btn-ghost'
          }`}
          onClick={() => onViewTypeChange('grid')}
          title="网格视图"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        <button
          className={`btn btn-sm join-item ${
            viewType === 'list' ? 'btn-active' : 'btn-ghost'
          }`}
          onClick={() => onViewTypeChange('list')}
          title="列表视图"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 设置按钮 */}
      <button
        className="btn btn-ghost btn-sm"
        onClick={onSettingsClick}
        title="设置"
      >
        <Cog6ToothIcon className="w-5 h-5" />
      </button>
    </header>
  );
}