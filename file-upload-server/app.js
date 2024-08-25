const Koa = require('koa');
const app = new Koa();
const views = require('koa-views');
const json = require('koa-json');
const onerror = require('koa-onerror');
const bodyparser = require('koa-bodyparser');
const logger = require('koa-logger');
const cors = require('koa2-cors');
const errorCatch = require('./middlewares/error-catch');

const files = require('./routes/files');
const index = require('./routes/index');
const users = require('./routes/users');

const ENV = process.env.NODE_ENV;

// error handler
onerror(app);

// app.use(errorCatch);

app.use(
  cors({
    origin: ctx => {
      const { origin } = ctx.request.header;
      if (ENV === 'prod' && origin.includes('chenruiweb.com')) {
        return origin;
      }
      if (ENV === 'dev' && origin.includes('localhost')) {
        return origin;
      }
      return 'http://localhost:5173';
    },
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  })
);

// middlewares
app.use(
  bodyparser({
    enableTypes: ['json', 'form', 'text'],
  })
);
app.use(json());
app.use(logger());
app.use(require('koa-static')(__dirname + '/public'));

app.use(
  views(__dirname + '/views', {
    extension: 'pug',
  })
);

// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});

// routes
// app.use(index.routes(), index.allowedMethods())
// app.use(users.routes(), users.allowedMethods())
app.use(files.routes(), files.allowedMethods());

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx);
});

module.exports = app;
