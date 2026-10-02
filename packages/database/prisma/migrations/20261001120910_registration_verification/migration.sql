-- CreateEnum
CREATE TYPE "public"."VerificationChannel" AS ENUM ('EMAIL', 'PHONE');

-- CreateEnum
CREATE TYPE "public"."VerificationPurpose" AS ENUM ('REGISTRATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "public"."verification_challenges" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "channel" "public"."VerificationChannel" NOT NULL,
    "purpose" "public"."VerificationPurpose" NOT NULL,
    "target" VARCHAR(320) NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 5,
    "verifiedAt" TIMESTAMPTZ(6),
    "consumedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verification_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "verification_challenges_userId_purpose_channel_idx" ON "public"."verification_challenges"("userId", "purpose", "channel");

-- CreateIndex
CREATE INDEX "verification_challenges_target_purpose_idx" ON "public"."verification_challenges"("target", "purpose");

-- CreateIndex
CREATE INDEX "verification_challenges_expiresAt_idx" ON "public"."verification_challenges"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."verification_challenges" ADD CONSTRAINT "verification_challenges_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
