/*
  Warnings:

  - You are about to drop the column `pineconeIds` on the `institutions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "institutions" DROP COLUMN "pineconeIds";

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);
