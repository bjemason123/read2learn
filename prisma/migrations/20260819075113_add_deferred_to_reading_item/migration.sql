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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "goalId" TEXT NOT NULL,
    CONSTRAINT "ReadingItem_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingItem" ("author", "createdAt", "goalId", "id", "note", "progress", "title", "updatedAt", "url") SELECT "author", "createdAt", "goalId", "id", "note", "progress", "title", "updatedAt", "url" FROM "ReadingItem";
DROP TABLE "ReadingItem";
ALTER TABLE "new_ReadingItem" RENAME TO "ReadingItem";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
