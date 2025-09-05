//! 文件系统服务模块
//!
//! 提供文件系统操作功能，包括：
//! - 文件上传和保存
//! - 文件删除和移动
//! - 目录创建和删除
//! - 文件类型检测和验证
//! - 大文件处理和进度跟踪

use crate::file_manager::error::{FileManagerError, Result};
use std::path::{Path, PathBuf};
use tokio::fs;
use tokio::io::{AsyncReadExt, AsyncWriteExt};

/// 文件上传信息
#[derive(Debug, Clone)]
pub struct UploadInfo {
    pub original_name: String,
    pub file_size: u64,
    pub mime_type: String,
    pub saved_path: PathBuf,
    pub unique_name: String,
}

/// 文件系统服务
pub struct FileSystemService {
    storage_root: PathBuf,
}

impl FileSystemService {
    /// 创建新的文件系统服务实例
    pub fn new(storage_root: &Path) -> Result<Self> {
        Ok(Self {
            storage_root: storage_root.to_path_buf(),
        })
    }

    /// 保存上传的文件
    /// 
    /// 将文件数据保存到指定的存储目录，并返回文件信息
    pub async fn save_file(
        &self,
        file_data: &[u8],
        original_name: &str,
        target_dir: &Path,
    ) -> Result<UploadInfo> {
        // 验证文件大小
        if file_data.is_empty() {
            return Err(FileManagerError::general_error("File data is empty"));
        }

        // 检测文件类型
        let mime_type = self.detect_mime_type(original_name, file_data);
        
        // 生成唯一文件名
        let unique_name = self.generate_unique_filename(original_name);
        
        // 确保目标目录存在
        let full_target_dir = self.storage_root.join(target_dir);
        fs::create_dir_all(&full_target_dir).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        // 构建完整的文件路径
        let file_path = full_target_dir.join(&unique_name);
        
        // 检查文件是否已存在（虽然 UUID 重复的概率极低）
        if file_path.exists() {
            return Err(FileManagerError::general_error(
                format!("File already exists: {}", file_path.display())
            ));
        }

        // 保存文件
        fs::write(&file_path, file_data).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(UploadInfo {
            original_name: original_name.to_string(),
            file_size: file_data.len() as u64,
            mime_type,
            saved_path: file_path,
            unique_name,
        })
    }

    /// 保存大文件（分块处理）
    /// 
    /// 适用于大文件上传，支持进度回调
    pub async fn save_large_file<F>(
        &self,
        mut file_reader: impl AsyncReadExt + Unpin,
        original_name: &str,
        target_dir: &Path,
        expected_size: u64,
        mut progress_callback: F,
    ) -> Result<UploadInfo>
    where
        F: FnMut(u64, u64), // (bytes_written, total_bytes)
    {
        // 生成唯一文件名
        let unique_name = self.generate_unique_filename(original_name);
        
        // 确保目标目录存在
        let full_target_dir = self.storage_root.join(target_dir);
        fs::create_dir_all(&full_target_dir).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        // 构建完整的文件路径
        let file_path = full_target_dir.join(&unique_name);
        
        // 创建文件
        let mut file = fs::File::create(&file_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        // 分块读取和写入
        let mut buffer = vec![0u8; 64 * 1024]; // 64KB 缓冲区
        let mut total_written = 0u64;
        let mut first_chunk = Vec::new();
        let mut is_first_chunk = true;

        loop {
            let bytes_read = file_reader.read(&mut buffer).await.map_err(|e| {
                FileManagerError::FileSystem(e)
            })?;

            if bytes_read == 0 {
                break; // 文件读取完成
            }

            let chunk = &buffer[..bytes_read];
            
            // 保存第一个块用于 MIME 类型检测
            if is_first_chunk {
                first_chunk.extend_from_slice(chunk);
                is_first_chunk = false;
            }

            // 写入文件
            file.write_all(chunk).await.map_err(|e| {
                FileManagerError::FileSystem(e)
            })?;

            total_written += bytes_read as u64;
            progress_callback(total_written, expected_size);
        }

        // 确保数据写入磁盘
        file.flush().await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        // 检测文件类型
        let mime_type = self.detect_mime_type(original_name, &first_chunk);

        Ok(UploadInfo {
            original_name: original_name.to_string(),
            file_size: total_written,
            mime_type,
            saved_path: file_path,
            unique_name,
        })
    }

    /// 删除文件
    pub async fn delete_file(&self, file_path: &Path) -> Result<()> {
        if !file_path.exists() {
            return Err(FileManagerError::FileNotFound {
                path: file_path.display().to_string(),
            });
        }

        fs::remove_file(file_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(())
    }

    /// 创建目录
    pub async fn create_directory(&self, dir_path: &Path) -> Result<()> {
        let full_path = self.storage_root.join(dir_path);
        
        fs::create_dir_all(&full_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(())
    }

    /// 删除目录（递归删除）
    pub async fn delete_directory(&self, dir_path: &Path) -> Result<()> {
        let full_path = self.storage_root.join(dir_path);
        
        if !full_path.exists() {
            return Err(FileManagerError::DirectoryNotFound {
                path: full_path.display().to_string(),
            });
        }

        fs::remove_dir_all(&full_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(())
    }

    /// 检查文件是否存在
    pub async fn file_exists(&self, file_path: &Path) -> bool {
        file_path.exists() && file_path.is_file()
    }

    /// 检查目录是否存在
    pub async fn directory_exists(&self, dir_path: &Path) -> bool {
        let full_path = self.storage_root.join(dir_path);
        full_path.exists() && full_path.is_dir()
    }

    /// 获取文件大小
    pub async fn get_file_size(&self, file_path: &Path) -> Result<u64> {
        let metadata = fs::metadata(file_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(metadata.len())
    }

    /// 移动文件
    pub async fn move_file(&self, from: &Path, to: &Path) -> Result<()> {
        // 确保目标目录存在
        if let Some(parent) = to.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                FileManagerError::FileSystem(e)
            })?;
        }

        fs::rename(from, to).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(())
    }

    /// 复制文件
    pub async fn copy_file(&self, from: &Path, to: &Path) -> Result<()> {
        // 确保目标目录存在
        if let Some(parent) = to.parent() {
            fs::create_dir_all(parent).await.map_err(|e| {
                FileManagerError::FileSystem(e)
            })?;
        }

        fs::copy(from, to).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        Ok(())
    }

    /// 读取文件内容
    pub async fn read_file(&self, file_path: &Path) -> Result<Vec<u8>> {
        fs::read(file_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })
    }

    /// 获取目录中的所有文件
    pub async fn list_files_in_directory(&self, dir_path: &Path) -> Result<Vec<PathBuf>> {
        let full_path = self.storage_root.join(dir_path);
        
        if !full_path.exists() {
            return Err(FileManagerError::DirectoryNotFound {
                path: full_path.display().to_string(),
            });
        }

        let mut entries = fs::read_dir(&full_path).await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })?;

        let mut files = Vec::new();
        while let Some(entry) = entries.next_entry().await.map_err(|e| {
            FileManagerError::FileSystem(e)
        })? {
            let path = entry.path();
            if path.is_file() {
                files.push(path);
            }
        }

        Ok(files)
    }

    /// 生成唯一文件名
    fn generate_unique_filename(&self, original_name: &str) -> String {
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

    /// 检测文件 MIME 类型
    fn detect_mime_type(&self, filename: &str, file_data: &[u8]) -> String {
        // 首先尝试根据文件扩展名检测
        if let Some(mime_type) = mime_guess::from_path(filename).first() {
            return mime_type.to_string();
        }

        // 如果无法从扩展名检测，尝试从文件内容检测
        self.detect_mime_from_content(file_data)
    }

    /// 从文件内容检测 MIME 类型
    fn detect_mime_from_content(&self, data: &[u8]) -> String {
        if data.is_empty() {
            return "application/octet-stream".to_string();
        }

        // 检查常见的文件签名
        match data {
            // JPEG
            d if d.len() >= 3 && d[0] == 0xFF && d[1] == 0xD8 && d[2] == 0xFF => {
                "image/jpeg".to_string()
            }
            // PNG
            d if d.len() >= 8 && d[0..8] == [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] => {
                "image/png".to_string()
            }
            // GIF
            d if d.len() >= 6 && (d[0..6] == *b"GIF87a" || d[0..6] == *b"GIF89a") => {
                "image/gif".to_string()
            }
            // PDF
            d if d.len() >= 4 && d[0..4] == *b"%PDF" => {
                "application/pdf".to_string()
            }
            // ZIP
            d if d.len() >= 4 && d[0..4] == [0x50, 0x4B, 0x03, 0x04] => {
                "application/zip".to_string()
            }
            // 默认为二进制流
            _ => "application/octet-stream".to_string(),
        }
    }

    /// 验证文件类型是否被支持
    pub fn is_file_type_supported(&self, filename: &str, supported_types: &[String]) -> bool {
        if let Some(extension) = Path::new(filename).extension() {
            if let Some(ext_str) = extension.to_str() {
                return supported_types.contains(&ext_str.to_lowercase());
            }
        }
        false
    }

    /// 清理临时文件
    pub async fn cleanup_temp_files(&self, temp_dir: &Path) -> Result<()> {
        let full_path = self.storage_root.join(temp_dir);
        
        if full_path.exists() {
            fs::remove_dir_all(&full_path).await.map_err(|e| {
                FileManagerError::FileSystem(e)
            })?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;
    use tokio::io::Cursor;

    async fn create_test_service() -> (FileSystemService, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let service = FileSystemService::new(temp_dir.path()).unwrap();
        (service, temp_dir)
    }

    #[tokio::test]
    async fn test_save_file() {
        let (service, _temp_dir) = create_test_service().await;
        
        let file_data = b"Hello, World!";
        let result = service.save_file(
            file_data,
            "test.txt",
            Path::new("uploads")
        ).await.unwrap();
        
        assert_eq!(result.original_name, "test.txt");
        assert_eq!(result.file_size, 13);
        assert!(result.saved_path.exists());
        assert!(result.unique_name.ends_with(".txt"));
    }

    #[tokio::test]
    async fn test_save_large_file() {
        let (service, _temp_dir) = create_test_service().await;
        
        let file_data = vec![0u8; 1024 * 1024]; // 1MB of zeros
        let cursor = Cursor::new(file_data.clone());
        
        let mut progress_calls = 0;
        let result = service.save_large_file(
            cursor,
            "large.bin",
            Path::new("uploads"),
            file_data.len() as u64,
            |_written, _total| {
                progress_calls += 1;
            }
        ).await.unwrap();
        
        assert_eq!(result.file_size, 1024 * 1024);
        assert!(progress_calls > 0);
        assert!(result.saved_path.exists());
    }

    #[tokio::test]
    async fn test_create_and_delete_directory() {
        let (service, _temp_dir) = create_test_service().await;
        
        let dir_path = Path::new("test_dir");
        service.create_directory(dir_path).await.unwrap();
        
        assert!(service.directory_exists(dir_path).await);
        
        service.delete_directory(dir_path).await.unwrap();
        assert!(!service.directory_exists(dir_path).await);
    }

    #[tokio::test]
    async fn test_mime_type_detection() {
        let (service, _temp_dir) = create_test_service().await;
        
        // JPEG 文件签名
        let jpeg_data = vec![0xFF, 0xD8, 0xFF, 0xE0];
        let mime_type = service.detect_mime_from_content(&jpeg_data);
        assert_eq!(mime_type, "image/jpeg");
        
        // PNG 文件签名
        let png_data = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
        let mime_type = service.detect_mime_from_content(&png_data);
        assert_eq!(mime_type, "image/png");
    }

    #[tokio::test]
    async fn test_file_operations() {
        let (service, _temp_dir) = create_test_service().await;
        
        // 保存文件
        let file_data = b"Test content";
        let upload_info = service.save_file(
            file_data,
            "test.txt",
            Path::new("uploads")
        ).await.unwrap();
        
        // 检查文件存在
        assert!(service.file_exists(&upload_info.saved_path).await);
        
        // 获取文件大小
        let size = service.get_file_size(&upload_info.saved_path).await.unwrap();
        assert_eq!(size, file_data.len() as u64);
        
        // 读取文件内容
        let content = service.read_file(&upload_info.saved_path).await.unwrap();
        assert_eq!(content, file_data);
        
        // 删除文件
        service.delete_file(&upload_info.saved_path).await.unwrap();
        assert!(!service.file_exists(&upload_info.saved_path).await);
    }
}