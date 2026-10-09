CREATE TABLE "public"."web_push_subscriptions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "endpoint" VARCHAR(2048) NOT NULL,
    "p256dh" VARCHAR(255) NOT NULL,
    "auth" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "web_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "web_push_subscriptions_endpoint_key" ON "public"."web_push_subscriptions"("endpoint");
CREATE INDEX "web_push_subscriptions_userId_idx" ON "public"."web_push_subscriptions"("userId");

ALTER TABLE "public"."web_push_subscriptions"
ADD CONSTRAINT "web_push_subscriptions_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
