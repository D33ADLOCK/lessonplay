import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";

const SkillFrontmatterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});

export function parseSkillFrontmatter(raw: string, skillPath: string) {
  try {
    return SkillFrontmatterSchema.parse(matter(raw).data);
  } catch (error) {
    throw new Error(
      `Invalid SKILL.md frontmatter at ${skillPath}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

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

    let raw: string;
    try {
      raw = await fs.readFile(skillPath, "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        continue;
      }
      throw new Error(
        `Failed to read SKILL.md for skill folder ${entry.name} at ${skillPath}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    const frontmatter = parseSkillFrontmatter(raw, skillPath);

    skills.push({
      name: frontmatter.name,
      description: frontmatter.description,
      id: entry.name,
      skillPath,
      skillDir,
    });
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
