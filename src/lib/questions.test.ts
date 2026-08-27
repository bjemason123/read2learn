import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createUser } from "@/lib/users";
import { createGoal, getGoal } from "@/lib/goals";
import { createNote, updateNote } from "@/lib/notes";
import {
  createQuestion,
  deleteQuestion,
  listQuestionsForGoal,
  syncNoteQuestions,
} from "@/lib/questions";
import { createReadingItem } from "@/lib/readingItems";

let userId: string;

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.user.deleteMany();

  userId = (
    await createUser({ email: "reader@example.com", password: "password123" })
  ).id;
});

async function makeGoal(questions: string[] = []) {
  return createGoal({ userId, title: "Learn Rust", questions });
}

async function makeItem(goalId: string) {
  return createReadingItem({ userId, goalId, title: "The Rust Book" });
}

describe("createQuestion", () => {
  it("adds a question to a goal with no existing questions", async () => {
    const goal = await makeGoal();

    const question = await createQuestion(goal.id, userId, "What is ownership?");

    expect(question.text).toBe("What is ownership?");
    expect(question.order).toBe(0);
  });

  it("appends after the highest existing order", async () => {
    const goal = await makeGoal(["What is ownership?"]);

    const question = await createQuestion(goal.id, userId, "What is borrowing?");

    expect(question.order).toBe(1);
    expect((await listQuestionsForGoal(goal.id, userId)).map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
  });

  it("trims the question text", async () => {
    const goal = await makeGoal();

    const question = await createQuestion(goal.id, userId, "  What is ownership?  ");

    expect(question.text).toBe("What is ownership?");
  });

  it("rejects a blank question", async () => {
    const goal = await makeGoal();

    await expect(createQuestion(goal.id, userId, "  ")).rejects.toThrow(
      "Question text is required",
    );
  });
});

describe("listQuestionsForGoal", () => {
  it("returns questions in order", async () => {
    const goal = await makeGoal(["first", "second", "third"]);

    expect((await listQuestionsForGoal(goal.id, userId)).map((q) => q.text)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("returns an empty array for a goal with no questions", async () => {
    const goal = await makeGoal();

    expect(await listQuestionsForGoal(goal.id, userId)).toEqual([]);
  });
});

describe("deleteQuestion", () => {
  it("deletes by id, leaving the other questions intact", async () => {
    const goal = await makeGoal(["What is ownership?", "What is borrowing?"]);
    const [first] = await listQuestionsForGoal(goal.id, userId);

    await deleteQuestion(first.id, userId);

    expect((await listQuestionsForGoal(goal.id, userId)).map((q) => q.text)).toEqual([
      "What is borrowing?",
    ]);
  });

  it("deletes the correct question regardless of position", async () => {
    const goal = await makeGoal(["a", "b", "c"]);
    const questions = await listQuestionsForGoal(goal.id, userId);

    await deleteQuestion(questions[1].id, userId);

    expect((await listQuestionsForGoal(goal.id, userId)).map((q) => q.text)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("syncNoteQuestions", () => {
  it("links a note to a question", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId, readingItemId: item.id, body: "Move semantics" });

    await syncNoteQuestions(note.id, userId, [question.id]);

    const found = await getGoal(goal.id, userId);
    expect(found?.questions[0].notes.map((n) => n.id)).toEqual([note.id]);
  });

  it("deduplicates repeated question ids", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId, readingItemId: item.id, body: "Move semantics" });

    await syncNoteQuestions(note.id, userId, [question.id, question.id]);

    const found = await getGoal(goal.id, userId);
    expect(found?.questions[0].notes).toHaveLength(1);
  });

  it("replaces the existing links rather than appending", async () => {
    const goal = await makeGoal(["first", "second"]);
    const item = await makeItem(goal.id);
    const [first, second] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId, readingItemId: item.id, body: "A note" });

    await syncNoteQuestions(note.id, userId, [first.id]);
    await syncNoteQuestions(note.id, userId, [second.id]);

    const found = await getGoal(goal.id, userId);
    expect(found?.questions[0].notes).toHaveLength(0);
    expect(found?.questions[1].notes.map((n) => n.id)).toEqual([note.id]);
  });

  it("clears all links when given an empty list", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId, readingItemId: item.id, body: "A note" });

    await syncNoteQuestions(note.id, userId, [question.id]);
    await syncNoteQuestions(note.id, userId, []);

    const found = await getGoal(goal.id, userId);
    expect(found?.questions[0].notes).toHaveLength(0);
  });

  it("leaves the question in place when a linked note is deleted", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId, readingItemId: item.id, body: "A note" });
    await syncNoteQuestions(note.id, userId, [question.id]);

    await prisma.note.delete({ where: { id: note.id } });

    // An unlinked question is the "unanswered" state, not an orphan to prune.
    const found = await getGoal(goal.id, userId);
    expect(found?.questions).toHaveLength(1);
    expect(found?.questions[0].notes).toHaveLength(0);
  });
});

describe("notes linked to questions", () => {
  it("links questions supplied when the note is created", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);

    const note = await createNote({ userId,
      readingItemId: item.id,
      body: "Move semantics",
      questionIds: [question.id],
    });

    expect(note.questions.map((q) => q.id)).toEqual([question.id]);
  });

  it("updates a note's question links", async () => {
    const goal = await makeGoal(["first", "second"]);
    const item = await makeItem(goal.id);
    const [first, second] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId,
      readingItemId: item.id,
      body: "A note",
      questionIds: [first.id],
    });

    const updated = await updateNote(note.id, userId, { questionIds: [second.id] });

    expect(updated.questions.map((q) => q.id)).toEqual([second.id]);
  });

  it("leaves question links untouched when updating only the body", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id, userId);
    const note = await createNote({ userId,
      readingItemId: item.id,
      body: "A note",
      questionIds: [question.id],
    });

    const updated = await updateNote(note.id, userId, { body: "An edited note" });

    expect(updated.questions.map((q) => q.id)).toEqual([question.id]);
  });
});

// Questions have no `userId` column — ownership comes from the parent goal.
describe("cross-user isolation", () => {
  async function makeOtherUsersQuestion() {
    const otherUserId = (
      await createUser({ email: "other@example.com", password: "password123" })
    ).id;
    const goal = await createGoal({ userId: otherUserId, title: "Theirs" });
    const question = await createQuestion(
      goal.id,
      otherUserId,
      "What is ownership?",
    );
    return { otherUserId, goal, question };
  }

  it("refuses to add a question to another user's goal", async () => {
    const { goal } = await makeOtherUsersQuestion();

    await expect(createQuestion(goal.id, userId, "Sneaky?")).rejects.toThrow(
      "Goal not found",
    );
  });

  it("does not list another user's questions", async () => {
    const { otherUserId, goal } = await makeOtherUsersQuestion();

    expect(await listQuestionsForGoal(goal.id, userId)).toEqual([]);
    expect(await listQuestionsForGoal(goal.id, otherUserId)).toHaveLength(1);
  });

  it("refuses to delete another user's question", async () => {
    const { question } = await makeOtherUsersQuestion();

    await expect(deleteQuestion(question.id, userId)).rejects.toThrow(
      "Question not found",
    );
    expect(await prisma.question.count({ where: { id: question.id } })).toBe(1);
  });
});
