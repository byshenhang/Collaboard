// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::collections::HashMap;
use std::ffi::CString;
use std::os::raw::{c_char, c_int};
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use log::{info, warn, error, debug};
use tracing::{info as tracing_info, warn as tracing_warn, error as tracing_error, debug as tracing_debug};
use tokio::sync::Mutex;
use chrono::Datelike;
use tauri::Manager;

// 日志模块
mod logging;
mod advanced_logging;
mod config_loader;

// 文件管理模块
mod file_manager;
use file_manager::{
    commands::*,
    config::FileManagerConfig,
    database::DatabaseService,
    filesystem::FileSystemService,
    service::FileManagerService,
};

// FFI 绑定：C++ TGA 图像加载库
#[repr(C)]
struct TgaImage {
    width: i32,
    height: i32,
    channels: i32,
    data: *mut u8,
    len: usize,
}

// 外部 C++ 函数声明
extern "C" {
    /**
     * 加载 TGA 图像为 RGBA 格式
     * @param path 图像文件路径
     * @param out 输出图像结构体
     * @return 0 成功，非 0 失败
     */
    fn tga_load_rgba(path: *const c_char, out: *mut TgaImage) -> c_int;
    
    /**
     * 释放 TGA 图像内存
     * @param img 图像结构体指针
     */
    fn tga_free(img: *mut TgaImage);
}

// Tauri 返回的图像数据结构
#[derive(Serialize, Deserialize)]
struct ImageData {
    width: i32,
    height: i32,
    data_base64: String,  // Base64 编码的 RGBA 数据
}

#[derive(Serialize, Deserialize)]
struct SystemInfo {
    os: String,
    arch: String,
    version: String,
}

#[derive(Serialize, Deserialize)]
struct FileInfo {
    name: String,
    size: u64,
    is_dir: bool,
}

/**
 * 问候命令 - 基础示例
 */
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/**
 * 获取系统信息
 */
#[tauri::command]
fn get_system_info() -> SystemInfo {
    SystemInfo {
        os: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    }
}

/**
 * 执行数学计算
 */
#[tauri::command]
fn calculate(operation: String, a: f64, b: f64) -> Result<f64, String> {
    match operation.as_str() {
        "add" => Ok(a + b),
        "subtract" => Ok(a - b),
        "multiply" => Ok(a * b),
        "divide" => {
            if b != 0.0 {
                Ok(a / b)
            } else {
                Err("Division by zero".to_string())
            }
        }
        _ => Err("Unknown operation".to_string()),
    }
}

/**
 * 生成随机数
 */
#[tauri::command]
fn generate_random_number(min: i32, max: i32) -> i32 {
    use rand::Rng;
    let mut rng = rand::thread_rng();
    rng.gen_range(min..=max)
}

/**
 * 处理用户数据
 */
#[tauri::command]
fn process_user_data(data: HashMap<String, String>) -> HashMap<String, String> {
    let mut result = HashMap::new();
    
    for (key, value) in data {
        result.insert(
            format!("processed_{}", key),
            format!("[PROCESSED] {}", value.to_uppercase()),
        );
    }
    
    result.insert("timestamp".to_string(), chrono::Utc::now().to_rfc3339());
    result
}

/**
 * 模拟异步操作
 */
#[tauri::command]
async fn async_operation(duration_ms: u64) -> String {
    tokio::time::sleep(tokio::time::Duration::from_millis(duration_ms)).await;
    format!("Async operation completed after {}ms", duration_ms)
}

/**
 * 加载 TGA 图像文件
 * @param path 图像文件路径
 * @return 包含图像数据的 ImageData 结构体或错误信息
 */
#[tauri::command]
fn load_tga_image(path: String) -> Result<ImageData, String> {
    info!("开始加载TGA图片: {}", path);
    
    // 检查文件是否存在
    if !std::path::Path::new(&path).exists() {
        error!("文件不存在: {}", path);
        return Err(format!("文件不存在: {}", path));
    }
    
    // 将 Rust 字符串转换为 C 字符串
    let c_path = CString::new(path.clone())
        .map_err(|e| {
            error!("路径转换失败: {} - {}", path, e);
            format!("Invalid path: {}", path)
        })?;
    
    debug!("路径转换成功，准备初始化TGA结构体");
    
    // 初始化 TGA 图像结构体
    let mut raw_image = TgaImage {
        width: 0,
        height: 0,
        channels: 0,
        data: std::ptr::null_mut(),
        len: 0,
    };
    
    debug!("调用C++函数加载图像");
    
    // 调用 C++ 函数加载图像
    let result_code = unsafe {
        tga_load_rgba(c_path.as_ptr(), &mut raw_image as *mut TgaImage)
    };
    
    info!("C++函数返回码: {}", result_code);
    debug!("图像信息 - 宽度: {}, 高度: {}, 通道: {}, 数据长度: {}", 
           raw_image.width, raw_image.height, raw_image.channels, raw_image.len);
    
    // 检查加载结果
    if result_code != 0 {
        let error_msg = match result_code {
            -1 => "Invalid parameters".to_string(),
            -2 => format!("Failed to load image: {}", path),
            _ => format!("Unknown error code: {}", result_code),
        };
        error!("TGA加载失败: {}", error_msg);
        return Err(error_msg);
    }
    
    // 检查图像数据是否有效
    if raw_image.data.is_null() {
        error!("图像数据指针为空");
        return Err("Image data pointer is null".to_string());
    }
    
    if raw_image.len == 0 {
        error!("图像数据长度为0");
        return Err("Image data length is 0".to_string());
    }
    
    info!("图像加载成功，开始复制像素数据");
    
    // 在释放内存前保存图像尺寸信息
    let image_width = raw_image.width;
    let image_height = raw_image.height;
    
    // 将像素数据复制到 Rust Vec
    let pixel_data = unsafe {
        std::slice::from_raw_parts(raw_image.data, raw_image.len).to_vec()
    };
    
    debug!("像素数据复制完成，数据大小: {} bytes", pixel_data.len());
    
    // 释放 C++ 分配的内存
    unsafe {
        tga_free(&mut raw_image as *mut TgaImage);
    }
    
    debug!("C++内存已释放，开始转换为PNG格式");
    
    // 使用image crate将RGBA数据转换为PNG格式
    use image::{ImageBuffer, Rgba, ImageFormat};
    use std::io::Cursor;
    
    let img_buffer = ImageBuffer::<Rgba<u8>, Vec<u8>>::from_raw(
        image_width as u32, 
        image_height as u32, 
        pixel_data
    ).ok_or("无法创建图像缓冲区")?;
    
    debug!("图像缓冲区创建成功，开始编码为PNG");
    
    // 将图像编码为PNG格式
    let mut png_data = Vec::new();
    {
        let mut cursor = Cursor::new(&mut png_data);
        img_buffer.write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("PNG编码失败: {}", e))?;
    }
    
    debug!("PNG编码完成，数据大小: {} bytes", png_data.len());
    
    // 将PNG数据编码为Base64
    use base64::{Engine as _, engine::general_purpose};
    let data_base64 = general_purpose::STANDARD.encode(&png_data);
    
    info!("TGA图片加载完成 - 尺寸: {}x{}, PNG Base64长度: {}", 
          image_width, image_height, data_base64.len());
    
    // 返回图像数据
    Ok(ImageData {
        width: image_width,
        height: image_height,
        data_base64,
    })
}

/**
 * 获取支持的图像格式列表
 * @return 支持的图像格式数组
 */
#[tauri::command]
fn get_supported_image_formats() -> Vec<String> {
    vec![
        "TGA".to_string(),
        "PNG".to_string(),
        "JPEG".to_string(),
        "BMP".to_string(),
        "GIF".to_string(),
        "HDR".to_string(),
        "PIC".to_string(),
        "PNM".to_string(),
    ]
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 加载配置文件
    let app_config = config_loader::ConfigLoader::load_or_default("log_config.toml");
    
    // 验证配置
    if let Err(errors) = config_loader::ConfigValidator::validate(&app_config) {
        eprintln!("配置验证失败:");
        for error in errors {
            eprintln!("  - {}", error);
        }
        std::process::exit(1);
    }
    
    // 初始化高级日志系统
    let log_config = app_config.logging.to_advanced_log_config()
        .expect("Failed to convert logging config");
    
    let _log_manager = advanced_logging::AdvancedLogManager::new(log_config)
        .init()
        .expect("Failed to initialize logging system");
    
    tracing::info!("Collaboard Tauri应用程序启动");
    
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            // 初始化文件管理服务
            let app_data_dir = app.path().app_data_dir()
                .map_err(|e| format!("Failed to get app data dir: {}", e))?;
            
            let config = tauri::async_runtime::block_on(async {
                FileManagerConfig::new().await
            }).map_err(|e| format!("Failed to create file manager config: {}", e))?;
            
            // 创建数据库服务
            let db_service = tauri::async_runtime::block_on(async {
                DatabaseService::new(&config.database_path).await
            }).map_err(|e| format!("Failed to initialize database: {}", e))?;
            
            // 创建文件系统服务
            let fs_service = FileSystemService::new(&config.storage_path)
                .map_err(|e| format!("Failed to initialize filesystem: {}", e))?;
            
            // 创建文件管理服务
            let file_manager = FileManagerService::with_config(config, db_service, fs_service);
            
            // 将服务添加到应用状态
            app.manage(Arc::new(Mutex::new(file_manager)));
            
            tracing_info!("文件管理系统初始化完成");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            get_system_info,
            calculate,
            generate_random_number,
            process_user_data,
            async_operation,
            load_tga_image,
            get_supported_image_formats,
            // 文件管理命令
            upload_file,
            create_directory,
            delete_file,
            delete_directory,
            get_directory_tree,
            get_directory_files,
            get_file_info,
            upload_multiple_files,
            search_files,
            get_storage_stats,
            validate_file_type
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
