// Runs the tests, builds the JSON report, sends it to the receiver, and
// exits with code 1 if any test failed (so the CI test stage fails too).
const { run } = require('node:test');
const fs = require('fs');
const path = require('path');

const RECEIVER_URL = process.env.RECEIVER_URL || 'http://localhost:4000/report';

(async () => {
  const tests = [];
  const stream = run({ files: [path.join(__dirname, '..', 'tests', 'submission.test.js')] });

  for await (const ev of stream) {
    if (ev.type === 'test:pass' && ev.data.nesting === 0) {
      tests.push({ name: ev.data.name, result: 'passed', message: null });
    }
    if (ev.type === 'test:fail' && ev.data.nesting === 0) {
      const err = ev.data.details.error;
      tests.push({ name: ev.data.name, result: 'failed', message: err?.cause?.message || err?.message || 'Test failed' });
    }
  }

  const passed = tests.filter((t) => t.result === 'passed').length;
  const failed = tests.length - passed;
  const report = {
    repository: process.env.GITHUB_REPOSITORY || 'local-run',
    branch: process.env.GITHUB_REF_NAME || 'local',
    commitSha: process.env.GITHUB_SHA || 'local',
    pipelineRunId: process.env.GITHUB_RUN_ID || 'local',
    timestamp: new Date().toISOString(),
    tests,
    summary: { total: tests.length, passed, failed, status: failed === 0 && tests.length > 0 ? 'PASSED' : 'FAILED' },
  };

  // Keep a copy in the workspace (used by the email job as an attachment).
  const out = path.join(__dirname, '..', 'report-out');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'testreport.json'), JSON.stringify(report, null, 2));
  fs.writeFileSync(path.join(out, 'summary.txt'), [
    `Repository: ${report.repository}`, `Branch: ${report.branch}`, `Commit: ${report.commitSha}`,
    `Run: ${report.pipelineRunId}`, `Overall: ${report.summary.status}`,
    `Total: ${report.summary.total}  Passed: ${passed}  Failed: ${failed}`, '',
    ...tests.map((t) => `${t.result === 'passed' ? 'PASS' : 'FAIL'} - ${t.name}${t.message ? ' (' + t.message + ')' : ''}`),
  ].join('\n'));

  // Send the report to the local receiver (for BOTH passing and failing runs).
  try {
    const res = await fetch(RECEIVER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) });
    console.log(`Report sent to ${RECEIVER_URL} (HTTP ${res.status})`);
  } catch (e) {
    console.warn(`Could not reach receiver at ${RECEIVER_URL}: ${e.message}`);
  }

  console.log(`\n${report.summary.status}: ${passed}/${tests.length} tests passed`);
  process.exitCode = report.summary.status === 'PASSED' ? 0 : 1;
})();
