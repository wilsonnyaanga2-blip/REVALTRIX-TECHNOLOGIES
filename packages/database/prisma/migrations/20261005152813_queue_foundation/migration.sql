-- CreateEnum
CREATE TYPE "public"."QueueStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "public"."QueueEntryStatus" AS ENUM ('CREATED', 'WAITING', 'CALLED', 'IN_SERVICE', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "public"."QueueEntryPriority" AS ENUM ('ROUTINE', 'URGENT', 'PRIORITY', 'EMERGENCY');

-- CreateTable
CREATE TABLE "public"."queues" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "branchId" UUID,
    "departmentId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(1000),
    "status" "public"."QueueStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."queue_entries" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "queueId" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "patientTenantRecordId" UUID NOT NULL,
    "queueNumber" VARCHAR(100) NOT NULL,
    "priority" "public"."QueueEntryPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "public"."QueueEntryStatus" NOT NULL DEFAULT 'CREATED',
    "position" INTEGER,
    "reason" VARCHAR(1000),
    "checkedInAt" TIMESTAMPTZ(6),
    "calledAt" TIMESTAMPTZ(6),
    "startedAt" TIMESTAMPTZ(6),
    "completedAt" TIMESTAMPTZ(6),
    "skippedAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "noShowAt" TIMESTAMPTZ(6),
    "createdByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queue_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."queue_entry_history" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "queueEntryId" UUID NOT NULL,
    "fromStatus" "public"."QueueEntryStatus",
    "toStatus" "public"."QueueEntryStatus" NOT NULL,
    "fromPosition" INTEGER,
    "toPosition" INTEGER,
    "reason" VARCHAR(1000),
    "changedByUserId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_entry_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queues_tenantId_status_idx" ON "public"."queues"("tenantId", "status");

-- CreateIndex
CREATE INDEX "queues_tenantId_branchId_status_idx" ON "public"."queues"("tenantId", "branchId", "status");

-- CreateIndex
CREATE INDEX "queues_tenantId_departmentId_status_idx" ON "public"."queues"("tenantId", "departmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "queues_tenantId_code_key" ON "public"."queues"("tenantId", "code");

-- CreateIndex
CREATE INDEX "queue_entries_tenantId_queueId_status_idx" ON "public"."queue_entries"("tenantId", "queueId", "status");

-- CreateIndex
CREATE INDEX "queue_entries_tenantId_queueId_priority_status_idx" ON "public"."queue_entries"("tenantId", "queueId", "priority", "status");

-- CreateIndex
CREATE INDEX "queue_entries_tenantId_encounterId_idx" ON "public"."queue_entries"("tenantId", "encounterId");

-- CreateIndex
CREATE INDEX "queue_entries_tenantId_patientTenantRecordId_createdAt_idx" ON "public"."queue_entries"("tenantId", "patientTenantRecordId", "createdAt");

-- CreateIndex
CREATE INDEX "queue_entries_tenantId_status_createdAt_idx" ON "public"."queue_entries"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "queue_entries_tenantId_queueId_queueNumber_key" ON "public"."queue_entries"("tenantId", "queueId", "queueNumber");

-- CreateIndex
CREATE INDEX "queue_entry_history_tenantId_queueEntryId_createdAt_idx" ON "public"."queue_entry_history"("tenantId", "queueEntryId", "createdAt");

-- CreateIndex
CREATE INDEX "queue_entry_history_tenantId_toStatus_createdAt_idx" ON "public"."queue_entry_history"("tenantId", "toStatus", "createdAt");

-- CreateIndex
CREATE INDEX "queue_entry_history_changedByUserId_createdAt_idx" ON "public"."queue_entry_history"("changedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."queues" ADD CONSTRAINT "queues_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queues" ADD CONSTRAINT "queues_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queues" ADD CONSTRAINT "queues_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entries" ADD CONSTRAINT "queue_entries_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entries" ADD CONSTRAINT "queue_entries_queueId_fkey" FOREIGN KEY ("queueId") REFERENCES "public"."queues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entries" ADD CONSTRAINT "queue_entries_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entries" ADD CONSTRAINT "queue_entries_patientTenantRecordId_fkey" FOREIGN KEY ("patientTenantRecordId") REFERENCES "public"."patient_tenant_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entries" ADD CONSTRAINT "queue_entries_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entry_history" ADD CONSTRAINT "queue_entry_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entry_history" ADD CONSTRAINT "queue_entry_history_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "public"."queue_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_entry_history" ADD CONSTRAINT "queue_entry_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
