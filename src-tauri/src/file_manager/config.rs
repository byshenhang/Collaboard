//! 文件管理系统配置模块
//!
//! 负责管理文件管理系统的配置信息，包括：
//! - 数据库文件路径
//! - 文件存储路径
//! - 系统限制参数
//! - 应用数据目录初始化

use crate::file_manager::error::{FileManagerError, Result};
use std::path::{Path, PathBuf};
use tokio::fs;

/// 文件管理系统配置
#[derive(Debug, Clone)]
pub struct FileManagerConfig {
    /// 应用数据根目录
    pub app_data_dir: PathBuf,
    /// 数据库文件路径
    pub database_path: PathBuf,
    /// 文件存储根目录
    pub storage_path: PathBuf,
    /// 最大文件大小 (字节)
    pub max_file_size: u64,
    /// 支持的文件类型
    pub supported_file_types: Vec<String>,
}

impl FileManagerConfig {
    /// 创建新的配置实例
    /// 
    /// 自动检测应用数据目录，创建必要的目录结构
    pub async fn new() -> Result<Self> {
        let app_data_dir = Self::get_app_data_dir()?;
        
        // 确保应用数据目录存在
        fs::create_dir_all(&app_data_dir).await.map_err(|e| {
            FileManagerError::config_error(format!(
                "Failed to create app data directory {}: {}",
                app_data_dir.display(),
                e
            ))
        })?;

        let database_path = app_data_dir.join("file_manager.db");
        let storage_path = app_data_dir.join("files");

        // 确保文件存储目录存在
        fs::create_dir_all(&storage_path).await.map_err(|e| {
            FileManagerError::config_error(format!(
                "Failed to create storage directory {}: {}",
                storage_path.display(),
                e
            ))
        })?;

        Ok(Self {
            app_data_dir,
            database_path,
            storage_path,
            max_file_size: 100 * 1024 * 1024, // 100MB
            supported_file_types: Self::default_supported_types(),
        })
    }

    /// 获取应用数据目录
    /// 
    /// 在 Windows 上通常是 %APPDATA%/Collaboard
    fn get_app_data_dir() -> Result<PathBuf> {
        // 尝试使用环境变量获取应用数据目录
        if let Ok(app_data) = std::env::var("APPDATA") {
            return Ok(Path::new(&app_data).join("Collaboard"));
        }

        // 备用方案：使用用户主目录
        if let Ok(home) = std::env::var("USERPROFILE") {
            return Ok(Path::new(&home).join("AppData").join("Roaming").join("Collaboard"));
        }

        // 最后备用方案：使用当前目录
        std::env::current_dir()
            .map(|dir| dir.join("data"))
            .map_err(|e| {
                FileManagerError::config_error(format!(
                    "Failed to determine app data directory: {}",
                    e
                ))
            })
    }

    /// 获取默认支持的文件类型
    fn default_supported_types() -> Vec<String> {
        vec![
            // 图片格式
            "jpg".to_string(),
            "jpeg".to_string(),
            "png".to_string(),
            "gif".to_string(),
            "bmp".to_string(),
            "webp".to_string(),
            "svg".to_string(),
            "tiff".to_string(),
            "tga".to_string(),
            // 文档格式
            "pdf".to_string(),
            "txt".to_string(),
            "md".to_string(),
            "doc".to_string(),
            "docx".to_string(),
            // 其他常见格式
            "zip".to_string(),
            "rar".to_string(),
            "7z".to_string(),
        ]
    }

    /// 检查文件类型是否支持
    pub fn is_file_type_supported(&self, file_path: &Path) -> bool {
        if let Some(extension) = file_path.extension() {
            if let Some(ext_str) = extension.to_str() {
                return self.supported_file_types.contains(&ext_str.to_lowercase());
            }
        }
        false
    }

    /// 检查文件大小是否在限制范围内
    pub fn is_file_size_valid(&self, size: u64) -> bool {
        size <= self.max_file_size
    }

    /// 获取相对于存储根目录的子目录路径
    /// 
    /// 按日期组织文件：YYYY/MM/DD
    pub fn get_storage_subdir(&self) -> PathBuf {
        let now = chrono::Local::now();
        self.storage_path.join(format!(
            "{:04}/{:02}/{:02}",
            now.year(),
            now.month(),
            now.day()
        ))
    }

    /// 生成唯一的文件名
    /// 
    /// 保持原始扩展名，使用 UUID 作为文件名
    pub fn generate_unique_filename(&self, original_name: &str) -> String {
        let path = Path::new(original_name);
        let extension = path.extension()
            .and_then(|ext| ext.to_str())
            .unwrap_or("");
        
        let uuid = uuid::Uuid::new_v4();
        
        if extension.is_empty() {
            uuid.to_string()
        } else {
            format!("{}.{}", uuid, extension)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_config_creation() {
        let config = FileManagerConfig::new().await;
        assert!(config.is_ok());
        
        let config = config.unwrap();
        assert!(config.database_path.exists() || config.database_path.parent().unwrap().exists());
        assert!(config.storage_path.exists());
    }

    #[test]
    fn test_file_type_support() {
        let config = FileManagerConfig {
            app_data_dir: PathBuf::new(),
            database_path: PathBuf::new(),
            storage_path: PathBuf::new(),
            max_file_size: 1024,
            supported_file_types: vec!["jpg".to_string(), "png".to_string()],
        };

        assert!(config.is_file_type_supported(Path::new("test.jpg")));
        assert!(config.is_file_type_supported(Path::new("test.PNG")));
        assert!(!config.is_file_type_supported(Path::new("test.exe")));
    }

    #[test]
    fn test_file_size_validation() {
        let config = FileManagerConfig {
            app_data_dir: PathBuf::new(),
            database_path: PathBuf::new(),
            storage_path: PathBuf::new(),
            max_file_size: 1024,
            supported_file_types: vec![],
        };

        assert!(config.is_file_size_valid(512));
        assert!(config.is_file_size_valid(1024));
        assert!(!config.is_file_size_valid(2048));
    }

    #[test]
    fn test_unique_filename_generation() {
        let config = FileManagerConfig {
            app_data_dir: PathBuf::new(),
            database_path: PathBuf::new(),
            storage_path: PathBuf::new(),
            max_file_size: 1024,
            supported_file_types: vec![],
        };

        let filename1 = config.generate_unique_filename("test.jpg");
        let filename2 = config.generate_unique_filename("test.jpg");
        
        assert_ne!(filename1, filename2);
        assert!(filename1.ends_with(".jpg"));
        assert!(filename2.ends_with(".jpg"));
    }
}