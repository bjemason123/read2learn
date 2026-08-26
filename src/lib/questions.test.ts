import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createGoal, getGoal } from "@/lib/goals";
import { createNote, updateNote } from "@/lib/notes";
import {
  createQuestion,
  deleteQuestion,
  listQuestionsForGoal,
  syncNoteQuestions,
} from "@/lib/questions";
import { createReadingItem } from "@/lib/readingItems";

beforeEach(async () => {
  await prisma.note.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.readingItem.deleteMany();
  await prisma.goal.deleteMany();
});

async function makeGoal(questions: string[] = []) {
  return createGoal({ title: "Learn Rust", questions });
}

async function makeItem(goalId: string) {
  return createReadingItem({ goalId, title: "The Rust Book" });
}

describe("createQuestion", () => {
  it("adds a question to a goal with no existing questions", async () => {
    const goal = await makeGoal();

    const question = await createQuestion(goal.id, "What is ownership?");

    expect(question.text).toBe("What is ownership?");
    expect(question.order).toBe(0);
  });

  it("appends after the highest existing order", async () => {
    const goal = await makeGoal(["What is ownership?"]);

    const question = await createQuestion(goal.id, "What is borrowing?");

    expect(question.order).toBe(1);
    expect((await listQuestionsForGoal(goal.id)).map((q) => q.text)).toEqual([
      "What is ownership?",
      "What is borrowing?",
    ]);
  });

  it("trims the question text", async () => {
    const goal = await makeGoal();

    const question = await createQuestion(goal.id, "  What is ownership?  ");

    expect(question.text).toBe("What is ownership?");
  });

  it("rejects a blank question", async () => {
    const goal = await makeGoal();

    await expect(createQuestion(goal.id, "  ")).rejects.toThrow(
      "Question text is required",
    );
  });
});

describe("listQuestionsForGoal", () => {
  it("returns questions in order", async () => {
    const goal = await makeGoal(["first", "second", "third"]);

    expect((await listQuestionsForGoal(goal.id)).map((q) => q.text)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });

  it("returns an empty array for a goal with no questions", async () => {
    const goal = await makeGoal();

    expect(await listQuestionsForGoal(goal.id)).toEqual([]);
  });
});

describe("deleteQuestion", () => {
  it("deletes by id, leaving the other questions intact", async () => {
    const goal = await makeGoal(["What is ownership?", "What is borrowing?"]);
    const [first] = await listQuestionsForGoal(goal.id);

    await deleteQuestion(first.id);

    expect((await listQuestionsForGoal(goal.id)).map((q) => q.text)).toEqual([
      "What is borrowing?",
    ]);
  });

  it("deletes the correct question regardless of position", async () => {
    const goal = await makeGoal(["a", "b", "c"]);
    const questions = await listQuestionsForGoal(goal.id);

    await deleteQuestion(questions[1].id);

    expect((await listQuestionsForGoal(goal.id)).map((q) => q.text)).toEqual([
      "a",
      "c",
    ]);
  });
});

describe("syncNoteQuestions", () => {
  it("links a note to a question", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);
    const note = await createNote({ readingItemId: item.id, body: "Move semantics" });

    await syncNoteQuestions(note.id, [question.id]);

    const found = await getGoal(goal.id);
    expect(found?.questions[0].notes.map((n) => n.id)).toEqual([note.id]);
  });

  it("deduplicates repeated question ids", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);
    const note = await createNote({ readingItemId: item.id, body: "Move semantics" });

    await syncNoteQuestions(note.id, [question.id, question.id]);

    const found = await getGoal(goal.id);
    expect(found?.questions[0].notes).toHaveLength(1);
  });

  it("replaces the existing links rather than appending", async () => {
    const goal = await makeGoal(["first", "second"]);
    const item = await makeItem(goal.id);
    const [first, second] = await listQuestionsForGoal(goal.id);
    const note = await createNote({ readingItemId: item.id, body: "A note" });

    await syncNoteQuestions(note.id, [first.id]);
    await syncNoteQuestions(note.id, [second.id]);

    const found = await getGoal(goal.id);
    expect(found?.questions[0].notes).toHaveLength(0);
    expect(found?.questions[1].notes.map((n) => n.id)).toEqual([note.id]);
  });

  it("clears all links when given an empty list", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);
    const note = await createNote({ readingItemId: item.id, body: "A note" });

    await syncNoteQuestions(note.id, [question.id]);
    await syncNoteQuestions(note.id, []);

    const found = await getGoal(goal.id);
    expect(found?.questions[0].notes).toHaveLength(0);
  });

  it("leaves the question in place when a linked note is deleted", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);
    const note = await createNote({ readingItemId: item.id, body: "A note" });
    await syncNoteQuestions(note.id, [question.id]);

    await prisma.note.delete({ where: { id: note.id } });

    // An unlinked question is the "unanswered" state, not an orphan to prune.
    const found = await getGoal(goal.id);
    expect(found?.questions).toHaveLength(1);
    expect(found?.questions[0].notes).toHaveLength(0);
  });
});

describe("notes linked to questions", () => {
  it("links questions supplied when the note is created", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);

    const note = await createNote({
      readingItemId: item.id,
      body: "Move semantics",
      questionIds: [question.id],
    });

    expect(note.questions.map((q) => q.id)).toEqual([question.id]);
  });

  it("updates a note's question links", async () => {
    const goal = await makeGoal(["first", "second"]);
    const item = await makeItem(goal.id);
    const [first, second] = await listQuestionsForGoal(goal.id);
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      questionIds: [first.id],
    });

    const updated = await updateNote(note.id, { questionIds: [second.id] });

    expect(updated.questions.map((q) => q.id)).toEqual([second.id]);
  });

  it("leaves question links untouched when updating only the body", async () => {
    const goal = await makeGoal(["What is ownership?"]);
    const item = await makeItem(goal.id);
    const [question] = await listQuestionsForGoal(goal.id);
    const note = await createNote({
      readingItemId: item.id,
      body: "A note",
      questionIds: [question.id],
    });

    const updated = await updateNote(note.id, { body: "An edited note" });

    expect(updated.questions.map((q) => q.id)).toEqual([question.id]);
  });
});
