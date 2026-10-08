-- CreateEnum
CREATE TYPE "public"."PatientJourneyStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "public"."PatientJourneyStepStatus" AS ENUM ('PENDING', 'READY', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PatientJourneyStepType" AS ENUM ('SERVICE', 'WAIT', 'HANDOFF', 'CHECK_IN', 'COMPLETION');

-- CreateTable
CREATE TABLE "public"."patient_journeys" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "patientTenantRecordId" UUID NOT NULL,
    "encounterId" UUID,
    "status" "public"."PatientJourneyStatus" NOT NULL DEFAULT 'ACTIVE',
    "startedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."patient_journey_steps" (
    "id" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "sequence" INTEGER NOT NULL,
    "type" "public"."PatientJourneyStepType" NOT NULL,
    "status" "public"."PatientJourneyStepStatus" NOT NULL DEFAULT 'PENDING',
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "branchId" UUID,
    "departmentId" UUID,
    "encounterId" UUID,
    "queueId" UUID,
    "queueEntryId" UUID,
    "location" VARCHAR(300),
    "instruction" VARCHAR(1000),
    "estimatedWaitMinutes" INTEGER,
    "estimatedDurationMinutes" INTEGER,
    "readyAt" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_journey_steps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_journeys_tenantId_status_idx" ON "public"."patient_journeys"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patient_journeys_tenantId_patientTenantRecordId_status_idx" ON "public"."patient_journeys"("tenantId", "patientTenantRecordId", "status");

-- CreateIndex
CREATE INDEX "patient_journeys_tenantId_encounterId_idx" ON "public"."patient_journeys"("tenantId", "encounterId");

-- CreateIndex
CREATE INDEX "patient_journey_steps_tenantId_status_idx" ON "public"."patient_journey_steps"("tenantId", "status");

-- CreateIndex
CREATE INDEX "patient_journey_steps_tenantId_journeyId_sequence_idx" ON "public"."patient_journey_steps"("tenantId", "journeyId", "sequence");

-- CreateIndex
CREATE INDEX "patient_journey_steps_tenantId_departmentId_status_idx" ON "public"."patient_journey_steps"("tenantId", "departmentId", "status");

-- CreateIndex
CREATE INDEX "patient_journey_steps_tenantId_queueEntryId_idx" ON "public"."patient_journey_steps"("tenantId", "queueEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_journey_steps_journeyId_sequence_key" ON "public"."patient_journey_steps"("journeyId", "sequence");

-- AddForeignKey
ALTER TABLE "public"."patient_journeys" ADD CONSTRAINT "patient_journeys_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journeys" ADD CONSTRAINT "patient_journeys_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journeys" ADD CONSTRAINT "patient_journeys_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."patient_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "public"."queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_steps" ADD CONSTRAINT "patient_journey_steps_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "public"."queue_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
