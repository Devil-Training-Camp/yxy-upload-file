import SparkMD5 from 'spark-md5';
import { FilePiece } from '../custom-type';

/**
 * 读取文件chunk
 * todo: 错误处理
 * @param file
 * @returns
 */
const readChunk = (file: Blob) => {
  return new Promise(resolve => {
    // 创建 FileReader 实例
    const reader = new FileReader();
    // 读取文件
    reader.readAsArrayBuffer(file);
    // onload 回调返回结果
    reader.onload = e => {
      if (e.target?.result) {
        resolve(e.target?.result);
      }
    };
  });
};

self.onmessage = async e => {
  const { chunkList } = e.data as { chunkList: FilePiece[] };

  const spark = new SparkMD5.ArrayBuffer();

  for (let i = 0; i < chunkList.length; i++) {
    const { chunk } = chunkList[i];
    const res = await readChunk(chunk);
    spark.append(res);

    self.postMessage({
      percentage: ((i + 1) / chunkList.length) * 100,
    });
  }

  self.postMessage({
    percentage: 100,
    hash: spark.end(),
  });

  self.close();
};
