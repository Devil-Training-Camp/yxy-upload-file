const fs = require('fs/promises');
const path = require('path');
// const multer = require('multer');
const FilePieceService = require('../file-storages/piece');

const tempDir = path.resolve(__dirname, '../node_modules/.cache');

/**
 * 保存文件至对应位置
 * @param {*} params 文件参数
 * @param {*} storageRoot 存储地址
 */
const saveChunk = async (params, storageRoot) => {
  const { hash, index, chunk } = params;
  const piece = new FilePieceService({ hash, storageRoot });
  await piece.writePiece(chunk, index);
};

// 处理大文件上传
const saveChunkController = async ctx => {
  // 获取 index 和 hash
  const { index, hash } = ctx.request.body;
  // 获取 chunk 文件路径
  const chunkFilePath = ctx.request.files?.chunk?.filepath;
  // 文件路径不存在抛出错误
  if (!chunkFilePath || Array.isArray(chunkFilePath)) {
    throw new Error('Invalid chunk file params');
  }
  // 读取文件
  const chunk = await fs.readFile(chunkFilePath);

  // todo: 校验文件
  // 文件存储根路径
  const fileStorageRoot = path.resolve(__dirname, '../node_modules/.cache');
  // 存储文件
  await saveChunk({ hash, index, chunk }, fileStorageRoot);

  ctx.body = {
    mag: 'save chunk',
    data: ctx.request.body,
    files: ctx.request.files,
  };
};

module.exports = saveChunkController;
