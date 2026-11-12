# Assignment Submission Portal

A small portal where students submit their name, registration number, assignment title and a submission link.
Every push is tested automatically by GitHub Actions, and the test report is saved locally as `testreport.json`.

**Requirements:** Node.js 20 or newer. No `npm install` needed (zero dependencies).

## Run the application
```bash
npm start
```
Open http://localhost:3000. Submissions are saved in `data/submissions.json`.

## Run the tests
```bash
npm test
```
Runs 3 tests, prints PASSED/FAILED, and exits with an error code if any test fails.

## Start the local report receiver
```bash
npm run receiver
```
Listens on http://localhost:4000/report and saves each report to `receiver/testreport.json`
(copies of every run go to `receiver/history/`).

## How the CI pipeline works
- `.github/workflows/ci.yml` runs on every push on a **self-hosted runner** (my own computer), so `localhost:4000` is my receiver.
- Job `test` runs the tests, POSTs the JSON report to the receiver, then fails if any test failed.
- Job `deploy` (bonus) publishes `public/` to GitHub Pages only when tests pass on `main`.
- Job `email` (bonus) emails the report after passing and failing runs.

Secrets needed for email: `EMAIL_USERNAME`, `EMAIL_PASSWORD` (Gmail App Password), `EMAIL_TO`.

Live demo: _paste your GitHub Pages URL here_
