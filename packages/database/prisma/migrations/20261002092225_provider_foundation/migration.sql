-- CreateEnum
CREATE TYPE "public"."ProviderType" AS ENUM ('PHYSICIAN', 'DENTIST', 'NURSE', 'MIDWIFE', 'CLINICAL_OFFICER', 'PHARMACIST', 'PHARMACY_TECHNICIAN', 'LABORATORY_SCIENTIST', 'LABORATORY_TECHNICIAN', 'RADIOLOGIST', 'RADIOGRAPHER', 'SONOGRAPHER', 'PHYSIOTHERAPIST', 'OCCUPATIONAL_THERAPIST', 'NUTRITIONIST', 'DIETITIAN', 'PSYCHOLOGIST', 'COUNSELLOR', 'OPTOMETRIST', 'OPTICIAN', 'ANESTHESIOLOGIST', 'SURGEON', 'SPECIALIST', 'PARAMEDIC', 'OTHER');

-- CreateTable
CREATE TABLE "public"."provider_profiles" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "providerNumber" VARCHAR(100) NOT NULL,
    "providerType" "public"."ProviderType" NOT NULL,
    "professionalTitle" VARCHAR(150),
    "specialty" VARCHAR(200),
    "subspecialty" VARCHAR(200),
    "registrationNumber" VARCHAR(150),
    "registrationBody" VARCHAR(200),
    "licenseNumber" VARCHAR(150),
    "licenseExpiryDate" DATE,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "provider_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "provider_profiles_tenantId_status_idx" ON "public"."provider_profiles"("tenantId", "status");

-- CreateIndex
CREATE INDEX "provider_profiles_tenantId_providerType_idx" ON "public"."provider_profiles"("tenantId", "providerType");

-- CreateIndex
CREATE INDEX "provider_profiles_userId_status_idx" ON "public"."provider_profiles"("userId", "status");

-- CreateIndex
CREATE INDEX "provider_profiles_tenantId_specialty_idx" ON "public"."provider_profiles"("tenantId", "specialty");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_tenantId_userId_key" ON "public"."provider_profiles"("tenantId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "provider_profiles_tenantId_providerNumber_key" ON "public"."provider_profiles"("tenantId", "providerNumber");

-- AddForeignKey
ALTER TABLE "public"."provider_profiles" ADD CONSTRAINT "provider_profiles_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."provider_profiles" ADD CONSTRAINT "provider_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
