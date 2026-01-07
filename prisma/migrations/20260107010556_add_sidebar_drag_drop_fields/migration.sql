-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SessionTab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "favicon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'tab',
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "position" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_SessionTab" ("id", "isActive", "position", "title", "url") SELECT "id", "isActive", "position", "title", "url" FROM "SessionTab";
DROP TABLE "SessionTab";
ALTER TABLE "new_SessionTab" RENAME TO "SessionTab";
CREATE INDEX "SessionTab_isActive_idx" ON "SessionTab"("isActive");
CREATE INDEX "SessionTab_type_idx" ON "SessionTab"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
