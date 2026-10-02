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
    '00000000-0000-0000-0000-000000000025',
    NULL,
    'encounters',
    'read',
    'ALLOW',
    'Read patient encounters within an authorized tenant scope.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000026',
    NULL,
    'encounters',
    'create',
    'ALLOW',
    'Create patient encounters within an authorized tenant scope.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000027',
    NULL,
    'encounters',
    'update',
    'ALLOW',
    'Update patient encounters within an authorized tenant scope.',
    'ACTIVE',
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-0000-0000-000000000028',
    NULL,
    'encounters',
    'delete',
    'ALLOW',
    'Deactivate or remove patient encounters according to authorized lifecycle rules.',
    'ACTIVE',
    NOW(),
    NOW()
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
  NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'TENANT_ADMIN'
  AND r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND p."tenantId" IS NULL
  AND p."resource" = 'encounters'
  AND p."effect" = 'ALLOW'
  AND p."status" = 'ACTIVE'
  AND p."action" IN ('read', 'create', 'update', 'delete')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
