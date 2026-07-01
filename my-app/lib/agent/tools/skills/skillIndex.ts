import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const SkillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export type SkillIndexEntry = {
  name: string;
  description: string;
  id: string;
  skillPath: string;
  skillDir: string;
};

export type SkillRegistry = {
  skills: SkillIndexEntry[];
  byName: Map<string, SkillIndexEntry>;
  byId: Map<string, SkillIndexEntry>;
};

export async function buildSkillIndex(skillsRoot: string) {
  const entries = await fs.readdir(skillsRoot, { withFileTypes: true });

  const skills: SkillIndexEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsRoot, entry.name);
    const skillPath = path.join(skillDir, "SKILL.md");

    try {
      const raw = await fs.readFile(skillPath, "utf8");
      const parsed = matter(raw);
      const frontmatter = SkillFrontmatterSchema.parse(parsed.data);

      skills.push({
        name: frontmatter.name,
        description: frontmatter.description,
        id: entry.name,
        skillPath,
        skillDir,
      });
    } catch {
      // Skip folders without a valid SKILL.md.
      // Or log this as a warning.
    }
  }

  return skills;
}

export async function buildSkillRegistry(
  skillsRoot: string,
): Promise<SkillRegistry> {
  const skills = await buildSkillIndex(skillsRoot);

  return {
    skills,
    byName: new Map(skills.map((skill) => [skill.name, skill])),
    byId: new Map(skills.map((skill) => [skill.id, skill])),
  };
}

export function renderAvailableSkills(
  skills: Array<{ id: string; name: string; description: string }>,
) {
  return [
    "<available_skills>",
    ...skills.map(
      (skill) => `  <skill>
    <id>${escapeXml(skill.id)}</id>
    <name>${escapeXml(skill.name)}</name>
    <description>${escapeXml(skill.description)}</description>
  </skill>`,
    ),
    "</available_skills>",
  ].join("\n");
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
