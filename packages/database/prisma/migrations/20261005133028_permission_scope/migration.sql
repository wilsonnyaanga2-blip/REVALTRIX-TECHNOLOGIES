-- CreateEnum
CREATE TYPE "public"."PermissionScope" AS ENUM ('TENANT', 'PLATFORM');

-- AlterTable
ALTER TABLE "public"."permissions" ADD COLUMN     "scope" "public"."PermissionScope" NOT NULL DEFAULT 'TENANT';
