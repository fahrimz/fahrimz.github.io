# Writing Articles for This Blog

## File Structure

- All blog posts go in `src/content/blog/`
- Filename becomes the URL slug (e.g., `my-post.md` → `/blog/my-post/`)
- Supported formats: `.md` and `.mdx`

## Frontmatter (Required)

```yaml
---
title: 'Your Post Title'
description: 'A short description of the post.'
pubDate: 'MMM DD YYYY'
updatedDate: 'MMM DD YYYY'  # optional
heroImage: '/blog/cover.png'  # optional, image in public/blog/
---
```

- `title` — required, string
- `description` — required, string
- `pubDate` — required, date string in `MMM DD YYYY` format (e.g., `Apr 01 2026`)
- `updatedDate` — optional, same date format
- `heroImage` — optional, path to image in `public/blog/`

## Content Format

- Use `<br />` tags for spacing between paragraphs (don't rely on blank lines alone)
- Use `####` for section headings
- Use fenced code blocks with language annotations (````typescript`, ````bash`, etc.)
- Standard markdown for links, images (`![alt](/blog/image.png)`), bold, italic
- No MDX component imports unless necessary — keep it plain markdown with occasional inline HTML

## Writing Style

- First person, casual tone ("I'll explain", "here's a workaround")
- Short paragraphs
- Get to the point quickly — don't pad with unnecessary background
- Use code examples generously
- Link to external references (GitHub issues, docs) when relevant

## Pre-Writing Checklist

Before writing an article, research and confirm:

- [ ] The problem/claim actually exists (search GitHub issues, Stack Overflow, official docs)
- [ ] Verify the actual behavior described (default behaviors, version numbers, platform specifics)
- [ ] Check if there are existing issues or discussions to reference
- [ ] Confirm the solution actually works

## Typical Article Structure

1. **Intro** — One or two sentences describing what the article is about
2. **The Problem** — Explain the issue with context and link to relevant references
3. **The Solution** — Provide the fix/workaround with code examples
4. **Usage** (if applicable) — Show how to use the solution in practice
5. **Why It Works** (optional) — Brief explanation of the underlying reason

## Assets

- Blog images/assets go in `public/blog/`
- Reference them with absolute paths: `/blog/filename.png`

## Build & Verify

After writing or editing an article, run:

```bash
pnpm build
```

This will catch any content or formatting errors.
