# Scott Biggs — portfolio

Personal site built with [Astro](https://astro.build/).

## Commands

From **this directory** (`my-portfolio/`):

| Command           | Action |
|-------------------|--------|
| `npm install`     | Install dependencies |
| `npm run dev`     | Dev server at `http://localhost:4321` |
| `npm run build`   | Static build to `dist/` |
| `npm run preview` | Preview production build |

If your repo root is one level **above** this folder, use `npm run dev` from that root (see parent `README.md`) or `cd` into this folder first.

## Layout width

The main column uses **`--content-max`** in `src/layouts/Base.astro` (about **1080px** max on large screens, with responsive side padding). Tweak `--content-max` there if you want it narrower or wider.

## Banner image (`public/banner.jpeg`)

The hero image is **full viewport width**. CSS does **not** crop it: it uses `width: 100%` and `height: auto`, so the **file’s aspect ratio** controls how tall the banner is.

**Sizing the source file (recommended)**

| Goal | Suggestion |
|------|------------|
| **Width** | Export **1920px** wide (or **2400px** if you want extra sharpness on large / retina displays). |
| **Aspect ratio** | Use a **wide** crop—roughly **3:1 to 4:1** (width:height), e.g. **1920×480** through **1920×640**. That keeps the strip reasonably short after scaling; a **tall** photo becomes a very tall banner. |
| **Panoramas** | If the photo is ultra-wide, crop to a band that includes the subject; the site will show the full width. |
| **File size** | JPEG at **~80–85%** quality; aim for **under ~500KB** if you can (faster loads on Vercel). |
| **Replace** | Put your file in **`public/`** and point the `<img slot="banner" …>` in `src/pages/index.astro` at it (e.g. `/banner.jpeg`). |

**Dark mode:** Check the banner in both themes; very light or very dark images may need a slight levels tweak so it still feels balanced next to the page background.

## Blog (Markdown + content collections)

- Posts are Markdown files in **`src/content/blog/`** (e.g. `my-post.md`).
- Collection config: **`src/content.config.ts`** (schema: `title`, `description`, `pubDate`, optional `updatedDate`, optional `draft`).
- URLs: **`/blog/<filename-without-extension>`** (e.g. `deepweightflow-notes.md` → `/blog/deepweightflow-notes`).
- **`draft: true`** hides a post from the home list and from generated `/blog/` pages.
- **Images:** put files in **`public/blog/`** and embed in Markdown: `![alt text](/blog/your-image.png)`.

## Project layout (high level)

```
src/
  content/
    blog/           # Markdown posts
  content.config.ts # Blog collection + schema
  pages/
    index.astro
    blog/[id].astro # One page per post
  ...
public/
  blog/             # Optional images for posts
```
