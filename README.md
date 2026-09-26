# Bangkok Emergency Map

Mobile-first public emergency map for Bangkok.

## Modules
- CCTV: public/authorized BMA traffic camera sources only
- Flood: planned
- Slide-car emergency: planned

## CCTV data
`data/cameras.json` accepts objects with `name`, `district`, `road`, `lat`, `lng`, `image`, `url`, `source`, `online`.

The app intentionally does not access private CCTV feeds, credentials, NVRs, or BMA internal systems. Camera entries should be populated only from publicly published/authorized sources.

## Run
Serve the repository as static files (GitHub Pages, Vercel, Netlify, etc.).

## Resource directory
The mobile resource dialog is independent of Leaflet and the existing CCTV, flood,
and slide-car layers. Open **แหล่งข้อมูล** or **สายด่วนฉุกเฉิน**, filter by water,
rain, CCTV, traffic or emergency, and search names, descriptions or phone numbers.
Telephone links open the device dialer; the DDPM LINE ID is displayed for manual
addition (the LINE URL could not be verified).

`data/resources.json` contains 11 external resources and 6 hotlines with stable
IDs, categories, provider/coverage, descriptions, and dated verification evidence.
These are a directory, not imported live feeds or new geographic map markers.
Existing map datasets and `app.js` are unchanged.

### Link checks — 2026-09-26
- Opened via web inspection: ThaiWater, Longdo (redirects to /main/), Windy,
  Google Flood Hub. This does not validate all interactive features or freshness.
- Could not confirm opening via the inspection tool: DOH HDMS, BMA CCTV,
  GISTDA Floodcheck, TMD radar, BMA rain, road flood and KlongMap. Timeouts/tool
  access failures are not proof that these services are down. Their supplied
  public URLs remain visible with an explicit unconfirmed label.
- GISTDA's public data catalog identifies Floodcheck's URL; API access requires
  requesting an API key. No authenticated integration is attempted.
- Hotline evidence links are stored per entry. Phone calls were not placed.
- To update: edit the catalog, repeat public URL checks, and update each entry's
  `verification.checkedAt`, `status`, and evidence. Do not label a timeout as verified.

Serve over HTTP(S) so the catalog fetch works. If it fails, all six telephone
links and the DDPM LINE ID remain available, with a retry button. The dialog
supports Escape, focus return, keyboard filters and 44px minimum action targets.
