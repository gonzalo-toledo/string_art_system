import {
  exportAllData,
  validateBackup,
  applyBackup,
  generateBackupFilename,
  BackupData,
  BackupImportError
} from '../backup';

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    // Helper to reset store
    _reset: () => { store = {}; },
    _getStore: () => store
  };
})();

// Mock global localStorage
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock Blob for Node environment
class MockBlob {
  parts: any[];
  type: string;
  constructor(parts: any[], options: { type: string }) {
    this.parts = parts;
    this.type = options.type;
  }
  async text() {
    return this.parts.join('');
  }
}
Object.defineProperty(global, 'Blob', { value: MockBlob });

// Mock URL
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock document
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn(() => ({
      href: '',
      download: '',
      click: mockClick
    })),
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  }
});

describe('backup utilities', () => {
  beforeEach(() => {
    localStorageMock._reset();
    jest.clearAllMocks();
  });

  describe('exportAllData', () => {
    it('should export all localStorage data with metadata', () => {
      // Arrange
      localStorageMock._getStore()['test-key'] = 'test-value';
      localStorageMock._getStore()['another-key'] = '{"nested": true}';

      // Act
      const blob = exportAllData();

      // Assert
      expect(blob).toBeInstanceOf(MockBlob);
      expect(blob.type).toBe('application/json');
    });

    it('should include version, app, and timestamp', async () => {
      // Act
      const blob = exportAllData();
      const text = await blob.text();
      const data = JSON.parse(text);

      // Assert
      expect(data.version).toBe('1.0.0');
      expect(data.app).toBe('stringo');
      expect(data.timestamp).toBeDefined();
      expect(new Date(data.timestamp)).toBeInstanceOf(Date);
    });

    it('should handle empty localStorage', async () => {
      // Act
      const blob = exportAllData();
      const text = await blob.text();
      const data = JSON.parse(text);

      // Assert
      expect(data.data).toEqual({});
    });
  });

  describe('validateBackup', () => {
    it('should validate correct backup data', () => {
      // Arrange
      const validBackup: BackupData = {
        version: '1.0.0',
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: { 'key': 'value' }
      };

      // Act
      const result = validateBackup(validBackup);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-object data', () => {
      // Act
      const result = validateBackup('not an object');

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('NOT_OBJECT');
    });

    it('should reject wrong app name', () => {
      // Arrange
      const wrongApp = {
        version: '1.0.0',
        app: 'wrong-app',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // Act
      const result = validateBackup(wrongApp);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('WRONG_APP');
    });

    it('should reject missing version', () => {
      // Arrange
      const noVersion = {
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // Act
      const result = validateBackup(noVersion);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('NO_VERSION');
    });

    it('should reject missing data', () => {
      // Arrange
      const noData = {
        version: '1.0.0',
        app: 'stringo',
        timestamp: new Date().toISOString()
      };

      // Act
      const result = validateBackup(noData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('NO_DATA');
    });

    it('should warn about missing timestamp', () => {
      // Arrange
      const noTimestamp = {
        version: '1.0.0',
        app: 'stringo',
        data: {}
      };

      // Act
      const result = validateBackup(noTimestamp);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('NO_TIMESTAMP');
    });

    it('should warn about older version', () => {
      // Arrange
      const oldVersion = {
        version: '0.9.0',
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // Act
      const result = validateBackup(oldVersion);

      // Assert
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain('OLD_VERSION');
    });

    it('should reject newer version', () => {
      // Arrange
      const newVersion = {
        version: '2.0.0',
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: {}
      };

      // Act
      const result = validateBackup(newVersion);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.error).toBe('NEWER_VERSION');
    });
  });

  describe('applyBackup', () => {
    it('should clear existing data and apply backup', async () => {
      // Arrange
      localStorageMock._getStore()['existing'] = 'data';
      const backupData: BackupData = {
        version: '1.0.0',
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: { 'new-key': 'new-value' }
      };

      // Act
      await applyBackup(backupData);

      // Assert
      expect(localStorageMock.clear).toHaveBeenCalled();
      expect(localStorageMock.setItem).toHaveBeenCalledWith('new-key', 'new-value');
    });

    it('should handle multiple keys', async () => {
      // Arrange
      const backupData: BackupData = {
        version: '1.0.0',
        app: 'stringo',
        timestamp: new Date().toISOString(),
        data: {
          'key1': 'value1',
          'key2': 'value2',
          'key3': 'value3'
        }
      };

      // Act
      await applyBackup(backupData);

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(3);
    });
  });

  describe('generateBackupFilename', () => {
    it('should generate filename with current date', () => {
      // Act
      const filename = generateBackupFilename();

      // Assert
      expect(filename).toMatch(/^stringo-backup-\d{4}-\d{2}-\d{2}\.json$/);
    });

    it('should use current date', () => {
      // Arrange
      const now = new Date();
      const expectedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Act
      const filename = generateBackupFilename();

      // Assert
      expect(filename).toContain(expectedDate);
    });
  });

  describe('BackupImportError', () => {
    it('should create error with code', () => {
      const error = new BackupImportError('INVALID_FILE_TYPE');
      expect(error.code).toBe('INVALID_FILE_TYPE');
      expect(error.name).toBe('BackupImportError');
      expect(error.message).toBe('INVALID_FILE_TYPE');
    });
  });
});
