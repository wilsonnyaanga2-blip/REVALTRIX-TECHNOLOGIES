-- Family connections and medical-data permissions remain independent.
ALTER TYPE "public"."PatientDependentRegistrationStatus" ADD VALUE IF NOT EXISTS 'DRAFT';
ALTER TYPE "public"."PatientDependentRegistrationStatus" ADD VALUE IF NOT EXISTS 'PENDING_REVIEW';
ALTER TYPE "public"."PatientDependentRegistrationStatus" ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE "public"."PatientDependentRegistrationStatus" ADD VALUE IF NOT EXISTS 'REJECTED';
ALTER TYPE "public"."VerificationPurpose" ADD VALUE IF NOT EXISTS 'FAMILY_ACCESS';
CREATE TYPE "public"."FamilyRelationshipVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED');

ALTER TABLE "public"."patient_family_relationships"
  ADD COLUMN "requestedById" UUID,
  ADD COLUMN "approvedById" UUID,
  ADD COLUMN "verificationStatus" "public"."FamilyRelationshipVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "verificationDocuments" JSONB;

ALTER TABLE "public"."patient_dependent_registrations"
  ADD COLUMN "birthCertificateUrl" VARCHAR(1000),
  ADD COLUMN "guardianIdDocumentUrl" VARCHAR(1000),
  ADD COLUMN "additionalProofUrl" VARCHAR(1000),
  ADD COLUMN "verificationNotes" VARCHAR(2000),
  ADD COLUMN "reviewedByUserId" UUID,
  ADD COLUMN "reviewedAt" TIMESTAMPTZ(6);

ALTER TABLE "public"."patient_family_relationships"
  ADD CONSTRAINT "patient_family_relationships_requestedById_fkey"
    FOREIGN KEY ("requestedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "patient_family_relationships_approvedById_fkey"
    FOREIGN KEY ("approvedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."patient_dependent_registrations"
  ADD CONSTRAINT "patient_dependent_registrations_reviewedByUserId_fkey"
    FOREIGN KEY ("reviewedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "public"."FamilyAccessGrantStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'REVOKED');
CREATE TYPE "public"."FamilyAccessAuditAction" AS ENUM ('VIEW', 'DOWNLOAD', 'CREATE', 'UPDATE', 'CANCEL', 'LOGIN_ATTEMPT', 'ACCESS_DENIED');
CREATE TYPE "public"."FamilyAccessResourceType" AS ENUM ('PROFILE', 'APPOINTMENTS', 'REMINDERS', 'DOCUMENTS', 'LAB_RESULTS', 'PRESCRIPTIONS', 'BILLING', 'MESSAGES');
CREATE TYPE "public"."FamilyVerificationDocumentType" AS ENUM ('BIRTH_CERTIFICATE', 'NATIONAL_ID', 'PASSPORT', 'GUARDIANSHIP_ORDER', 'SCHOOL_ID', 'IMMUNIZATION_CARD', 'OTHER');
CREATE TYPE "public"."FamilyVerificationDocumentStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

CREATE TABLE "public"."family_access_grants" (
  "id" UUID NOT NULL,
  "patientId" UUID NOT NULL,
  "delegateId" UUID NOT NULL,
  "relationshipId" UUID,
  "permissions" JSONB NOT NULL,
  "status" "public"."FamilyAccessGrantStatus" NOT NULL DEFAULT 'ACTIVE',
  "grantedById" UUID NOT NULL,
  "expiresAt" TIMESTAMPTZ(6) NOT NULL,
  "reviewedAt" TIMESTAMPTZ(6),
  "revokedAt" TIMESTAMPTZ(6),
  "revokedById" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "family_access_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."family_access_audit_logs" (
  "id" UUID NOT NULL,
  "accessGrantId" UUID,
  "patientId" UUID NOT NULL,
  "delegateId" UUID NOT NULL,
  "action" "public"."FamilyAccessAuditAction" NOT NULL,
  "resourceType" "public"."FamilyAccessResourceType" NOT NULL,
  "resourceId" VARCHAR(100),
  "ipAddress" VARCHAR(64),
  "userAgent" VARCHAR(500),
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "family_access_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."family_verification_documents" (
  "id" UUID NOT NULL,
  "ownerId" UUID NOT NULL,
  "uploadedById" UUID NOT NULL,
  "documentType" "public"."FamilyVerificationDocumentType" NOT NULL,
  "storageKey" VARCHAR(1000) NOT NULL,
  "fileName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(150) NOT NULL,
  "fileSize" BIGINT NOT NULL,
  "status" "public"."FamilyVerificationDocumentStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMPTZ(6),
  "rejectionReason" VARCHAR(1000),
  "dependentRegistrationId" UUID,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "family_verification_documents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "family_verification_documents_storageKey_key" ON "public"."family_verification_documents"("storageKey");
CREATE INDEX "family_access_grants_patientId_status_expiresAt_idx" ON "public"."family_access_grants"("patientId", "status", "expiresAt");
CREATE INDEX "family_access_grants_delegateId_status_expiresAt_idx" ON "public"."family_access_grants"("delegateId", "status", "expiresAt");
CREATE INDEX "family_access_grants_relationshipId_idx" ON "public"."family_access_grants"("relationshipId");
CREATE INDEX "family_access_grants_grantedById_createdAt_idx" ON "public"."family_access_grants"("grantedById", "createdAt");
CREATE INDEX "family_access_audit_logs_patientId_createdAt_idx" ON "public"."family_access_audit_logs"("patientId", "createdAt");
CREATE INDEX "family_access_audit_logs_delegateId_createdAt_idx" ON "public"."family_access_audit_logs"("delegateId", "createdAt");
CREATE INDEX "family_access_audit_logs_accessGrantId_createdAt_idx" ON "public"."family_access_audit_logs"("accessGrantId", "createdAt");
CREATE INDEX "family_access_audit_logs_action_createdAt_idx" ON "public"."family_access_audit_logs"("action", "createdAt");
CREATE INDEX "family_verification_documents_ownerId_status_createdAt_idx" ON "public"."family_verification_documents"("ownerId", "status", "createdAt");
CREATE INDEX "family_verification_documents_uploadedById_createdAt_idx" ON "public"."family_verification_documents"("uploadedById", "createdAt");
CREATE INDEX "family_verification_documents_status_createdAt_idx" ON "public"."family_verification_documents"("status", "createdAt");
CREATE INDEX "family_verification_documents_dependentRegistrationId_idx" ON "public"."family_verification_documents"("dependentRegistrationId");

ALTER TABLE "public"."family_access_grants"
  ADD CONSTRAINT "family_access_grants_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_grants_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_grants_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "public"."patient_family_relationships"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_grants_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_grants_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."family_access_audit_logs"
  ADD CONSTRAINT "family_access_audit_logs_accessGrantId_fkey" FOREIGN KEY ("accessGrantId") REFERENCES "public"."family_access_grants"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_audit_logs_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_access_audit_logs_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "public"."family_verification_documents"
  ADD CONSTRAINT "family_verification_documents_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_verification_documents_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_verification_documents_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "family_verification_documents_dependentRegistrationId_fkey" FOREIGN KEY ("dependentRegistrationId") REFERENCES "public"."patient_dependent_registrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "public"."permissions" (
  "id", "tenantId", "scope", "resource", "action", "effect",
  "description", "status", "createdAt", "updatedAt"
)
VALUES (
  '00000000-0000-4000-8000-000000000090', NULL, 'PLATFORM',
  'patient_dependents', 'review', 'ALLOW',
  'Review dependent verification documents and registrations',
  'ACTIVE', NOW(), NOW()
)
ON CONFLICT ("id") DO UPDATE
SET "scope" = EXCLUDED."scope",
    "resource" = EXCLUDED."resource",
    "action" = EXCLUDED."action",
    "effect" = EXCLUDED."effect",
    "description" = EXCLUDED."description",
    "status" = EXCLUDED."status",
    "updatedAt" = NOW();

INSERT INTO "public"."role_permissions" ("roleId", "permissionId", "assignedAt")
SELECT r."id", p."id", NOW()
FROM "public"."roles" r
JOIN "public"."permissions" p
  ON p."id" = '00000000-0000-4000-8000-000000000090'
WHERE r."tenantId" IS NULL
  AND r."scope" = 'PLATFORM'
  AND r."status" = 'ACTIVE'
  AND r."code" IN ('PLATFORM_ADMIN', 'PLATFORM_VERIFIER', 'VERIFICATION_REVIEWER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
