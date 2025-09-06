//! 高级日志系统配置模块
//!
//! 基于 tracing 库提供更强大的日志功能：
//! - 结构化日志记录
//! - 自动文件轮转
//! - JSON 格式输出
//! - 性能追踪
//! - 分层过滤

use std::path::{Path, PathBuf};
use std::fs;
use tracing::{info, warn, error, debug, Level};
use tracing_subscriber::{
    fmt,
    layer::SubscriberExt,
    util::SubscriberInitExt,
    EnvFilter,
    Registry,
    Layer,
};
use tracing_appender::{non_blocking, rolling};
use chrono::Local;

/// 高级日志配置
#[derive(Debug, Clone)]
pub struct AdvancedLogConfig {
    /// 日志文件目录
    pub log_dir: PathBuf,
    /// 应用名称（用于日志文件前缀）
    pub app_name: String,
    /// 日志级别
    pub level: Level,
    /// 是否启用控制台输出
    pub console_enabled: bool,
    /// 是否启用文件输出
    pub file_enabled: bool,
    /// 是否启用JSON格式
    pub json_format: bool,
    /// 文件轮转策略
    pub rotation: RotationStrategy,
    /// 环境过滤器
    pub env_filter: Option<String>,
}

/// 文件轮转策略
#[derive(Debug, Clone)]
pub enum RotationStrategy {
    /// 每小时轮转
    Hourly,
    /// 每天轮转
    Daily,
    /// 永不轮转
    Never,
}

impl Default for AdvancedLogConfig {
    fn default() -> Self {
        Self {
            log_dir: PathBuf::from("logs"),
            app_name: "tauri-app".to_string(),
            level: Level::INFO,
            console_enabled: true,
            file_enabled: true,
            json_format: false,
            rotation: RotationStrategy::Daily,
            env_filter: None,
        }
    }
}

impl AdvancedLogConfig {
    /// 创建新的日志配置
    pub fn new() -> Self {
        Self::default()
    }
    
    /// 设置日志目录
    pub fn with_log_dir<P: AsRef<Path>>(mut self, dir: P) -> Self {
        self.log_dir = dir.as_ref().to_path_buf();
        self
    }
    
    /// 设置应用名称
    pub fn with_app_name<S: Into<String>>(mut self, name: S) -> Self {
        self.app_name = name.into();
        self
    }
    
    /// 设置日志级别
    pub fn with_level(mut self, level: Level) -> Self {
        self.level = level;
        self
    }
    
    /// 设置控制台输出
    pub fn with_console(mut self, enabled: bool) -> Self {
        self.console_enabled = enabled;
        self
    }
    
    /// 设置文件输出
    pub fn with_file(mut self, enabled: bool) -> Self {
        self.file_enabled = enabled;
        self
    }
    
    /// 设置JSON格式
    pub fn with_json_format(mut self, enabled: bool) -> Self {
        self.json_format = enabled;
        self
    }
    
    /// 设置轮转策略
    pub fn with_rotation(mut self, rotation: RotationStrategy) -> Self {
        self.rotation = rotation;
        self
    }
    
    /// 设置环境过滤器
    pub fn with_env_filter<S: Into<String>>(mut self, filter: S) -> Self {
        self.env_filter = Some(filter.into());
        self
    }
}

/// 高级日志管理器
pub struct AdvancedLogManager {
    config: AdvancedLogConfig,
    _guards: Vec<tracing_appender::non_blocking::WorkerGuard>,
}

impl AdvancedLogManager {
    /// 创建新的日志管理器
    pub fn new(config: AdvancedLogConfig) -> Self {
        Self {
            config,
            _guards: Vec::new(),
        }
    }
    
    /// 初始化日志系统
    pub fn init(mut self) -> Result<Self, Box<dyn std::error::Error>> {
        // 确保日志目录存在
        if self.config.file_enabled {
            fs::create_dir_all(&self.config.log_dir)?;
        }
        
        // 设置环境过滤器
        let env_filter = if let Some(filter) = &self.config.env_filter {
            EnvFilter::try_new(filter)?
        } else {
            EnvFilter::from_default_env()
                .add_directive(format!("{}={}", self.config.app_name, self.config.level).parse()?)
        };
        
        // 使用更简单的方法来初始化订阅者
        let mut subscriber = tracing_subscriber::fmt()
            .with_env_filter(env_filter)
            .with_target(true)
            .with_thread_ids(true)
            .with_thread_names(true)
            .with_file(true)
            .with_line_number(true)
            .with_timer(fmt::time::ChronoLocal::rfc_3339());
        
        // 设置输出格式
        if self.config.json_format {
            if self.config.file_enabled {
                let file_appender = match self.config.rotation {
                    RotationStrategy::Hourly => {
                        rolling::hourly(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                    RotationStrategy::Daily => {
                        rolling::daily(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                    RotationStrategy::Never => {
                        rolling::never(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                };
                
                let (non_blocking, guard) = non_blocking(file_appender);
                self._guards.push(guard);
                
                subscriber
                    .json()
                    .with_writer(non_blocking)
                    .with_ansi(false)
                    .init();
            } else {
                subscriber
                    .json()
                    .init();
            }
        } else {
            if self.config.file_enabled {
                let file_appender = match self.config.rotation {
                    RotationStrategy::Hourly => {
                        rolling::hourly(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                    RotationStrategy::Daily => {
                        rolling::daily(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                    RotationStrategy::Never => {
                        rolling::never(&self.config.log_dir, &format!("{}.log", self.config.app_name))
                    },
                };
                
                let (non_blocking, guard) = non_blocking(file_appender);
                self._guards.push(guard);
                
                subscriber
                    .with_writer(non_blocking)
                    .with_ansi(false)
                    .init();
            } else {
                subscriber.init();
            }
        }
        
        // 记录启动信息
        self.log_startup_info();
        
        Ok(self)
    }
    
    /// 记录启动信息
    fn log_startup_info(&self) {
        info!("=== 高级日志系统初始化完成 ===");
        info!(app_name = %self.config.app_name, "应用名称");
        info!(log_dir = %self.config.log_dir.display(), "日志目录");
        info!(level = %self.config.level, "日志级别");
        info!(console_enabled = %self.config.console_enabled, "控制台输出");
        info!(file_enabled = %self.config.file_enabled, "文件输出");
        info!(json_format = %self.config.json_format, "JSON格式");
        info!(rotation = ?self.config.rotation, "轮转策略");
        info!(timestamp = %Local::now().format("%Y-%m-%d %H:%M:%S"), "启动时间");
    }
    
    /// 记录关闭信息
    pub fn log_shutdown_info(&self) {
        info!("=== 应用程序关闭 ===");
        info!(timestamp = %Local::now().format("%Y-%m-%d %H:%M:%S"), "关闭时间");
    }
}

/// 性能监控工具
pub struct PerformanceMonitor {
    operation: String,
    start_time: std::time::Instant,
}

impl PerformanceMonitor {
    /// 开始性能监控
    pub fn start<S: Into<String>>(operation: S) -> Self {
        let operation = operation.into();
        debug!(operation = %operation, "开始性能监控");
        Self {
            operation,
            start_time: std::time::Instant::now(),
        }
    }
    
    /// 结束性能监控并记录结果
    pub fn finish(self) {
        let duration = self.start_time.elapsed();
        info!(
            operation = %self.operation,
            duration_ms = %duration.as_millis(),
            "性能监控完成"
        );
    }
    
    /// 记录中间检查点
    pub fn checkpoint<S: AsRef<str>>(&self, checkpoint: S) {
        let duration = self.start_time.elapsed();
        debug!(
            operation = %self.operation,
            checkpoint = %checkpoint.as_ref(),
            duration_ms = %duration.as_millis(),
            "性能检查点"
        );
    }
}

/// 结构化日志宏
#[macro_export]
macro_rules! log_structured {
    (error, $($field:ident = $value:expr),* $(,)?) => {
        tracing::error!($($field = $value),*);
    };
    (warn, $($field:ident = $value:expr),* $(,)?) => {
        tracing::warn!($($field = $value),*);
    };
    (info, $($field:ident = $value:expr),* $(,)?) => {
        tracing::info!($($field = $value),*);
    };
    (debug, $($field:ident = $value:expr),* $(,)?) => {
        tracing::debug!($($field = $value),*);
    };
}

/// 用户操作日志宏
#[macro_export]
macro_rules! log_user_operation {
    ($operation:expr, $user_id:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::info!(
            operation = %$operation,
            user_id = %$user_id,
            timestamp = %chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
            $($field = $value),*
        );
    };
    ($operation:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::info!(
            operation = %$operation,
            timestamp = %chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
            $($field = $value),*
        );
    };
}

/// 错误日志宏
#[macro_export]
macro_rules! log_error_with_context {
    ($error:expr, $context:expr, $($field:ident = $value:expr),* $(,)?) => {
        tracing::error!(
            error = %$error,
            context = %$context,
            timestamp = %chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
            $($field = $value),*
        );
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_advanced_log_config() {
        let temp_dir = TempDir::new().unwrap();
        let config = AdvancedLogConfig::new()
            .with_log_dir(temp_dir.path())
            .with_app_name("test-app")
            .with_level(Level::DEBUG)
            .with_json_format(true)
            .with_rotation(RotationStrategy::Hourly);
            
        assert_eq!(config.app_name, "test-app");
        assert_eq!(config.level, Level::DEBUG);
        assert!(config.json_format);
        assert!(matches!(config.rotation, RotationStrategy::Hourly));
    }
    
    #[test]
    fn test_performance_monitor() {
        let monitor = PerformanceMonitor::start("test_operation");
        std::thread::sleep(std::time::Duration::from_millis(10));
        monitor.checkpoint("middle");
        std::thread::sleep(std::time::Duration::from_millis(10));
        monitor.finish();
    }
}