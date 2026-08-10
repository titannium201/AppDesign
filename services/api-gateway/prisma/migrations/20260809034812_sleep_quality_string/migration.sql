-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "nickname" TEXT,
    "gender" TEXT,
    "age" INTEGER,
    "heightCm" INTEGER,
    "weightKg" INTEGER,
    "sportType" TEXT,
    "weeklyMileageKm" INTEGER,
    "trainingTypes" TEXT,
    "intervalConfig" TEXT,
    "bestRace" TEXT,
    "targetEvent" TEXT,
    "injuryHistory" TEXT,
    "currentDiscomfort" TEXT,
    "sleepQuality" TEXT,
    "runningExperience" TEXT,
    "watchBrands" TEXT,
    "sport" TEXT,
    "trainingLevel" TEXT,
    "goal" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("age", "bestRace", "createdAt", "currentDiscomfort", "email", "gender", "goal", "heightCm", "id", "injuryHistory", "intervalConfig", "name", "nickname", "passwordHash", "runningExperience", "sleepQuality", "sport", "sportType", "targetEvent", "trainingLevel", "trainingTypes", "updatedAt", "watchBrands", "weeklyMileageKm", "weightKg") SELECT "age", "bestRace", "createdAt", "currentDiscomfort", "email", "gender", "goal", "heightCm", "id", "injuryHistory", "intervalConfig", "name", "nickname", "passwordHash", "runningExperience", "sleepQuality", "sport", "sportType", "targetEvent", "trainingLevel", "trainingTypes", "updatedAt", "watchBrands", "weeklyMileageKm", "weightKg" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
