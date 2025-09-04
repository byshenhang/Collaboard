fn main() {
    // 调用 tauri-build 的默认构建逻辑
    tauri_build::build();
    
    // 使用 cc 编译 C++ 桥接代码
    // 这会将 tga_loader.cpp 和 stb_image.h 一起编译进 Rust 二进制文件
    cc::Build::new()
        .cpp(true)                           // 启用 C++ 模式
        .file("../cpp/tga_loader.cpp")       // C++ 桥接文件路径
        .include("../cpp")                   // 包含头文件目录
        .flag_if_supported("-std=c++17")     // 使用 C++17 标准
        .compile("tga_loader");              // 编译为静态库
    
    // Windows 平台链接设置
    #[cfg(target_os = "windows")]
    {
        // MSVC 工具链会自动处理 C++ 标准库链接
        println!("cargo:rustc-link-lib=static=tga_loader");
    }
    
    // Linux 平台可能需要链接 libstdc++
    #[cfg(target_os = "linux")]
    {
        println!("cargo:rustc-link-lib=stdc++");
    }
    
    // macOS 平台可能需要链接 libc++
    #[cfg(target_os = "macos")]
    {
        println!("cargo:rustc-link-lib=c++");
    }
    
    // 告诉 Cargo 当 C++ 文件变化时重新构建
    println!("cargo:rerun-if-changed=../cpp/tga_loader.cpp");
    println!("cargo:rerun-if-changed=../cpp/stb_image.h");
}
