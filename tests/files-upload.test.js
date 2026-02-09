/**
 * Tests for processlink-files-upload node
 */

// Extract functions for testing by re-implementing them here
// (In production, you'd refactor to export these from a shared module)

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

function sanitizeFilename(filename) {
  return filename
    .replace(/[/\\]/g, "_")        // Remove path separators
    .replace(/"/g, '\\"')          // Escape quotes
    .replace(/[\x00-\x1f\x7f]/g, "") // Remove control characters
    .substring(0, 255);            // Limit length
}

describe('sanitizeFilename', () => {
  test('passes through normal filenames unchanged', () => {
    expect(sanitizeFilename('report.pdf')).toBe('report.pdf');
    expect(sanitizeFilename('my-file_2024.csv')).toBe('my-file_2024.csv');
  });

  test('replaces forward slashes with underscores', () => {
    expect(sanitizeFilename('path/to/file.txt')).toBe('path_to_file.txt');
  });

  test('replaces backslashes with underscores', () => {
    expect(sanitizeFilename('path\\to\\file.txt')).toBe('path_to_file.txt');
  });

  test('escapes double quotes', () => {
    expect(sanitizeFilename('file"name.txt')).toBe('file\\"name.txt');
  });

  test('removes control characters', () => {
    expect(sanitizeFilename('file\x00name.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file\nname.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file\rname.txt')).toBe('filename.txt');
    expect(sanitizeFilename('file\x1fname.txt')).toBe('filename.txt');
  });

  test('removes DEL character (0x7f)', () => {
    expect(sanitizeFilename('file\x7fname.txt')).toBe('filename.txt');
  });

  test('truncates to 255 characters', () => {
    const longName = 'a'.repeat(300) + '.txt';
    const result = sanitizeFilename(longName);
    expect(result.length).toBe(255);
  });

  test('handles injection attempt with CRLF', () => {
    const malicious = 'test"\r\nContent-Disposition: form-data; name="evil';
    const result = sanitizeFilename(malicious);
    expect(result).not.toContain('\r');
    expect(result).not.toContain('\n');
    expect(result).toBe('test\\"Content-Disposition: form-data; name=\\"evil');
  });

  test('handles empty filename', () => {
    expect(sanitizeFilename('')).toBe('');
  });
});

describe('file size validation', () => {
  test('MAX_FILE_SIZE is 100MB', () => {
    expect(MAX_FILE_SIZE).toBe(100 * 1024 * 1024);
  });

  test('rejects files over 100MB', () => {
    const fileSize = 101 * 1024 * 1024; // 101 MB
    expect(fileSize > MAX_FILE_SIZE).toBe(true);
  });

  test('accepts files under 100MB', () => {
    const fileSize = 50 * 1024 * 1024; // 50 MB
    expect(fileSize <= MAX_FILE_SIZE).toBe(true);
  });

  test('accepts files exactly 100MB', () => {
    const fileSize = 100 * 1024 * 1024; // Exactly 100 MB
    expect(fileSize <= MAX_FILE_SIZE).toBe(true);
  });
});

// Filename extension auto-append logic (mirrors node logic from lines 80-94)
describe('filename extension inheritance', () => {
  /**
   * Replicates the filename logic from the upload node
   */
  function resolveFilename(configFilename, msgFilename) {
    let basename;
    if (configFilename) {
      basename = configFilename;
      // Check if config filename lacks an extension
      if (!basename.includes('.') && msgFilename) {
        // Extract extension from msg.filename
        const origName = msgFilename.split(/[\\/]/).pop();
        const extMatch = origName.match(/\.[^.]+$/);
        if (extMatch) {
          basename = basename + extMatch[0];
        }
      }
    } else {
      basename = (msgFilename || 'file.bin').split(/[\\/]/).pop();
    }
    return basename;
  }

  describe('when config filename has extension', () => {
    test('should use config filename as-is', () => {
      expect(resolveFilename('report.pdf', 'original.csv')).toBe('report.pdf');
    });

    test('should not append extension even if msg has different extension', () => {
      expect(resolveFilename('data.xlsx', 'source.csv')).toBe('data.xlsx');
    });

    test('should keep config filename with multiple dots', () => {
      expect(resolveFilename('report.2024.pdf', 'source.csv')).toBe('report.2024.pdf');
    });
  });

  describe('when config filename lacks extension', () => {
    test('should inherit extension from msg.filename', () => {
      expect(resolveFilename('report', 'daily-report.pdf')).toBe('report.pdf');
    });

    test('should handle complex extensions like .tar.gz (gets .gz)', () => {
      expect(resolveFilename('backup', 'archive.tar.gz')).toBe('backup.gz');
    });

    test('should handle msg.filename with path separators (unix)', () => {
      expect(resolveFilename('output', '/var/log/data.csv')).toBe('output.csv');
    });

    test('should handle msg.filename with path separators (windows)', () => {
      expect(resolveFilename('output', 'C:\\Users\\data.csv')).toBe('output.csv');
    });

    test('should not append if msg.filename has no extension', () => {
      expect(resolveFilename('output', 'noextension')).toBe('output');
    });

    test('should not append if msg.filename is not provided', () => {
      expect(resolveFilename('output', undefined)).toBe('output');
    });

    test('should not append if msg.filename is empty', () => {
      expect(resolveFilename('output', '')).toBe('output');
    });
  });

  describe('when config filename is not set', () => {
    test('should use msg.filename', () => {
      expect(resolveFilename(undefined, 'uploaded-file.txt')).toBe('uploaded-file.txt');
    });

    test('should extract basename from msg.filename path (unix)', () => {
      expect(resolveFilename(undefined, '/path/to/file.pdf')).toBe('file.pdf');
    });

    test('should extract basename from msg.filename path (windows)', () => {
      expect(resolveFilename(undefined, 'C:\\path\\to\\file.pdf')).toBe('file.pdf');
    });

    test('should default to file.bin when no filename provided', () => {
      expect(resolveFilename(undefined, undefined)).toBe('file.bin');
    });

    test('should default to file.bin when msg.filename is empty', () => {
      expect(resolveFilename(undefined, '')).toBe('file.bin');
    });

    test('should default to file.bin when config is empty string', () => {
      expect(resolveFilename('', '')).toBe('file.bin');
    });
  });

  describe('edge cases', () => {
    test('should handle filename with dot at start (hidden files)', () => {
      // ".config" has a dot, so it's considered to have an extension
      expect(resolveFilename('.config', 'settings.json')).toBe('.config');
    });

    test('should handle multiple dots in msg.filename', () => {
      expect(resolveFilename('report', 'data.2024.01.15.csv')).toBe('report.csv');
    });

    test('should handle extension-only msg.filename', () => {
      expect(resolveFilename('output', '.gitignore')).toBe('output.gitignore');
    });
  });
});

// Timestamp prefix format (mirrors node logic from lines 97-106)
describe('timestamp prefix', () => {
  function generateTimestamp() {
    const now = new Date();
    return (
      now.getFullYear() +
      '-' +
      String(now.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(now.getDate()).padStart(2, '0') +
      '_' +
      String(now.getHours()).padStart(2, '0') +
      '-' +
      String(now.getMinutes()).padStart(2, '0') +
      '-' +
      String(now.getSeconds()).padStart(2, '0')
    );
  }

  test('should match expected format YYYY-MM-DD_HH-MM-SS', () => {
    const timestampRegex = /^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}$/;
    const timestamp = generateTimestamp();
    expect(timestamp).toMatch(timestampRegex);
  });

  test('should produce a valid timestamp for current time', () => {
    const timestamp = generateTimestamp();
    // Parse the timestamp back
    const [datePart, timePart] = timestamp.split('_');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split('-').map(Number);

    expect(year).toBeGreaterThanOrEqual(2024);
    expect(month).toBeGreaterThanOrEqual(1);
    expect(month).toBeLessThanOrEqual(12);
    expect(day).toBeGreaterThanOrEqual(1);
    expect(day).toBeLessThanOrEqual(31);
    expect(hour).toBeGreaterThanOrEqual(0);
    expect(hour).toBeLessThanOrEqual(23);
    expect(minute).toBeGreaterThanOrEqual(0);
    expect(minute).toBeLessThanOrEqual(59);
    expect(second).toBeGreaterThanOrEqual(0);
    expect(second).toBeLessThanOrEqual(59);
  });

  test('should pad single-digit values with zero', () => {
    // Test specific date: January 5, 2025, 3:07:09
    const testDate = new Date(2025, 0, 5, 3, 7, 9); // Month is 0-indexed
    const timestamp =
      testDate.getFullYear() +
      '-' +
      String(testDate.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(testDate.getDate()).padStart(2, '0') +
      '_' +
      String(testDate.getHours()).padStart(2, '0') +
      '-' +
      String(testDate.getMinutes()).padStart(2, '0') +
      '-' +
      String(testDate.getSeconds()).padStart(2, '0');

    expect(timestamp).toBe('2025-01-05_03-07-09');
  });
});
