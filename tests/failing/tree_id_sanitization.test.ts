import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { webcrypto } from 'crypto';

// The module under test relies on the Electron preload bridge. We stub it here.
function installElectronStub(root: string) {
  (globalThis as any).window = {
    electronAPI: {
      async getUserDataPath() {
        return root;
      },
      joinPath(...parts: string[]) {
        return path.join(...parts);
      },
      async readFile(filePath: string) {
        return await (await import('fs/promises')).readFile(filePath, 'utf8');
      },
      async writeFile(filePath: string, content: string) {
        const fs = await import('fs/promises');
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf8');
        return true;
      },
      async readDir(dirPath: string) {
        return await (await import('fs/promises')).readdir(dirPath);
      },
      async exists(targetPath: string) {
        const fs = await import('fs/promises');
        try {
          await fs.access(targetPath);
          return true;
        } catch {
          return false;
        }
      },
      async mkdir(dirPath: string) {
        await (await import('fs/promises')).mkdir(dirPath, { recursive: true });
        return true;
      },
      async stat(targetPath: string) {
        const stats = await (await import('fs/promises')).stat(targetPath);
        return {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
        };
      },
      async rmdir(dirPath: string) {
        await (await import('fs/promises')).rm(dirPath, { recursive: true, force: true });
        return true;
      },
    },
  };
  (globalThis as any).crypto = webcrypto;
}

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(path.join(tmpdir(), 'helm-test-'));
  installElectronStub(tmpRoot);
});

afterEach(() => {
  rmSync(tmpRoot, { recursive: true, force: true });
  delete (globalThis as any).window;
});

describe('tree ID sanitization', () => {
  test.fails('rejects names containing path traversal characters', async () => {
    const { createNewTree } = await import('../../src/utils/fileSystem');
    await expect(createNewTree('unsafe/../name')).rejects.toThrow();
  });
});
