/*
  Warnings:

  - The values [HOSPITAL_GROUP,CORPORATE] on the enum `TenantType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."RegistrationType" AS ENUM ('TENANT', 'PATIENT');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('INITIATED', 'VERIFICATION_REQUIRED', 'ONBOARDING', 'COMPLETED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."VerificationStatus" AS ENUM ('PENDING', 'PARTIALLY_VERIFIED', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "public"."OnboardingStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."TenantType_new" AS ENUM ('HOSPITAL', 'CLINIC', 'SPECIALIST_PRACTICE', 'MEDICAL_CENTER', 'DIAGNOSTIC_CENTER', 'LABORATORY', 'RADIOLOGY_CENTER', 'PHARMACY', 'DENTAL_CLINIC', 'OPTICAL_CENTER', 'MATERNITY_CENTER', 'REHABILITATION_CENTER', 'HOME_HEALTH_PROVIDER', 'AMBULANCE_PROVIDER', 'HEALTHCARE_NETWORK', 'CORPORATE_HEALTH_PROVIDER', 'INSURER', 'EXTERNAL_PROVIDER', 'OTHER_HEALTHCARE_PROVIDER');
ALTER TABLE "public"."tenants" ALTER COLUMN "type" TYPE "public"."TenantType_new" USING ("type"::text::"public"."TenantType_new");
ALTER TYPE "public"."TenantType" RENAME TO "TenantType_old";
ALTER TYPE "public"."TenantType_new" RENAME TO "TenantType";
DROP TYPE "public"."TenantType_old";
COMMIT;

-- CreateTable
CREATE TABLE "public"."patient_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "secondName" VARCHAR(100) NOT NULL,
    "location" VARCHAR(300),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registrations" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tenantId" UUID,
    "type" "public"."RegistrationType" NOT NULL,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'INITIATED',
    "verificationStatus" "public"."VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "onboardingStatus" "public"."OnboardingStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "completedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."registration_sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "consumedAt" TIMESTAMPTZ(6),
    "lastUsedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_profiles_userId_key" ON "public"."patient_profiles"("userId");

-- CreateIndex
CREATE INDEX "patient_profiles_firstName_secondName_idx" ON "public"."patient_profiles"("firstName", "secondName");

-- CreateIndex
CREATE INDEX "patient_profiles_location_idx" ON "public"."patient_profiles"("location");

-- CreateIndex
CREATE INDEX "registrations_userId_status_idx" ON "public"."registrations"("userId", "status");

-- CreateIndex
CREATE INDEX "registrations_tenantId_status_idx" ON "public"."registrations"("tenantId", "status");

-- CreateIndex
CREATE INDEX "registrations_type_status_idx" ON "public"."registrations"("type", "status");

-- CreateIndex
CREATE INDEX "registrations_verificationStatus_idx" ON "public"."registrations"("verificationStatus");

-- CreateIndex
CREATE INDEX "registrations_onboardingStatus_idx" ON "public"."registrations"("onboardingStatus");

-- CreateIndex
CREATE UNIQUE INDEX "registration_sessions_tokenHash_key" ON "public"."registration_sessions"("tokenHash");

-- CreateIndex
CREATE INDEX "registration_sessions_userId_expiresAt_idx" ON "public"."registration_sessions"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "registration_sessions_expiresAt_idx" ON "public"."registration_sessions"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."patient_profiles" ADD CONSTRAINT "patient_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registrations" ADD CONSTRAINT "registrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."registration_sessions" ADD CONSTRAINT "registration_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
