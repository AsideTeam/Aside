-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_SessionTab" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "favicon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "section" TEXT NOT NULL DEFAULT 'tab',
    "position" INTEGER NOT NULL DEFAULT 0
);

INSERT INTO "new_SessionTab" ("id", "url", "title", "favicon", "isActive", "section", "position")
SELECT
    "id",
    "url",
    "title",
    "favicon",
    "isActive",
    CASE
        WHEN "type" = 'icon' OR "isFavorite" = 1 THEN 'icon'
        WHEN "type" = 'space' OR "isPinned" = 1 THEN 'space'
        ELSE 'tab'
    END AS "section",
    "position"
FROM "SessionTab";

DROP TABLE "SessionTab";
ALTER TABLE "new_SessionTab" RENAME TO "SessionTab";

CREATE INDEX "SessionTab_isActive_idx" ON "SessionTab"("isActive");
CREATE INDEX "SessionTab_section_idx" ON "SessionTab"("section");
CREATE INDEX "SessionTab_section_position_idx" ON "SessionTab"("section", "position");

-- Additive indexes for common queries
CREATE INDEX "History_url_visitedAt_idx" ON "History"("url", "visitedAt");
CREATE INDEX "Bookmark_folder_createdAt_idx" ON "Bookmark"("folder", "createdAt");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
