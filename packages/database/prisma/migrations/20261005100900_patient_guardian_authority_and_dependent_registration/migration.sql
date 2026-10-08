-- CreateEnum
CREATE TYPE "public"."PatientGuardianAuthorityType" AS ENUM ('PARENT', 'LEGAL_GUARDIAN', 'CAREGIVER', 'AUTHORIZED_REPRESENTATIVE');

-- CreateEnum
CREATE TYPE "public"."PatientGuardianAuthorityStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PatientGuardianVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PatientDependentRegistrationStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'REVOKED');

-- AlterTable
ALTER TABLE "public"."patient_profiles" ADD COLUMN     "dateOfBirth" DATE;

-- CreateTable
CREATE TABLE "public"."patient_guardian_authorities" (
    "id" UUID NOT NULL,
    "guardianPatientProfileId" UUID NOT NULL,
    "dependentPatientProfileId" UUID NOT NULL,
    "authorityType" "public"."PatientGuardianAuthorityType" NOT NULL,
    "status" "public"."PatientGuardianAuthorityStatus" NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" "public"."PatientGuardianVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" UUID NOT NULL,
    "verifiedByUserId" UUID,
    "revokedByUserId" UUID,
    "startsAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMPTZ(6),
    "verifiedAt" TIMESTAMPTZ(6),
    "revokedAt" TIMESTAMPTZ(6),
    "reason" VARCHAR(1000),
    "verificationReason" VARCHAR(1000),
    "revokedReason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_guardian_authorities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_dependent_registrations" (
    "id" UUID NOT NULL,
    "dependentPatientProfileId" UUID NOT NULL,
    "registeredByPatientProfileId" UUID NOT NULL,
    "registeredByUserId" UUID NOT NULL,
    "relationshipType" "public"."PatientFamilyRelationshipType" NOT NULL,
    "status" "public"."PatientDependentRegistrationStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_dependent_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_guardian_authorities_guardianPatientProfileId_statu_idx" ON "public"."patient_guardian_authorities"("guardianPatientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_guardian_authorities_dependentPatientProfileId_stat_idx" ON "public"."patient_guardian_authorities"("dependentPatientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_guardian_authorities_verificationStatus_idx" ON "public"."patient_guardian_authorities"("verificationStatus");

-- CreateIndex
CREATE INDEX "patient_guardian_authorities_expiresAt_idx" ON "public"."patient_guardian_authorities"("expiresAt");

-- CreateIndex
CREATE INDEX "patient_guardian_authorities_createdByUserId_createdAt_idx" ON "public"."patient_guardian_authorities"("createdByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_dependent_registrations_dependentPatientProfileId_key" ON "public"."patient_dependent_registrations"("dependentPatientProfileId");

-- CreateIndex
CREATE INDEX "patient_dependent_registrations_registeredByPatientProfileI_idx" ON "public"."patient_dependent_registrations"("registeredByPatientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_dependent_registrations_registeredByUserId_createdA_idx" ON "public"."patient_dependent_registrations"("registeredByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_authorities" ADD CONSTRAINT "patient_guardian_authorities_guardianPatientProfileId_fkey" FOREIGN KEY ("guardianPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_authorities" ADD CONSTRAINT "patient_guardian_authorities_dependentPatientProfileId_fkey" FOREIGN KEY ("dependentPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_authorities" ADD CONSTRAINT "patient_guardian_authorities_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_authorities" ADD CONSTRAINT "patient_guardian_authorities_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_authorities" ADD CONSTRAINT "patient_guardian_authorities_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_dependent_registrations" ADD CONSTRAINT "patient_dependent_registrations_dependentPatientProfileId_fkey" FOREIGN KEY ("dependentPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_dependent_registrations" ADD CONSTRAINT "patient_dependent_registrations_registeredByPatientProfile_fkey" FOREIGN KEY ("registeredByPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_dependent_registrations" ADD CONSTRAINT "patient_dependent_registrations_registeredByUserId_fkey" FOREIGN KEY ("registeredByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
