// 本地开发测试服务器
import http from 'http';
import fs from 'fs';
import path from 'path';
import url from 'url';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;

// 动态导入 API handlers
const extractHandler = (await import('./api/extract.js')).default;
const generateHandler = (await import('./api/generate.js')).default;

// MIME types
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// 解析 JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

// 创建模拟的 res 对象
function createMockRes(realRes) {
  const headers = {};
  let statusCode = 200;
  let sent = false;

  return {
    setHeader(name, value) {
      headers[name] = value;
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      if (sent) return;
      sent = true;
      realRes.writeHead(statusCode, {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8'
      });
      realRes.end(JSON.stringify(data));
    },
    send(data) {
      if (sent) return;
      sent = true;
      realRes.writeHead(statusCode, headers);
      realRes.end(data);
    },
    end() {
      if (sent) return;
      sent = true;
      realRes.writeHead(statusCode, headers);
      realRes.end();
    }
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  console.log(`${req.method} ${pathname}`);

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // API routes
  if (pathname === '/api/extract' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const mockRes = createMockRes(res);
      await extractHandler({ method: 'POST', body }, mockRes);
    } catch (error) {
      console.error('Extract error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  if (pathname === '/api/generate' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const mockRes = createMockRes(res);
      await generateHandler({ method: 'POST', body }, mockRes);
    } catch (error) {
      console.error('Generate error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // Static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, 'public', filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop');
});
