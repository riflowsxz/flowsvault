const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    if (req.url && req.url.startsWith('/api/upload')) {
      req.maxBodySize = 100 * 1024 * 1024;
    }

    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  server.timeout = 300000;
  server.keepAliveTimeout = 300000;
  server.headersTimeout = 300000;

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Server ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`> Max upload size: 100MB`);
  });
});
