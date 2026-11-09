# State, context and custom hooks

1. Keep state local unless several unrelated descendants need it. Use URL state for shareable navigation/filter state and server data fetching where appropriate.
2. Put reusable client providers in `src/contexts/` and hooks in `src/hooks/` when those directories are introduced; name hooks `useX` and provide typed context values and cleanup for subscriptions.
3. Wrap providers as deeply as practical in a Client Component composed from the server layout. Do not import server-only modules or secrets into client boundaries.
4. Derive values rather than duplicating them, handle loading/error/empty states, cancel or ignore stale async results, and avoid updating state after unmount.
5. Treat session context as a presentation aid; server-side verified authorization remains authoritative. Test observable behavior and provider lifecycle where relevant.
