const router = require('koa-router')();
const { koaBody } = require('koa-body');
const findFileController = require('../controller/find');
const saveChunkController = require('../controller/file');
const mergeFileController = require('../controller/merge');

router.prefix('/api');

router.get('/file/test', async (ctx, next) => {
  ctx.body = {
    msg: 'file test',
  };
});

router.post('/file/check', findFileController);
router.post('/file/save', koaBody({ multipart: true }), saveChunkController);
router.post('/file/merge', mergeFileController);

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json',
  };
});

module.exports = router;
