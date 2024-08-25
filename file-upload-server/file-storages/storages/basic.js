const { isValidString } = require('../../utils/tools');
const { createWriteStream, createReadStream } = require('fs');
const pump = require('pump'); // 用于管道化流
const { once } = require('events');

class BasicStorage {
  // 会提示 MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 close listeners added to [WriteStream]. Use emitter.setMaxListeners() to increase limit
  // 需要增加监听器限制
  async combind1(files, saveAs) {
    if (files.some(r => !isValidString(r)) || !isValidString(saveAs)) {
      throw new Error(`Invalid file paths`);
    }

    const writeStream = createWriteStream(saveAs);
    writeStream.setMaxListeners(50); // 将监听器限制增加到50

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!(await this.isFileExists(file))) {
          throw new Error(`File ${file} does not exist.`);
        }

        const readStream = createReadStream(file);

        // 使用pump来处理流错误并确保流的关闭
        pump(readStream, writeStream, err => {
          if (err) {
            console.error(`Error processing file ${file}:`, err);
            writeStream.destroy(); // 销毁写流以停止写入
          }
        });
      }
    } catch (error) {
      writeStream.destroy(); // 如果在循环中出现错误，销毁写流
      throw error;
    }

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
  }
  // 简单写法
  async combind2(files, saveAs) {
    // 这里应该改成 stream api，防止文件过大导致 node crash
    if (files?.some(r => !isValidString(r)) || !isValidString(saveAs)) {
      throw new Error(`Invalid file paths`);
    }

    const contents = await Promise.all(
      files.map(async r => {
        if ((await this.isFileExists(r)) !== true) {
          throw new Error(`file ${r} not exists`);
        }
        return this.readFile(r);
      }),
    );
    const combindedContent = Buffer.concat(contents);
    await this.writeFile(saveAs, combindedContent);
  }
  // 文件流写法
  async combind(files, saveAs) {
    if (!files.every(isValidString) || !isValidString(saveAs)) {
      throw new Error('Invalid file paths');
    }

    // 创建一个可写流来写入合并后的文件
    const writeStream = createWriteStream(saveAs);

    // 等待所有读取流都关闭或发生错误s
    const promises = files.map(async file => {
      if (!(await this.isFileExists(file))) {
        throw new Error(`File ${file} not exists`);
      }

      // 创建一个读取流来读取文件
      const readStream = createReadStream(file);

      // 监听错误事件
      readStream.on('error', err => {
        console.error(`Error reading file ${file}:`, err);
        // 可能需要在这里做一些额外的错误处理，比如关闭写入流
      });

      // 将读取流的内容管道到写入流
      readStream.pipe(writeStream, { end: false }); // 注意 { end: false }，我们不希望每个文件读取完毕后写入流就结束

      // 等待读取流结束
      return once(readStream, 'end');
    });

    // 等待所有文件都读取并写入完毕
    try {
      await Promise.all(promises);
      // 所有文件都写入完毕后，关闭写入流
      writeStream.end();
    } catch (error) {
      // 如果有错误发生，尝试关闭写入流
      writeStream.destroy();
      throw error;
    }
  }
}
module.exports = BasicStorage;
