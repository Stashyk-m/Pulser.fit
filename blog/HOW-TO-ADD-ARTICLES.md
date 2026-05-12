# How to Add a New Blog Article to Pulser.fit

This guide walks you through adding a new article to the Pulser blog. No coding experience needed — just copy, paste, and replace.

---

## Step 1: Create the article file

1. Open the `website/blog/` folder
2. Copy an existing article file (e.g. `ai-personal-trainer.html`)
3. Rename the copy to your new article's slug — use lowercase, hyphens between words, no spaces.
   Example: `gym-software-comparison.html`

---

## Step 2: Update the `<head>` section

Open your new file and find the `<head>` block at the top. Replace these values:

| What to change | Where to find it | What to put |
|---|---|---|
| `<title>` | Line ~6 | Your Article Title \| Pulser Blog |
| `<meta name="description">` | Line ~8 | 1-2 sentence summary (150 chars max) |
| `<link rel="canonical">` | Line ~15 | `https://pulser.fit/blog/your-slug.html` |
| `<meta name="keywords">` | Line ~16 | 5-8 comma-separated keywords |
| All `og:title` and `twitter:title` | Lines ~18-29 | Same as `<title>` |
| All `og:description` and `twitter:description` | Same area | Same as meta description |
| `og:url` | Line ~21 | `https://pulser.fit/blog/your-slug.html` |

### Update the JSON-LD structured data

Find the `<script type="application/ld+json">` block and update:

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "Your Article Title Here",
  "datePublished": "2026-05-12",
  "url": "https://pulser.fit/blog/your-slug",
  "description": "Your meta description here."
}
```

Leave `author` and `publisher` as-is (they point to Pulser).

---

## Step 3: Update the article content

Find the `<main>` section. Here's the structure:

### Tags (topic badges)

```html
<div class="flex flex-wrap gap-2 mb-4">
  <span class="text-xs px-2.5 py-1 rounded-full bg-brand/15 text-brand">Retention</span>
  <span class="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/50">For Gyms</span>
</div>
```

Available tag color combos:
- **Red** (brand topics): `bg-brand/15 text-brand` — use for: Retention, Pricing, Business
- **Blue** (tech topics): `bg-blue-500/15 text-blue-400` — use for: AI & Tech, Data, EHDS
- **Green** (growth topics): `bg-emerald-500/15 text-emerald-400` — use for: Growth, Coaching, Training
- **Grey** (audience): `bg-white/5 text-white/50` — use for: For Gyms, For Members, For Coaches

### Title and meta

```html
<h1 class="heading-xl mb-4">Your Article Title Here</h1>
<p class="text-sm text-white/40 mb-10">May 2026 &middot; 8 min read</p>
```

### Body content

All body text goes inside `<div class="prose prose-invert max-w-none space-y-6 text-white/70 leading-relaxed">`.

Use these building blocks:

**Paragraphs:**
```html
<p>Your paragraph text here. Use <strong class="text-white">bold for key terms</strong>.</p>
```

**Lead paragraph** (first paragraph, slightly larger):
```html
<p class="text-lg text-white/80">Opening paragraph that hooks the reader.</p>
```

**Section headings:**
```html
<h2 class="text-xl font-semibold text-white mt-10 mb-3">Section Title</h2>
```

**Numbered lists:**
```html
<div class="space-y-3 my-6">
  <div class="flex gap-3"><span class="text-brand font-bold">1.</span><span>First item text.</span></div>
  <div class="flex gap-3"><span class="text-brand font-bold">2.</span><span>Second item text.</span></div>
</div>
```

**Highlight cards:**
```html
<div class="card p-6">
  <h3 class="font-semibold mb-2">Card Title</h3>
  <p class="text-sm text-white/55">Card description text.</p>
</div>
```

**Accent-bordered card** (for featured/recommended):
```html
<div class="card p-6 border-brand/30">
  <h3 class="font-semibold mb-2 text-brand">Featured Title</h3>
  <p class="text-sm text-white/55">Description.</p>
</div>
```

**CTA block** (at the end of every article):
```html
<div class="card p-8 mt-12">
  <h3 class="text-lg font-semibold mb-3 text-white">Call to Action Title</h3>
  <p>Description of what Pulser offers related to this article's topic.</p>
  <p class="mt-4"><a href="../for-gyms.html" class="text-brand hover:underline">Learn more &rarr;</a></p>
</div>
```

Link targets for CTAs:
- Gym owners → `../for-gyms.html`
- Members → `../for-members.html`
- Coaches → `../for-coaches.html`
- General → `../platform.html`

---

## Step 4: Add the article to the blog listing

Open `blog/index.html` and find the `<section class="pb-20">` block. Add a new card **above** the existing ones (newest first):

```html
<a href="your-slug.html" class="card p-8 block hover:border-brand/30 transition-colors">
  <div class="flex flex-wrap gap-2 mb-3">
    <span class="text-xs px-2.5 py-1 rounded-full bg-brand/15 text-brand">Topic Tag</span>
    <span class="text-xs px-2.5 py-1 rounded-full bg-white/5 text-white/50">Audience Tag</span>
  </div>
  <h2 class="text-xl font-semibold mb-2">Your Article Title</h2>
  <p class="text-sm text-white/55">1-2 sentence description.</p>
  <div class="text-xs text-white/30 mt-4">May 2026 &middot; 8 min read</div>
</a>
```

---

## Step 5: Add to sitemap (optional but recommended)

Open `website/sitemap.xml` and add:

```xml
<url>
  <loc>https://pulser.fit/blog/your-slug.html</loc>
  <lastmod>2026-05-12</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.6</priority>
</url>
```

---

## Checklist before publishing

- [ ] File name is lowercase with hyphens (e.g. `my-article.html`)
- [ ] Title tag, og:title, twitter:title all match
- [ ] Meta description is under 160 characters
- [ ] Canonical URL is correct
- [ ] JSON-LD `datePublished` is set
- [ ] Article has a CTA card at the bottom
- [ ] Card added to `blog/index.html` (newest first)
- [ ] Entry added to `sitemap.xml`
- [ ] All links use `../` prefix (since articles are in `/blog/` subfolder)

---

## Quick reference: file paths from inside /blog/

Since articles live in the `blog/` subfolder, all links to main site pages need `../`:

- Homepage: `../index.html`
- Assets (CSS, JS, favicon): `../assets/...`
- Other pages: `../for-gyms.html`, `../pricing.html`, etc.
- Other blog articles: `gym-member-retention.html` (same folder, no prefix)
