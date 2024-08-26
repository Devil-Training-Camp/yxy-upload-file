import sparkMD5 from 'spark-md5';
import { gzipSync } from 'fflate';
import { FilePiece } from '../custom-type';
import { CHUNK_SIZE } from '../const';

/**
 * 文件切片
 * @param file 要切片的文件
 * @param chunkSize 切片大小
 * @returns FilePiece[]
 */
export const splitFile = (file: File, chunkSize = CHUNK_SIZE) => {
  const chunkList: FilePiece[] = [];
  let cur = 0;

  while (cur < file.size) {
    const chunk = file.slice(cur, cur + chunkSize);
    chunkList.push({
      chunk,
      size: chunk.size,
    });
    cur += chunkSize;
  }

  return chunkList;
};

/**
 * 生成文件切片并对每个切片进行压缩处理
 * @param file 要切片的文件
 * @param chunkSize 切片大小
 * @returns FilePiece[]
 */
export const splitFile2 = async (file: File, chunkSize = CHUNK_SIZE): Promise<FilePiece[]> => {
  const chunkList: FilePiece[] = [];
  let cur = 0;

  while (cur < file.size) {
    const chunk = file.slice(cur, cur + chunkSize);
    const reader = new FileReader();

    const compressedChunk = await new Promise<Uint8Array>((resolve, reject) => {
      reader.onload = () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const data = new Uint8Array(arrayBuffer);
          const compressed = gzipSync(data, { level: 9 }); // 使用更高的压缩级别
          resolve(compressed);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsArrayBuffer(chunk);
    });

    console.log('原始大小', chunk.size);
    console.log('压缩后的大小', compressedChunk.length);

    chunkList.push({
      chunk: convertToBlob(compressedChunk),
      size: compressedChunk.length,
    });
    cur += chunkSize;
  }

  return chunkList;
};

/**
 * 借助 spark-md5 生成文件 Hash
 * @param file
 * @returns
 */
export const calHashSparkMD5 = (file: File) => {
  return new Promise(resolve => {
    // 创建 SparkMD5 实例
    const spark = new sparkMD5.ArrayBuffer();
    // 1. 创建 FileReader 实例
    // 2. 读取文件
    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = e => {
      if (e.target?.result) {
        spark.append(e.target?.result);
        const hash = spark.end();
        resolve(hash);
      }
    };
  });
};

// 将Uint8Array转换为Blob
export const convertToBlob = (data: Uint8Array): Blob => {
  return new Blob([data], { type: 'application/octet-stream' });
};
