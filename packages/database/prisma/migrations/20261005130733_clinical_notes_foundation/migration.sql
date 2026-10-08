-- CreateEnum
CREATE TYPE "public"."ClinicalNoteType" AS ENUM ('CONSULTATION', 'PROGRESS', 'EMERGENCY', 'ADMISSION', 'DISCHARGE', 'PROCEDURE', 'FOLLOW_UP', 'TELEMEDICINE');

-- CreateEnum
CREATE TYPE "public"."ClinicalNoteStatus" AS ENUM ('DRAFT', 'SIGNED', 'FINAL', 'AMENDED', 'VOID');

-- CreateTable
CREATE TABLE "public"."clinical_notes" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientTenantRecordId" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "authorUserId" UUID NOT NULL,
    "authorProviderId" UUID,
    "noteNumber" VARCHAR(100) NOT NULL,
    "type" "public"."ClinicalNoteType" NOT NULL,
    "status" "public"."ClinicalNoteStatus" NOT NULL DEFAULT 'DRAFT',
    "chiefComplaint" VARCHAR(2000),
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "signedAt" TIMESTAMPTZ(6),
    "finalizedAt" TIMESTAMPTZ(6),
    "voidedAt" TIMESTAMPTZ(6),
    "voidReason" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clinical_note_versions" (
    "id" UUID NOT NULL,
    "clinicalNoteId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "chiefComplaint" VARCHAR(2000),
    "subjective" TEXT,
    "objective" TEXT,
    "assessment" TEXT,
    "plan" TEXT,
    "createdByUserId" UUID NOT NULL,
    "amendmentReason" VARCHAR(2000),
    "signedAt" TIMESTAMPTZ(6),
    "finalizedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_note_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_patientTenantRecordId_createdAt_idx" ON "public"."clinical_notes"("tenantId", "patientTenantRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_encounterId_createdAt_idx" ON "public"."clinical_notes"("tenantId", "encounterId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_authorUserId_createdAt_idx" ON "public"."clinical_notes"("tenantId", "authorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_authorProviderId_createdAt_idx" ON "public"."clinical_notes"("tenantId", "authorProviderId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_notes_tenantId_status_createdAt_idx" ON "public"."clinical_notes"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_notes_tenantId_noteNumber_key" ON "public"."clinical_notes"("tenantId", "noteNumber");

-- CreateIndex
CREATE INDEX "clinical_note_versions_tenantId_clinicalNoteId_createdAt_idx" ON "public"."clinical_note_versions"("tenantId", "clinicalNoteId", "createdAt");

-- CreateIndex
CREATE INDEX "clinical_note_versions_tenantId_createdByUserId_createdAt_idx" ON "public"."clinical_note_versions"("tenantId", "createdByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_note_versions_clinicalNoteId_versionNumber_key" ON "public"."clinical_note_versions"("clinicalNoteId", "versionNumber");

-- AddForeignKey
ALTER TABLE "public"."clinical_notes" ADD CONSTRAINT "clinical_notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_notes" ADD CONSTRAINT "clinical_notes_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_notes" ADD CONSTRAINT "clinical_notes_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_notes" ADD CONSTRAINT "clinical_notes_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_notes" ADD CONSTRAINT "clinical_notes_authorProviderId_fkey" FOREIGN KEY ("authorProviderId") REFERENCES "public"."provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_note_versions" ADD CONSTRAINT "clinical_note_versions_clinicalNoteId_fkey" FOREIGN KEY ("clinicalNoteId") REFERENCES "public"."clinical_notes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_note_versions" ADD CONSTRAINT "clinical_note_versions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."clinical_note_versions" ADD CONSTRAINT "clinical_note_versions_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
