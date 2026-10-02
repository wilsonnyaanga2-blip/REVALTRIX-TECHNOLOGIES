-- CreateEnum
CREATE TYPE "public"."TenantSetupStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY', 'BLOCKED', 'LIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."TenantDocumentStatus" AS ENUM ('DRAFT', 'UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED', 'REPLACED');

-- CreateEnum
CREATE TYPE "public"."TenantDocumentVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "public"."TenantDocumentType" AS ENUM ('REGISTRATION_CERTIFICATE', 'INCORPORATION_CERTIFICATE', 'BUSINESS_PERMIT', 'HEALTHCARE_FACILITY_LICENSE', 'PROFESSIONAL_LICENSE', 'TAX_CERTIFICATE', 'INSURANCE_CERTIFICATE', 'ACCREDITATION_CERTIFICATE', 'MEDICAL_WASTE_CERTIFICATE', 'FIRE_SAFETY_CERTIFICATE', 'RADIATION_LICENSE', 'PHARMACY_LICENSE', 'LABORATORY_LICENSE', 'AMBULANCE_LICENSE', 'PRIVACY_DATA_PROTECTION_DOCUMENT', 'OTHER');

-- CreateTable
CREATE TABLE "public"."tenant_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "businessName" VARCHAR(200),
    "legalName" VARCHAR(300),
    "registrationNumber" VARCHAR(150),
    "taxIdentificationNumber" VARCHAR(150),
    "country" VARCHAR(100) NOT NULL,
    "county" VARCHAR(100),
    "subcounty" VARCHAR(100),
    "address" VARCHAR(500),
    "postalCode" VARCHAR(30),
    "website" VARCHAR(500),
    "contactEmail" VARCHAR(320),
    "contactPhone" VARCHAR(50),
    "description" VARCHAR(1000),
    "ownershipType" VARCHAR(100),
    "parentOrganizationId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_setups" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "status" "public"."TenantSetupStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "readinessPercent" INTEGER NOT NULL DEFAULT 0,
    "readyAt" TIMESTAMPTZ(6),
    "liveAt" TIMESTAMPTZ(6),
    "suspendedAt" TIMESTAMPTZ(6),
    "lastCalculatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_setups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."tenant_documents" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "type" "public"."TenantDocumentType" NOT NULL,
    "status" "public"."TenantDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationStatus" "public"."TenantDocumentVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "title" VARCHAR(200) NOT NULL,
    "documentNumber" VARCHAR(150),
    "issuingAuthority" VARCHAR(200),
    "issueDate" DATE,
    "expiryDate" DATE,
    "version" INTEGER NOT NULL DEFAULT 1,
    "storageKey" VARCHAR(1000),
    "fileName" VARCHAR(255),
    "mimeType" VARCHAR(150),
    "fileSizeBytes" BIGINT,
    "checksum" VARCHAR(128),
    "uploadedByUserId" UUID,
    "verifiedByUserId" UUID,
    "verifiedAt" TIMESTAMPTZ(6),
    "rejectionReason" VARCHAR(1000),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "tenant_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_profiles_tenantId_key" ON "public"."tenant_profiles"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_profiles_country_idx" ON "public"."tenant_profiles"("country");

-- CreateIndex
CREATE INDEX "tenant_profiles_county_idx" ON "public"."tenant_profiles"("county");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_setups_tenantId_key" ON "public"."tenant_setups"("tenantId");

-- CreateIndex
CREATE INDEX "tenant_setups_status_idx" ON "public"."tenant_setups"("status");

-- CreateIndex
CREATE INDEX "tenant_documents_tenantId_type_status_idx" ON "public"."tenant_documents"("tenantId", "type", "status");

-- CreateIndex
CREATE INDEX "tenant_documents_tenantId_expiryDate_idx" ON "public"."tenant_documents"("tenantId", "expiryDate");

-- CreateIndex
CREATE INDEX "tenant_documents_tenantId_verificationStatus_idx" ON "public"."tenant_documents"("tenantId", "verificationStatus");

-- CreateIndex
CREATE INDEX "tenant_documents_storageKey_idx" ON "public"."tenant_documents"("storageKey");

-- AddForeignKey
ALTER TABLE "public"."tenant_profiles" ADD CONSTRAINT "tenant_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_setups" ADD CONSTRAINT "tenant_setups_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tenant_documents" ADD CONSTRAINT "tenant_documents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
