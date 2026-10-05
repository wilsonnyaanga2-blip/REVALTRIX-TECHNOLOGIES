-- CreateEnum
CREATE TYPE "public"."PatientDataSource" AS ENUM ('PATIENT', 'FACILITY_STAFF', 'IMPORT', 'INTEGRATION', 'SYSTEM');

-- CreateTable
CREATE TABLE "public"."patient_contacts" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "phone" VARCHAR(30),
    "alternativePhone" VARCHAR(30),
    "email" VARCHAR(320),
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."emergency_contacts" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "alternativePhone" VARCHAR(30),
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "emergency_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."next_of_kin" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "relationship" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "email" VARCHAR(320),
    "address" VARCHAR(500),
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "next_of_kin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_addresses" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "county" VARCHAR(100),
    "town" VARCHAR(100),
    "area" VARCHAR(150),
    "physicalAddress" VARCHAR(500),
    "postalAddress" VARCHAR(300),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_insurances" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "provider" VARCHAR(200) NOT NULL,
    "memberNumber" VARCHAR(100),
    "policyNumber" VARCHAR(100),
    "principalMember" VARCHAR(200),
    "relationshipToPrincipal" VARCHAR(100),
    "validFrom" DATE,
    "validUntil" DATE,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_insurances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_corporate_profiles" (
    "id" UUID NOT NULL,
    "patientProfileId" UUID NOT NULL,
    "company" VARCHAR(200),
    "employeeNumber" VARCHAR(100),
    "corporatePlan" VARCHAR(200),
    "eligibilityInformation" JSONB,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" "public"."PatientDataSource" NOT NULL DEFAULT 'PATIENT',
    "createdByUserId" UUID,
    "updatedByUserId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "patient_corporate_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patient_contacts_patientProfileId_key" ON "public"."patient_contacts"("patientProfileId");

-- CreateIndex
CREATE INDEX "patient_contacts_status_idx" ON "public"."patient_contacts"("status");

-- CreateIndex
CREATE INDEX "patient_contacts_createdByUserId_idx" ON "public"."patient_contacts"("createdByUserId");

-- CreateIndex
CREATE INDEX "patient_contacts_updatedByUserId_idx" ON "public"."patient_contacts"("updatedByUserId");

-- CreateIndex
CREATE INDEX "emergency_contacts_patientProfileId_status_idx" ON "public"."emergency_contacts"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "emergency_contacts_createdByUserId_idx" ON "public"."emergency_contacts"("createdByUserId");

-- CreateIndex
CREATE INDEX "emergency_contacts_updatedByUserId_idx" ON "public"."emergency_contacts"("updatedByUserId");

-- CreateIndex
CREATE INDEX "next_of_kin_patientProfileId_status_idx" ON "public"."next_of_kin"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "next_of_kin_createdByUserId_idx" ON "public"."next_of_kin"("createdByUserId");

-- CreateIndex
CREATE INDEX "next_of_kin_updatedByUserId_idx" ON "public"."next_of_kin"("updatedByUserId");

-- CreateIndex
CREATE INDEX "patient_addresses_patientProfileId_status_idx" ON "public"."patient_addresses"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_addresses_patientProfileId_isPrimary_idx" ON "public"."patient_addresses"("patientProfileId", "isPrimary");

-- CreateIndex
CREATE INDEX "patient_addresses_createdByUserId_idx" ON "public"."patient_addresses"("createdByUserId");

-- CreateIndex
CREATE INDEX "patient_addresses_updatedByUserId_idx" ON "public"."patient_addresses"("updatedByUserId");

-- CreateIndex
CREATE INDEX "patient_insurances_patientProfileId_status_idx" ON "public"."patient_insurances"("patientProfileId", "status");

-- CreateIndex
CREATE INDEX "patient_insurances_provider_idx" ON "public"."patient_insurances"("provider");

-- CreateIndex
CREATE INDEX "patient_insurances_memberNumber_idx" ON "public"."patient_insurances"("memberNumber");

-- CreateIndex
CREATE INDEX "patient_insurances_policyNumber_idx" ON "public"."patient_insurances"("policyNumber");

-- CreateIndex
CREATE INDEX "patient_insurances_createdByUserId_idx" ON "public"."patient_insurances"("createdByUserId");

-- CreateIndex
CREATE INDEX "patient_insurances_updatedByUserId_idx" ON "public"."patient_insurances"("updatedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_corporate_profiles_patientProfileId_key" ON "public"."patient_corporate_profiles"("patientProfileId");

-- CreateIndex
CREATE INDEX "patient_corporate_profiles_status_idx" ON "public"."patient_corporate_profiles"("status");

-- CreateIndex
CREATE INDEX "patient_corporate_profiles_createdByUserId_idx" ON "public"."patient_corporate_profiles"("createdByUserId");

-- CreateIndex
CREATE INDEX "patient_corporate_profiles_updatedByUserId_idx" ON "public"."patient_corporate_profiles"("updatedByUserId");

-- AddForeignKey
ALTER TABLE "public"."patient_contacts" ADD CONSTRAINT "patient_contacts_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_contacts" ADD CONSTRAINT "patient_contacts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_contacts" ADD CONSTRAINT "patient_contacts_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."emergency_contacts" ADD CONSTRAINT "emergency_contacts_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."next_of_kin" ADD CONSTRAINT "next_of_kin_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."next_of_kin" ADD CONSTRAINT "next_of_kin_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."next_of_kin" ADD CONSTRAINT "next_of_kin_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_addresses" ADD CONSTRAINT "patient_addresses_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_addresses" ADD CONSTRAINT "patient_addresses_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_addresses" ADD CONSTRAINT "patient_addresses_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_insurances" ADD CONSTRAINT "patient_insurances_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_insurances" ADD CONSTRAINT "patient_insurances_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_insurances" ADD CONSTRAINT "patient_insurances_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_corporate_profiles" ADD CONSTRAINT "patient_corporate_profiles_patientProfileId_fkey" FOREIGN KEY ("patientProfileId") REFERENCES "public"."patient_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_corporate_profiles" ADD CONSTRAINT "patient_corporate_profiles_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_corporate_profiles" ADD CONSTRAINT "patient_corporate_profiles_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "public"."patient_data_access_logs_tenantId_patientProfileId_createdAt_id" RENAME TO "patient_data_access_logs_tenantId_patientProfileId_createdA_idx";

-- RenameIndex
ALTER INDEX "public"."patient_deletion_requests_requestingTenantId_status_createdAt_i" RENAME TO "patient_deletion_requests_requestingTenantId_status_created_idx";
-- Enforce at most one active primary address per patient.
CREATE UNIQUE INDEX "patient_addresses_one_active_primary_idx"
ON "public"."patient_addresses" ("patientProfileId")
WHERE "isPrimary" = true
  AND "status" = 'ACTIVE'
  AND "deletedAt" IS NULL;
