# Image generation prompts

Every site image, its exact file name, where it appears, and a ready-to-paste
generation prompt. Generate each image, save it under `public/images/` with the
**exact file name** below (overwriting the placeholder), and redeploy — no code
changes needed.

Brand palette to keep the set cohesive:

- Background lilac-white `#f8f5fc`, surfaces `#ffffff` / `#efe9f8`
- Primary violet `#7c3aed` (deep `#6d28d9`)
- Saffron gold accent `#d9a52b`
- Style: warm, editorial food photography / clean modern illustration. No text
  inside images (the site overlays its own copy). RTL audience — avoid baked-in
  Latin text or left-anchored compositions.

---

## New — currently flat-color placeholders (highest priority)

### `landing-chefs-hero.png` — 800×600 (or 1600×1200 @2x)

Where: `/chefs` client landing hero (`src/pages/EzfindChefs.tsx`).

> Warm editorial photo of a private chef in a home kitchen plating an elegant
> dish for a small dinner party, guests softly blurred in the background around
> a candle-lit table, shallow depth of field, warm golden-hour light with subtle
> violet tones in the shadows, premium yet homey atmosphere, no text, no logos.

### `landing-join-hero.png` — 800×600 (or 1600×1200 @2x)

Where: umbrella `ezfind.app` provider-registration hero (`src/pages/EzfindJoin.tsx`).

> Confident collage-style photo of three Israeli service professionals at work —
> a chef plating a dish, a photographer with a camera, an event producer with a
> tablet — bright clean lilac-white background with soft violet accents,
> optimistic and professional mood, modern editorial style, no text, no logos.

---

## Existing images (regenerate for a cohesive set)

### `og.png` — 1200×630

Where: social share card for every page (`src/components/Seo.tsx`).

> Social share banner: elegant dark slate table surface with a beautifully
> plated gourmet dish top-center, scattered saffron threads and pomegranate
> seeds, generous empty space in the lower third for overlay text, violet and
> gold color grading, premium food-brand look, no text.

### `hero.png` — ~1200×900

Where: marketplace home hero (`src/pages/Home.tsx`).

> A private chef's hands finishing a refined plated dish with a micro-herb
> garnish, warm side light, dark elegant background with a violet cast,
> close-up editorial food photography, no faces, no text.

### `chef.png` — ~900×900

Where: "for chefs" info page (`src/pages/Chefs.tsx`).

> Portrait of a professional chef in a white chef jacket smiling while checking
> a smartphone in a modern kitchen, natural window light, shallow depth of
> field, approachable and trustworthy mood, no visible brand names, no text.

### `olive.png` — ~600×600, transparent background

Where: decorative accent on the "for chefs" page (`src/pages/Chefs.tsx`).

> Minimal hand-drawn illustration of an olive branch with three olives, thin
> violet line art (#7c3aed) with saffron-gold olives, on a fully transparent
> background, consistent 1.6px stroke weight, no text.

### `pomegranate.png` — ~600×600, transparent background

Where: decorative accent on the marketplace home (`src/pages/Home.tsx`).

> Minimal hand-drawn illustration of a halved pomegranate with a few loose
> seeds, thin violet line art (#7c3aed) with ruby-red seed accents, on a fully
> transparent background, consistent 1.6px stroke weight, no text.

### `texture.png` — ~800×800, tileable

Where: subtle background texture (`src/pages/Home.css`).

> Seamless tileable paper-grain texture, extremely subtle, lilac-white
> (#f8f5fc) base with barely visible fiber noise, suitable as a repeating web
> background at 3–5% opacity, no visible seams, no text.

### `logo.png` — 512×512, transparent background

Where: favicon/app icon (`index.html`).

> App icon: minimal geometric monogram of the letters "ez" in bold rounded
> lettering, violet (#7c3aed) on transparent background, subtle saffron-gold
> dot accent, flat vector style, crisp at 32×32, no other text.

---

## Tips

- Generate at 2× the listed size and downscale for sharpness.
- Keep all photos in the same "session": same grading (violet shadows, warm
  highlights) so pages feel like one brand.
- After replacing images, run `npm run build` and spot-check `/`, `/chefs`,
  `/for-chefs`, and a shared link preview (og.png).
