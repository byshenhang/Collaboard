//! 文件管理系统错误处理模块
//!
//! 定义了文件管理系统中可能出现的所有错误类型，
//! 并提供统一的错误处理机制。

use thiserror::Error;

/// 文件管理系统错误类型
#[derive(Error, Debug)]
pub enum FileManagerError {
    /// 数据库操作错误
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    /// 文件系统操作错误
    #[error("File system error: {0}")]
    FileSystem(#[from] std::io::Error),

    /// 文件不存在错误
    #[error("File not found: {path}")]
    FileNotFound { path: String },

    /// 目录不存在错误
    #[error("Directory not found: {path}")]
    DirectoryNotFound { path: String },

    /// 文件类型不支持错误
    #[error("Unsupported file type: {file_type}")]
    UnsupportedFileType { file_type: String },

    /// 文件大小超限错误
    #[error("File size exceeds limit: {size} bytes (max: {max_size} bytes)")]
    FileSizeExceeded { size: u64, max_size: u64 },

    /// 权限不足错误
    #[error("Permission denied: {operation}")]
    PermissionDenied { operation: String },

    /// 配置错误
    #[error("Configuration error: {message}")]
    Configuration { message: String },

    /// 序列化/反序列化错误
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    /// UUID 解析错误
    #[error("UUID parse error: {0}")]
    UuidParse(#[from] uuid::Error),

    /// 通用错误
    #[error("General error: {message}")]
    General { message: String },
}

/// 文件管理系统结果类型
pub type Result<T> = std::result::Result<T, FileManagerError>;

impl FileManagerError {
    /// 创建配置错误
    pub fn config_error(message: impl Into<String>) -> Self {
        Self::Configuration {
            message: message.into(),
        }
    }

    /// 创建通用错误
    pub fn general_error(message: impl Into<String>) -> Self {
        Self::General {
            message: message.into(),
        }
    }

    /// 检查是否为数据库错误
    pub fn is_database_error(&self) -> bool {
        matches!(self, Self::Database(_))
    }

    /// 检查是否为文件系统错误
    pub fn is_filesystem_error(&self) -> bool {
        matches!(self, Self::FileSystem(_))
    }

    /// 检查是否为权限错误
    pub fn is_permission_error(&self) -> bool {
        matches!(self, Self::PermissionDenied { .. })
    }
}

/// 将错误转换为 Tauri 可以处理的字符串格式
impl From<FileManagerError> for String {
    fn from(error: FileManagerError) -> Self {
        error.to_string()
    }
}