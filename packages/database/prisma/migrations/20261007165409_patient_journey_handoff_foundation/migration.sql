-- CreateEnum
CREATE TYPE "public"."PatientJourneyHandoffStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "public"."patient_journey_handoffs" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "journeyId" UUID NOT NULL,
    "encounterId" UUID,
    "fromStepId" UUID,
    "toStepId" UUID,
    "fromBranchId" UUID,
    "fromDepartmentId" UUID,
    "toBranchId" UUID,
    "toDepartmentId" UUID,
    "status" "public"."PatientJourneyHandoffStatus" NOT NULL DEFAULT 'PENDING',
    "reason" VARCHAR(1000),
    "instruction" VARCHAR(1000),
    "initiatedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMPTZ(6),
    "rejectedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "patient_journey_handoffs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_journey_handoffs_tenantId_journeyId_status_idx" ON "public"."patient_journey_handoffs"("tenantId", "journeyId", "status");

-- CreateIndex
CREATE INDEX "patient_journey_handoffs_tenantId_encounterId_idx" ON "public"."patient_journey_handoffs"("tenantId", "encounterId");

-- CreateIndex
CREATE INDEX "patient_journey_handoffs_tenantId_fromDepartmentId_status_idx" ON "public"."patient_journey_handoffs"("tenantId", "fromDepartmentId", "status");

-- CreateIndex
CREATE INDEX "patient_journey_handoffs_tenantId_toDepartmentId_status_idx" ON "public"."patient_journey_handoffs"("tenantId", "toDepartmentId", "status");

-- CreateIndex
CREATE INDEX "patient_journey_handoffs_tenantId_initiatedByUserId_idx" ON "public"."patient_journey_handoffs"("tenantId", "initiatedByUserId");

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_journeyId_fkey" FOREIGN KEY ("journeyId") REFERENCES "public"."patient_journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_fromStepId_fkey" FOREIGN KEY ("fromStepId") REFERENCES "public"."patient_journey_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_toStepId_fkey" FOREIGN KEY ("toStepId") REFERENCES "public"."patient_journey_steps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_fromBranchId_fkey" FOREIGN KEY ("fromBranchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_toBranchId_fkey" FOREIGN KEY ("toBranchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_fromDepartmentId_fkey" FOREIGN KEY ("fromDepartmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_toDepartmentId_fkey" FOREIGN KEY ("toDepartmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."patient_journey_handoffs" ADD CONSTRAINT "patient_journey_handoffs_initiatedByUserId_fkey" FOREIGN KEY ("initiatedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
