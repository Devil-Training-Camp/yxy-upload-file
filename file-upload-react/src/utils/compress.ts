import imageCompression from 'browser-image-compression'; // 图片压缩
import { zipSync, gzipSync } from 'fflate'; // 一般文件进行压缩

export const compressFile = async (file: File) => {
  if (file.type.startsWith('image/')) {
    // 对图片文件进行压缩
    const options = {
      maxSizeMB: 10, // 设置最大文件大小
      maxWidthOrHeight: 1920, // 设置最大宽度或高度
      useWebWorker: true, // 使用WebWorker
      fileType: 'image/jpeg', // 设置压缩后的文件类型
      initialQuality: 0.75, // 设置初始压缩质量
    };
    return await imageCompression(file, options);
  } else {
    // 对其他文件进行压缩（使用zip）
    const fileData = await file.arrayBuffer();
    const compressed = zipSync(
      { [file.name]: new Uint8Array(fileData) },
      {
        level: 6,
      }
    );
    return new File([compressed], `${file.name}.zip`, {
      type: 'application/zip',
    });
  }
};
