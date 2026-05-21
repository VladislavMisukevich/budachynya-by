-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "schoolGrade" INTEGER NOT NULL,
    "city" TEXT,
    "hobbies" TEXT,
    "achievements" TEXT,
    "characteristic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "quarter1" DOUBLE PRECISION,
    "quarter2" DOUBLE PRECISION,
    "quarter3" DOUBLE PRECISION,
    "quarter4" DOUBLE PRECISION,
    "yearScore" DOUBLE PRECISION,
    "examScore" TEXT,
    "finalScore" DOUBLE PRECISION,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_scores" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exam_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "career_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "desiredSphere" TEXT,
    "desiredUniversity" TEXT,
    "cri" DOUBLE PRECISION,
    "criBreakdown" JSONB,
    "trackerPlan" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "faculties" JSONB NOT NULL,
    "entryScores" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "grades_userId_subject_year_key" ON "grades"("userId", "subject", "year");

-- CreateIndex
CREATE UNIQUE INDEX "career_profiles_userId_key" ON "career_profiles"("userId");

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_scores" ADD CONSTRAINT "exam_scores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "career_profiles" ADD CONSTRAINT "career_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
