-- Revaltrix Platform
-- Authorization permission catalog
--
-- Global permissions are tenant-independent and can be reused by
-- tenant-scoped roles. Deterministic UUIDs provide stable identifiers
-- for the platform permission catalog.

INSERT INTO "permissions" (
  "id",
  "tenantId",
  "resource",
  "action",
  "effect",
  "description",
  "status",
  "createdAt",
  "updatedAt"
)
VALUES
  ('00000000-0000-4000-8000-000000000001', NULL, 'organization', 'read',   'ALLOW', 'View tenant organization information', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000002', NULL, 'organization', 'create', 'ALLOW', 'Create tenant organization information', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000003', NULL, 'organization', 'update', 'ALLOW', 'Update tenant organization information', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000004', NULL, 'organization', 'delete', 'ALLOW', 'Delete or deactivate tenant organization information', 'ACTIVE', NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000005', NULL, 'branches', 'read',   'ALLOW', 'View tenant branches', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000006', NULL, 'branches', 'create', 'ALLOW', 'Create tenant branches', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000007', NULL, 'branches', 'update', 'ALLOW', 'Update tenant branches', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000008', NULL, 'branches', 'delete', 'ALLOW', 'Delete or deactivate tenant branches', 'ACTIVE', NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000009', NULL, 'departments', 'read',   'ALLOW', 'View tenant departments', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000010', NULL, 'departments', 'create', 'ALLOW', 'Create tenant departments', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000011', NULL, 'departments', 'update', 'ALLOW', 'Update tenant departments', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000012', NULL, 'departments', 'delete', 'ALLOW', 'Delete or deactivate tenant departments', 'ACTIVE', NOW(), NOW()),

  ('00000000-0000-4000-8000-000000000013', NULL, 'services', 'read',   'ALLOW', 'View tenant services', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000014', NULL, 'services', 'create', 'ALLOW', 'Create tenant services', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000015', NULL, 'services', 'update', 'ALLOW', 'Update tenant services', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-4000-8000-000000000016', NULL, 'services', 'delete', 'ALLOW', 'Delete or deactivate tenant services', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO UPDATE
SET
  "tenantId" = EXCLUDED."tenantId",
  "resource" = EXCLUDED."resource",
  "action" = EXCLUDED."action",
  "effect" = EXCLUDED."effect",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "updatedAt" = NOW();

INSERT INTO "role_permissions" (
  "roleId",
  "permissionId",
  "assignedAt"
)
SELECT
  r."id",
  p."id",
  NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'TENANT_ADMIN'
  AND r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND p."tenantId" IS NULL
  AND p."effect" = 'ALLOW'
  AND p."status" = 'ACTIVE'
  AND p."resource" IN (
    'organization',
    'branches',
    'departments',
    'services'
  )
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
