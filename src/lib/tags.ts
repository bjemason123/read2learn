import { prisma } from "@/lib/prisma";

export function normalizeTagName(raw: string): string | null {
  const collapsed = raw.trim().toLowerCase().replace(/\s+/g, " ");
  return collapsed.length > 0 ? collapsed : null;
}

// Scoped to one user so pruning never touches another user's tags — an orphan
// for this user may still be in use by someone else's notes.
async function pruneOrphanTags(userId: string) {
  const orphans = await prisma.tag.findMany({
    where: { userId, notes: { none: {} } },
  });
  if (orphans.length > 0) {
    await prisma.tag.deleteMany({
      where: { id: { in: orphans.map((tag) => tag.id) } },
    });
  }
}

export async function syncNoteTags(
  noteId: string,
  userId: string,
  names: string[],
) {
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
        // Tag names are unique per user now, so two users can both have "rust".
        connectOrCreate: normalized.map((name) => ({
          where: { userId_name: { userId, name } },
          create: { name, userId },
        })),
      },
    },
  });

  await pruneOrphanTags(userId);
}

export { pruneOrphanTags };
