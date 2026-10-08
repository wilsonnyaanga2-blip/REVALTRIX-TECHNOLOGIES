-- CreateTable
CREATE TABLE "public"."platform_role_assignments" (
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "assignedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "platform_role_assignments_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateIndex
CREATE INDEX "platform_role_assignments_roleId_idx" ON "public"."platform_role_assignments"("roleId");

-- AddForeignKey
ALTER TABLE "public"."platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."platform_role_assignments" ADD CONSTRAINT "platform_role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "public"."roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
