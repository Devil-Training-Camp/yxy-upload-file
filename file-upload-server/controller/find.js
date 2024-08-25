const {
  isValidString,
  isEffective,
  isPositiveInteger,
} = require('../utils/tools');
const FilePieceService = require('../file-storages/piece');
const { FILE_STORAGE_ROOT } = require('../const');

// 校验参数
const checkParams = params => {
  const { hash, index } = params;
  // 校验 hash 为有效字符串
  if (!isValidString(hash)) {
    throw new Error('hash should not be empty string');
  }
  // 校验 index 为有效正整数
  if (isEffective(index) && !isPositiveInteger(index)) {
    throw new Error('index should be positive integer');
  }
  return true;
};

// 搜索文件是否存在
const searchFile = async (params, storageRoot) => {
  const { hash, index } = params;

  const piece = new FilePieceService({ hash, storageRoot });

  const res = await piece.isExist(index);

  return res;
};

const findFileController = async ctx => {
  // 获取 hash 值和对应的 index
  const { hash, index } = ctx.request.body;

  const params = {
    hash,
    index: typeof index === 'string' ? +index : index,
  };

  // 校验参数
  checkParams(params);
  // 搜索文件是否已存在
  const isExist = await searchFile(params, FILE_STORAGE_ROOT);

  ctx.body = {
    code: 0,
    data: {
      exist: isExist,
    },
  };
};

module.exports = findFileController;
