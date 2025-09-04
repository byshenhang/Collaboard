#define STB_IMAGE_IMPLEMENTATION
#include "stb_image.h"

#include <cstdint>
#include <cstddef>

extern "C" {

struct TgaImage {
  int32_t width;
  int32_t height;
  int32_t channels;   // 我们强制输出 RGBA => 4
  uint8_t* data;      // 像素数据，稍后由 tga_free 释放
  size_t   len;       // data 字节数 = w*h*4
};

// 0 成功；非 0 失败
int tga_load_rgba(const char* path, TgaImage* out) {
  if (!path || !out) return -1;
  int w=0,h=0,c=0;
  unsigned char* p = stbi_load(path, &w, &h, &c, 4);
  if (!p) return -2;
  out->width = w; out->height = h; out->channels = 4;
  out->data = p; out->len = (size_t)w * (size_t)h * 4;
  return 0;
}

void tga_free(TgaImage* img) {
  if (img && img->data) {
    stbi_image_free(img->data);
    img->data = nullptr; img->len = 0;
    img->width = img->height = img->channels = 0;
  }
}

} // extern "C"
