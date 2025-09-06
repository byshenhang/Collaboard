//! 配置加载模块
//!
//! 负责从配置文件加载日志和应用配置

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::fs;
use tracing::Level;
use crate::advanced_logging::{AdvancedLogConfig, RotationStrategy};

/// 完整的应用配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub logging: LoggingConfig,
}

/// 日志配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub app_name: String,
    pub level: String,
    pub log_dir: String,
    pub console_enabled: bool,
    pub file_enabled: bool,
    pub json_format: bool,
    pub rotation: String,
    pub env_filter: String,
    pub performance: PerformanceConfig,
    pub user_actions: UserActionsConfig,
    pub error_handling: ErrorHandlingConfig,
    pub file_operations: FileOperationsConfig,
    pub system_monitoring: SystemMonitoringConfig,
    pub development: DevelopmentConfig,
}

/// 性能监控配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub enabled: bool,
    pub threshold_ms: u64,
}

/// 用户操作配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserActionsConfig {
    pub enabled: bool,
    pub log_sensitive_operations: bool,
}

/// 错误处理配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ErrorHandlingConfig {
    pub detailed_errors: bool,
    pub include_stack_trace: bool,
    pub log_retry_attempts: bool,
}

/// 文件操作配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileOperationsConfig {
    pub enabled: bool,
    pub level: String,
    pub log_file_hash: bool,
}

/// 系统监控配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemMonitoringConfig {
    pub enabled: bool,
    pub interval_seconds: u64,
    pub thresholds: SystemThresholds,
}

/// 系统阈值配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemThresholds {
    pub cpu_warning: f64,
    pub cpu_critical: f64,
    pub memory_warning: f64,
    pub memory_critical: f64,
    pub disk_warning: f64,
    pub disk_critical: f64,
}

/// 开发配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DevelopmentConfig {
    pub verbose_debug: bool,
    pub log_sql_queries: bool,
    pub log_http_traffic: bool,
    pub colored_output: bool,
}

/// 配置加载器
pub struct ConfigLoader;

impl ConfigLoader {
    /// 从文件加载配置
    pub fn load_from_file<P: AsRef<Path>>(path: P) -> Result<AppConfig, Box<dyn std::error::Error>> {
        let content = fs::read_to_string(path)?;
        let config: AppConfig = toml::from_str(&content)?;
        Ok(config)
    }
    
    /// 加载默认配置
    pub fn load_default() -> AppConfig {
        AppConfig {
            logging: LoggingConfig {
                app_name: "collaboard".to_string(),
                level: "INFO".to_string(),
                log_dir: "logs".to_string(),
                console_enabled: true,
                file_enabled: true,
                json_format: false,
                rotation: "daily".to_string(),
                env_filter: "collaboard=debug,tauri=info".to_string(),
                performance: PerformanceConfig {
                    enabled: true,
                    threshold_ms: 100,
                },
                user_actions: UserActionsConfig {
                    enabled: true,
                    log_sensitive_operations: true,
                },
                error_handling: ErrorHandlingConfig {
                    detailed_errors: true,
                    include_stack_trace: true,
                    log_retry_attempts: true,
                },
                file_operations: FileOperationsConfig {
                    enabled: true,
                    level: "INFO".to_string(),
                    log_file_hash: false,
                },
                system_monitoring: SystemMonitoringConfig {
                    enabled: true,
                    interval_seconds: 300,
                    thresholds: SystemThresholds {
                        cpu_warning: 80.0,
                        cpu_critical: 95.0,
                        memory_warning: 85.0,
                        memory_critical: 95.0,
                        disk_warning: 90.0,
                        disk_critical: 98.0,
                    },
                },
                development: DevelopmentConfig {
                    verbose_debug: true,
                    log_sql_queries: true,
                    log_http_traffic: false,
                    colored_output: true,
                },
            },
        }
    }
    
    /// 尝试加载配置，失败时使用默认配置
    pub fn load_or_default<P: AsRef<Path>>(path: P) -> AppConfig {
        match Self::load_from_file(path) {
            Ok(config) => {
                tracing::info!("配置文件加载成功");
                config
            },
            Err(e) => {
                tracing::warn!(error = %e, "配置文件加载失败，使用默认配置");
                Self::load_default()
            }
        }
    }
    
    /// 保存配置到文件
    pub fn save_to_file<P: AsRef<Path>>(config: &AppConfig, path: P) -> Result<(), Box<dyn std::error::Error>> {
        let content = toml::to_string_pretty(config)?;
        fs::write(path, content)?;
        Ok(())
    }
}

/// 配置转换工具
impl LoggingConfig {
    /// 转换为高级日志配置
    pub fn to_advanced_log_config(&self) -> Result<AdvancedLogConfig, Box<dyn std::error::Error>> {
        let level = match self.level.to_uppercase().as_str() {
            "TRACE" => Level::TRACE,
            "DEBUG" => Level::DEBUG,
            "INFO" => Level::INFO,
            "WARN" => Level::WARN,
            "ERROR" => Level::ERROR,
            _ => return Err(format!("无效的日志级别: {}", self.level).into()),
        };
        
        let rotation = match self.rotation.to_lowercase().as_str() {
            "hourly" => RotationStrategy::Hourly,
            "daily" => RotationStrategy::Daily,
            "never" => RotationStrategy::Never,
            _ => return Err(format!("无效的轮转策略: {}", self.rotation).into()),
        };
        
        Ok(AdvancedLogConfig::new()
            .with_app_name(&self.app_name)
            .with_level(level)
            .with_log_dir(&self.log_dir)
            .with_console(self.console_enabled)
            .with_file(self.file_enabled)
            .with_json_format(self.json_format)
            .with_rotation(rotation)
            .with_env_filter(&self.env_filter))
    }
}

/// 配置验证器
pub struct ConfigValidator;

impl ConfigValidator {
    /// 验证配置的有效性
    pub fn validate(config: &AppConfig) -> Result<(), Vec<String>> {
        let mut errors = Vec::new();
        
        // 验证日志级别
        if !matches!(config.logging.level.to_uppercase().as_str(), "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR") {
            errors.push(format!("无效的日志级别: {}", config.logging.level));
        }
        
        // 验证轮转策略
        if !matches!(config.logging.rotation.to_lowercase().as_str(), "hourly" | "daily" | "never") {
            errors.push(format!("无效的轮转策略: {}", config.logging.rotation));
        }
        
        // 验证日志目录
        if config.logging.log_dir.is_empty() {
            errors.push("日志目录不能为空".to_string());
        }
        
        // 验证应用名称
        if config.logging.app_name.is_empty() {
            errors.push("应用名称不能为空".to_string());
        }
        
        // 验证性能阈值
        if config.logging.performance.threshold_ms == 0 {
            errors.push("性能监控阈值必须大于0".to_string());
        }
        
        // 验证系统监控间隔
        if config.logging.system_monitoring.interval_seconds == 0 {
            errors.push("系统监控间隔必须大于0".to_string());
        }
        
        // 验证系统阈值
        let thresholds = &config.logging.system_monitoring.thresholds;
        if thresholds.cpu_warning >= thresholds.cpu_critical {
            errors.push("CPU警告阈值必须小于临界阈值".to_string());
        }
        if thresholds.memory_warning >= thresholds.memory_critical {
            errors.push("内存警告阈值必须小于临界阈值".to_string());
        }
        if thresholds.disk_warning >= thresholds.disk_critical {
            errors.push("磁盘警告阈值必须小于临界阈值".to_string());
        }
        
        if errors.is_empty() {
            Ok(())
        } else {
            Err(errors)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;
    use std::io::Write;
    
    #[test]
    fn test_load_default_config() {
        let config = ConfigLoader::load_default();
        assert_eq!(config.logging.app_name, "collaboard");
        assert_eq!(config.logging.level, "INFO");
        assert!(config.logging.console_enabled);
        assert!(config.logging.file_enabled);
    }
    
    #[test]
    fn test_config_validation() {
        let config = ConfigLoader::load_default();
        let result = ConfigValidator::validate(&config);
        assert!(result.is_ok());
    }
    
    #[test]
    fn test_invalid_config_validation() {
        let mut config = ConfigLoader::load_default();
        config.logging.level = "INVALID".to_string();
        config.logging.app_name = "".to_string();
        
        let result = ConfigValidator::validate(&config);
        assert!(result.is_err());
        
        let errors = result.unwrap_err();
        assert!(errors.len() >= 2);
    }
    
    #[test]
    fn test_save_and_load_config() {
        let config = ConfigLoader::load_default();
        
        let mut temp_file = NamedTempFile::new().unwrap();
        let temp_path = temp_file.path().to_path_buf();
        
        // 保存配置
        ConfigLoader::save_to_file(&config, &temp_path).unwrap();
        
        // 加载配置
        let loaded_config = ConfigLoader::load_from_file(&temp_path).unwrap();
        
        assert_eq!(config.logging.app_name, loaded_config.logging.app_name);
        assert_eq!(config.logging.level, loaded_config.logging.level);
    }
    
    #[test]
    fn test_to_advanced_log_config() {
        let config = ConfigLoader::load_default();
        let advanced_config = config.logging.to_advanced_log_config().unwrap();
        
        assert_eq!(advanced_config.app_name, "collaboard");
        assert_eq!(advanced_config.level, Level::INFO);
    }
}