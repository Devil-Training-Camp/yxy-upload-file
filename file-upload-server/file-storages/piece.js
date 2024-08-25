const path = require('path');
const { isValidString, isPositiveInteger } = require('../utils/tools');
const { BasicStorage } = require('./storages/basic');
const { fsStorage } = require('./storages/fs');

const COMBIND_FILE_NAME = 'combind';

class FilePieceService {
  constructor(params) {
    const { hash, storageRoot, storage } = params;
    // 校验存储路径
    if (!isValidString(storageRoot)) {
      throw new Error('Invalid storageRoot, it should not empty string.');
    }
    // 校验 hash
    if (!isValidString(hash)) {
      throw new Error('Invalid file hash, it should not empty string.');
    }
    this.hash = hash;
    this._storage = storage || fsStorage;
    this._storageRoot = storageRoot;
  }

  get hashDir() {
    const { _storageRoot, hash } = this;
    return path.resolve(_storageRoot, hash);
  }

  ensureHashDir() {
    const { hashDir } = this;
    return this._storage.ensureDir(hashDir);
  }

  // 将文件分片 chunk 写入 storage
  async writePiece(content, index) {
    const { _storage } = this;
    const pieceFilePath = path.resolve(this.hashDir, `${index}`);
    await this.ensureHashDir();
    await _storage.writeFile(pieceFilePath, content);
  }

  async hasContent() {
    const { _storage } = this;
    return _storage.isDirExists(this.hashDir);
  }

  isExist(chunkIndex) {
    const findChunkIndex = typeof chunkIndex === 'number' && chunkIndex >= 0;
    const { _storage } = this;
    return _storage.isFileExists(
      path.resolve(
        this.hashDir,
        findChunkIndex ? `${chunkIndex}` : COMBIND_FILE_NAME
      )
    );
  }

  // 合并文件
  async merge() {
    const pieces = await this._storage.ls(this.hashDir);
    // path.basename 函数用于从给定的路径中提取基本的文件名部分，即最后一个路径分隔符后面的字符串。
    // 例如，如果你有路径 /home/user/documents/report.txt，path.basename 将返回 report.txt
    const fn2idx = filePath => +path.basename(filePath);
    const sortedPieces = pieces
      .filter(r => isPositiveInteger(fn2idx(r)))
      .sort((r1, r2) => fn2idx(r1) - fn2idx(r2));
    if (sortedPieces.length <= 0) {
      throw new Error(`Can not found any pieces of ${this.hash}`);
    }

    const filePath = path.resolve(this.hashDir, COMBIND_FILE_NAME);

    await this._storage.combind(sortedPieces, filePath);

    return { count: pieces.length, hash: this.hash };
  }
}

module.exports = FilePieceService;
