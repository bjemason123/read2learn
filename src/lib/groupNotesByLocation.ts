export function groupNotesByLocation<
  N extends { location: string | null; order: number },
>(notes: N[]): { location: string | null; notes: N[] }[] {
  const groups = new Map<string | null, N[]>();

  for (const note of notes) {
    const existing = groups.get(note.location);
    if (existing) {
      existing.push(note);
    } else {
      groups.set(note.location, [note]);
    }
  }

  const entries = [...groups.entries()].map(([location, groupNotes]) => ({
    location,
    notes: groupNotes,
    minOrder: Math.min(...groupNotes.map((note) => note.order)),
  }));

  entries.sort((a, b) => {
    if (a.location === null) return 1;
    if (b.location === null) return -1;
    return a.minOrder - b.minOrder;
  });

  return entries.map(({ location, notes: groupNotes }) => ({
    location,
    notes: groupNotes,
  }));
}
