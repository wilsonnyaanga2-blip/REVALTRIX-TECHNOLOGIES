/*
  Warnings:

  - The `status` column on the `patient_tenant_records` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."PatientTenantRecordStatus" AS ENUM ('PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "public"."patient_tenant_records" DROP COLUMN "status",
ADD COLUMN     "status" "public"."PatientTenantRecordStatus" NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE "public"."patient_data_submissions" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "patientTenantRecordId" UUID,
    "tenantId" UUID NOT NULL,
    "submittedByUserId" UUID,
    "source" VARCHAR(50) NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_data_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_data_submissions_patientProfileId_createdAt_idx" ON "public"."patient_data_submissions"("patientProfileId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_data_submissions_patientTenantRecordId_createdAt_idx" ON "public"."patient_data_submissions"("patientTenantRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_data_submissions_tenantId_createdAt_idx" ON "public"."patient_data_submissions"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_data_submissions_submittedByUserId_createdAt_idx" ON "public"."patient_data_submissions"("submittedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "patient_tenant_records_tenantId_status_idx" ON "public"."patient_tenant_records"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patient_tenant_records_patientProfileId_status_idx" ON "public"."patient_tenant_records"("patientProfileId", "status");

-- AddForeignKey
ALTER TABLE "public"."patient_data_submissions" ADD CONSTRAINT "patient_data_submissions_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_data_submissions" ADD CONSTRAINT "patient_data_submissions_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_data_submissions" ADD CONSTRAINT "patient_data_submissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_data_submissions" ADD CONSTRAINT "patient_data_submissions_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
