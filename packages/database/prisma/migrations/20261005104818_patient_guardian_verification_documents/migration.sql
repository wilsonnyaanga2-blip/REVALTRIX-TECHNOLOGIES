-- CreateEnum
CREATE TYPE "public"."PatientGuardianVerificationDocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'BIRTH_NOTIFICATION');

-- CreateEnum
CREATE TYPE "public"."PatientGuardianVerificationDocumentStatus" AS ENUM ('UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REPLACED');

-- CreateTable
CREATE TABLE "public"."patient_guardian_verification_documents" (
    "id" UUID NOT NULL,
    "guardianAuthorityId" UUID NOT NULL,
    "guardianPatientProfileId" UUID NOT NULL,
    "dependentPatientProfileId" UUID NOT NULL,
    "type" "public"."PatientGuardianVerificationDocumentType" NOT NULL,
    "status" "public"."PatientGuardianVerificationDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "storageKey" VARCHAR(1000),
    "fileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(150) NOT NULL,
    "fileSizeBytes" BIGINT NOT NULL,
    "checksum" VARCHAR(128) NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "reviewedByUserId" UUID,
    "reviewedAt" TIMESTAMPTZ(6),
    "rejectionReason" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_guardian_verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_guardian_verification_documents_guardianAuthorityId_idx" ON "public"."patient_guardian_verification_documents"("guardianAuthorityId", "status");

-- CreateIndex
CREATE INDEX "patient_guardian_verification_documents_guardianPatientProf_idx" ON "public"."patient_guardian_verification_documents"("guardianPatientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_guardian_verification_documents_dependentPatientPro_idx" ON "public"."patient_guardian_verification_documents"("dependentPatientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_guardian_verification_documents_status_createdAt_idx" ON "public"."patient_guardian_verification_documents"("status", "createdAt");

-- CreateIndex
CREATE INDEX "patient_guardian_verification_documents_uploadedByUserId_cr_idx" ON "public"."patient_guardian_verification_documents"("uploadedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_verification_documents" ADD CONSTRAINT "patient_guardian_verification_documents_guardianAuthorityI_fkey" FOREIGN KEY ("guardianAuthorityId") REFERENCES "public"."patient_guardian_authorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_verification_documents" ADD CONSTRAINT "patient_guardian_verification_documents_guardianPatientPro_fkey" FOREIGN KEY ("guardianPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_verification_documents" ADD CONSTRAINT "patient_guardian_verification_documents_dependentPatientPr_fkey" FOREIGN KEY ("dependentPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_verification_documents" ADD CONSTRAINT "patient_guardian_verification_documents_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_guardian_verification_documents" ADD CONSTRAINT "patient_guardian_verification_documents_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
