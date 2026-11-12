// Local report receiver: saves every incoming test report as testreport.json
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.RECEIVER_PORT || 4000;
const FILE = path.join(__dirname, 'testreport.json');
const HISTORY = path.join(__dirname, 'history');

http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/report') {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      try {
        const report = JSON.parse(body);
        fs.writeFileSync(FILE, JSON.stringify(report, null, 2));
        fs.mkdirSync(HISTORY, { recursive: true });
        fs.writeFileSync(path.join(HISTORY, `${Date.now()}-${report.summary.status}.json`), JSON.stringify(report, null, 2));
        console.log(`[${new Date().toLocaleTimeString()}] Saved report: ${report.summary.status} (${report.commitSha.slice(0, 7)})`);
        res.writeHead(200).end('saved');
      } catch {
        res.writeHead(400).end('invalid report');
      }
    });
    return;
  }
  res.writeHead(200).end('Receiver is running. POST reports to /report');
}).listen(PORT, () => console.log(`Receiver listening on http://localhost:${PORT}/report`));
