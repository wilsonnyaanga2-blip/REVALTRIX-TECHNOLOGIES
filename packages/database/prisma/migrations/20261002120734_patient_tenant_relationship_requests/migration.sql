-- CreateEnum
CREATE TYPE "public"."PatientTenantRelationshipRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."patient_tenant_relationship_requests" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "patientTenantRecordId" UUID NOT NULL,
    "requestingTenantId" UUID NOT NULL,
    "requestedByUserId" UUID NOT NULL,
    "respondedByUserId" UUID,
    "status" "public"."PatientTenantRelationshipRequestStatus" NOT NULL DEFAULT 'PENDING',
    "reason" VARCHAR(1000),
    "responseReason" VARCHAR(1000),
    "requestedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_tenant_relationship_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_tenant_relationship_requests_patientProfileId_statu_idx" ON "public"."patient_tenant_relationship_requests"("patientProfileId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "patient_tenant_relationship_requests_patientTenantRecordId__idx" ON "public"."patient_tenant_relationship_requests"("patientTenantRecordId", "status");

-- CreateIndex
CREATE INDEX "patient_tenant_relationship_requests_requestingTenantId_sta_idx" ON "public"."patient_tenant_relationship_requests"("requestingTenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "patient_tenant_relationship_requests_requestedByUserId_crea_idx" ON "public"."patient_tenant_relationship_requests"("requestedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_tenant_relationship_requests_respondedByUserId_resp_idx" ON "public"."patient_tenant_relationship_requests"("respondedByUserId", "respondedAt");

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_relationship_requests" ADD CONSTRAINT "patient_tenant_relationship_requests_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_relationship_requests" ADD CONSTRAINT "patient_tenant_relationship_requests_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_relationship_requests" ADD CONSTRAINT "patient_tenant_relationship_requests_requestingTenantId_fkey" FOREIGN KEY ("requestingTenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_relationship_requests" ADD CONSTRAINT "patient_tenant_relationship_requests_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_relationship_requests" ADD CONSTRAINT "patient_tenant_relationship_requests_respondedByUserId_fkey" FOREIGN KEY ("respondedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

