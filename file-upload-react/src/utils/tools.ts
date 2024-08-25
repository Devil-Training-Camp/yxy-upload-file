import sparkMD5 from 'spark-md5';
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
