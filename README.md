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