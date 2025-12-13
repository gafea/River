-- CreateTable
CREATE TABLE "IncomeSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL,
    "startDate" TEXT,
    "endDate" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "IncomeSource_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IncomeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "description" TEXT,
    "sourceId" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "IncomeEntry_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "IncomeSource" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IncomeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "isSold" BOOLEAN NOT NULL DEFAULT false,
    "soldDate" TEXT,
    "soldValue" REAL,
    "tag" TEXT NOT NULL DEFAULT '',
    "terminalPrice" REAL,
    "events" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Asset_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Asset" ("description", "events", "expectedLifeWeeks", "id", "name", "photoDataUrl", "purchaseDate", "purchaseValue", "tag", "terminalPrice", "userId") SELECT "description", "events", "expectedLifeWeeks", "id", "name", "photoDataUrl", "purchaseDate", "purchaseValue", "tag", "terminalPrice", "userId" FROM "Asset";
DROP TABLE "Asset";
ALTER TABLE "new_Asset" RENAME TO "Asset";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tags" TEXT,
    "hasCompletedSetup" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_User" ("createdAt", "id", "tags") SELECT "createdAt", "id", "tags" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
