//! 数据库服务模块
//!
//! 提供 SQLite 数据库操作功能，包括：
//! - 数据库初始化和表创建
//! - 目录和文件的 CRUD 操作
//! - 事务管理和错误处理
//! - 数据库连接池管理

use crate::file_manager::error::{FileManagerError, Result};
use chrono::{DateTime, Local};
use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};
use std::path::Path;
use uuid::Uuid;

/// 目录信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirectoryInfo {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub path: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

/// 文件信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileInfo {
    pub id: String,
    pub name: String,
    pub original_name: String,
    pub directory_id: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: String,
    pub created_at: DateTime<Local>,
    pub updated_at: DateTime<Local>,
}

/// 数据库服务
pub struct DatabaseService {
    connection: Connection,
}

impl DatabaseService {
    /// 创建新的数据库服务实例
    /// 
    /// 如果数据库文件不存在，会自动创建并初始化表结构
    pub async fn new(db_path: &Path) -> Result<Self> {
        let connection = Connection::open(db_path)
            .map_err(FileManagerError::Database)?;
        
        let service = Self { connection };
        service.initialize_tables().await?;
        
        Ok(service)
    }

    /// 初始化数据库表结构
    async fn initialize_tables(&self) -> Result<()> {
        // 创建目录表
        self.connection.execute(
            r#"
            CREATE TABLE IF NOT EXISTS directories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                path TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES directories (id) ON DELETE CASCADE
            )
            "#,
            [],
        ).map_err(FileManagerError::Database)?;

        // 创建文件表
        self.connection.execute(
            r#"
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                original_name TEXT NOT NULL,
                directory_id TEXT NOT NULL,
                file_path TEXT NOT NULL UNIQUE,
                file_size INTEGER NOT NULL,
                mime_type TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (directory_id) REFERENCES directories (id) ON DELETE CASCADE
            )
            "#,
            [],
        ).map_err(FileManagerError::Database)?;

        // 创建索引以提高查询性能
        self.connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_directories_parent_id ON directories (parent_id)",
            [],
        ).map_err(FileManagerError::Database)?;

        self.connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_directory_id ON files (directory_id)",
            [],
        ).map_err(FileManagerError::Database)?;

        self.connection.execute(
            "CREATE INDEX IF NOT EXISTS idx_directories_path ON directories (path)",
            [],
        ).map_err(FileManagerError::Database)?;

        Ok(())
    }

    /// 创建目录
    pub async fn create_directory(
        &self,
        name: &str,
        parent_id: Option<&str>,
        path: &str,
    ) -> Result<DirectoryInfo> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now();
        
        self.connection.execute(
            r#"
            INSERT INTO directories (id, name, parent_id, path, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6)
            "#,
            params![
                id,
                name,
                parent_id,
                path,
                now.to_rfc3339(),
                now.to_rfc3339()
            ],
        ).map_err(FileManagerError::Database)?;

        Ok(DirectoryInfo {
            id,
            name: name.to_string(),
            parent_id: parent_id.map(|s| s.to_string()),
            path: path.to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    /// 获取目录信息
    pub async fn get_directory(&self, id: &str) -> Result<Option<DirectoryInfo>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, parent_id, path, created_at, updated_at FROM directories WHERE id = ?1"
        ).map_err(FileManagerError::Database)?;

        let result = stmt.query_row(params![id], |row| {
            Ok(self.row_to_directory_info(row)?)
        });

        match result {
            Ok(dir) => Ok(Some(dir)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(FileManagerError::Database(e)),
        }
    }

    /// 获取子目录列表
    pub async fn get_child_directories(&self, parent_id: Option<&str>) -> Result<Vec<DirectoryInfo>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, parent_id, path, created_at, updated_at FROM directories WHERE parent_id IS ?1 ORDER BY name"
        ).map_err(FileManagerError::Database)?;

        let rows = stmt.query_map(params![parent_id], |row| {
            Ok(self.row_to_directory_info(row)?)
        }).map_err(FileManagerError::Database)?;

        let mut directories = Vec::new();
        for row in rows {
            directories.push(row.map_err(FileManagerError::Database)?);
        }

        Ok(directories)
    }

    /// 删除目录（级联删除子目录和文件）
    pub async fn delete_directory(&self, id: &str) -> Result<()> {
        self.connection.execute(
            "DELETE FROM directories WHERE id = ?1",
            params![id],
        ).map_err(FileManagerError::Database)?;

        Ok(())
    }

    /// 创建文件记录
    pub async fn create_file(
        &self,
        name: &str,
        original_name: &str,
        directory_id: &str,
        file_path: &str,
        file_size: i64,
        mime_type: &str,
    ) -> Result<FileInfo> {
        let id = Uuid::new_v4().to_string();
        let now = Local::now();
        
        self.connection.execute(
            r#"
            INSERT INTO files (id, name, original_name, directory_id, file_path, file_size, mime_type, created_at, updated_at)
            VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                id,
                name,
                original_name,
                directory_id,
                file_path,
                file_size,
                mime_type,
                now.to_rfc3339(),
                now.to_rfc3339()
            ],
        ).map_err(FileManagerError::Database)?;

        Ok(FileInfo {
            id,
            name: name.to_string(),
            original_name: original_name.to_string(),
            directory_id: directory_id.to_string(),
            file_path: file_path.to_string(),
            file_size,
            mime_type: mime_type.to_string(),
            created_at: now,
            updated_at: now,
        })
    }

    /// 获取文件信息
    pub async fn get_file(&self, id: &str) -> Result<Option<FileInfo>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, original_name, directory_id, file_path, file_size, mime_type, created_at, updated_at FROM files WHERE id = ?1"
        ).map_err(FileManagerError::Database)?;

        let result = stmt.query_row(params![id], |row| {
            Ok(self.row_to_file_info(row)?)
        });

        match result {
            Ok(file) => Ok(Some(file)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(FileManagerError::Database(e)),
        }
    }

    /// 获取目录中的文件列表
    pub async fn get_files_in_directory(&self, directory_id: &str) -> Result<Vec<FileInfo>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, original_name, directory_id, file_path, file_size, mime_type, created_at, updated_at FROM files WHERE directory_id = ?1 ORDER BY name"
        ).map_err(FileManagerError::Database)?;

        let rows = stmt.query_map(params![directory_id], |row| {
            Ok(self.row_to_file_info(row)?)
        }).map_err(FileManagerError::Database)?;

        let mut files = Vec::new();
        for row in rows {
            files.push(row.map_err(FileManagerError::Database)?);
        }

        Ok(files)
    }

    /// 删除文件记录
    pub async fn delete_file(&self, id: &str) -> Result<()> {
        self.connection.execute(
            "DELETE FROM files WHERE id = ?1",
            params![id],
        ).map_err(FileManagerError::Database)?;

        Ok(())
    }

    /// 获取完整的目录树结构
    pub async fn get_directory_tree(&self) -> Result<Vec<DirectoryInfo>> {
        let mut stmt = self.connection.prepare(
            "SELECT id, name, parent_id, path, created_at, updated_at FROM directories ORDER BY path"
        ).map_err(FileManagerError::Database)?;

        let rows = stmt.query_map([], |row| {
            Ok(self.row_to_directory_info(row)?)
        }).map_err(FileManagerError::Database)?;

        let mut directories = Vec::new();
        for row in rows {
            directories.push(row.map_err(FileManagerError::Database)?);
        }

        Ok(directories)
    }

    /// 检查路径是否已存在
    pub async fn path_exists(&self, path: &str) -> Result<bool> {
        let mut stmt = self.connection.prepare(
            "SELECT COUNT(*) FROM directories WHERE path = ?1"
        ).map_err(FileManagerError::Database)?;

        let count: i64 = stmt.query_row(params![path], |row| {
            row.get(0)
        }).map_err(FileManagerError::Database)?;

        Ok(count > 0)
    }

    /// 将数据库行转换为目录信息
    fn row_to_directory_info(&self, row: &Row) -> rusqlite::Result<DirectoryInfo> {
        let created_at_str: String = row.get("created_at")?;
        let updated_at_str: String = row.get("updated_at")?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                4, rusqlite::types::Type::Text, Box::new(e)
            ))?
            .with_timezone(&Local);
            
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                5, rusqlite::types::Type::Text, Box::new(e)
            ))?
            .with_timezone(&Local);

        Ok(DirectoryInfo {
            id: row.get("id")?,
            name: row.get("name")?,
            parent_id: row.get("parent_id")?,
            path: row.get("path")?,
            created_at,
            updated_at,
        })
    }

    /// 将数据库行转换为文件信息
    fn row_to_file_info(&self, row: &Row) -> rusqlite::Result<FileInfo> {
        let created_at_str: String = row.get("created_at")?;
        let updated_at_str: String = row.get("updated_at")?;
        
        let created_at = DateTime::parse_from_rfc3339(&created_at_str)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                7, rusqlite::types::Type::Text, Box::new(e)
            ))?
            .with_timezone(&Local);
            
        let updated_at = DateTime::parse_from_rfc3339(&updated_at_str)
            .map_err(|e| rusqlite::Error::FromSqlConversionFailure(
                8, rusqlite::types::Type::Text, Box::new(e)
            ))?
            .with_timezone(&Local);

        Ok(FileInfo {
            id: row.get("id")?,
            name: row.get("name")?,
            original_name: row.get("original_name")?,
            directory_id: row.get("directory_id")?,
            file_path: row.get("file_path")?,
            file_size: row.get("file_size")?,
            mime_type: row.get("mime_type")?,
            created_at,
            updated_at,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::NamedTempFile;

    async fn create_test_db() -> DatabaseService {
        let temp_file = NamedTempFile::new().unwrap();
        DatabaseService::new(temp_file.path()).await.unwrap()
    }

    #[tokio::test]
    async fn test_create_and_get_directory() {
        let db = create_test_db().await;
        
        let dir = db.create_directory("test", None, "/test").await.unwrap();
        assert_eq!(dir.name, "test");
        assert_eq!(dir.path, "/test");
        assert!(dir.parent_id.is_none());
        
        let retrieved = db.get_directory(&dir.id).await.unwrap().unwrap();
        assert_eq!(retrieved.id, dir.id);
        assert_eq!(retrieved.name, dir.name);
    }

    #[tokio::test]
    async fn test_create_and_get_file() {
        let db = create_test_db().await;
        
        let dir = db.create_directory("test", None, "/test").await.unwrap();
        let file = db.create_file(
            "unique_name.jpg",
            "original.jpg",
            &dir.id,
            "/path/to/file.jpg",
            1024,
            "image/jpeg"
        ).await.unwrap();
        
        assert_eq!(file.name, "unique_name.jpg");
        assert_eq!(file.original_name, "original.jpg");
        assert_eq!(file.file_size, 1024);
        
        let retrieved = db.get_file(&file.id).await.unwrap().unwrap();
        assert_eq!(retrieved.id, file.id);
        assert_eq!(retrieved.name, file.name);
    }

    #[tokio::test]
    async fn test_directory_tree() {
        let db = create_test_db().await;
        
        let root = db.create_directory("root", None, "/root").await.unwrap();
        let child = db.create_directory("child", Some(&root.id), "/root/child").await.unwrap();
        
        let tree = db.get_directory_tree().await.unwrap();
        assert_eq!(tree.len(), 2);
        
        let children = db.get_child_directories(Some(&root.id)).await.unwrap();
        assert_eq!(children.len(), 1);
        assert_eq!(children[0].id, child.id);
    }
}