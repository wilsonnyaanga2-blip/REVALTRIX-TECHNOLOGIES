INSERT INTO "permissions"
  ("id", "tenantId", "resource", "action", "effect", "scope", "description", "status", "createdAt", "updatedAt")
VALUES
  ('9d7a5c21-8e34-4f61-a102-000000000001', NULL, 'queues', 'read',   'ALLOW', 'TENANT', 'View queues and queue entries', 'ACTIVE', NOW(), NOW()),
  ('9d7a5c21-8e34-4f61-a102-000000000002', NULL, 'queues', 'create', 'ALLOW', 'TENANT', 'Create queues and queue entries', 'ACTIVE', NOW(), NOW()),
  ('9d7a5c21-8e34-4f61-a102-000000000003', NULL, 'queues', 'update', 'ALLOW', 'TENANT', 'Operate queues and update queue entries', 'ACTIVE', NOW(), NOW())
ON CONFLICT ("tenantId", "resource", "action", "effect") DO NOTHING;

INSERT INTO "role_permissions"
  ("roleId", "permissionId")
SELECT
  r."id",
  p."id"
FROM "roles" r
CROSS JOIN "permissions" p
WHERE
  r."scope" = 'TENANT'
  AND r."status" = 'ACTIVE'
  AND p."tenantId" IS NULL
  AND p."resource" = 'queues'
  AND p."action" IN ('read', 'create', 'update')
  AND p."effect" = 'ALLOW'
  AND p."scope" = 'TENANT'
  AND p."status" = 'ACTIVE'
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
