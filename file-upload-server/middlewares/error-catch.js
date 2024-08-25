const { ENV } = require('../const');

const errorCatch = async (ctx, next) => {
  try {
    await next();
    return;
  } catch (error) {
    console.log('errorCatch xxx', error);
    ctx.body = {
      error,
    };
  }
};

module.exports = errorCatch;
