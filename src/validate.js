// All validation rules live here so the server and the tests share them.
const FIELDS = [
  ['name', 'Student name'],
  ['title', 'Assignment title'],
  ['url', 'Submission URL'],
];

function isValidUrl(text) {
  try {
    const u = new URL(text);
    const okProtocol = u.protocol === 'http:' || u.protocol === 'https:';
    const okHost = u.hostname === 'localhost' || u.hostname.includes('.');
    return okProtocol && okHost;
  } catch {
    return false;
  }
}

function validateSubmission(data = {}) {
  const errors = [];
  const clean = {};
  for (const [key, label] of FIELDS) {
    clean[key] = String(data[key] ?? '').trim();
    if (!clean[key]) errors.push(`${label} is required`);
  }
  if (clean.url && !isValidUrl(clean.url)) {
    errors.push('Submission URL must be a valid http or https link');
  }
  return { valid: errors.length === 0, errors, clean };
}

module.exports = { validateSubmission, isValidUrl };
