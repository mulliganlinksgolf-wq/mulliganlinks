# TeeAhead identity

The primary logo pairs a tapered golf tee with an outlined Inter wordmark (weight 650, optical size 24). Forest green: #0F3D2E. Reversed version: #F4F1EA.

- `teeahead-logo-primary.svg`: primary vector master, 492 × 94; lettering is paths, so no installed font is needed.
- `teeahead-logo-light.svg`: matching reversed vector master.
- `teeahead-mark.svg`: standalone tee.
- `teeahead-favicon.svg`: app/browser tile master.
- `teeahead-logo-final.png`: transparent 2× export for PDFs and compatibility.

Run `node scripts/generate-brand-assets.mjs` from the repository root after editing the masters. This generates PNG logos, icons, the Apple touch icon, ICO and default social preview. Keep the light and primary vector masters in sync. Inter is licensed under the included SIL Open Font License.

SVG masters are the production artwork. Earlier generated concept boards are visual references, not application assets.
