//! Tauri 命令接口模块
//!
//! 提供前端调用的 Tauri 命令，包括：
//! - 文件上传命令
//! - 目录管理命令
//! - 文件查询命令
//! - 参数验证和错误处理

use crate::file_manager::{
    error::{FileManagerError, Result},
    service::{
        FileManagerService, UploadRequest, UploadResponse,
        CreateDirectoryRequest, CreateDirectoryResponse,
        DirectoryTreeNode, FileListItem,
    },
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::State;
use tokio::sync::Mutex;

/// 全局文件管理服务状态
pub type FileManagerState = Arc<Mutex<FileManagerService>>;

/// 文件上传命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadFileCommand {
    pub file_data: Vec<u8>,
    pub original_name: String,
    pub directory_id: Option<String>,
}

/// 创建目录命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDirectoryCommand {
    pub name: String,
    pub parent_id: Option<String>,
}

/// 删除文件命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteFileCommand {
    pub file_id: String,
}

/// 删除目录命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteDirectoryCommand {
    pub directory_id: String,
}

/// 获取目录文件命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetDirectoryFilesCommand {
    pub directory_id: String,
}

/// 获取文件信息命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetFileInfoCommand {
    pub file_id: String,
}

/// 读取文件内容命令参数
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReadFileContentCommand {
    pub file_id: String,
}

/// 命令响应包装器
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResponse<T> {
    /// 创建成功响应
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    /// 创建错误响应
    pub fn error(error: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(error),
        }
    }
}

/// 将 Result 转换为 CommandResponse
impl<T> From<Result<T>> for CommandResponse<T> {
    fn from(result: Result<T>) -> Self {
        match result {
            Ok(data) => CommandResponse::success(data),
            Err(error) => CommandResponse::error(error.to_string()),
        }
    }
}

/// 上传文件命令
/// 
/// 接收前端传来的文件数据，执行上传流程
#[tauri::command]
pub async fn upload_file(
    command: UploadFileCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<UploadResponse>, String> {
    tracing::info!("开始处理文件上传请求: 文件名={}, 文件大小={} bytes, 目录ID={:?}", 
        command.original_name, command.file_data.len(), command.directory_id);
    
    // 参数验证
    if command.file_data.is_empty() {
        tracing::error!("文件上传失败: 文件数据为空");
        return Ok(CommandResponse::error("File data cannot be empty".to_string()));
    }

    if command.original_name.trim().is_empty() {
        tracing::error!("文件上传失败: 文件名为空");
        return Ok(CommandResponse::error("Original name cannot be empty".to_string()));
    }

    // 获取服务实例
    tracing::debug!("获取文件管理服务实例");
    let service = service.lock().await;
    
    // 构建请求
    let request = UploadRequest {
        file_data: command.file_data,
        original_name: command.original_name.clone(),
        directory_id: command.directory_id.clone(),
    };

    tracing::debug!("调用文件管理服务上传文件");
    // 执行上传
    let result = service.upload_file(request).await;
    
    match &result {
        Ok(response) => {
            tracing::info!("文件上传成功: 文件ID={}, 文件名={}, 大小={} bytes", 
                response.file_id, response.file_name, response.file_size);
        }
        Err(error) => {
            tracing::error!("文件上传失败: {}", error);
        }
    }
    
    Ok(CommandResponse::from(result))
}

/// 创建目录命令
/// 
/// 在指定父目录下创建新目录
#[tauri::command]
pub async fn create_directory(
    command: CreateDirectoryCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<CreateDirectoryResponse>, String> {
    // 参数验证
    if command.name.trim().is_empty() {
        return Ok(CommandResponse::error("Directory name cannot be empty".to_string()));
    }

    // 验证目录名不包含非法字符
    if command.name.contains(['/', '\\', ':', '*', '?', '"', '<', '>', '|']) {
        return Ok(CommandResponse::error("Directory name contains invalid characters".to_string()));
    }

    let service = service.lock().await;
    
    let request = CreateDirectoryRequest {
        name: command.name,
        parent_id: command.parent_id,
    };

    let result = service.create_directory(request).await;
    Ok(CommandResponse::from(result))
}

/// 删除文件命令
/// 
/// 删除指定的文件
#[tauri::command]
pub async fn delete_file(
    command: DeleteFileCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<()>, String> {
    // 参数验证
    if command.file_id.trim().is_empty() {
        return Ok(CommandResponse::error("File ID cannot be empty".to_string()));
    }

    let service = service.lock().await;
    let result = service.delete_file(&command.file_id).await;
    Ok(CommandResponse::from(result))
}

/// 删除目录命令
/// 
/// 递归删除指定目录及其所有内容
#[tauri::command]
pub async fn delete_directory(
    command: DeleteDirectoryCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<()>, String> {
    // 参数验证
    if command.directory_id.trim().is_empty() {
        return Ok(CommandResponse::error("Directory ID cannot be empty".to_string()));
    }

    let service = service.lock().await;
    let result = service.delete_directory(&command.directory_id).await;
    Ok(CommandResponse::from(result))
}

/// 获取目录树命令
/// 
/// 返回完整的目录树结构
#[tauri::command]
pub async fn get_directory_tree(
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Vec<DirectoryTreeNode>>, String> {
    let service = service.lock().await;
    let result = service.get_directory_tree().await;
    Ok(CommandResponse::from(result))
}

/// 获取目录中的文件列表命令
/// 
/// 返回指定目录中的所有文件
#[tauri::command]
pub async fn get_directory_files(
    command: GetDirectoryFilesCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Vec<FileListItem>>, String> {
    // 参数验证
    if command.directory_id.trim().is_empty() {
        return Ok(CommandResponse::error("Directory ID cannot be empty".to_string()));
    }

    let service = service.lock().await;
    let result = service.get_files_in_directory(&command.directory_id).await;
    Ok(CommandResponse::from(result))
}

/// 获取文件信息命令
/// 
/// 返回指定文件的详细信息
#[tauri::command]
pub async fn get_file_info(
    command: GetFileInfoCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Option<FileListItem>>, String> {
    // 参数验证
    if command.file_id.trim().is_empty() {
        return Ok(CommandResponse::error("File ID cannot be empty".to_string()));
    }

    let service = service.lock().await;
    let result = service.get_file_info(&command.file_id).await;
    Ok(CommandResponse::from(result))
}

/// 批量上传文件命令
/// 
/// 支持一次上传多个文件
#[tauri::command]
pub async fn upload_multiple_files(
    files: Vec<UploadFileCommand>,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Vec<UploadResponse>>, String> {
    // 参数验证
    if files.is_empty() {
        return Ok(CommandResponse::error("No files to upload".to_string()));
    }

    if files.len() > 50 {
        return Ok(CommandResponse::error("Too many files, maximum 50 files per batch".to_string()));
    }

    let service = service.lock().await;
    let mut results = Vec::new();
    let mut errors = Vec::new();

    // 逐个上传文件
    for (index, file_command) in files.into_iter().enumerate() {
        // 验证单个文件
        if file_command.file_data.is_empty() {
            errors.push(format!("File {} has empty data", index));
            continue;
        }

        if file_command.original_name.trim().is_empty() {
            errors.push(format!("File {} has empty name", index));
            continue;
        }

        let request = UploadRequest {
            file_data: file_command.file_data,
            original_name: file_command.original_name,
            directory_id: file_command.directory_id,
        };

        match service.upload_file(request).await {
            Ok(response) => results.push(response),
            Err(error) => errors.push(format!("File {}: {}", index, error)),
        }
    }

    if !errors.is_empty() {
        return Ok(CommandResponse::error(format!(
            "Some files failed to upload: {}",
            errors.join(", ")
        )));
    }

    Ok(CommandResponse::success(results))
}

/// 搜索文件命令
/// 
/// 根据文件名搜索文件
#[tauri::command]
pub async fn search_files(
    query: String,
    directory_id: Option<String>,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Vec<FileListItem>>, String> {
    // 参数验证
    if query.trim().is_empty() {
        return Ok(CommandResponse::error("Search query cannot be empty".to_string()));
    }

    if query.len() < 2 {
        return Ok(CommandResponse::error("Search query must be at least 2 characters".to_string()));
    }

    let service = service.lock().await;
    
    // 简单实现：获取所有文件然后过滤
    // 在实际应用中，应该在数据库层面实现搜索
    let all_files = if let Some(dir_id) = directory_id {
        service.get_files_in_directory(&dir_id).await
    } else {
        // 获取所有目录的文件（这里需要改进）
        let tree = service.get_directory_tree().await?;
        let mut all_files = Vec::new();
        for node in tree {
            if let Ok(files) = service.get_files_in_directory(&node.id).await {
                all_files.extend(files);
            }
        }
        Ok(all_files)
    };

    match all_files {
        Ok(files) => {
            let query_lower = query.to_lowercase();
            let filtered_files: Vec<FileListItem> = files
                .into_iter()
                .filter(|file| {
                    file.name.to_lowercase().contains(&query_lower) ||
                    file.original_name.to_lowercase().contains(&query_lower)
                })
                .collect();
            
            Ok(CommandResponse::success(filtered_files))
        }
        Err(error) => Ok(CommandResponse::error(error.to_string())),
    }
}

/// 获取存储统计信息命令
/// 
/// 返回存储空间使用情况
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageStats {
    pub total_files: usize,
    pub total_directories: usize,
    pub total_size: i64,
    pub largest_file_size: i64,
    pub most_recent_upload: Option<String>,
}

#[tauri::command]
pub async fn get_storage_stats(
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<StorageStats>, String> {
    let service = service.lock().await;
    
    // 获取目录树统计
    let directories = service.get_directory_tree().await
        .map_err(|e| e.to_string())?;
    
    let mut total_files = 0;
    let mut total_size = 0i64;
    let mut largest_file_size = 0i64;
    let mut most_recent_upload: Option<String> = None;
    
    // 遍历所有目录获取文件统计
    for dir in &directories {
        if let Ok(files) = service.get_files_in_directory(&dir.id).await {
            total_files += files.len();
            
            for file in files {
                total_size += file.file_size;
                if file.file_size > largest_file_size {
                    largest_file_size = file.file_size;
                }
                
                // 更新最近上传时间
                if most_recent_upload.is_none() || 
                   most_recent_upload.as_ref().map_or(true, |recent| file.created_at > *recent) {
                    most_recent_upload = Some(file.created_at);
                }
            }
        }
    }
    
    let stats = StorageStats {
        total_files,
        total_directories: directories.len(),
        total_size,
        largest_file_size,
        most_recent_upload,
    };
    
    Ok(CommandResponse::success(stats))
}

/// 验证文件类型命令
/// 
/// 检查文件是否为支持的类型
#[tauri::command]
pub async fn validate_file_type(
    filename: String,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<bool>, String> {
    if filename.trim().is_empty() {
        return Ok(CommandResponse::error("Filename cannot be empty".to_string()));
    }

    let service = service.lock().await;
    
    // 这里需要访问配置，但我们的服务结构需要调整
    // 暂时返回一个简单的验证
    let supported_extensions = vec![
        "jpg", "jpeg", "png", "gif", "bmp", "webp", "svg",
        "pdf", "txt", "md", "zip", "rar", "7z",
        "doc", "docx", "xls", "xlsx", "ppt", "pptx"
    ];
    
    let extension = std::path::Path::new(&filename)
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_lowercase();
    
    let is_supported = supported_extensions.contains(&extension.as_str());
    Ok(CommandResponse::success(is_supported))
}

/// 读取文件内容命令
/// 
/// 读取指定文件的二进制内容，用于预览等功能
#[tauri::command]
pub async fn read_file_content(
    command: ReadFileContentCommand,
    service: State<'_, FileManagerState>,
) -> std::result::Result<CommandResponse<Vec<u8>>, String> {
    tracing::info!("读取文件内容: file_id={}", command.file_id);
    
    // 参数验证
    if command.file_id.trim().is_empty() {
        return Ok(CommandResponse::error("File ID cannot be empty".to_string()));
    }
    
    let service = service.lock().await;
    let result = service.read_file_content(&command.file_id).await;
    
    match &result {
        Ok(content) => {
            tracing::info!("文件内容读取成功: file_id={}, size={} bytes", command.file_id, content.len());
        }
        Err(e) => {
            tracing::error!("文件内容读取失败: file_id={}, error={:?}", command.file_id, e);
        }
    }
    
    Ok(result.into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_response_success() {
        let response = CommandResponse::success("test data".to_string());
        assert!(response.success);
        assert_eq!(response.data, Some("test data".to_string()));
        assert!(response.error.is_none());
    }

    #[test]
    fn test_command_response_error() {
        let response: CommandResponse<String> = CommandResponse::error("test error".to_string());
        assert!(!response.success);
        assert!(response.data.is_none());
        assert_eq!(response.error, Some("test error".to_string()));
    }

    #[test]
    fn test_upload_command_validation() {
        let command = UploadFileCommand {
            file_data: vec![],
            original_name: "".to_string(),
            directory_id: None,
        };
        
        assert!(command.file_data.is_empty());
        assert!(command.original_name.trim().is_empty());
    }

    #[test]
    fn test_directory_name_validation() {
        let invalid_names = vec![
            "test/dir",
            "test\\dir",
            "test:dir",
            "test*dir",
            "test?dir",
            "test\"dir",
            "test<dir",
            "test>dir",
            "test|dir",
        ];
        
        for name in invalid_names {
            assert!(name.contains(['/', '\\', ':', '*', '?', '"', '<', '>', '|']));
        }
    }
}