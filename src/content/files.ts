import type { SkillFile } from './bank';
import type { Branch } from './types';

export async function readContentFiles(root: URL): Promise<{ branches: Branch[]; files: SkillFile[] }> {
  const { readFileSync, readdirSync } = await import('node:fs');
  const branches = JSON.parse(readFileSync(new URL('branches.json', root), 'utf8')) as Branch[];
  const dir = new URL('skills/', root);
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as SkillFile);
  return { branches, files };
}
