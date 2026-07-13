<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the ezfind marketplace. The project already had `posthog-js` installed and a consent-gated `initAnalytics()` / `track()` / `identify()` abstraction in `src/lib/analytics.ts`, along with extensive tracking in `FindAChef.tsx` and `LeadUnlock.tsx`. This run extended that coverage to the two primary conversion forms (`JoinForm` and `LeadRequestForm`) and the cookie consent banner, and updated the PostHog environment variables.

**New events added:**

| Event | Description | File |
|---|---|---|
| `join_submitted` | A professional successfully submits the join form to register on the network. Includes `source`, `category`, and `city` properties. Also calls `identify()` with a hashed phone. | `src/components/landing/JoinForm.tsx` |
| `join_error` | The join form submission fails (server error or network error). | `src/components/landing/JoinForm.tsx` |
| `chef_request_submitted` | A client successfully submits the chef request form. Includes `source`, `event_type`, and `city` properties. | `src/components/landing/LeadRequestForm.tsx` |
| `chef_request_error` | The chef request form submission fails (server error or network error). | `src/components/landing/LeadRequestForm.tsx` |
| `otp_requested` | An OTP code was successfully sent to the client's phone during chef request verification. | `src/components/landing/LeadRequestForm.tsx` |
| `consent_granted` | Visitor explicitly accepts analytics cookies in the consent banner. Fired immediately after PostHog is initialised. | `src/components/CookieBanner.tsx` |

**Pre-existing events (already instrumented):**

`form_start`, `form_step_completed`, `form_abandoned`, `otp_sent`, `lead_submitted` (FindAChef.tsx) · `lead_page_viewed`, `pay_clicked`, `reserve_won`, `payment_started`, `payment_completed`, `phone_revealed`, `reserve_sold_out`, `access_recovery_requested` (LeadUnlock.tsx)

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — dashboard](https://eu.posthog.com/project/222306/dashboard/813137)
- [Professional signups over time](https://eu.posthog.com/project/222306/insights/CAgws0k5)
- [Chef requests over time](https://eu.posthog.com/project/222306/insights/0jMKnlPa)
- [Payment conversion funnel](https://eu.posthog.com/project/222306/insights/CATKlNib)
- [Professional signups by category](https://eu.posthog.com/project/222306/insights/9bb5lAFq)
- [Lead request funnel (form_start → lead_submitted)](https://eu.posthog.com/project/222306/insights/GPAXloAF)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to `.env.example` and any bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a chef who revisits the lead unlock page is identified by hashed phone on `pay_clicked`, but the join form only identifies on successful submission. Returning professionals who don't re-submit the join form will remain on anonymous distinct IDs.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
