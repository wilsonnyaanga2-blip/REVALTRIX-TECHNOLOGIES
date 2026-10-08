-- CreateEnum
CREATE TYPE "public"."QueueCallStatus" AS ENUM ('CALLED', 'ACKNOWLEDGED', 'EXPIRED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."queue_calls" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "queueEntryId" UUID NOT NULL,
    "calledByUserId" UUID NOT NULL,
    "callNumber" INTEGER NOT NULL,
    "status" "public"."QueueCallStatus" NOT NULL DEFAULT 'CALLED',
    "calledAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledgedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6),
    "cancelledAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queue_calls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_calls_tenantId_queueEntryId_createdAt_idx" ON "public"."queue_calls"("tenantId", "queueEntryId", "createdAt");

-- CreateIndex
CREATE INDEX "queue_calls_tenantId_status_calledAt_idx" ON "public"."queue_calls"("tenantId", "status", "calledAt");

-- CreateIndex
CREATE INDEX "queue_calls_calledByUserId_createdAt_idx" ON "public"."queue_calls"("calledByUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "queue_calls_queueEntryId_callNumber_key" ON "public"."queue_calls"("queueEntryId", "callNumber");

-- AddForeignKey
ALTER TABLE "public"."queue_calls" ADD CONSTRAINT "queue_calls_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_calls" ADD CONSTRAINT "queue_calls_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "public"."queue_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."queue_calls" ADD CONSTRAINT "queue_calls_calledByUserId_fkey" FOREIGN KEY ("calledByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
