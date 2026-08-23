import { prisma } from "@/lib/prisma";

export function normalizeTagName(raw: string): string | null {
  const collapsed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return collapsed.length > 0 ? collapsed : null;
}

async function pruneOrphanTags() {
  const orphans = await prisma.tag.findMany({ where: { notes: { none: {} } } });
  if (orphans.length > 0) {
    await prisma.tag.deleteMany({
      where: { id: { in: orphans.map((tag) => tag.id) } },
    });
  }
}

export async function syncNoteTags(noteId: string, names: string[]) {
  const normalized = [
    ...new Set(
      names.map(normalizeTagName).filter((name): name is string => name !== null),
    ),
  ];

  await prisma.note.update({
    where: { id: noteId },
    data: {
      tags: {
        set: [],
        connectOrCreate: normalized.map((name) => ({
          where: { name },
          create: { name },
        })),
      },
    },
  });

  await pruneOrphanTags();
}

export { pruneOrphanTags };
