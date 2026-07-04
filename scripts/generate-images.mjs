#!/usr/bin/env node
// Generates every site image from docs/IMAGE_PROMPTS.md with the OpenAI Images
// API (gpt-image family) and saves each one under public/images/ with the
// exact file name the app expects — overwriting the flat-color placeholders.
//
// Usage:
//   OPENAI_API_KEY=sk-...  node scripts/generate-images.mjs             # all images
//   node scripts/generate-images.mjs og.png logo.png                    # a subset
//   node scripts/generate-images.mjs --dry-run                          # print the plan, no API calls
//   node scripts/generate-images.mjs --model gpt-image-1 --quality medium
//   node scripts/generate-images.mjs --no-resize                        # keep raw API output size
//
// Models: defaults to gpt-image-2, which accepts flexible resolutions (both
// edges multiples of 16, max edge 3840, ratio <= 3:1), so photos render at
// exactly 2x the target size and are downscaled with sharp — the "generate
// big, downscale for sharpness" tip from docs/IMAGE_PROMPTS.md. gpt-image-2
// rejects background:"transparent", so transparent images (olive, pomegranate,
// logo) fall back to gpt-image-1, which only renders fixed sizes
// (1024x1024 / 1536x1024 / 1024x1536, or auto) — each manifest entry carries both a
// flexible ("flex") and a fixed ("fixed") generation size for this reason.
//
// The key is read from $OPENAI_API_KEY, falling back to OPENAI_API_KEY= lines
// in .env.local / .env at the repo root.

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "public", "images");

// ---------------------------------------------------------------------------
// Manifest — prompts copied verbatim from docs/IMAGE_PROMPTS.md
// ---------------------------------------------------------------------------

// Shared grading suffix for the photographic set so all pages feel like one
// brand session (per the doc's palette notes). Line-art/texture prompts already
// spell out their own palette, so they get no suffix.
const PHOTO_SUFFIX =
  " Consistent brand grading: subtle violet tones in the shadows, warm golden" +
  " highlights, premium editorial food-brand look. No text, no logos, no" +
  " watermarks.";

const IMAGES = [
  {
    file: "landing-chefs-hero.png",
    where: "/chefs client landing hero (src/pages/EzfindChefs.tsx)",
    flex: "1600x1200", // exact 2x of the 800×600 target
    fixed: "1536x1024",
    target: { width: 800, height: 600 },
    kind: "photo",
    prompt:
      "Warm editorial photo of a private chef in a home kitchen plating an" +
      " elegant dish for a small dinner party, guests softly blurred in the" +
      " background around a candle-lit table, shallow depth of field, warm" +
      " golden-hour light with subtle violet tones in the shadows, premium yet" +
      " homey atmosphere, no text, no logos.",
  },
  {
    file: "landing-join-hero.png",
    where: "ezfind.app provider-registration hero (src/pages/EzfindJoin.tsx)",
    flex: "1600x1200",
    fixed: "1536x1024",
    target: { width: 800, height: 600 },
    kind: "photo",
    prompt:
      "Confident collage-style photo of three Israeli service professionals at" +
      " work — a chef plating a dish, a photographer with a camera, an event" +
      " producer with a tablet — bright clean lilac-white background with soft" +
      " violet accents, optimistic and professional mood, modern editorial" +
      " style, no text, no logos.",
  },
  {
    file: "og.png",
    where: "social share card for every page (src/components/Seo.tsx)",
    flex: "2400x1264", // ~2x of 1200×630, /16-aligned; tiny center-crop to 1.91:1
    fixed: "1536x1024",
    target: { width: 1200, height: 630 },
    kind: "photo",
    prompt:
      "Social share banner: elegant dark slate table surface with a beautifully" +
      " plated gourmet dish top-center, scattered saffron threads and" +
      " pomegranate seeds, generous empty space in the lower third for overlay" +
      " text, violet and gold color grading, premium food-brand look, no text.",
  },
  {
    file: "hero.png",
    where: "marketplace home hero (src/pages/Home.tsx)",
    flex: "2432x1824", // ~2x of 1200×900, exact 4:3, /16-aligned
    fixed: "1536x1024",
    target: { width: 1200, height: 900 },
    kind: "photo",
    prompt:
      "A private chef's hands finishing a refined plated dish with a micro-herb" +
      " garnish, warm side light, dark elegant background with a violet cast," +
      " close-up editorial food photography, no faces, no text.",
  },
  {
    file: "chef.png",
    where: '"for chefs" info page (src/pages/Chefs.tsx)',
    flex: "1792x1792", // ~2x of 900×900, /16-aligned
    fixed: "1024x1024",
    target: { width: 900, height: 900 },
    kind: "photo",
    prompt:
      "Portrait of a professional chef in a white chef jacket smiling while" +
      " checking a smartphone in a modern kitchen, natural window light," +
      " shallow depth of field, approachable and trustworthy mood, no visible" +
      " brand names, no text.",
  },
  {
    file: "olive.png",
    where: 'decorative accent on the "for chefs" page (src/pages/Chefs.tsx)',
    flex: "1200x1200",
    fixed: "1024x1024",
    target: { width: 600, height: 600 },
    kind: "illustration",
    transparent: true,
    prompt:
      "Minimal hand-drawn illustration of an olive branch with three olives," +
      " thin violet line art (#7c3aed) with saffron-gold olives, on a fully" +
      " transparent background, consistent 1.6px stroke weight, no text.",
  },
  {
    file: "pomegranate.png",
    where: "decorative accent on the marketplace home (src/pages/Home.tsx)",
    flex: "1200x1200",
    fixed: "1024x1024",
    target: { width: 600, height: 600 },
    kind: "illustration",
    transparent: true,
    prompt:
      "Minimal hand-drawn illustration of a halved pomegranate with a few loose" +
      " seeds, thin violet line art (#7c3aed) with ruby-red seed accents, on a" +
      " fully transparent background, consistent 1.6px stroke weight, no text.",
  },
  {
    file: "texture.png",
    where: "subtle background texture (src/pages/Home.css)",
    flex: "1600x1600",
    fixed: "1024x1024",
    target: { width: 800, height: 800 },
    kind: "texture",
    prompt:
      "Seamless tileable paper-grain texture, extremely subtle, lilac-white" +
      " (#f8f5fc) base with barely visible fiber noise, suitable as a repeating" +
      " web background at 3–5% opacity, no visible seams, no text.",
  },
  {
    file: "logo.png",
    where: "favicon/app icon (index.html)",
    flex: "1024x1024",
    fixed: "1024x1024",
    target: { width: 512, height: 512 },
    kind: "illustration",
    transparent: true,
    prompt:
      'App icon: minimal geometric monogram of the letters "ez" in bold rounded' +
      " lettering, violet (#7c3aed) on transparent background, subtle" +
      " saffron-gold dot accent, flat vector style, crisp at 32×32, no" +
      " other text.",
  },
];

// ---------------------------------------------------------------------------
// CLI + config
// ---------------------------------------------------------------------------

// Strict parsing on purpose: a mistyped flag on this script means a paid API
// run instead of the dry run the user expected, so anything unknown exits 1.
const argv = process.argv.slice(2);
const KNOWN_FLAGS = new Set(["--model", "--quality", "--dry-run", "--no-resize"]);
const VALUE_FLAGS = new Set(["--model", "--quality"]);
const flags = new Set();
const flagValues = new Map();
const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (!argv[i].startsWith("--")) {
    positional.push(argv[i]);
    continue;
  }
  const eq = argv[i].indexOf("=");
  const name = eq === -1 ? argv[i] : argv[i].slice(0, eq);
  const inline = eq === -1 ? undefined : argv[i].slice(eq + 1);
  if (!KNOWN_FLAGS.has(name)) {
    console.error(`[images] unknown flag: ${argv[i]}`);
    console.error(`[images] known flags: ${[...KNOWN_FLAGS].join(", ")}`);
    process.exit(1);
  }
  if (VALUE_FLAGS.has(name)) {
    const value = inline !== undefined ? inline : argv[++i];
    if (!value || value.startsWith("--")) {
      console.error(`[images] flag ${name} requires a value`);
      process.exit(1);
    }
    flagValues.set(name, value);
  } else {
    if (inline !== undefined) {
      console.error(`[images] flag ${name} takes no value`);
      process.exit(1);
    }
    flags.add(name);
  }
}
const flagValue = (name, fallback) => flagValues.get(name) ?? fallback;
const wanted = positional.map((a) => (a.endsWith(".png") ? a : `${a}.png`));

const MODEL = flagValue("--model", process.env.OPENAI_IMAGE_MODEL || "gpt-image-2");
// gpt-image-2 rejects background:"transparent"; gpt-image-1 is the long-term
// supported model that still renders alpha (gpt-image-1.5/-mini shut down Dec 2026).
const TRANSPARENT_MODEL = "gpt-image-1";
const QUALITY = flagValue("--quality", "high");
const DRY_RUN = flags.has("--dry-run");
const NO_RESIZE = flags.has("--no-resize");
const CONCURRENCY = 3;

// DALL-E models were removed from the API (May 2026) and don't take the
// GPT-image-only params (background, output_format) this script sends.
if (!MODEL.startsWith("gpt-image")) {
  console.error(`[images] unsupported model "${MODEL}" — only gpt-image-* models work here`);
  process.exit(1);
}

function loadApiKey() {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  for (const envFile of [".env.local", ".env"]) {
    const p = join(root, envFile);
    if (!existsSync(p)) continue;
    // Tolerate Windows-typical encodings: UTF-16 (PowerShell's `>` default)
    // and UTF-8 BOMs, plus dotenv-style quoting around the value.
    const buf = readFileSync(p);
    let text;
    if (buf[0] === 0xff && buf[1] === 0xfe) text = buf.toString("utf16le");
    else if (buf[0] === 0xfe && buf[1] === 0xff) text = Buffer.from(buf).swap16().toString("utf16le");
    else text = buf.toString("utf8");
    text = text.replace(/^﻿/, "");
    const m = text.match(/^OPENAI_API_KEY\s*=\s*["']?([^"'\r\n]+?)["']?\s*$/m);
    if (m) return m[1].trim();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

// Only gpt-image-2 accepts flexible WxH sizes; older gpt-image models are
// limited to the three fixed sizes carried in each entry's "fixed" field.
function modelFor(image) {
  if (image.transparent && MODEL.startsWith("gpt-image-2")) return TRANSPARENT_MODEL;
  return MODEL;
}

function sizeFor(image, model) {
  return model.startsWith("gpt-image-2") ? image.flex : image.fixed;
}

async function callImagesApi(apiKey, image) {
  const model = modelFor(image);
  const body = {
    model,
    prompt: image.kind === "photo" ? image.prompt + PHOTO_SUFFIX : image.prompt,
    n: 1,
    size: sizeFor(image, model),
    quality: QUALITY,
    output_format: "png",
  };
  if (image.transparent) body.background = "transparent";

  for (let attempt = 1; attempt <= 3; attempt++) {
    let res;
    try {
      res = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // undici says just "fetch failed" — the real reason lives in err.cause.
      const detail = err.cause?.code || err.cause?.message || err.message;
      if (attempt === 3) throw new Error(`${image.file}: network error — ${detail}`);
      const wait = attempt * 5000;
      console.warn(`[images] ${image.file}: network error (${detail}), retrying in ${wait / 1000}s…`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    if (res.ok) {
      const json = await res.json();
      const b64 = json.data?.[0]?.b64_json;
      if (!b64) throw new Error(`no b64_json in response for ${image.file}`);
      return Buffer.from(b64, "base64");
    }
    const text = await res.text();
    const retryable = res.status === 429 || res.status >= 500;
    if (!retryable || attempt === 3) {
      throw new Error(`${image.file}: HTTP ${res.status} — ${text.slice(0, 500)}`);
    }
    const wait = attempt * 5000;
    console.warn(`[images] ${image.file}: HTTP ${res.status}, retrying in ${wait / 1000}s…`);
    await new Promise((r) => setTimeout(r, wait));
  }
}

async function finalize(image, buf) {
  if (NO_RESIZE) return buf;
  const { width, height } = image.target;
  return sharp(buf)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

async function generateOne(apiKey, image) {
  const started = Date.now();
  const model = modelFor(image);
  console.log(
    `[images] ${image.file}: generating (${model}, ${sizeFor(image, model)}, quality=${QUALITY})…`,
  );
  const raw = await callImagesApi(apiKey, image);
  const out = await finalize(image, raw);
  const dest = join(outDir, image.file);
  writeFileSync(dest, out);
  const kb = Math.round(out.length / 1024);
  const secs = Math.round((Date.now() - started) / 1000);
  console.log(
    `[images] ${image.file}: saved ${image.target.width}×${image.target.height}, ${kb} KB (${secs}s)` +
      (kb > 300 ? "  ⚠ >300 KB — consider recompressing" : ""),
  );
}

async function main() {
  let queue = IMAGES;
  if (wanted.length) {
    queue = IMAGES.filter((i) => wanted.includes(i.file));
    const unknown = wanted.filter((w) => !IMAGES.some((i) => i.file === w));
    if (unknown.length) {
      console.error(`[images] unknown image(s): ${unknown.join(", ")}`);
      console.error(`[images] known: ${IMAGES.map((i) => i.file).join(", ")}`);
      process.exit(1);
    }
  }

  console.log(`[images] model=${MODEL} quality=${QUALITY} → ${outDir}`);
  for (const i of queue) {
    const model = modelFor(i);
    console.log(
      `[images]   ${i.file}  ${model} ${sizeFor(i, model)} → ${i.target.width}×${i.target.height}` +
        `${i.transparent ? " (transparent)" : ""}  — ${i.where}`,
    );
  }
  if (DRY_RUN) {
    console.log(`[images] dry run — no API calls made.`);
    return;
  }

  const apiKey = loadApiKey();
  if (!apiKey) {
    console.error(
      "[images] missing OPENAI_API_KEY — set the env var or add it to .env.local",
    );
    process.exit(1);
  }

  // Small worker pool: image generations run ~30–60s each; a few in flight
  // keeps things fast without tripping rate limits.
  const pending = [...queue];
  const failures = [];
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, pending.length) }, async () => {
      for (let img = pending.shift(); img; img = pending.shift()) {
        try {
          await generateOne(apiKey, img);
        } catch (err) {
          failures.push(img.file);
          console.error(`[images] ${img.file}: FAILED — ${err.message}`);
        }
      }
    }),
  );

  if (failures.length) {
    console.error(`[images] done with ${failures.length} failure(s): ${failures.join(", ")}`);
    console.error(`[images] re-run just those: node scripts/generate-images.mjs ${failures.join(" ")}`);
    process.exit(1);
  }
  console.log("[images] all images generated. Next: npm run build, then spot-check /, /chefs, /for-chefs and a share preview (og.png).");
}

main().catch((err) => {
  console.error(`[images] fatal: ${err.message}`);
  process.exit(1);
});
