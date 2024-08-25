import { useRef, useState } from 'react';
import { Button, message, Progress, Spin } from 'antd';
import dayjs from 'dayjs';
import { CancelTokenSource } from 'axios';
import { splitFile, calHashSparkMD5 } from '@/utils/tools';
import { calHash } from '@/utils/hash';
import { compressFile } from '@/utils/compress';
import { uploadChunks, findFile, mergeFile } from '@/api';
import './index.scss';

type Uploaded = number[];

interface FileSize {
  total: number;
  uploaded: Uploaded;
}

export default function UploadFile() {
  const file = useRef<HTMLInputElement>(null);

  const [messageApi, contextHolder] = message.useMessage();
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const pauseRef = useRef(false);
  const cancelTokensRef = useRef<CancelTokenSource[]>([]);

  // 记录文件的原始size以及已上传的size
  const fileSize = useRef<FileSize>({
    total: 0,
    uploaded: [],
  });

  // 更新上传进度
  const onTick = (index: number, val: number) => {
    const { total, uploaded } = fileSize.current;
    // 计算已上传的size
    if (!uploaded[index]) {
      uploaded[index] = 0;
    }
    uploaded[index] = val;
    // 计算当前进度
    const currentTotal = uploaded.reduce((a, c) => a + c, 0);
    const _progress = Math.round((currentTotal / total) * 100);
    // 如果progress已经存在，说明是暂停后恢复上传，这个时候保留当前进度
    if (progress < _progress) {
      setProgress(_progress);
    }
  };

  // 记录axios的cancelToken
  const onPushToken = (token: CancelTokenSource) => {
    cancelTokensRef.current.push(token);
  };

  // 暂停上传
  const onPause = () => {
    pauseRef.current = true;
    cancelTokensRef.current.forEach(token => {
      token.cancel();
    });
  };

  // 恢复上传
  const onResume = () => {
    pauseRef.current = false;
    uploadFile();
  };

  // 上传文件
  const uploadFile = async () => {
    if (!file.current || !file.current.files || !file.current.files.length) {
      messageApi.warning('请选择上传文件');
      return;
    }

    setLoading(true);

    try {
      // 对文件进行压缩
      console.log('压缩前', file.current.files[0].size);
      const targetFile = await compressFile(file.current.files[0]);
      console.log('压缩后', targetFile.size);
      // 记录文件的size
      fileSize.current.total = targetFile.size;

      // 文件切片
      const chunkList = splitFile(targetFile);

      // 方式一: spark-md5
      // const hash = await calHashSparkMD5(targetFile);
      // 方式二: 切片 + Web Worker + spark-md5
      const hash = await calHash({ chunkList });

      // 根据hash查询文件是否已存在
      const { exist } = await findFile({ hash: hash as string });

      // // 文件已存在 展示秒传效果
      if (exist) {
        setProgress(100);
        messageApi.success('文件上传成功');
        return;
      }

      console.log('上传开始时间', dayjs().format('YYYY-MM-DD HH:mm:ss'));

      await uploadChunks({
        hash: hash as string,
        chunkList,
        pauseRef,
        onTick,
        onPushToken,
      });

      console.log('上传结束时间', dayjs().format('YYYY-MM-DD HH:mm:ss'));
      await mergeFile({ hash: hash as string });

      setProgress(100);
      messageApi.success('文件上传成功');
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}

      <div className="upload-file-wrap">
        <Spin
          wrapperClassName="custom-loading"
          // spinning={loading}
          spinning={false}
          tip="上传中..."
          size="small"
        >
          {progress === 100 && <div>上传成功</div>}
          {progress !== 100 && (
            <>
              <div>
                <input ref={file} type="file" />
              </div>

              <div className="btn-list">
                <Button type="primary" onClick={uploadFile}>
                  上传
                </Button>
                <Button type="primary" onClick={onPause}>
                  暂停
                </Button>
                <Button type="primary" onClick={onResume}>
                  恢复
                </Button>
              </div>
            </>
          )}
          {progress > 0 && (
            <div style={{ marginTop: 24 }}>
              <Progress
                size={[400, 20]}
                strokeColor="#1677ff"
                trailColor="#6B6B6B"
                percent={progress}
                format={percent => {
                  return <div style={{ color: '#fff' }}>{percent}%</div>;
                }}
              />
            </div>
          )}
        </Spin>
      </div>
    </>
  );
}
