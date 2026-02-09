/**
 * Tests for processlink-system-info node
 */

// Re-implement helper functions for testing
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + " " + units[i];
}

function formatUptime(totalSeconds) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  return {
    raw: Math.floor(totalSeconds),
    breakdown: {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    },
    formatted: `${days}d ${hours}h ${minutes}m ${seconds}s`,
  };
}

describe('formatBytes', () => {
  test('formats 0 bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  test('formats bytes', () => {
    expect(formatBytes(500)).toBe('500.00 B');
  });

  test('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
  });

  test('formats megabytes', () => {
    expect(formatBytes(1024 * 1024)).toBe('1.00 MB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.00 MB');
  });

  test('formats gigabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
    expect(formatBytes(16 * 1024 * 1024 * 1024)).toBe('16.00 GB');
  });

  test('formats terabytes', () => {
    expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1.00 TB');
  });
});

describe('formatUptime', () => {
  test('formats zero seconds', () => {
    const result = formatUptime(0);
    expect(result.raw).toBe(0);
    expect(result.breakdown).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    expect(result.formatted).toBe('0d 0h 0m 0s');
  });

  test('formats seconds only', () => {
    const result = formatUptime(45);
    expect(result.raw).toBe(45);
    expect(result.breakdown).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 45 });
    expect(result.formatted).toBe('0d 0h 0m 45s');
  });

  test('formats minutes and seconds', () => {
    const result = formatUptime(125); // 2 min 5 sec
    expect(result.raw).toBe(125);
    expect(result.breakdown).toEqual({ days: 0, hours: 0, minutes: 2, seconds: 5 });
    expect(result.formatted).toBe('0d 0h 2m 5s');
  });

  test('formats hours, minutes and seconds', () => {
    const result = formatUptime(3661); // 1 hour 1 min 1 sec
    expect(result.raw).toBe(3661);
    expect(result.breakdown).toEqual({ days: 0, hours: 1, minutes: 1, seconds: 1 });
    expect(result.formatted).toBe('0d 1h 1m 1s');
  });

  test('formats days, hours, minutes and seconds', () => {
    const result = formatUptime(90061); // 1 day 1 hour 1 min 1 sec
    expect(result.raw).toBe(90061);
    expect(result.breakdown).toEqual({ days: 1, hours: 1, minutes: 1, seconds: 1 });
    expect(result.formatted).toBe('1d 1h 1m 1s');
  });

  test('formats 5 days exactly', () => {
    const result = formatUptime(432000); // 5 days
    expect(result.raw).toBe(432000);
    expect(result.breakdown).toEqual({ days: 5, hours: 0, minutes: 0, seconds: 0 });
    expect(result.formatted).toBe('5d 0h 0m 0s');
  });

  test('floors fractional seconds', () => {
    const result = formatUptime(45.9);
    expect(result.raw).toBe(45);
    expect(result.breakdown.seconds).toBe(45);
  });
});
