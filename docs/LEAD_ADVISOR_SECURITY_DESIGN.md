# Lead, Client, and Advisor Security Design

## Release Boundary

- This release is implemented in the existing Vite/React management portal.
- The CRM remains the system of record.
- The SQL migration must be reviewed and tested in an isolated Supabase branch or project before production use.
- A Vercel Preview must not apply this migration to the production Supabase project.

## Authentication Audit

The current management first factor is Supabase email/password authentication through `signInWithPassword`. The Vercel API stores the Supabase access and refresh tokens in Secure, HttpOnly, SameSite=Strict cookies and independently checks `public.user_roles` before granting portal access.

Before this feature branch, the application did not implement WebAuthn, passkeys, biometric authentication, Supabase TOTP challenges, or AAL2 enforcement. Any biometric or save-password prompt visible on desktop was therefore supplied by the browser, operating system, or password manager rather than Estate Nest code. This branch adds Supabase TOTP enrollment, challenge, and AAL2 enforcement; it does not claim that a browser prompt is an Estate Nest passkey.

Supabase TOTP is the approved second factor for this phase. It is available on Supabase projects without an MFA add-on. A passkey release requires a separate review because Supabase passkey support is experimental, requires a newer Supabase JavaScript SDK, and requires stable relying-party configuration for `estatenest.ca`.

## MFA and Recovery Controls

- Password authentication remains the first factor.
- An enrolled TOTP factor must be verified before an AAL1 session can access management APIs.
- Enrollment and challenge screens remain usable at mobile widths and expose the manual TOTP secret when QR scanning is not possible.
- Losing a TOTP device does not create an authentication bypass. Recovery requires owner identity verification and factor removal through the protected Supabase administrator process.
- Lost-password or lost-factor recovery begins through the owner-verified recovery mailbox and does not expose an account-existence lookup or authentication bypass.
- No passwords, TOTP secrets, access tokens, refresh tokens, or recovery values are logged.

## Lead Acceptance and Notification

`accept_quote_lead` performs contact matching, deduplication, lead creation, funnel capture, public lead-ID assignment, and notification queue creation in one PostgreSQL transaction. Email delivery begins only after that transaction returns successfully.

Gmail SMTP is the only delivery provider. SMTP acceptance is recorded as `SENT`; `DELIVERED` is reserved for a future trusted delivery signal. A Gmail failure changes the queue record to `FAILED`, records a sanitized error, and never deletes the accepted lead. Failed notifications are visible to authorized portal users and can be retried.

Notification messages contain contact details, province, insurance interest, source, timestamp, public lead reference, and a protected CRM link. Medical, medication, underwriting, and coverage-amount details are not included.

Concurrent duplicate submissions are resolved inside the database transaction. Notification retry and management-email send operations atomically move an eligible record to `QUEUED` before contacting Gmail, preventing two authorized browser requests from sending the same message simultaneously.

## Database Access Boundary

Management data is read and changed only through authenticated Vercel Functions using the server-held Supabase secret. Row Level Security is enabled on legacy and new CRM tables, former permissive public policies are removed, and direct `anon`/`authenticated` table grants are revoked. The public quote function is executable only by `service_role`; browser publishable keys cannot call it directly.

## Banking Data

Ordinary database fields may hold only receipt and verification metadata, a secure document reference, and an approved last-four value. Full account, institution, transit, routing, PIN, password, or online-banking credentials are prohibited.

Before full banking documents are enabled, Estate Nest must approve:

- envelope encryption with keys held outside the database;
- key rotation, separation of duties, and emergency revocation;
- least-privilege access limited to approved finance administrators;
- immutable access and download audit events;
- masked UI and export behavior;
- documented retention and verified deletion;
- breach-impact analysis and incident procedures;
- a private document vault with short-lived signed access;
- malware scanning before any document can be downloaded or attached.

The private `management-documents` bucket accepts only approved document/image MIME types and a maximum of 10 MiB. New objects remain `PENDING` and cannot be sent as email attachments until a malware scanner marks them `CLEAN`.

## Email Controls

- Client, advisor, compliance, commission, and report messages begin as drafts.
- Preview is mandatory before confirmation.
- Send requires an explicit authorized-user confirmation.
- Default BCC is stored once in `management_settings`, remains visible before send, and is always unioned server-side with user-entered BCC recipients.
- Notes are never inserted automatically. Only an explicitly requested approved summary is inserted.
- Failed sends remain retryable and retain a sanitized audit trail.
- Scheduled messages and reports remain disabled until a named approver enables the specific schedule.

Report export, delivery, and schedule approval require an unexpired server-issued preview ID for the same user, report type, format, and filters. Changing any of those values invalidates the browser preview. CSV exports neutralize formula-leading values before download.

## Record Lifecycle

Lead, contact, and advisor UI actions archive rather than delete. Archive and restore require a reason, confirmation, actor identity, and timestamp. Permanent deletion is reserved for a separately approved retention/privacy process and is not exposed in ordinary portal actions.

## Commission History

Every commission insert and update creates a history row containing the old and new structure. Previous percentages and amounts are retained rather than overwritten without history.
