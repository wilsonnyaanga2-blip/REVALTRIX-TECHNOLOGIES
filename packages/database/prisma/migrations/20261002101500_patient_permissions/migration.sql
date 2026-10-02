INSERT INTO "permissions"
  ("id", "tenantId", "resource", "action", "effect", "description", "status", "createdAt", "updatedAt")
VALUES
  ('00000000-0000-0000-0000-000000000021', NULL, 'patients', 'read',   'ALLOW', 'Read patient records within an authorized tenant scope', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000022', NULL, 'patients', 'create', 'ALLOW', 'Enroll a patient into an authorized tenant', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000023', NULL, 'patients', 'update', 'ALLOW', 'Update patient records within an authorized tenant scope', 'ACTIVE', NOW(), NOW()),
  ('00000000-0000-0000-0000-000000000024', NULL, 'patients', 'delete', 'ALLOW', 'Deactivate patient records within an authorized tenant scope', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "assignedAt")
SELECT
  r."id",
  p."id",
  NOW()
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."code" = 'TENANT_ADMIN'
  AND r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND p."resource" = 'patients'
  AND p."tenantId" IS NULL
  AND p."effect" = 'ALLOW'
  AND p."status" = 'ACTIVE'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
