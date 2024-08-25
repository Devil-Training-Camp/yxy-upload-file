const {
  stat,
  readdir,
  readFile,
  writeFile,
  writeFileSync,
  mkdir,
} = require('fs/promises');
const path = require('path');
const BasicStorage = require('./basic');

class FilesystemStorage extends BasicStorage {
  // 校验给定的文件名对应的文件是否存在
  async isFileExists(filepath) {
    try {
      const fStat = await stat(filepath); // 调用 fs.stat() 方法，返回一个 Promise
      return fStat.isFile(); // 检查文件状态信息，判断是否是一个普通文件
    } catch (err) {
      // 如果调用 fs.stat() 时发生错误，比如文件不存在
      return false; // 返回 false，表示文件不存在或不是一个普通文件
    }
  }

  // 校验给定的路径是否对应一个存在的目录
  async isDirExists(filepath) {
    try {
      const fStat = await stat(filepath); // 尝试获取路径的文件系统状态
      return fStat.isDirectory(); // 如果状态对象表明这是一个目录，返回 true
    } catch (error) {
      // 如果在获取状态时出现错误（如路径不存在），则
      console.log('isDirExists error', error);
      return false; // 返回 false，表示这不是一个存在的目录
    }
  }
  // 列出指定目录下的文件和子目录
  async ls(dir) {
    if (await this.isDirExists(dir)) {
      // 检查目录是否存在
      const res = await readdir(dir); // 读取目录内容
      return res.map(r => path.resolve(dir, r)); // 将文件名转换为绝对路径
    }
    throw new Error(`Dir ${dir} not exists`); // 如果目录不存在，抛出错误
  }
  // 读取文件
  async readFile(filepath) {
    return await readFile(filepath);
  }
  // 写入文件
  async writeFile(filepath, content) {
    await writeFile(filepath, content);
  }
  // 确保给定的目录路径存在，如果目录不存在，将使用 mkdir 方法创建目录，包括任何必要的父目录（递归创建）
  async ensureDir(dir) {
    await mkdir(dir, { recursive: true }); // { recursive: true } 这个选项告诉 mkdir 方法如果给定的路径中包含多级目录，那么所有不存在的父目录也将会被创建
  }
}

const fsStorage = new FilesystemStorage();

module.exports = {
  fsStorage,
};
