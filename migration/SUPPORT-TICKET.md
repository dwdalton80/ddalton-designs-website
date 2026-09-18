Subject: Self-hosted Access application not enforcing on any path — zero entries in Access authentication logs

Account: Dwdalton80@gmail.com's Account
Account ID: 2a9ba2f1494b2c1abedcead2500808a0
Zone: ddaltondesigns.com
Zone ID: 45447f44dd72085dfcd8d9be343886b0
Zero Trust team name: ddaltondesigns (team domain ddaltondesigns.cloudflareaccess.com)
Access application: "DDalton Designs Admin"
Current application ID: fae4362c-4053-4814-a5c6-1714719151e2
Application AUD tag: 4dd7e3daafcb7e90a3e2c53666288cd0202bd9951eecc190003171ba24a32dc3

---

I set up a self-hosted Access application on this zone and it is not
enforcing at all — requests to protected paths pass straight through to
the origin with no login challenge, and the Access authentication logs
show zero events, not zero-and-allowed but no entries whatsoever, since
the application was created.

Timeline:

1. Activated Zero Trust (Free plan) on this account today. Team was
   auto-named "patient-cake-b922"; I renamed it to "ddaltondesigns" via
   Settings before creating anything else.
2. Created a self-hosted application "DDalton Designs Admin" with
   destinations ddaltondesigns.com/admin and ddaltondesigns.com/admin/*,
   and an Allow policy listing two email addresses. This was created
   while the zone showed a "pending" ownership-verification banner (the
   zone had just been added to Cloudflare for DNS; nameservers had
   already been switched at the registrar, but the dashboard still
   showed "pending" for a period).
3. After the zone changed to Active, requests to /admin still returned
   200 directly from the origin (confirmed via response header
   x-render-origin-server, which only the origin sends) with no
   redirect to the Access login and no entry in Access authentication
   logs.
4. Suspecting the application was created before Access fully
   provisioned on the zone, I deleted it and recreated it from scratch
   (same destinations, reattached the same Allow policy). No change in
   behavior.
5. To rule out a path-matching issue, I temporarily added a third
   destination covering the entire hostname with no path (matches every
   path on ddaltondesigns.com), polled the site root for ~90 seconds,
   then removed it. The homepage never triggered an Access challenge
   either. This rules out /admin specifically being the problem — Access
   is not intercepting any path on this hostname.

What I've already verified/ruled out:

- The apex A record is proxied (orange-clouded) — confirmed via cf-ray
  and server: cloudflare headers on every response.
- The zone shows Active, not pending.
- The application has a valid identity provider available (Cloudflare
  one-time PIN, listed under Integrations > Identity providers) — not
  missing an IdP.
- The Allow policy is attached and shows in the application's Policies
  tab with two email addresses.
- Not a caching issue — cf-cache-status: DYNAMIC on responses.
- Not a stale browser session — tested with plain curl (no cookies) and
  with a browser user agent; both get 200.
- Not propagation alone — unenforced for well over an hour, including
  after the delete/recreate.

Could you check whether Access was actually provisioned for this zone at
the point the first application was created, and whether that left the
zone in a state where Access policy evaluation isn't hooked in at the
edge even though the dashboard shows everything configured correctly?

Happy to provide a HAR file, additional cf-ray values from failed
requests, or run further tests on request.
