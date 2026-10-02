-- CreateEnum
CREATE TYPE "public"."EncounterStatus" AS ENUM ('DRAFT', 'CREATED', 'CHECKED_IN', 'TRIAGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'REFERRED');

-- CreateEnum
CREATE TYPE "public"."EncounterType" AS ENUM ('OUTPATIENT', 'INPATIENT', 'EMERGENCY', 'WALK_IN', 'FOLLOW_UP', 'PROCEDURE', 'TELEMEDICINE', 'HOME_CARE');

-- CreateTable
CREATE TABLE "public"."encounters" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientTenantRecordId" UUID NOT NULL,
    "providerId" UUID,
    "branchId" UUID,
    "departmentId" UUID,
    "createdByUserId" UUID NOT NULL,
    "encounterNumber" VARCHAR(100) NOT NULL,
    "type" "public"."EncounterType" NOT NULL,
    "status" "public"."EncounterStatus" NOT NULL DEFAULT 'DRAFT',
    "reason" VARCHAR(1000),
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "cancelledReason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounters_tenantId_status_idx" ON "public"."encounters"("tenantId", "status");

-- CreateIndex
CREATE INDEX "encounters_tenantId_patientTenantRecordId_createdAt_idx" ON "public"."encounters"("tenantId", "patientTenantRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "encounters_tenantId_providerId_status_idx" ON "public"."encounters"("tenantId", "providerId", "status");

-- CreateIndex
CREATE INDEX "encounters_tenantId_branchId_status_idx" ON "public"."encounters"("tenantId", "branchId", "status");

-- CreateIndex
CREATE INDEX "encounters_tenantId_departmentId_status_idx" ON "public"."encounters"("tenantId", "departmentId", "status");

-- CreateIndex
CREATE INDEX "encounters_createdByUserId_idx" ON "public"."encounters"("createdByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "encounters_tenantId_encounterNumber_key" ON "public"."encounters"("tenantId", "encounterNumber");

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "public"."provider_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounters" ADD CONSTRAINT "encounters_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
