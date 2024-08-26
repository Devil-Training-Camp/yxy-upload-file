import Axios, { CancelTokenSource } from 'axios';
import { gzipSync } from 'fflate';
import { convertToBlob } from '@/utils/tools';

const axios = Axios.create({
  // 正式项目中，需要根据环境变量赋予实际地址
  baseURL: import.meta.env.VITE_BASE_URL,
});

interface Chunk {
  chunk: Blob;
  size: number;
}

interface uploadChunksParams {
  hash: string;
  chunkList: Chunk[];
  pauseRef?: React.MutableRefObject<boolean>;
  onTick?: (index: number, progress: number) => void;
  cancelToken?: string;
  onPushToken?: (token: CancelTokenSource) => void;
}

// interface UploadChunkParams {
//   chunk: Blob;
//   hash: string;
//   index: string | number;
// }

interface FindFileParams {
  hash: string;
  index?: number;
}

interface MergeFileParams {
  hash: string;
}

interface UploadTask {
  chunk: Blob;
  hash: string;
  index: number;
  retryCount: number;
  maxRetries: number;
  onTick?: (index: number, progress: number) => void;
  onPushToken?: (token: CancelTokenSource) => void;
}

// 上传文件
export const uploadChunk = async (params: UploadTask) => {
  const { chunk, hash, index, retryCount, maxRetries, onTick, onPushToken } =
    params;

  // 根据hash查询文件是否已存在
  const { exist } = await findFile({ hash: hash as string, index });

  // 如果当前文件块存在，跳过上传，追加size，更新上传进度
  if (exist) {
    new Promise(resolve => {
      onTick && onTick(index, chunk.size);
      resolve(true);
    });
    return;
  }

  // const reader = new FileReader();

  // reader.readAsArrayBuffer(chunk);
  // const compressedChunk = await new Promise<Uint8Array>(resolve => {
  //   reader.onload = () => {
  //     const compressed = gzipSync(new Uint8Array(reader.result as ArrayBuffer));
  //     resolve(compressed);
  //   };
  // });

  try {
    const formData = new FormData();
    formData.append('hash', hash);
    formData.append('chunk', chunk);
    formData.append('index', index + '');

    const cancelToken = Axios.CancelToken.source();
    onPushToken && onPushToken(cancelToken);

    await axios.post('/api/file/save', formData, {
      onUploadProgress: processData => {
        onTick && onTick(index, processData.loaded);
      },
      cancelToken: cancelToken.token,
    });
  } catch (error) {
    console.log(`Chunk ${index} upload failed, retry count: ${retryCount}`);
    if (retryCount < maxRetries) {
      throw new Error(`Retry chunk ${index}`); // 抛出错误以便重试
    }
  }
};

// 查询文件
export const findFile = async (params: FindFileParams) => {
  const { hash, index } = params;
  const res = await axios.post('/api/file/check', { hash, index });
  return res?.data?.data;
};

// 合并文件
export const mergeFile = async (params: MergeFileParams) => {
  const { hash } = params;
  const res = await axios.post('/api/file/merge', { hash });
  return res?.data?.data;
};

// 并发上传文件列表
export const uploadChunks = async (params: uploadChunksParams) => {
  const { hash, chunkList, pauseRef, onTick, onPushToken } = params;

  // 最大重试次数
  const MAX_RETRIES = 3;
  const pool = 4; // 并发请求数量
  let taskArr: UploadTask[] = []; // 任务集合

  chunkList.forEach((item, index) => {
    taskArr.push({
      chunk: item.chunk,
      hash,
      index,
      retryCount: 0, // 重试次数
      maxRetries: MAX_RETRIES,
      onTick,
      onPushToken,
    });
  });

  while (taskArr.length > 0 && !pauseRef?.current) {
    const failTaskArr: UploadTask[] = []; // 失败任务集合
    // 每次并发请求 4 个
    const currentArr = taskArr.slice(0, pool);
    // 等待执行的请求
    const residueArr = taskArr.slice(pool);
    const resultArr = await Promise.allSettled(
      currentArr.map(task => uploadChunk(task))
    );

    // 将失败的请求放入失败任务集合
    resultArr.map((result, index) => {
      if (result.status === 'rejected') {
        const failedTask = taskArr[index];
        if (failedTask.retryCount! < MAX_RETRIES) {
          failedTask.retryCount! += 1;
          failTaskArr.push(failedTask);
        } else {
          console.error(
            `Chunk ${failedTask.index} failed after ${MAX_RETRIES} retries`
          );
        }
      }
    });

    taskArr = residueArr.concat(failTaskArr);
  }
};

// 老师提供的思路
export const uploadChunks2 = async (params: uploadChunksParams) => {
  const { chunkList: originChunks, hash, onTick, cancelToken } = params;
  const paralleSize = 3; // 最大并发请求数
  const total = originChunks.length;

  const doUpload = async pieces => {
    if (pieces.length === 0) {
      mergeFile({ hash });
      console.log('上传完成');
      onTick?.(100);
    }
    const pool = []; // 并发池
    let finish = 0; // 完成的数量
    const failList = []; // 失败的列表
    for (let i = 0; i < pieces.length; i++) {
      const piece = pieces[i];
      const params = { hash, chunk: piece.chunk, index: i };
      // 这段并发连接限制的逻辑，可以抽取成一个单独的函数，不要跟业务代码耦合
      const task = (async () => {
        const { exists } = await findFile({ hash, index: i });
        if (!exists) {
          return await uploadChunk({ ...params, cancelToken });
        }
      })();
      task
        .then(res => {
          console.log(res);
          finish++;
          const j = pool.findIndex(t => t === task);
          pool.splice(j);
          onTick?.((finish / total) * 100);
        })
        .catch(err => {
          console.log(err);
          failList.push(piece);
        })
        .finally(() => {
          if (finish === pieces.length) {
            doUpload(failList);
          }
        });
      pool.push(task);
      if (pool.length === paralleSize) {
        // 每当并发池跑完一个任务，就再塞入一个任务
        await Promise.race(pool);
      }
    }
  };
  await doUpload(originChunks);
};
