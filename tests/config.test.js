/**
 * Tests for processlink-config node
 */

// Re-implement the allowed hosts list for testing
const ALLOWED_HOSTS = [
  "files.processlink.com.au",
  "processlink.com.au",
  "processmail.processlink.com.au",
  "portal.processlink.com.au"
];

/**
 * Validate if a redirect URL is to an allowed host
 */
function isAllowedRedirect(urlString) {
  try {
    const url = new URL(urlString);
    return ALLOWED_HOSTS.includes(url.hostname);
  } catch {
    return false;
  }
}

describe('redirect URL validation (SSRF prevention)', () => {
  test('allows redirect to files.processlink.com.au', () => {
    expect(isAllowedRedirect('https://files.processlink.com.au/api/test')).toBe(true);
  });

  test('allows redirect to processlink.com.au', () => {
    expect(isAllowedRedirect('https://processlink.com.au/page')).toBe(true);
  });

  test('allows redirect to processmail.processlink.com.au', () => {
    expect(isAllowedRedirect('https://processmail.processlink.com.au/send')).toBe(true);
  });

  test('allows redirect to portal.processlink.com.au', () => {
    expect(isAllowedRedirect('https://portal.processlink.com.au/dashboard')).toBe(true);
  });

  test('blocks redirect to evil.com', () => {
    expect(isAllowedRedirect('https://evil.com/steal-data')).toBe(false);
  });

  test('blocks redirect to attacker-controlled subdomain', () => {
    expect(isAllowedRedirect('https://files.processlink.com.au.evil.com/test')).toBe(false);
  });

  test('blocks redirect to localhost', () => {
    expect(isAllowedRedirect('http://localhost:8080/admin')).toBe(false);
  });

  test('blocks redirect to internal IP addresses', () => {
    expect(isAllowedRedirect('http://192.168.1.1/admin')).toBe(false);
    expect(isAllowedRedirect('http://10.0.0.1/secrets')).toBe(false);
    expect(isAllowedRedirect('http://127.0.0.1:3000/debug')).toBe(false);
  });

  test('blocks redirect to metadata endpoints', () => {
    // AWS metadata endpoint
    expect(isAllowedRedirect('http://169.254.169.254/latest/meta-data/')).toBe(false);
  });

  test('handles invalid URLs gracefully', () => {
    expect(isAllowedRedirect('not-a-url')).toBe(false);
    expect(isAllowedRedirect('')).toBe(false);
  });

  test('blocks subdomains that are not in allowed list', () => {
    expect(isAllowedRedirect('https://api.processlink.com.au/test')).toBe(false);
    expect(isAllowedRedirect('https://staging.files.processlink.com.au/test')).toBe(false);
  });
});

describe('ALLOWED_HOSTS configuration', () => {
  test('contains expected domains', () => {
    expect(ALLOWED_HOSTS).toContain('files.processlink.com.au');
    expect(ALLOWED_HOSTS).toContain('processlink.com.au');
    expect(ALLOWED_HOSTS).toContain('processmail.processlink.com.au');
    expect(ALLOWED_HOSTS).toContain('portal.processlink.com.au');
  });

  test('has exactly 4 allowed hosts', () => {
    expect(ALLOWED_HOSTS.length).toBe(4);
  });
});
