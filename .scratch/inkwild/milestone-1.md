# Milestone 1 plan (figure-it-out framing)

## Done means (checkable)

1. `npm test` is green: game core behaviour tests, Backup code property tests, content rule checks over every shipped Encounter.
2. `npm run build` produces a static site that loads offline after one visit.
3. In the browser pane at 820x1180 and 1024x768 with touch: open the app, pick a captain and interests, see the home Island, sail to Sentence building, finish a Teach sequence and Encounters with Second looks, befriend a Creature, and copy and confirm a Backup code.
4. The teacher opens it on a real school iPad from the Home Screen.

## Scope

- Units, in order: scaffold, types, game core, Backup code, persistence and PWA shell, UI shell and Encounter formats, world renderer (home Island, sailing, one Island), Sentence building content (13 Skills x 4 Bands x 6 Encounters plus Teach sequences), blind solve, Keeper battle, Creature art for Island 5.
- Riskiest first: drag and build tiles on touch, and the Backup code bit budget.

## Rigor

High on the game core and the Backup code. A wrong rule or a lossy code costs a student a year of progress, so both get behaviour and property tests before any UI. Medium on rendering, checked by screenshots at iPad sizes. Content gets rule checks that fail the build, plus a blind solve.

## Decision trail

`decisions.tsv` in this folder, one row per decision.
