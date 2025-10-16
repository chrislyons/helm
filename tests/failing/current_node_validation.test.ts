import { beforeEach, afterEach, describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { promises as fs } from 'fs';
import { webcrypto } from 'crypto';

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
        return fs.readFile(filePath, 'utf8');
      },
      async writeFile(filePath: string, content: string) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content, 'utf8');
        return true;
      },
      async readDir(dirPath: string) {
        return fs.readdir(dirPath);
      },
      async exists(targetPath: string) {
        try {
          await fs.access(targetPath);
          return true;
        } catch {
          return false;
        }
      },
      async mkdir(dirPath: string) {
        await fs.mkdir(dirPath, { recursive: true });
        return true;
      },
      async stat(targetPath: string) {
        const stats = await fs.stat(targetPath);
        return {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
        };
      },
      async rmdir(dirPath: string) {
        await fs.rm(dirPath, { recursive: true, force: true });
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

describe('current node validation', () => {
  test.fails('rejects trees whose currentNodeId is missing', async () => {
    const treeId = 'bad-current-node';
    const treesDir = path.join(tmpRoot, 'trees', treeId);
    await fs.mkdir(treesDir, { recursive: true });
    const payload = {
      id: treeId,
      name: treeId,
      nodes: [
        {
          id: 'root',
          text: 'root',
          parentId: null,
          childIds: [],
          locked: false,
        },
      ],
      rootId: 'root',
      currentNodeId: 'ghost',
      bookmarkedNodeIds: [],
    };
    await fs.writeFile(path.join(treesDir, 'tree.json'), JSON.stringify(payload, null, 2), 'utf8');

    const { loadTree } = await import('../../src/utils/fileSystem');
    await expect(loadTree(treeId)).rejects.toThrow();
  });
});
