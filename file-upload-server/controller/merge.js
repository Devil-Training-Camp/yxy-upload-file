const { isValidString } = require('../utils/tools');
const FilePieceService = require('../file-storages/piece');
const { FILE_STORAGE_ROOT } = require('../const');

const checkParams = params => {
  const { hash } = params;

  if (!isValidString(hash)) {
    throw new Error('hash should be no empty string');
  }
  return true;
};

const mergeFile = async ({ hash, storageRoot }) => {
  const piece = new FilePieceService({ hash, storageRoot });
  const notEmpty = await piece.hasContent();
  if (!notEmpty) {
    throw new Error('hash file not exists');
  }

  return await piece.merge();
};

const mergeFileController = async ctx => {
  const { hash } = ctx.request.body;

  checkParams({ hash });

  const res = await mergeFile({ hash, storageRoot: FILE_STORAGE_ROOT });

  ctx.body = {
    errno: 0,
    data: {
      ...res,
    },
  };
};

module.exports = mergeFileController;
