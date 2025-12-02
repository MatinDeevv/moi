-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "runnerUrl" TEXT,
    "runnerToken" TEXT,
    "updatedAt" DATETIME NOT NULL
);
