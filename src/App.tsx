import { useState } from 'react';
import Header, { ViewType } from './components/Header';
import Sidebar, { FolderNode } from './components/Sidebar';
import Content, { Asset, AssetType, SortField, SortDirection } from './components/Content';
import Inspector from './components/Inspector';
import Footer, { SyncStatus, Task } from './components/Footer';
import { FileManager } from './pages';

/**
 * 应用模式枚举
 */
export type AppMode = 'asset-manager' | 'file-manager';

/**
 * 主应用组件 - Eagle风格的美术资产管理工具
 */
function App() {
  // 应用模式状态
  const [appMode, setAppMode] = useState<AppMode>('asset-manager');
  
  // 视图状态
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [currentLibrary, setCurrentLibrary] = useState('default');
  const [searchQuery, setSearchQuery] = useState('');
  
  // 排序状态
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // 选择状态
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // 加载状态
  const [loading] = useState(false);
  
  // 同步状态
  const [syncStatus] = useState<SyncStatus>('success');
  const [tasks] = useState<Task[]>([]);
  
  // 模拟数据
  const libraries = ['默认资源库', '项目资源', '归档资源'];
  
  const folders: FolderNode[] = [
    {
      id: 'root',
      name: '根目录',
      assetCount: 156,
      isExpanded: true,
      children: [
        {
          id: 'images',
          name: '图片',
          assetCount: 89,
          isExpanded: false,
          children: [
            {
              id: 'photos',
              name: '照片',
              assetCount: 45,
              isExpanded: false
            },
            {
              id: 'illustrations',
              name: '插画',
              assetCount: 44,
              isExpanded: false
            }
          ]
        },
        {
          id: 'videos',
          name: '视频',
          assetCount: 23,
          isExpanded: false
        },
        {
          id: 'audio',
          name: '音频',
          assetCount: 44,
          isExpanded: false
        }
      ]
    }
  ];
  
  const tags = [
    { id: 'favorite', name: '收藏', color: '#ef4444', count: 12 },
    { id: 'work', name: '工作', color: '#3b82f6', count: 34 },
    { id: 'personal', name: '个人', color: '#10b981', count: 28 },
    { id: 'draft', name: '草稿', color: '#f59e0b', count: 15 },
    { id: 'final', name: '最终版', color: '#8b5cf6', count: 67 }
  ];
  
  const mockAssets: Asset[] = [
    {
      id: '1',
      name: 'landscape.jpg',
      type: AssetType.Image,
      size: 2048576,
      createdAt: new Date('2024-01-15'),
      modifiedAt: new Date('2024-01-15'),
      thumbnailUrl: 'https://picsum.photos/200/150?random=1',
      previewUrl: 'https://picsum.photos/800/600?random=1',
      tags: ['favorite', 'work'],
      folderId: 'photos',
      width: 1920,
      height: 1080,
      format: 'JPEG',
      colorSpace: 'sRGB',
      notes: '美丽的风景照片，适合用作背景'
    },
    {
      id: '2',
      name: 'demo_video.mp4',
      type: AssetType.Video,
      size: 15728640,
      createdAt: new Date('2024-01-14'),
      modifiedAt: new Date('2024-01-14'),
      thumbnailUrl: 'https://picsum.photos/200/150?random=2',
      previewUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
      tags: ['work', 'draft'],
      folderId: 'videos',
      width: 1280,
      height: 720,
      duration: 30,
      format: 'MP4',
      frameRate: 30,
      bitRate: 4000,
      notes: '演示视频，需要进一步编辑'
    },
    {
      id: '3',
      name: 'background_music.mp3',
      type: AssetType.Audio,
      size: 5242880,
      createdAt: new Date('2024-01-13'),
      modifiedAt: new Date('2024-01-13'),
      thumbnailUrl: undefined,
      tags: ['personal', 'final'],
      folderId: 'audio',
      duration: 180,
      format: 'MP3',
      sampleRate: 44100,
      bitRate: 320,
      notes: '背景音乐，已完成制作'
    },
    {
      id: '4',
      name: 'design_spec.pdf',
      type: AssetType.Document,
      size: 1048576,
      createdAt: new Date('2024-01-12'),
      modifiedAt: new Date('2024-01-16'),
      thumbnailUrl: 'https://picsum.photos/200/150?random=4',
      tags: ['work', 'final'],
      folderId: 'root',
      format: 'PDF',
      notes: '设计规范文档，最新版本'
    },
    {
      id: '5',
      name: 'character_design.png',
      type: AssetType.Image,
      size: 3145728,
      createdAt: new Date('2024-01-11'),
      modifiedAt: new Date('2024-01-11'),
      thumbnailUrl: 'https://picsum.photos/200/150?random=5',
      previewUrl: 'https://picsum.photos/800/600?random=5',
      tags: ['work', 'draft'],
      folderId: 'illustrations',
      width: 2048,
      height: 2048,
      format: 'PNG',
      colorSpace: 'sRGB',
      notes: '角色设计草图'
    }
  ];
  
  // 获取当前选中的单个资源
  const selectedAsset = selectedAssetIds.length === 1 
    ? mockAssets.find(asset => asset.id === selectedAssetIds[0])
    : undefined;
  
  // 事件处理函数
  const handleLibraryChange = (libraryId: string) => {
    setCurrentLibrary(libraryId);
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };
  
  const handleViewTypeChange = (type: ViewType) => {
    setViewType(type);
  };
  
  const handleSettingsClick = () => {
    console.log('打开设置');
  };
  
  const handleModeChange = (mode: AppMode) => {
    setAppMode(mode);
  };
  
  const handleFolderSelect = (folderId: string) => {
    setSelectedFolderId(folderId);
  };
  
  const handleFolderToggle = (folderId: string) => {
    // 切换文件夹展开状态的逻辑
    console.log('切换文件夹:', folderId);
  };
  
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };
  
  const handleSortChange = (field: SortField, direction: SortDirection) => {
    setSortField(field);
    setSortDirection(direction);
  };
  
  const handleAssetSelect = (assetId: string, multiSelect = false) => {
    if (multiSelect) {
      setSelectedAssetIds(prev => 
        prev.includes(assetId)
          ? prev.filter(id => id !== assetId)
          : [...prev, assetId]
      );
    } else {
      setSelectedAssetIds([assetId]);
    }
  };
  
  const handleAssetDoubleClick = (asset: Asset) => {
    console.log('双击资源:', asset.name);
  };
  
  const handleNotesUpdate = (assetId: string, notes: string) => {
    console.log('更新备注:', assetId, notes);
  };
  
  const handleTagAdd = (assetId: string, tagId: string) => {
    console.log('添加标签:', assetId, tagId);
  };
  
  const handleTagRemove = (assetId: string, tagId: string) => {
    console.log('移除标签:', assetId, tagId);
  };
  
  const handleExport = (asset: Asset) => {
    console.log('导出资源:', asset.name);
  };
  
  const handleShare = (asset: Asset) => {
    console.log('分享资源:', asset.name);
  };
  
  const handleDelete = (asset: Asset) => {
    console.log('删除资源:', asset.name);
  };
  
  return (
    <div className="h-screen flex flex-col bg-base-100" data-theme="dark">
      {/* 顶部导航栏 */}
      <Header
        libraries={libraries}
        currentLibrary={currentLibrary}
        searchQuery={searchQuery}
        viewType={viewType}
        appMode={appMode}
        onLibraryChange={handleLibraryChange}
        onSearchChange={handleSearchChange}
        onViewTypeChange={handleViewTypeChange}
        onSettingsClick={handleSettingsClick}
        onModeChange={handleModeChange}
      />
      
      {/* 主内容区域 */}
      {appMode === 'asset-manager' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* 左侧边栏 */}
          <Sidebar
            folders={folders}
            tags={tags}
            selectedFolderId={selectedFolderId}
            selectedTagIds={selectedTagIds}
            onFolderSelect={handleFolderSelect}
            onFolderToggle={handleFolderToggle}
            onTagToggle={handleTagToggle}
          />
          
          {/* 主内容区 */}
          <Content
            assets={mockAssets}
            viewType={viewType}
            sortField={sortField}
            sortDirection={sortDirection}
            selectedAssetIds={selectedAssetIds}
            loading={loading}
            onSortChange={handleSortChange}
            onAssetSelect={handleAssetSelect}
            onAssetDoubleClick={handleAssetDoubleClick}
          />
          
          {/* 右侧信息栏 */}
          {selectedAsset && (
            <Inspector
              selectedAsset={selectedAsset}
              availableTags={tags}
              onNotesUpdate={handleNotesUpdate}
              onTagAdd={handleTagAdd}
              onTagRemove={handleTagRemove}
              onExport={handleExport}
              onShare={handleShare}
              onDelete={handleDelete}
            />
          )}
        </div>
      ) : (
        /* 文件管理器模式 */
        <div className="flex-1 overflow-hidden">
          <FileManager />
        </div>
      )}
      
      {/* 底部状态栏 */}
      <Footer
        syncStatus={syncStatus}
        tasks={tasks}
        selectedCount={selectedAssetIds.length}
        totalCount={mockAssets.length}
        storageUsed={mockAssets.reduce((sum, asset) => sum + asset.size, 0)}
        storageTotal={1024 * 1024 * 1024 * 100} // 100GB
      />
    </div>
  );
}

export default App;