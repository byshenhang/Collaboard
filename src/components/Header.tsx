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
    <header className="h-16 bg-gradient-to-r from-primary/5 to-secondary/5 backdrop-blur-sm border-b border-base-300/50 flex items-center px-6 gap-6 shadow-sm">
      {/* Logo区域 */}
      <div className="flex items-center gap-3 min-w-fit">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-primary-content font-bold text-lg">EA</span>
        </div>
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block">
            Eagle Assets
          </h1>
          <p className="text-xs text-base-content/60 hidden sm:block">资产管理工具</p>
        </div>
      </div>

      {/* 资源库切换 */}
      <div className="dropdown dropdown-bottom">
        <div tabIndex={0} role="button" className="btn btn-sm btn-outline gap-2">
          <span className="text-sm">{currentLibrary}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow-lg border border-base-300">
          {libraries.map((library) => (
            <li key={library}>
              <a 
                className={`${currentLibrary === library ? 'active' : ''}`}
                onClick={() => onLibraryChange(library)}
              >
                {library}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 搜索框 */}
      <div className="flex-1 max-w-lg">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/40" />
          <input
            type="text"
            placeholder="搜索资源、标签或文件夹..."
            className="input input-bordered w-full pl-12 pr-4 bg-base-100/50 backdrop-blur-sm border-base-300/50 focus:border-primary/50 focus:bg-base-100 transition-all duration-200"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* 视图切换 */}
      <div className="join">
        <button
          className={`btn btn-sm join-item ${
            viewType === 'grid' 
              ? 'btn-primary' 
              : 'btn-outline btn-primary/20 hover:btn-primary/40'
          }`}
          onClick={() => onViewTypeChange('grid')}
          title="网格视图"
        >
          <Squares2X2Icon className="w-4 h-4" />
        </button>
        <button
          className={`btn btn-sm join-item ${
            viewType === 'list' 
              ? 'btn-primary' 
              : 'btn-outline btn-primary/20 hover:btn-primary/40'
          }`}
          onClick={() => onViewTypeChange('list')}
          title="列表视图"
        >
          <ListBulletIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 设置按钮 */}
      <div className="tooltip tooltip-bottom" data-tip="设置">
        <button
          className="btn btn-sm btn-ghost btn-circle hover:btn-primary/20 transition-all duration-200"
          onClick={onSettingsClick}
        >
          <Cog6ToothIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}