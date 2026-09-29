# Agency Automation Demo

A working lead qualification and sales-workflow demo for Digital Whopper / agencies.

## MVP
- Public lead intake form
- Deterministic lead scoring
- Hot / warm / cold priority
- Supabase-ready data model
- Admin dashboard
- Lead detail + follow-up status
- Demo notification panel
- Meeting booking CTA placeholder

## Run locally
```bash
npm install
npm run dev
```

## Supabase
Create a `.env.local` file using `.env.example` and add your Supabase project URL and anon/publishable key.

The app is intentionally designed so no OpenAI or other paid AI API key is required for the first demo. AI qualification can be added later behind a server-side endpoint.
