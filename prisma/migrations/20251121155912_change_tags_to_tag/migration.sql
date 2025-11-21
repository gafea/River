/*
  Warnings:

  - You are about to drop the column `tags` on the `Asset` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Asset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoDataUrl" TEXT,
    "purchaseValue" REAL NOT NULL,
    "expectedLifeWeeks" INTEGER NOT NULL,
    "purchaseDate" TEXT NOT NULL,
    "tag" TEXT NOT NULL DEFAULT '',
    "terminalPrice" REAL,
    "events" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("description", "events", "expectedLifeWeeks", "id", "name", "photoDataUrl", "purchaseDate", "purchaseValue", "terminalPrice", "userId") SELECT "description", "events", "expectedLifeWeeks", "id", "name", "photoDataUrl", "purchaseDate", "purchaseValue", "terminalPrice", "userId" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
