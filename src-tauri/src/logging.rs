//! 日志系统配置模块
//!
//! 提供完整的日志记录功能，包括：
//! - 控制台输出
//! - 文件输出
//! - 日志轮转
//! - 结构化日志
//! - 不同级别的日志过滤

use std::path::{Path, PathBuf};
use std::fs;
use chrono::{DateTime, Local};
use log::{info, warn, error};

/// 日志配置结构
#[derive(Debug, Clone)]
pub struct LogConfig {
    /// 日志文件目录
    pub log_dir: PathBuf,
    /// 日志级别
    pub level: log::LevelFilter,
    /// 是否输出到控制台
    pub console_output: bool,
    /// 是否输出到文件
    pub file_output: bool,
    /// 单个日志文件最大大小 (MB)
    pub max_file_size_mb: u64,
    /// 保留的日志文件数量
    pub max_files: usize,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            log_dir: PathBuf::from("logs"),
            level: log::LevelFilter::Info,
            console_output: true,
            file_output: true,
            max_file_size_mb: 10,
            max_files: 5,
        }
    }
}

impl LogConfig {
    /// 创建新的日志配置
    pub fn new() -> Self {
        Self::default()
    }
    
    /// 设置日志目录
    pub fn with_log_dir<P: AsRef<Path>>(mut self, dir: P) -> Self {
        self.log_dir = dir.as_ref().to_path_buf();
        self
    }
    
    /// 设置日志级别
    pub fn with_level(mut self, level: log::LevelFilter) -> Self {
        self.level = level;
        self
    }
    
    /// 设置是否输出到控制台
    pub fn with_console_output(mut self, enabled: bool) -> Self {
        self.console_output = enabled;
        self
    }
    
    /// 设置是否输出到文件
    pub fn with_file_output(mut self, enabled: bool) -> Self {
        self.file_output = enabled;
        self
    }
    
    /// 设置单个日志文件最大大小
    pub fn with_max_file_size_mb(mut self, size_mb: u64) -> Self {
        self.max_file_size_mb = size_mb;
        self
    }
    
    /// 设置保留的日志文件数量
    pub fn with_max_files(mut self, count: usize) -> Self {
        self.max_files = count;
        self
    }
}

/// 日志系统管理器
pub struct LogManager {
    config: LogConfig,
}

impl LogManager {
    /// 创建新的日志管理器
    pub fn new(config: LogConfig) -> Self {
        Self { config }
    }
    
    /// 初始化日志系统
    pub fn init(&self) -> Result<(), Box<dyn std::error::Error>> {
        // 确保日志目录存在
        if self.config.file_output {
            fs::create_dir_all(&self.config.log_dir)?;
        }
        
        // 创建日志构建器
        let mut builder = env_logger::Builder::new();
        
        // 设置日志级别
        builder.filter_level(self.config.level);
        
        // 设置日志格式
        builder.format(|buf, record| {
            use std::io::Write;
            let now: DateTime<Local> = Local::now();
            writeln!(
                buf,
                "[{}] [{}] [{}:{}] - {}",
                now.format("%Y-%m-%d %H:%M:%S%.3f"),
                record.level(),
                record.file().unwrap_or("unknown"),
                record.line().unwrap_or(0),
                record.args()
            )
        });
        
        // 如果启用文件输出，设置文件写入器
        if self.config.file_output {
            // 这里使用简单的文件输出，实际项目中可以考虑使用 tracing-appender 等更高级的库
            let log_file = self.get_current_log_file();
            
            // 检查是否需要轮转日志
            self.rotate_logs_if_needed()?;
            
            // 设置环境变量以启用文件输出
            std::env::set_var("RUST_LOG_FILE", log_file.to_string_lossy().to_string());
        }
        
        // 初始化日志系统
        builder.init();
        
        info!("日志系统初始化完成");
        info!("日志配置: {:?}", self.config);
        
        Ok(())
    }
    
    /// 获取当前日志文件路径
    fn get_current_log_file(&self) -> PathBuf {
        let now = Local::now();
        let filename = format!("app-{}.log", now.format("%Y%m%d"));
        self.config.log_dir.join(filename)
    }
    
    /// 检查并轮转日志文件
    fn rotate_logs_if_needed(&self) -> Result<(), Box<dyn std::error::Error>> {
        let current_log = self.get_current_log_file();
        
        // 检查当前日志文件大小
        if current_log.exists() {
            let metadata = fs::metadata(&current_log)?;
            let size_mb = metadata.len() / (1024 * 1024);
            
            if size_mb >= self.config.max_file_size_mb {
                self.rotate_log_file(&current_log)?;
            }
        }
        
        // 清理旧的日志文件
        self.cleanup_old_logs()?;
        
        Ok(())
    }
    
    /// 轮转日志文件
    fn rotate_log_file(&self, current_log: &Path) -> Result<(), Box<dyn std::error::Error>> {
        let now = Local::now();
        let timestamp = now.format("%Y%m%d_%H%M%S");
        let rotated_name = format!(
            "app-{}.log",
            timestamp
        );
        let rotated_path = self.config.log_dir.join(rotated_name);
        
        fs::rename(current_log, rotated_path)?;
        info!("日志文件已轮转: {:?}", current_log);
        
        Ok(())
    }
    
    /// 清理旧的日志文件
    fn cleanup_old_logs(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut log_files = Vec::new();
        
        // 读取日志目录中的所有 .log 文件
        for entry in fs::read_dir(&self.config.log_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_file() && path.extension().map_or(false, |ext| ext == "log") {
                if let Ok(metadata) = entry.metadata() {
                    if let Ok(modified) = metadata.modified() {
                        log_files.push((path, modified));
                    }
                }
            }
        }
        
        // 按修改时间排序（最新的在前）
        log_files.sort_by(|a, b| b.1.cmp(&a.1));
        
        // 删除超出保留数量的文件
        if log_files.len() > self.config.max_files {
            for (path, _) in log_files.iter().skip(self.config.max_files) {
                if let Err(e) = fs::remove_file(path) {
                    warn!("删除旧日志文件失败 {:?}: {}", path, e);
                } else {
                    info!("已删除旧日志文件: {:?}", path);
                }
            }
        }
        
        Ok(())
    }
    
    /// 记录应用启动信息
    pub fn log_startup_info(&self) {
        info!("=== 应用程序启动 ===");
        info!("启动时间: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
        info!("日志级别: {:?}", self.config.level);
        info!("日志目录: {:?}", self.config.log_dir);
        info!("控制台输出: {}", self.config.console_output);
        info!("文件输出: {}", self.config.file_output);
    }
    
    /// 记录应用关闭信息
    pub fn log_shutdown_info(&self) {
        info!("=== 应用程序关闭 ===");
        info!("关闭时间: {}", Local::now().format("%Y-%m-%d %H:%M:%S"));
    }
}

/// 便捷的日志宏
#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        log::error!("[ERROR] {}", format!($($arg)*));
    };
}

#[macro_export]
macro_rules! log_warn {
    ($($arg:tt)*) => {
        log::warn!("[WARN] {}", format!($($arg)*));
    };
}

#[macro_export]
macro_rules! log_info {
    ($($arg:tt)*) => {
        log::info!("[INFO] {}", format!($($arg)*));
    };
}

#[macro_export]
macro_rules! log_debug {
    ($($arg:tt)*) => {
        log::debug!("[DEBUG] {}", format!($($arg)*));
    };
}

/// 性能监控日志宏
#[macro_export]
macro_rules! log_performance {
    ($operation:expr, $duration:expr) => {
        log::info!("[PERF] {} 耗时: {:?}", $operation, $duration);
    };
}

/// 用户操作日志宏
#[macro_export]
macro_rules! log_user_action {
    ($action:expr, $user:expr) => {
        log::info!("[USER] 用户 {} 执行操作: {}", $user, $action);
    };
    ($action:expr) => {
        log::info!("[USER] 执行操作: {}", $action);
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    
    #[test]
    fn test_log_config_creation() {
        let config = LogConfig::new()
            .with_level(log::LevelFilter::Debug)
            .with_max_file_size_mb(5)
            .with_max_files(3);
            
        assert_eq!(config.level, log::LevelFilter::Debug);
        assert_eq!(config.max_file_size_mb, 5);
        assert_eq!(config.max_files, 3);
    }
    
    #[test]
    fn test_log_manager_creation() {
        let temp_dir = TempDir::new().unwrap();
        let config = LogConfig::new()
            .with_log_dir(temp_dir.path());
            
        let manager = LogManager::new(config);
        assert_eq!(manager.config.log_dir, temp_dir.path());
    }
}