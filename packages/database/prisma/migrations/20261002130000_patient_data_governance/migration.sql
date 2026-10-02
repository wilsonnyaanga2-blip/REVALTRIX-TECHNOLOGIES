-- Platform-wide patient identity and patient data governance.
-- This migration intentionally does NOT add tenant ownership to patient_profiles.

ALTER TABLE "patient_profiles"
ADD COLUMN "platformPatientId" VARCHAR(50);

UPDATE "patient_profiles"
SET "platformPatientId" = 'pt_' || REPLACE(gen_random_uuid()::text, '-', '')
WHERE "platformPatientId" IS NULL;

ALTER TABLE "patient_profiles"
ALTER COLUMN "platformPatientId" SET NOT NULL;

CREATE UNIQUE INDEX "patient_profiles_platformPatientId_key"
ON "patient_profiles"("platformPatientId");

CREATE TYPE "PatientAccessRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'CANCELLED',
  'EXPIRED'
);

CREATE TYPE "PatientAccessGrantStatus" AS ENUM (
  'ACTIVE',
  'REVOKED',
  'EXPIRED'
);

CREATE TYPE "PatientDeletionRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED'
);

CREATE TYPE "PatientDeletionRequesterType" AS ENUM (
  'PATIENT',
  'TENANT'
);

CREATE TABLE "patient_access_requests" (
  "id" UUID NOT NULL,
  "patientProfileId" UUID NOT NULL,
  "patientTenantRecordId" UUID,
  "requestingTenantId" UUID NOT NULL,
  "requestedByUserId" UUID NOT NULL,
  "reviewedByUserId" UUID,
  "status" "PatientAccessRequestStatus" NOT NULL DEFAULT 'PENDING',
  "purpose" VARCHAR(500) NOT NULL,
  "requestedCategories" JSONB NOT NULL,
  "reason" VARCHAR(1000),
  "expiresAt" TIMESTAMPTZ(6),
  "respondedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "patient_access_requests_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "patient_access_grants" (
  "id" UUID NOT NULL,
  "patientProfileId" UUID NOT NULL,
  "patientTenantRecordId" UUID,
  "tenantId" UUID NOT NULL,
  "accessRequestId" UUID,
  "createdByUserId" UUID NOT NULL,
  "status" "PatientAccessGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "categories" JSONB NOT NULL,
  "purpose" VARCHAR(500) NOT NULL,
  "startsAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMPTZ(6),
  "revokedAt" TIMESTAMPTZ(6),
  "revokedReason" VARCHAR(500),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "patient_access_grants_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "patient_data_access_logs" (
  "id" UUID NOT NULL,
  "patientProfileId" UUID NOT NULL,
  "tenantId" UUID,
  "accessedByUserId" UUID NOT NULL,
  "action" VARCHAR(100) NOT NULL,
  "dataCategory" VARCHAR(100) NOT NULL,
  "resourceType" VARCHAR(100),
  "resourceId" VARCHAR(100),
  "purpose" VARCHAR(500) NOT NULL,
  "outcome" VARCHAR(50) NOT NULL,
  "reason" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "patient_data_access_logs_pkey"
    PRIMARY KEY ("id")
);

CREATE TABLE "patient_deletion_requests" (
  "id" UUID NOT NULL,
  "patientProfileId" UUID NOT NULL,
  "requestingTenantId" UUID,
  "requestedByUserId" UUID NOT NULL,
  "reviewedByUserId" UUID,
  "requesterType" "PatientDeletionRequesterType" NOT NULL,
  "status" "PatientDeletionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reason" VARCHAR(1000) NOT NULL,
  "reviewReason" VARCHAR(1000),
  "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMPTZ(6),
  "completedAt" TIMESTAMPTZ(6),
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "patient_deletion_requests_pkey"
    PRIMARY KEY ("id")
);

ALTER TABLE "patient_access_requests"
ADD CONSTRAINT "patient_access_requests_patientProfileId_fkey"
FOREIGN KEY ("patientProfileId")
REFERENCES "patient_profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_requests"
ADD CONSTRAINT "patient_access_requests_patientTenantRecordId_fkey"
FOREIGN KEY ("patientTenantRecordId")
REFERENCES "patient_tenant_records"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_requests"
ADD CONSTRAINT "patient_access_requests_requestingTenantId_fkey"
FOREIGN KEY ("requestingTenantId")
REFERENCES "tenants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_requests"
ADD CONSTRAINT "patient_access_requests_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_requests"
ADD CONSTRAINT "patient_access_requests_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_grants"
ADD CONSTRAINT "patient_access_grants_patientProfileId_fkey"
FOREIGN KEY ("patientProfileId")
REFERENCES "patient_profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_grants"
ADD CONSTRAINT "patient_access_grants_patientTenantRecordId_fkey"
FOREIGN KEY ("patientTenantRecordId")
REFERENCES "patient_tenant_records"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_grants"
ADD CONSTRAINT "patient_access_grants_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "tenants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_grants"
ADD CONSTRAINT "patient_access_grants_accessRequestId_fkey"
FOREIGN KEY ("accessRequestId")
REFERENCES "patient_access_requests"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_access_grants"
ADD CONSTRAINT "patient_access_grants_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_data_access_logs"
ADD CONSTRAINT "patient_data_access_logs_patientProfileId_fkey"
FOREIGN KEY ("patientProfileId")
REFERENCES "patient_profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_data_access_logs"
ADD CONSTRAINT "patient_data_access_logs_tenantId_fkey"
FOREIGN KEY ("tenantId")
REFERENCES "tenants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_data_access_logs"
ADD CONSTRAINT "patient_data_access_logs_accessedByUserId_fkey"
FOREIGN KEY ("accessedByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_deletion_requests"
ADD CONSTRAINT "patient_deletion_requests_patientProfileId_fkey"
FOREIGN KEY ("patientProfileId")
REFERENCES "patient_profiles"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_deletion_requests"
ADD CONSTRAINT "patient_deletion_requests_requestingTenantId_fkey"
FOREIGN KEY ("requestingTenantId")
REFERENCES "tenants"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_deletion_requests"
ADD CONSTRAINT "patient_deletion_requests_requestedByUserId_fkey"
FOREIGN KEY ("requestedByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "patient_deletion_requests"
ADD CONSTRAINT "patient_deletion_requests_reviewedByUserId_fkey"
FOREIGN KEY ("reviewedByUserId")
REFERENCES "users"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "patient_access_requests_patientProfileId_status_idx"
ON "patient_access_requests"("patientProfileId", "status");

CREATE INDEX "patient_access_requests_requestingTenantId_status_createdAt_idx"
ON "patient_access_requests"("requestingTenantId", "status", "createdAt");

CREATE INDEX "patient_access_requests_requestedByUserId_createdAt_idx"
ON "patient_access_requests"("requestedByUserId", "createdAt");

CREATE INDEX "patient_access_requests_reviewedByUserId_createdAt_idx"
ON "patient_access_requests"("reviewedByUserId", "createdAt");

CREATE INDEX "patient_access_requests_expiresAt_idx"
ON "patient_access_requests"("expiresAt");

CREATE INDEX "patient_access_grants_patientProfileId_status_idx"
ON "patient_access_grants"("patientProfileId", "status");

CREATE INDEX "patient_access_grants_tenantId_status_expiresAt_idx"
ON "patient_access_grants"("tenantId", "status", "expiresAt");

CREATE INDEX "patient_access_grants_accessRequestId_idx"
ON "patient_access_grants"("accessRequestId");

CREATE INDEX "patient_access_grants_createdByUserId_createdAt_idx"
ON "patient_access_grants"("createdByUserId", "createdAt");

CREATE INDEX "patient_data_access_logs_patientProfileId_createdAt_idx"
ON "patient_data_access_logs"("patientProfileId", "createdAt");

CREATE INDEX "patient_data_access_logs_tenantId_patientProfileId_createdAt_idx"
ON "patient_data_access_logs"("tenantId", "patientProfileId", "createdAt");

CREATE INDEX "patient_data_access_logs_accessedByUserId_createdAt_idx"
ON "patient_data_access_logs"("accessedByUserId", "createdAt");

CREATE INDEX "patient_data_access_logs_resourceType_resourceId_idx"
ON "patient_data_access_logs"("resourceType", "resourceId");

CREATE INDEX "patient_deletion_requests_patientProfileId_status_createdAt_idx"
ON "patient_deletion_requests"("patientProfileId", "status", "createdAt");

CREATE INDEX "patient_deletion_requests_requestingTenantId_status_createdAt_idx"
ON "patient_deletion_requests"("requestingTenantId", "status", "createdAt");

CREATE INDEX "patient_deletion_requests_requestedByUserId_createdAt_idx"
ON "patient_deletion_requests"("requestedByUserId", "createdAt");

CREATE INDEX "patient_deletion_requests_reviewedByUserId_createdAt_idx"
ON "patient_deletion_requests"("reviewedByUserId", "createdAt");
