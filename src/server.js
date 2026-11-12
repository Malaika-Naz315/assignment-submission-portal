const http = require('http');
const fs = require('fs');
const path = require('path');
const { validateSubmission } = require('./validate');

function createServer(dataFile = path.join(__dirname, '..', 'data', 'submissions.json')) {
  const readAll = () => {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return []; }
  };
  const writeAll = (list) => {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(list, null, 2));
  };
  const send = (res, code, body) => {
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(body));
  };

  return http.createServer((req, res) => {
    if (req.url === '/api/submissions' && req.method === 'GET') {
      return send(res, 200, readAll());
    }

    if (req.url === '/api/submissions' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        let data;
        try { data = JSON.parse(body); } catch { return send(res, 400, { errors: ['Invalid JSON'] }); }

        const { valid, errors, clean } = validateSubmission(data);
        if (!valid) return send(res, 400, { errors });   // rejected, nothing saved

        const list = readAll();
        const item = { id: Date.now(), ...clean, submittedAt: new Date().toISOString() };
        list.push(item);
        writeAll(list);
        return send(res, 201, item);
      });
      return;
    }

    if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html')));
    }
    send(res, 404, { errors: ['Not found'] });
  });
}

module.exports = { createServer };

if (require.main === module) {
  const port = process.env.PORT || 3000;
  createServer().listen(port, () => console.log(`Portal running at http://localhost:${port}`));
}
