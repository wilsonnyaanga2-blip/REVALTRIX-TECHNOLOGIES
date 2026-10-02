-- CreateTable
CREATE TABLE "public"."services" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "departmentId" UUID,
    "branchId" UUID,
    "name" VARCHAR(200) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(1000),
    "category" VARCHAR(100),
    "durationMin" INTEGER,
    "status" "public"."RecordStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "services_tenantId_status_idx" ON "public"."services"("tenantId", "status");

-- CreateIndex
CREATE INDEX "services_tenantId_departmentId_idx" ON "public"."services"("tenantId", "departmentId");

-- CreateIndex
CREATE INDEX "services_tenantId_branchId_idx" ON "public"."services"("tenantId", "branchId");

-- CreateIndex
CREATE INDEX "services_departmentId_idx" ON "public"."services"("departmentId");

-- CreateIndex
CREATE INDEX "services_branchId_idx" ON "public"."services"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "services_tenantId_code_key" ON "public"."services"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."services" ADD CONSTRAINT "services_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "public"."branches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
