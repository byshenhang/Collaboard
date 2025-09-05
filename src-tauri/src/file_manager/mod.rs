//! 文件管理系统模块
//! 
//! 提供完整的文件和目录管理功能，包括：
//! - 数据库操作服务
//! - 文件系统操作服务  
//! - 核心业务逻辑服务
//! - Tauri 命令接口
//! - 错误处理和配置管理

pub mod config;
pub mod database;
pub mod error;
pub mod filesystem;
pub mod service;
pub mod commands;

// 重新导出主要类型和函数
pub use config::FileManagerConfig;
pub use database::DatabaseService;
pub use error::{FileManagerError, Result};
pub use filesystem::FileSystemService;
pub use service::FileManagerService;
pub use commands::*;

/// 初始化文件管理系统
/// 
/// 创建必要的目录结构，初始化数据库，并返回配置好的服务实例
pub async fn initialize() -> Result<FileManagerService> {
    let config = FileManagerConfig::new().await?;
    let db_service = DatabaseService::new(&config.database_path).await?;
    let fs_service = FileSystemService::new(&config.storage_path)?;
    
    Ok(FileManagerService::new(db_service, fs_service))
}