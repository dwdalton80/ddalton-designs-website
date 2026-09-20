# DNS cutover: GoDaddy → Cloudflare (`ddaltondesigns.com`)

> **STATUS: DONE — nameservers cut over 2026-09-18 and verified.** The domain
> now resolves via `gannon.ns.cloudflare.com` / `rosalie.ns.cloudflare.com`.
> All mail records verified resolving through Cloudflare (see §Verification
> results). The website is unchanged — still served by Base44 via the apex A
> record and `www` CNAME, both still returning HTTP 200 from `216.24.57.1`.

**Captured 2026-09-18** by querying GoDaddy's authoritative nameservers
(`ns25/ns26.domaincontrol.com`) directly, before the move. If anything is ever
missing, compare against this.

Registrar: **GoDaddy** · Expires: **2027-04-10** · Nameservers: `ns25`/`ns26.domaincontrol.com`

---

## ⚠️ Email is on this domain — this is the main risk

`ddaltondesigns.com` uses **iCloud Custom Email Domain**. Four records make that
work, and if any of them fail to carry over, mail to `@ddaltondesigns.com` stops
arriving. Cloudflare's nameserver-change scan usually imports them, but it is
not guaranteed — **verify all four by hand before changing nameservers at
GoDaddy**, and again afterwards.

| Type | Name | Value | Purpose |
|---|---|---|---|
| MX | `@` | `mx01.mail.icloud.com` (priority 10) | inbound mail |
| MX | `@` | `mx02.mail.icloud.com` (priority 10) | inbound mail |
| TXT | `@` | `v=spf1 include:icloud.com ~all` | SPF |
| TXT | `@` | `apple-domain=QXvsFRDjjPYpH8PZ` | Apple domain verification |
| CNAME | `sig1._domainkey` | `sig1.dkim.ddaltondesigns.com.at.icloudmailadmin.com` | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;` | DMARC |

Note the DMARC `rua` reports to `onsecureserver.net` — a GoDaddy address. It
keeps working, but once off GoDaddy you may want to repoint it somewhere you
actually read.

**All six must be set to DNS-only (grey cloud) in Cloudflare.** Proxying an MX
or DKIM record breaks mail.

---

## Records being replaced (currently pointing at Base44)

| Type | Name | Current value | After cutover |
|---|---|---|---|
| A | `@` | `216.24.57.1` | Worker / Pages route for the site |
| CNAME | `www` | `base44.onrender.com` | Worker / Pages route for the site |
| CNAME | `_domainconnect` | `_domainconnect.gd.domaincontrol.com` | delete — GoDaddy-specific |

Nothing else exists: a sweep of `mail`, `autodiscover`, `ftp`, `cpanel`,
`webmail`, `assets`, `files`, `cdn`, `img`, `blog`, `shop`, `api`, `portal`,
`admin`, `dev`, `staging` returned no records.

---

## Order of operations

The sequence matters — getting it wrong takes the site or the email down.

1. **Cloudflare → Add a site → `ddaltondesigns.com`.** Let it scan. It will
   report the records it found and assign you two nameservers.
2. **Check the imported records against the two tables above.** Add anything
   missing *now*, while GoDaddy is still authoritative and nothing has moved.
   Pay attention to the MX pair, the DKIM CNAME, and both apex TXT records.
3. **Leave the Base44 A and `www` CNAME as they are for the moment.** The site
   should keep serving from Base44 until the Worker is ready.
4. **GoDaddy → Domain settings → Nameservers → change to the two Cloudflare
   ones.** Propagation is usually minutes to a few hours.
5. **Verify** (see below). Confirm mail still arrives before going further.
6. **Then** add `assets.ddaltondesigns.com` as a custom domain on the
   `ddalton-designs-assets` R2 bucket, and run:
   `node migration/rewrite-urls.mjs https://assets.ddaltondesigns.com`
7. **Last**, once the Worker is deployed, repoint the apex and `www` at it and
   delete the Base44 records.

> Do **not** attach a custom domain to `ddalton-designs-private`. Client files
> should be served through a Worker that checks authorization — that is the
> reason they are in a separate bucket.

---

## Verification

After the nameserver change propagates:

```bash
# should return the Cloudflare nameservers
dig +short NS ddaltondesigns.com

# mail — must still be the two iCloud hosts
dig +short MX ddaltondesigns.com

# SPF + Apple verification must both still be present
dig +short TXT ddaltondesigns.com

# DKIM
dig +short CNAME sig1._domainkey.ddaltondesigns.com

# DMARC
dig +short TXT _dmarc.ddaltondesigns.com
```

Then **send a real test email to an `@ddaltondesigns.com` address from an
outside account** and confirm it arrives. DNS lookups succeeding is not the same
as mail being delivered.

---

## Domain locks

GoDaddy has `clientTransferProhibited` and `clientUpdateProhibited` set on the
domain. These are its normal registrar locks and do not block a nameserver
change made from within the GoDaddy dashboard — they block transfers to another
registrar. This cutover moves **DNS hosting only**; the domain stays registered
at GoDaddy, so there is nothing to unlock.


---

## Verification results (2026-09-18, post-cutover)

Nameservers confirmed at the registry (whois) and via both `1.1.1.1` and
`8.8.8.8`. Every record below was resolved through Cloudflare *after* the move:

| Check | Result |
|---|---|
| MX | `mx01` + `mx02.mail.icloud.com` (10) |
| SPF (apex) | `v=spf1 include:icloud.com ~all` |
| Apple verification | `apple-domain=QXvsFRDjjPYpH8PZ` |
| iCloud DKIM | CNAME → `sig1.dkim.ddaltondesigns.com.at.icloudmailadmin.com` |
| DMARC | `v=DMARC1; p=quarantine; ...` |
| Resend MX (`send`) | `feedback-smtp.us-east-1.amazonses.com` |
| Resend DKIM | present |
| Website | apex + `www` → HTTP 200 from `216.24.57.1` (Base44) |

The full SPF chain resolves end to end:

```
ddaltondesigns.com            → include:icloud.com → redirect=_spf.icloud.com
send.ddaltondesigns.com       → include:dc-fd741b8612._spfm.send.ddaltondesigns.com
dc-fd741b8612._spfm.send...   → include:amazonses.com → ip4 blocks
```

### Two defects found and fixed during the cutover

1. **Cloudflare's scan imported the iCloud DKIM CNAME as Proxied.** A proxied
   DKIM record resolves to Cloudflare IPs instead of returning the key, so DKIM
   verification fails and mail degrades toward spam folders. Set to DNS-only.
2. **Cloudflare's scan missed `dc-fd741b8612._spfm.send`** — the second hop of
   Resend's SPF chain. `send` points at it, so without it the `include:`
   dead-ends and the app's invoice/estimate email fails SPF. Added manually.

Both were caught by diffing GoDaddy's 16 records against Cloudflare's imported
12. **Always do that diff** — the scan is not authoritative. Excluding the 2 NS
and 1 SOA that Cloudflare manages itself, the correct count is 13.

### Still outstanding

- Send a real test email to an `@ddaltondesigns.com` address from an outside
  account. DNS resolving is not proof of delivery.
- The `_domainconnect` CNAME is GoDaddy-specific and can now be deleted.
- Apex A and `www` still point at Base44 — repoint to the Worker when ready.
