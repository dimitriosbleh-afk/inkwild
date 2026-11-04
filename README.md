# Inkwild (working title)

A creature-collecting reading and writing game for a Grade 5/6 composite class, played in Safari on each student's own iPad. It covers sentence- and text-level reading and writing in the Victorian Curriculum v2.0 English, across Levels 4 to 7, with difficulty that adapts silently per student. There is no AI, no server, no account, and nothing leaves the iPad.

- Teachers: start with [docs/teacher-setup.md](docs/teacher-setup.md).
- Design: [.scratch/inkwild/spec.md](.scratch/inkwild/spec.md), [GLOSSARY.md](GLOSSARY.md) and [docs/adr](docs/adr).
- Skills and curriculum codes: [docs/curriculum/skill-list.md](docs/curriculum/skill-list.md).
- Writing content: [docs/agents/content-writing.md](docs/agents/content-writing.md).

## Develop

```
npm install
npm run dev        # local server
npm test           # game rules, Backup code and content checks
npm run build      # static site in dist/
```

Pushing to `main` tests, builds and publishes the site to GitHub Pages.

## Licence

Content and code are released under [CC BY 4.0](LICENSE). Curriculum extracts in `docs/curriculum` are © VCAA, reproduced for reference with attribution.
