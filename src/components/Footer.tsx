import { 
  CloudArrowUpIcon, 
  CloudArrowDownIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * 同步状态枚举
 */
export type SyncStatus = 'idle' | 'syncing' | 'uploading' | 'downloading' | 'error' | 'success';

/**
 * 任务状态接口
 */
export interface Task {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'running' | 'completed' | 'error';
}

/**
 * Footer组件属性接口
 */
interface FooterProps {
  /** 同步状态 */
  syncStatus: SyncStatus;
  /** 同步消息 */
  syncMessage?: string;
  /** 当前任务列表 */
  tasks: Task[];
  /** 选中的资源数量 */
  selectedCount: number;
  /** 总资源数量 */
  totalCount: number;
  /** 存储使用情况 */
  storageUsed?: number;
  /** 存储总量 */
  storageTotal?: number;
}

/**
 * 获取同步状态图标和颜色
 */
function getSyncStatusIcon(status: SyncStatus) {
  switch (status) {
    case 'uploading':
      return { icon: <CloudArrowUpIcon className="w-4 h-4" />, color: 'text-info' };
    case 'downloading':
      return { icon: <CloudArrowDownIcon className="w-4 h-4" />, color: 'text-info' };
    case 'syncing':
      return { icon: <div className="loading loading-spinner loading-xs" />, color: 'text-info' };
    case 'error':
      return { icon: <ExclamationTriangleIcon className="w-4 h-4" />, color: 'text-error' };
    case 'success':
      return { icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-success' };
    default:
      return { icon: <CheckCircleIcon className="w-4 h-4" />, color: 'text-base-content/60' };
  }
}

/**
 * 格式化存储大小
 */
function formatStorageSize(bytes?: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * 任务进度组件
 */
function TaskProgress({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      {/* 任务状态图标 */}
      <div className="flex-shrink-0">
        {task.status === 'running' ? (
          <div className="loading loading-spinner loading-xs" />
        ) : task.status === 'completed' ? (
          <CheckCircleIcon className="w-4 h-4 text-success" />
        ) : task.status === 'error' ? (
          <ExclamationTriangleIcon className="w-4 h-4 text-error" />
        ) : (
          <ClockIcon className="w-4 h-4 text-base-content/60" />
        )}
      </div>
      
      {/* 任务名称 */}
      <span className="text-sm truncate flex-1" title={task.name}>
        {task.name}
      </span>
      
      {/* 进度条 */}
      {task.status === 'running' && (
        <div className="flex items-center gap-2 flex-shrink-0">
          <progress 
            className="progress progress-primary w-16 h-2" 
            value={task.progress} 
            max={100}
          />
          <span className="text-xs text-base-content/60 w-8">
            {task.progress}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 底部状态栏组件
 * 显示同步状态、任务进度、选中数量等信息
 * @param props Footer组件属性
 * @returns JSX.Element
 */
export default function Footer({
  syncStatus,
  syncMessage,
  tasks,
  selectedCount,
  totalCount,
  storageUsed,
  storageTotal
}: FooterProps) {
  const { icon: syncIcon, color: syncColor } = getSyncStatusIcon(syncStatus);
  const runningTasks = tasks.filter(task => task.status === 'running');
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const errorTasks = tasks.filter(task => task.status === 'error');

  return (
    <footer className="h-10 bg-gradient-to-r from-base-100 to-base-200/50 border-t border-base-300/50 flex items-center justify-between px-6 text-xs shadow-sm backdrop-blur-sm">
      {/* 左侧：同步状态 */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 ${syncColor}`}>
          {syncIcon}
          <span className="font-medium">
            {syncStatus === 'idle' ? '已同步' :
             syncStatus === 'syncing' ? '同步中' :
             syncStatus === 'uploading' ? '上传中' :
             syncStatus === 'downloading' ? '下载中' :
             syncStatus === 'error' ? '同步错误' :
             syncStatus === 'success' ? '同步完成' : '未知状态'}
          </span>
        </div>
        
        {syncMessage && (
          <div className="badge badge-sm badge-outline">
            {syncMessage}
          </div>
        )}
      </div>

      {/* 中间：任务状态 */}
      <div className="flex items-center gap-4">
        {runningTasks.length > 0 && (
          <div className="flex items-center gap-2">
            {runningTasks.slice(0, 2).map((task) => (
              <div key={task.id} className="badge badge-sm badge-info gap-1">
                <div className="loading loading-spinner loading-xs" />
                <span className="truncate max-w-20">{task.name}</span>
                <span>{task.progress}%</span>
              </div>
            ))}
            
            {runningTasks.length > 2 && (
              <div className="badge badge-sm badge-ghost">
                +{runningTasks.length - 2}
              </div>
            )}
          </div>
        )}

        {tasks.length > 0 && (
          <div className="flex items-center gap-2">
            {completedTasks.length > 0 && (
              <div className="badge badge-sm badge-success">
                ✓ {completedTasks.length}
              </div>
            )}
            {errorTasks.length > 0 && (
              <div className="badge badge-sm badge-error">
                ✗ {errorTasks.length}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 右侧：统计信息 */}
      <div className="flex items-center gap-4">
        <div className="stats stats-horizontal shadow-sm bg-base-100/50">
          <div className="stat py-1 px-3">
            <div className="stat-value text-xs text-primary">{selectedCount}</div>
            <div className="stat-desc text-xs">已选择</div>
          </div>
          <div className="stat py-1 px-3">
            <div className="stat-value text-xs text-secondary">{totalCount}</div>
            <div className="stat-desc text-xs">总计</div>
          </div>
        </div>
        
        {storageUsed !== undefined && storageTotal !== undefined && (
          <div className="tooltip tooltip-top" data-tip={`已使用 ${formatStorageSize(storageUsed)} / 总容量 ${formatStorageSize(storageTotal)}`}>
            <div className="flex items-center gap-2">
              <div className="w-16 bg-base-300 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-300"
                  style={{ width: `${Math.min((storageUsed / storageTotal) * 100, 100)}%` }}
                />
              </div>
              <span className="text-base-content/70 font-medium text-xs">
                {Math.round((storageUsed / storageTotal) * 100)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </footer>
  );
}