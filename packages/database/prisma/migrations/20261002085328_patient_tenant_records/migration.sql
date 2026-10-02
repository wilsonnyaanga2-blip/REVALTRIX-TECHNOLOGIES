-- CreateTable
CREATE TABLE "public"."patient_tenant_records" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientNumber" VARCHAR(50) NOT NULL,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "registeredAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_tenant_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_tenant_records_tenantId_status_idx" ON "public"."patient_tenant_records"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patient_tenant_records_patientProfileId_status_idx" ON "public"."patient_tenant_records"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_tenant_records_createdByUserId_idx" ON "public"."patient_tenant_records"("createdByUserId");

-- CreateIndex
CREATE INDEX "patient_tenant_records_tenantId_createdAt_idx" ON "public"."patient_tenant_records"("tenantId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "patient_tenant_records_tenantId_patientProfileId_key" ON "public"."patient_tenant_records"("tenantId", "patientProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_tenant_records_tenantId_patientNumber_key" ON "public"."patient_tenant_records"("tenantId", "patientNumber");

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_records" ADD CONSTRAINT "patient_tenant_records_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_records" ADD CONSTRAINT "patient_tenant_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_tenant_records" ADD CONSTRAINT "patient_tenant_records_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
