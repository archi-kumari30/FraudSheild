/**
 * Middleware to extract, sanitize, and attach device context telemetry to req
 * Critical boundary note: x-device-id is an application-level identifier, NOT a secure cryptographic fingerprint.
 */
const deviceContextMiddleware = (req, res, next) => {
  const rawDeviceId = req.headers['x-device-id'];
  const userAgent = req.headers['user-agent'] || 'unknown';

  // Resolve client IP (supporting reverse proxies and load balancers)
  const forwardedFor = req.headers['x-forwarded-for'];
  let ipAddress = 'unknown';

  if (forwardedFor) {
    ipAddress = forwardedFor.split(',')[0].trim();
  } else if (req.socket && req.socket.remoteAddress) {
    ipAddress = req.socket.remoteAddress;
  }

  let deviceId = 'unspecified-device';
  let isVerified = false;

  if (rawDeviceId && typeof rawDeviceId === 'string') {
    const trimmed = rawDeviceId.trim();
    // Allow alphanumeric characters, hyphens, and underscores between 5 and 100 characters
    const deviceIdRegex = /^[a-zA-Z0-9_-]{5,100}$/;

    if (deviceIdRegex.test(trimmed)) {
      deviceId = trimmed;
      isVerified = true;
    } else {
      deviceId = 'invalid-device-id';
      isVerified = false;
    }
  }

  req.deviceContext = {
    deviceId,
    userAgent,
    ipAddress,
    isVerified
  };

  next();
};

module.exports = deviceContextMiddleware;
