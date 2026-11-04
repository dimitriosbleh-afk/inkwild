# 1. No AI and no backend: all play and progress stay on the iPad

Date: 2026-11-04
Status: accepted

## Context

Students play in their own time on school iPads in Safari. Open-ended writing feedback would need an AI service, a server, ongoing cost, and a DET privacy impact assessment, because student writing would leave the device. The school also does not want to track individual students or create staff work.

## Decision

The game is a static web app with no AI and no server. Writing tasks are ones the game can check by rule (combining, choosing, ordering, punctuating, building from tiles), plus an unmarked free-writing space. Progress is stored only on the iPad. Teachers see no data.

## Consequences

- No privacy review, no running cost, works offline once loaded.
- Writing feedback is limited to what rules can judge; open writing is never marked.
- Adding AI feedback or a teacher view later means a new backend and a privacy review: a deliberate future decision, not a toggle.
