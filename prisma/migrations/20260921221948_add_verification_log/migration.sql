-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "question" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "answer" BOOLEAN,
    "sub" TEXT,
    "reason" TEXT,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);
