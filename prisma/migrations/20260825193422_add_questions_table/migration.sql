/*
  Warnings:

  - You are about to drop the column `questions` on the `Goal` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "goalId" TEXT NOT NULL,
    CONSTRAINT "Question_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_NoteToQuestion" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_NoteToQuestion_A_fkey" FOREIGN KEY ("A") REFERENCES "Note" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_NoteToQuestion_B_fkey" FOREIGN KEY ("B") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Backfill: promote each non-empty line of the old "Goal"."questions" blob to a
-- Question row, mirroring parseQuestions() (split on \n, trim, drop blanks).
-- Must run before the Goal rebuild below drops the column.
WITH RECURSIVE split(goalId, remainder, line, idx) AS (
    SELECT "id", replace("questions", char(13), '') || char(10), '', -1
    FROM "Goal"
    WHERE "questions" IS NOT NULL
    UNION ALL
    SELECT goalId,
           substr(remainder, instr(remainder, char(10)) + 1),
           substr(remainder, 1, instr(remainder, char(10)) - 1),
           idx + 1
    FROM split
    WHERE instr(remainder, char(10)) > 0
)
INSERT INTO "Question" ("id", "text", "order", "goalId", "createdAt", "updatedAt")
SELECT lower(hex(randomblob(16))),
       trim(line),
       row_number() OVER (PARTITION BY goalId ORDER BY idx) - 1,
       goalId,
       CURRENT_TIMESTAMP,
       CURRENT_TIMESTAMP
FROM split
WHERE trim(line) <> '';

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Goal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Goal" ("createdAt", "description", "id", "title", "updatedAt") SELECT "createdAt", "description", "id", "title", "updatedAt" FROM "Goal";
DROP TABLE "Goal";
ALTER TABLE "new_Goal" RENAME TO "Goal";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Question_goalId_order_idx" ON "Question"("goalId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "_NoteToQuestion_AB_unique" ON "_NoteToQuestion"("A", "B");

-- CreateIndex
CREATE INDEX "_NoteToQuestion_B_index" ON "_NoteToQuestion"("B");
