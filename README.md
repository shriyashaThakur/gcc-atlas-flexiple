# GCC Atlas

A single-page Next.js App Router dashboard for a verified, company-level record of India’s GCC ecosystem. Every figure on the page is read from `src/data/gcc_data.json`. Nothing is invented at render time.

## Setup

1. Install Node.js 20+ and run `npm install`.
2. Optional, for LLM explanations of the City-Fit Advisor ranking: create `.env.local` with:

```bash
GEMINI_API_KEY=your_key
GEMINI_MODEL=gemini-2.5-flash
```

If `GEMINI_API_KEY` is missing, or Gemini times out after 10 seconds, the advisor still returns a deterministic ranking built from the JSON (`fallback: true`).

3. Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Data and method

- **Registry.** Company-level records with source URLs and High/Medium confidence. Headcount is shown as “Not disclosed” unless the JSON contains a figure; `headcount_note` is kept as a tooltip. Rows with `manual_check: "pending"` show a Pending badge.
- **Disagreements.** Published counts disagree. Source-type tags are derived in code: OceanFrogs → Vendor claim; names containing “government” or “minister” → State claim; everything else → Report / press.
- **Pipeline.** Only signals with `checked: true`, newest first.
- **City-Fit Advisor.** Cities are ranked in code before any model call:
  - `momentum`: checked signals in the city + registry records in the city
  - `depth`: `leasing_q3_2026.cbre_absorption_msf`
  - `supply`: `leasing_q3_2026.cbre_new_supply_msf`
  - `peers`: registry records in the city matching the selected sector (if zero everywhere, ranking is withheld)
  - `incentives`: only cities whose `policy.scope` starts with `GCC-specific` and that list `key_incentives` (Chennai is GCC-specific with an empty list, so it is marked not comparable)
  - Ties: more registry records, then alphabetical city name
  - Cities with fewer than 3 registry records get “Limited registry evidence for this city”
- Planned headcount is collected for context only and does not change the ranking.
- Gemini (`@google/genai`) explains the pre-computed ranking. Any city or number that is not in that ranking is ignored. The API is rate-limited to 10 requests per minute per IP.
