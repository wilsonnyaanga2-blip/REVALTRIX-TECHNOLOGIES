-- Seed global provider permissions and assign them to active tenant administrators.
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
  (
    '00000000-0000-0000-0000-000000000017',
    NULL,
    'providers',
    'read',
    'ALLOW',
    'View provider profiles within the authorized tenant context.',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '00000000-0000-0000-0000-000000000018',
    NULL,
    'providers',
    'create',
    'ALLOW',
    'Create provider profiles for users who belong to the authorized tenant.',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '00000000-0000-0000-0000-000000000019',
    NULL,
    'providers',
    'update',
    'ALLOW',
    'Update provider profiles within the authorized tenant context.',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  ),
  (
    '00000000-0000-0000-0000-000000000020',
    NULL,
    'providers',
    'delete',
    'ALLOW',
    'Deactivate provider profiles within the authorized tenant context.',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT ("id") DO UPDATE
SET
  "resource" = EXCLUDED."resource",
  "action" = EXCLUDED."action",
  "effect" = EXCLUDED."effect",
  "description" = EXCLUDED."description",
  "status" = EXCLUDED."status",
  "updatedAt" = CURRENT_TIMESTAMP;

INSERT INTO "role_permissions" (
  "roleId",
  "permissionId",
  "assignedAt"
)
SELECT
  r."id",
  p."id",
  CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'TENANT_ADMIN'
  AND r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND p."tenantId" IS NULL
  AND p."resource" = 'providers'
  AND p."effect" = 'ALLOW'
  AND p."action" IN ('read', 'create', 'update', 'delete')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
