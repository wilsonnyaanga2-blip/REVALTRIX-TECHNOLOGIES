-- CreateTable
CREATE TABLE "public"."queue_care_records" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "queueEntryId" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "departmentId" UUID,
    "authorUserId" UUID NOT NULL,
    "note" TEXT,
    "procedures" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "queue_care_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."queue_care_attachments" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "careRecordId" UUID NOT NULL,
    "uploadedByUserId" UUID NOT NULL,
    "storageKey" VARCHAR(500) NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(100) NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "queue_care_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "queue_care_records_tenantId_queueEntryId_createdAt_idx" ON "public"."queue_care_records"("tenantId", "queueEntryId", "createdAt");
CREATE INDEX "queue_care_records_tenantId_encounterId_createdAt_idx" ON "public"."queue_care_records"("tenantId", "encounterId", "createdAt");
CREATE UNIQUE INDEX "queue_care_attachments_storageKey_key" ON "public"."queue_care_attachments"("storageKey");
CREATE INDEX "queue_care_attachments_tenantId_careRecordId_createdAt_idx" ON "public"."queue_care_attachments"("tenantId", "careRecordId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."queue_care_records" ADD CONSTRAINT "queue_care_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_records" ADD CONSTRAINT "queue_care_records_queueEntryId_fkey" FOREIGN KEY ("queueEntryId") REFERENCES "public"."queue_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_records" ADD CONSTRAINT "queue_care_records_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_records" ADD CONSTRAINT "queue_care_records_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_records" ADD CONSTRAINT "queue_care_records_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_attachments" ADD CONSTRAINT "queue_care_attachments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_attachments" ADD CONSTRAINT "queue_care_attachments_careRecordId_fkey" FOREIGN KEY ("careRecordId") REFERENCES "public"."queue_care_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "public"."queue_care_attachments" ADD CONSTRAINT "queue_care_attachments_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
