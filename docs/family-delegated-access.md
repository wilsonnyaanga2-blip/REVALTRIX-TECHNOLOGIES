# Family & Care Circle and Delegated Access

## Privacy boundary

A family relationship and medical-data access are independent records. Accepting
an invitation never creates an access grant. Protected resources remain private
unless an active, unexpired grant explicitly includes the required permission.
Verification documents are stored using the private object-storage service and
are downloaded only through authenticated reviewer routes.

## Setup

1. Apply database migrations with `pnpm --filter @revaltrix/database migrate:deploy`.
2. Generate the Prisma client with `pnpm --filter @revaltrix/database generate`.
3. Configure the API's existing private object-storage and email-delivery settings.
   The storage bucket must not allow public reads.
4. Optionally configure:
   - `FAMILY_ADOLESCENT_MINIMUM_AGE` (default `13`)
   - `FAMILY_ADOLESCENT_RESTRICTED_PERMISSIONS` (default
     `lab-results.read,prescriptions.read,documents.read`)
5. Grant the platform dependent-review permission to the appropriate reviewer
   roles. The migration adds this permission to active platform roles named
   `PLATFORM_ADMIN`, `PLATFORM_VERIFIER`, or `VERIFICATION_REVIEWER`.
6. Run `pnpm --filter @revaltrix/api typecheck` and
   `pnpm --filter @revaltrix/web typecheck`.

Step-up verification currently uses a verified email identity and the configured
email service. It requires a fresh, session-bound code for grant changes,
relationship revocation, reviewer actions, and reviewer document downloads.

## API areas

Routes are rooted at `/v1/patient-family`:

- `/requests` and `/relationships` handle invitation acceptance, decline, listing,
  and relationship revocation.
- `/dependents` handles child registration; `/dependents/:id/documents` accepts
  private verification uploads and `/dependents/:id/status` returns review state.
- `/access-grants` handles explicit grant creation, listing, modification,
  revocation, activity, and review timestamps.
- `/admin/dependents` and its registration-specific routes handle authorized
  review, secure downloads, and suspicious-registration flags.
- `/step-up/request` and `/step-up/verify` handle step-up codes.

Relationship request responses use the existing `/requests/:requestId/respond`
route (`ACCEPT` or `DECLINE`); relationship revocation uses
`/relationships/:relationshipId/revoke`.

## Acceptance checklist

- [ ] Invite a registered patient using a Revaltrix ID, email, or phone number.
- [ ] Confirm the invitation is pending until the invitee accepts while signed in.
- [ ] Confirm accepting a family link does not create an `AccessGrant`.
- [ ] Register a dependent and upload a PDF, PNG, or JPEG birth certificate and
      guardian identity document; confirm invalid types and files over 10 MB fail.
- [ ] Confirm uploaded files have no public URL and can be downloaded only by an
      authorized reviewer after authentication and step-up verification.
- [ ] Approve a registration and verify it becomes eligible for an explicit
      guardian access request; reject another registration with a reason and
      confirm replacement documents can be submitted.
- [ ] Create a grant with selected permissions and an expiry within 365 days;
      verify the default expiry is 90 days and overlong grants are rejected.
- [ ] Verify access is allowed only for an included permission and only before
      expiry; verify missing grants, missing scopes, adolescent restrictions,
      expired grants, and revoked grants are denied.
- [ ] Revoke a relationship while leaving a grant active, then repeat with explicit
      confirmation to revoke both records.
- [ ] Revoke an access grant and confirm subsequent checks are denied immediately.
- [ ] Confirm allowed and denied delegated checks create audit records with the
      resource, action, timestamp, and available request metadata.
- [ ] Confirm a grant review updates its next-review date and is visible in the
      patient's access-review view.

## Integration status

`FamilyAccessGuard` and `RequireFamilyAccess` provide server-side checks for
resource routes that resolve a `patientId` parameter. They must be applied to all
existing patient-data, appointment, reminder, document, laboratory, prescription,
billing, and messaging endpoints that support delegated access before those
endpoints expose data to delegates. The existing patient-scoped APIs remain
patient-authenticated and do not automatically gain delegated access from a
family relationship.

Payment step-up, appointment-management step-up, additional sensitive-record
policy categories, and scheduled delivery of 90-day review reminders also require
integration with their respective feature modules before production rollout.
