-- Add missing tenant-scoped patient verification permission
INSERT INTO "public"."permissions" (
  "id",
  "tenantId",
  "resource",
  "action",
  "effect",
  "scope",
  "description",
  "status",
  "createdAt",
  "updatedAt"
)
VALUES (
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340001',
  NULL,
  'patients',
  'verify',
  'ALLOW',
  'TENANT',
  'Verify patient identity for an authorized tenant workflow',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT ("tenantId", "resource", "action", "effect") DO NOTHING;

-- Add tenant-scoped clinical note permissions
INSERT INTO "public"."permissions" (
  "id",
  "tenantId",
  "resource",
  "action",
  "effect",
  "scope",
  "description",
  "status",
  "createdAt",
  "updatedAt"
)
VALUES
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340002',
  NULL,
  'clinical_notes',
  'read',
  'ALLOW',
  'TENANT',
  'Read clinical notes within the authorized tenant scope',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340003',
  NULL,
  'clinical_notes',
  'create',
  'ALLOW',
  'TENANT',
  'Create clinical note drafts within the authorized tenant scope',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340004',
  NULL,
  'clinical_notes',
  'update',
  'ALLOW',
  'TENANT',
  'Update permitted clinical note content before signing',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340005',
  NULL,
  'clinical_notes',
  'sign',
  'ALLOW',
  'TENANT',
  'Sign a clinical note as an authorized clinical user',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340006',
  NULL,
  'clinical_notes',
  'finalize',
  'ALLOW',
  'TENANT',
  'Finalize a signed clinical note',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340007',
  NULL,
  'clinical_notes',
  'amend',
  'ALLOW',
  'TENANT',
  'Create an immutable amendment version of a clinical note',
  'ACTIVE',
  NOW(),
  NOW()
),
(
  '8f6d4b21-7c39-4a15-b2e8-91d5c0340008',
  NULL,
  'clinical_notes',
  'void',
  'ALLOW',
  'TENANT',
  'Void a clinical note with an auditable reason',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT ("tenantId", "resource", "action", "effect") DO NOTHING;

-- Grant the tenant-scoped catalog to active tenant roles.
INSERT INTO "public"."role_permissions" (
  "roleId",
  "permissionId"
)
SELECT
  r."id",
  p."id"
FROM "public"."roles" r
CROSS JOIN "public"."permissions" p
WHERE r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND r."tenantId" IS NULL
  AND p."tenantId" IS NULL
  AND p."scope" = 'TENANT'
  AND p."effect" = 'ALLOW'
  AND p."status" = 'ACTIVE'
  AND p."resource" IN ('patients', 'clinical_notes')
  AND NOT EXISTS (
    SELECT 1
    FROM "public"."role_permissions" rp
    WHERE rp."roleId" = r."id"
      AND rp."permissionId" = p."id"
  );
