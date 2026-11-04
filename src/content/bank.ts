import type { Band, Branch, BranchId, Content, Encounter, EncounterId, Skill, SkillId } from './types';

export interface SkillFile {
  skill: Omit<Skill, 'branch' | 'order'>;
  encounters: Omit<Encounter, 'skill'>[];
}

export function buildContent(branches: Branch[], files: SkillFile[]): Content {
  const byNumber = new Map(branches.map((b) => [b.number, b]));
  const skills = new Map<SkillId, Skill>();
  const encounters = new Map<EncounterId, Encounter>();
  const pools = new Map<string, Encounter[]>();

  for (const file of files) {
    const [branchNo, order] = file.skill.id.split('.').map(Number);
    const branch = byNumber.get(branchNo!);
    if (!branch) throw new Error(`skill ${file.skill.id} has no branch ${branchNo}`);
    if (skills.has(file.skill.id)) throw new Error(`skill ${file.skill.id} defined twice`);
    const skill: Skill = { ...file.skill, branch: branch.id, order: order! };
    skills.set(skill.id, skill);
    for (const e of file.encounters) {
      if (encounters.has(e.id)) throw new Error(`encounter ${e.id} defined twice`);
      const encounter: Encounter = { ...e, skill: skill.id };
      encounters.set(e.id, encounter);
      const key = `${skill.id}|${e.band}`;
      pools.set(key, [...(pools.get(key) ?? []), encounter]);
    }
  }

  const ordered = [...skills.values()].sort((a, b) => a.order - b.order);
  const skillsByBranch = new Map<BranchId, Skill[]>(
    branches.map((b) => [b.id, ordered.filter((s) => s.branch === b.id)]),
  );
  const branchById = new Map(branches.map((b) => [b.id, b]));

  return {
    branches,
    branch: (id) => must(branchById.get(id), `branch ${id}`),
    skillsOf: (id) => skillsByBranch.get(id) ?? [],
    skill: (id) => must(skills.get(id), `skill ${id}`),
    encounter: (id) => must(encounters.get(id), `encounter ${id}`),
    pool: (skill: SkillId, band: Band) => pools.get(`${skill}|${band}`) ?? [],
  };
}

function must<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`unknown ${what}`);
  return value;
}
