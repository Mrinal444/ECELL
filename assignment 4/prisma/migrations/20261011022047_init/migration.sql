-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FounderProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "startupName" TEXT,
    "pitch" TEXT,
    "domain" TEXT,
    "stage" TEXT,
    "needsNote" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "FounderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FounderNeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "founderId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    CONSTRAINT "FounderNeed_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "expertiseNote" TEXT,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorDomain" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    CONSTRAINT "MentorDomain_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorStage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    CONSTRAINT "MentorStage_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MentorSkill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    CONSTRAINT "MentorSkill_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AvailabilitySlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mentorId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMin" INTEGER NOT NULL,
    "endMin" INTEGER NOT NULL,
    CONSTRAINT "AvailabilitySlot_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MatchRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "founderId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "score" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "respondedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchRequest_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MatchRequest_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchRequestId" TEXT NOT NULL,
    "founderId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL,
    "endsAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "topic" TEXT NOT NULL,
    "founderNotes" TEXT,
    "mentorNotes" TEXT,
    "cancelledBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_matchRequestId_fkey" FOREIGN KEY ("matchRequestId") REFERENCES "MatchRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_founderId_fkey" FOREIGN KEY ("founderId") REFERENCES "FounderProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Session_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "MentorProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "FounderProfile_userId_key" ON "FounderProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FounderNeed_founderId_skill_key" ON "FounderNeed"("founderId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorDomain_mentorId_domain_key" ON "MentorDomain"("mentorId", "domain");

-- CreateIndex
CREATE UNIQUE INDEX "MentorStage_mentorId_stage_key" ON "MentorStage"("mentorId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "MentorSkill_mentorId_skill_key" ON "MentorSkill"("mentorId", "skill");

-- CreateIndex
CREATE UNIQUE INDEX "MatchRequest_founderId_mentorId_key" ON "MatchRequest"("founderId", "mentorId");
