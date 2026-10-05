-- CreateEnum
CREATE TYPE "public"."PatientFamilyRelationshipType" AS ENUM ('SPOUSE', 'PARENT', 'CHILD', 'SIBLING', 'GRANDPARENT', 'GRANDCHILD', 'GUARDIAN', 'DEPENDENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."PatientFamilyRelationshipStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED', 'CANCELLED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."PatientFamilyRelationshipRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."patient_family_relationships" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "relatedPatientProfileId" UUID NOT NULL,
    "relationshipType" "public"."PatientFamilyRelationshipType" NOT NULL,
    "status" "public"."PatientFamilyRelationshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdByUserId" UUID NOT NULL,
    "revokedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_family_relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_family_relationship_requests" (
    "id" UUID NOT NULL,
    "requesterPatientProfileId" UUID NOT NULL,
    "targetPatientProfileId" UUID NOT NULL,
    "relationshipType" "public"."PatientFamilyRelationshipType" NOT NULL,
    "status" "public"."PatientFamilyRelationshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" UUID NOT NULL,
    "respondedByUserId" UUID,
    "reason" VARCHAR(1000),
    "responseReason" VARCHAR(1000),
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_family_relationship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_family_relationships_patientProfileId_status_relati_idx" ON "public"."patient_family_relationships"("patientProfileId", "status", "relationshipType");

-- CreateIndex
CREATE INDEX "patient_family_relationships_relatedPatientProfileId_status_idx" ON "public"."patient_family_relationships"("relatedPatientProfileId", "status", "relationshipType");

-- CreateIndex
CREATE INDEX "patient_family_relationships_createdByUserId_createdAt_idx" ON "public"."patient_family_relationships"("createdByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_family_relationships_revokedByUserId_revokedAt_idx" ON "public"."patient_family_relationships"("revokedByUserId", "revokedAt");

-- CreateIndex
CREATE INDEX "patient_family_relationship_requests_requesterPatientProfil_idx" ON "public"."patient_family_relationship_requests"("requesterPatientProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "patient_family_relationship_requests_targetPatientProfileId_idx" ON "public"."patient_family_relationship_requests"("targetPatientProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "patient_family_relationship_requests_requestedByUserId_crea_idx" ON "public"."patient_family_relationship_requests"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_family_relationship_requests_respondedByUserId_resp_idx" ON "public"."patient_family_relationship_requests"("respondedByUserId", "respondedAt");

-- CreateIndex
CREATE INDEX "patient_family_relationship_requests_expiresAt_idx" ON "public"."patient_family_relationship_requests"("expiresAt");

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_relatedPatientProfileId_fkey" FOREIGN KEY ("relatedPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationships" ADD CONSTRAINT "patient_family_relationships_revokedByUserId_fkey" FOREIGN KEY ("revokedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationship_requests" ADD CONSTRAINT "patient_family_relationship_requests_requesterPatientProfi_fkey" FOREIGN KEY ("requesterPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationship_requests" ADD CONSTRAINT "patient_family_relationship_requests_targetPatientProfileI_fkey" FOREIGN KEY ("targetPatientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationship_requests" ADD CONSTRAINT "patient_family_relationship_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_family_relationship_requests" ADD CONSTRAINT "patient_family_relationship_requests_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
