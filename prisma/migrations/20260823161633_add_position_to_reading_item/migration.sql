-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ReadingItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "url" TEXT,
    "note" TEXT,
    "progress" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "deferred" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "goalId" TEXT NOT NULL,
    CONSTRAINT "ReadingItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingItem" ("author", "createdAt", "deferred", "goalId", "id", "note", "progress", "title", "updatedAt", "url") SELECT "author", "createdAt", "deferred", "goalId", "id", "note", "progress", "title", "updatedAt", "url" FROM "ReadingItem";
DROP TABLE "ReadingItem";
ALTER TABLE "new_ReadingItem" RENAME TO "ReadingItem";
CREATE INDEX "ReadingItem_goalId_position_idx" ON "ReadingItem"("goalId", "position");
-- Backfill: 0-based sequential position per goal, ordered by createdAt (id as stable tiebreak)
UPDATE "ReadingItem"
SET "position" = (
  SELECT COUNT(*)
  FROM "ReadingItem" AS ri2
  WHERE ri2."goalId" = "ReadingItem"."goalId"
    AND (ri2."createdAt" < "ReadingItem"."createdAt"
         OR (ri2."createdAt" = "ReadingItem"."createdAt" AND ri2."id" < "ReadingItem"."id"))
);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
