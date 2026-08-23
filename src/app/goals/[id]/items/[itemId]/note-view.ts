// Serializable shape passed from the server components down to the client
// note components. Deliberately narrower than the Prisma row so the client
// bundle does not depend on generated model types.
export type NoteView = {
  id: string;
  body: string;
  location: string | null;
  order: number;
  tags: { id: string; name: string }[];
};
