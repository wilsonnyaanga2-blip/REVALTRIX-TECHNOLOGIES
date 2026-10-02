-- CreateTable
CREATE TABLE "public"."encounter_status_history" (
    "id" UUID NOT NULL,
    "encounterId" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "fromStatus" "public"."EncounterStatus",
    "toStatus" "public"."EncounterStatus" NOT NULL,
    "changedByUserId" UUID NOT NULL,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounter_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "encounter_status_history_encounterId_createdAt_idx" ON "public"."encounter_status_history"("encounterId", "createdAt");

-- CreateIndex
CREATE INDEX "encounter_status_history_tenantId_createdAt_idx" ON "public"."encounter_status_history"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "encounter_status_history_changedByUserId_createdAt_idx" ON "public"."encounter_status_history"("changedByUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."encounter_status_history" ADD CONSTRAINT "encounter_status_history_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "public"."encounters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounter_status_history" ADD CONSTRAINT "encounter_status_history_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."encounter_status_history" ADD CONSTRAINT "encounter_status_history_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
