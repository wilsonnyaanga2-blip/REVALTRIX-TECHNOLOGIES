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
VALUES (
  '00000000-0000-0000-0000-000000000023',
  NULL,
  'patients',
  'verify',
  'ALLOW',
  'Verify patient identity for an authorized tenant',
  'ACTIVE',
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO NOTHING;
