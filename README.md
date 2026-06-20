# cosmos1030.github.io

Personal academic portfolio site for [Doyoon Kim](https://cosmos1030.github.io), M.S. student in AI at POSTECH. Built as a static site hosted on GitHub Pages — no build tools, no frameworks.

## Structure

```
.
├── index.html               # Main page (About, News, Publications)
├── publications.html        # Full publications list
├── styles.css               # All styles (al-folio-inspired af-* classes)
├── blog/
│   ├── index.html           # Posts listing page
│   ├── post.html            # Post renderer (marked.js + KaTeX)
│   └── posts/               # Markdown source files
│       └── *.md
├── data/
│   ├── personal.js          # Name, contact, bio, education
│   ├── publications.js      # Publications array
│   ├── news.js              # News items
│   └── posts.js             # Blog post registry (auto-generated)
└── gen_posts.py             # Script to regenerate posts.js from .md front matter
```

## Writing a Blog Post

1. Create `blog/posts/your-slug.md` with front matter:

```markdown
---
title: Your Post Title
date: 2026-06-20
tags: [tag1, tag2]
description: One-sentence summary shown in the post list.
---

Your content here. Supports **Markdown**, inline math $E = mc^2$, and display math:

$$
\nabla_\theta J(\theta) = \mathbb{E}_{\tau}\left[\sum_t \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot G_t\right]
$$
```

2. Run the registry generator:

```bash
python gen_posts.py
```

That's it. `data/posts.js` is updated automatically and the post appears in the Posts page.

## Updating Content

All site content lives in `data/`:

| File | What to edit |
|---|---|
| `data/personal.js` | Name, email, GitHub, LinkedIn, bio paragraphs |
| `data/publications.js` | Add/reorder publications (most recent first) |
| `data/news.js` | Add news items |

## Local Development

Open with VS Code Live Server. The workspace-level `.vscode/settings.json` sets the Live Server root to this folder so all navigation links resolve correctly:

```json
{ "liveServer.settings.root": "/cosmos1030.github.io" }
```

Then go to `http://127.0.0.1:5500/`.

## Tech Stack

- Pure HTML/CSS/JS — no build step
- [marked.js](https://marked.js.org/) — Markdown rendering
- [KaTeX](https://katex.org/) — Math rendering
- [Font Awesome 6](https://fontawesome.com/) — Icons
- [Inter](https://fonts.google.com/specimen/Inter) — Typography
- GitHub Pages — Hosting
