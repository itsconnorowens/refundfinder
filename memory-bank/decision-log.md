# Architecture Decision Log

This document tracks significant architecture and technical decisions made during the Flghtly project development.

---

## Decision Format

Each decision should include:
- **Date**: When the decision was made
- **Decision**: What was decided
- **Context**: Why this was needed
- **Options Considered**: Alternatives that were evaluated
- **Decision**: The chosen option
- **Consequences**: Expected outcomes, trade-offs

---

## Decisions

### ADR-001: Resend as Primary Email Provider
**Date:** 2025-01
**Status:** Accepted

**Context:**
Need reliable transactional email service for claim notifications, payment confirmations, and admin alerts.

**Options Considered:**
1. SendGrid - Well-established, good free tier (100 emails/day)
2. Resend - Modern API, better deliverability, generous free tier (3,000 emails/month)
3. AWS SES - Cheapest at scale, more complex setup
4. Mailgun - Good features, pricing less favorable

**Decision:**
Use Resend as primary email provider with SendGrid as fallback.

**Rationale:**
- Better free tier (3,000/month vs 100/day)
- Modern, developer-friendly API
- Excellent deliverability
- Easy domain verification
- SendGrid fallback provides redundancy

**Consequences:**
- ✅ Generous free tier for MVP phase
- ✅ Simple API integration
- ✅ High deliverability rates
- ⚠️ Newer service, less proven at massive scale
- ✅ Fallback provider mitigates risk

---

### ADR-002: Airtable for Database
**Date:** 2024-12
**Status:** Accepted

**Context:**
Need database for storing claims, payments, and refund data during MVP phase.

**Options Considered:**
1. PostgreSQL (Supabase/Vercel Postgres) - Traditional database, more scalable
2. Airtable - Spreadsheet-like interface, easy admin access, API included
3. MongoDB - NoSQL, flexible schema
4. Firebase - Real-time, Google ecosystem

**Decision:**
Use Airtable for MVP with plan to migrate to PostgreSQL for scale.

**Rationale:**
- Non-technical team members can view/edit data easily
- Built-in forms, views, and automations
- Quick to set up, no schema migrations needed
- API included with generous free tier
- Visual interface helps with debugging

**Consequences:**
- ✅ Fast development and iteration
- ✅ Easy for non-technical team access
- ✅ Built-in admin interface
- ⚠️ Less performant at scale (migration needed >10k records)
- ⚠️ Limited query capabilities vs SQL
- ✅ Migration path clear (export to PostgreSQL when needed)

---

### ADR-003: Stripe for Payment Processing
**Date:** 2024-12
**Status:** Accepted

**Context:**
Need to collect $49 service fee before claim submission with 100% refund guarantee.

**Options Considered:**
1. Stripe - Industry standard, excellent developer experience
2. PayPal - Wide consumer adoption, higher fees
3. Square - Good for in-person, less ideal for web
4. Braintree (PayPal) - Flexible, more complex

**Decision:**
Use Stripe Payment Intents with automatic tax calculation.

**Rationale:**
- Best developer experience and documentation
- Stripe Tax handles sales tax automatically
- Excellent webhook system for automation
- Built-in refund handling
- PCI compliance handled
- Supports 135+ currencies

**Consequences:**
- ✅ Fast integration (complete in 2 days)
- ✅ Automatic tax handling (critical for compliance)
- ✅ Reliable refund system
- ⚠️ Fees: 2.9% + $0.30 per transaction
- ✅ Best-in-class security and fraud detection
- ✅ Easy to add payment methods later (Apple Pay, Google Pay)

---

### ADR-004: Next.js with App Router
**Date:** 2024-10
**Status:** Accepted

**Context:**
Choose web framework for flight delay compensation platform.

**Options Considered:**
1. Next.js App Router - Modern, server components, built-in API routes
2. Next.js Pages Router - Stable, well-documented, traditional
3. Remix - Modern, focused on web standards
4. SvelteKit - Fast, smaller bundle sizes

**Decision:**
Use Next.js 14+ with App Router.

**Rationale:**
- Server components for better performance
- Built-in API routes for backend logic
- Excellent Vercel deployment integration
- Large community and ecosystem
- TypeScript-first approach
- SEO-friendly with SSR/SSG

**Consequences:**
- ✅ Fast initial page loads with server components
- ✅ Unified codebase (frontend + backend)
- ✅ Seamless Vercel deployment
- ⚠️ App Router still maturing (some edge cases)
- ✅ Easy to optimize for performance
- ✅ Great developer experience

---

### ADR-005: Claude AI for Email Parsing
**Date:** 2024-11
**Status:** Accepted

**Context:**
Users often have flight confirmation emails but don't know their flight details. Need to extract structured data from unstructured email text.

**Options Considered:**
1. Claude (Anthropic) - Strong reasoning, good for structured extraction
2. GPT-4 - Well-known, slightly more expensive
3. Gemini - Google's model, competitive pricing
4. RegEx + Manual Parsing - Deterministic but fragile

**Decision:**
Use Claude API (Claude 3.5 Sonnet) for email parsing.

**Rationale:**
- Excellent at structured data extraction
- More affordable than GPT-4 for this use case
- Strong reasoning for ambiguous cases
- Good API documentation
- Constitutional AI approach aligns with values

**Consequences:**
- ✅ High accuracy flight detail extraction
- ✅ Handles various email formats (airline, OTA, etc.)
- ✅ Graceful degradation for unclear cases
- ⚠️ API costs (~$0.003 per parse)
- ✅ Better user experience (paste email instead of manual entry)
- ⚠️ Dependent on external API (need fallback UX)

---

### ADR-006: Mobile-First Responsive Design
**Date:** 2024-12
**Status:** Accepted

**Context:**
Need to support users on mobile devices, which are increasingly primary for travel.

**Decision:**
Implement mobile-first responsive design with Tailwind CSS.

**Rationale:**
- Majority of users check compensation on mobile
- Mobile-first ensures better mobile UX
- Tailwind's responsive utilities make this natural
- Forces simpler, cleaner designs

**Consequences:**
- ✅ Better mobile experience
- ✅ Faster mobile load times
- ✅ Simpler CSS (constrained to mobile first)
- ⚠️ Desktop designs may need more iteration
- ✅ Higher mobile conversion rates

---

### ADR-007: Vercel for Hosting
**Date:** 2024-10
**Status:** Accepted

**Context:**
Choose hosting platform for Next.js application.

**Options Considered:**
1. Vercel - Native Next.js integration, created by Next.js team
2. Netlify - Good competitor, similar features
3. AWS Amplify - More AWS integration
4. Self-hosted (DigitalOcean, etc.) - More control, more work

**Decision:**
Use Vercel for hosting.

**Rationale:**
- Zero-config deployment for Next.js
- Automatic preview deployments for PRs
- Edge network for fast global performance
- Generous free tier for MVP
- Created by Next.js team (best compatibility)

**Consequences:**
- ✅ Instant deployments on git push
- ✅ Preview URLs for every PR
- ✅ Automatic HTTPS and CDN
- ⚠️ Vendor lock-in for Vercel-specific features
- ✅ Excellent developer experience
- ⚠️ Costs increase with scale (but competitive)

---

### ADR-008: TypeScript for Type Safety
**Date:** 2024-10
**Status:** Accepted

**Context:**
Choose whether to use JavaScript or TypeScript for the project.

**Decision:**
Use TypeScript with strict mode enabled.

**Rationale:**
- Catch errors at compile time vs runtime
- Better IDE autocomplete and IntelliSense
- Self-documenting interfaces
- Easier refactoring
- Industry best practice for larger projects

**Consequences:**
- ✅ Fewer runtime errors
- ✅ Better developer experience with autocomplete
- ✅ Easier onboarding for new developers
- ⚠️ Slightly slower initial development
- ✅ More maintainable codebase
- ✅ Easier to scale team

---

### ADR-009: Documentation Consolidation
**Date:** 2025-10-29
**Status:** Accepted

**Context:**
Documentation grew to 55+ markdown files at project root, making navigation difficult and increasing risk of conflicting/outdated docs.

**Options Considered:**
1. Keep flat structure - Easy to find, but chaotic at scale
2. Move to /docs with subdirectories - Organized, scalable, industry standard
3. Use dedicated docs site (Docusaurus, etc.) - Professional, overkill for MVP
4. Wiki-based (GitHub Wiki) - Separate from codebase, harder to version

**Decision:**
Create /docs directory structure with subdirectories (setup, features, development, planning, reference) and consolidate overlapping documentation.

**Rationale:**
- Industry standard organization
- Keeps docs in git (version controlled)
- Easy to navigate with clear categories
- DOCUMENTATION_INDEX.md serves as master directory
- Consolidation reduces conflicting information

**Consequences:**
- ✅ Much easier to navigate documentation
- ✅ Reduced risk of conflicting docs
- ✅ Clear documentation lifecycle
- ✅ Easier onboarding for new developers
- ⚠️ One-time migration effort (completed)
- ✅ Scalable structure for future growth

**Implementation:**
- Created /docs with 7 subdirectories
- Moved 50+ docs from root to appropriate folders
- Consolidated overlapping docs (payment, email, UI components)
- Created DOCUMENTATION_INDEX.md master index
- Updated README.md references

---

## Future Decisions Needed

### Pending ADR-010: Database Migration Strategy
**Context:** Airtable will not scale beyond ~10,000 claims
**Options:** PostgreSQL (Supabase), PlanetScale, Neon
**Timeline:** Before reaching 5,000 claims
**Status:** Planning

### Pending ADR-011: Admin Dashboard Framework
**Context:** Need robust admin interface for claim management
**Options:** Custom Next.js, Retool, AdminJS
**Timeline:** Q2 2025
**Status:** Research

### Pending ADR-012: Multi-language Support
**Context:** EU261 applies to multiple countries/languages
**Options:** next-intl, next-translate, custom solution
**Timeline:** Q3 2025
**Status:** Future

---

## Decision Review Schedule

- **Monthly:** Review recent decisions, document new ones
- **Quarterly:** Revisit major architectural decisions
- **Annually:** Evaluate technology choices for updates

---

**Last Updated:** 2025-10-29
