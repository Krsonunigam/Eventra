const BLOCKED_KEYS = new Set(['__proto__', 'prototype', 'constructor']);

const sanitizeValue = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeValue);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((safe, [key, item]) => {
    if (BLOCKED_KEYS.has(key) || key.startsWith('$')) return safe;
    safe[key] = sanitizeValue(item);
    return safe;
  }, {});
};

const sanitizeRequest = (req, _res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeRequest;
