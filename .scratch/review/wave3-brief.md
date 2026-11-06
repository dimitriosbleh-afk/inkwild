# Wave 3 brief: Bands that step up in thinking, and writing of their own

**Goal.** James Hooke teaches Grade 5/6. He wants Inkwild to teach as well as the best teacher would, for every student from 18 months below Level 5 to 18 months above Level 6. A teacher review found two problems:

- **Band 3 and 4 tasks are mostly longer versions of Band 1 tasks.** A strong reader is never stretched, and the "judge, explain and compare" half of the curriculum codes is almost never tested.
- **Students never write a sentence of their own.**

You are fixing both for your island. The I do lessons were rewritten last week (Tap to learn) and are good. Leave them alone.

## Read first

1. `docs/agents/content-writing.md`. It is binding. The Bands section now describes the thinking ladder, and there is a new `write` field.
2. Your island's review file in `.scratch/review/`, for its range and curriculum findings.
3. `.scratch/review/plan.md`, for the "Open after Wave 2" items that are yours.
4. Each Skill's I do (`skill.teach.iDo`). Encounters must use the lesson's words and test what it taught.

## For each Skill

### 1. Audit the Band ladder

Read the 24 Encounters by Band. For Bands 3 and 4, ask: "Does this need harder thinking than Band 1, or is it only longer?"

Rewrite every Band 3 and 4 task that is only longer so it matches the ladder:

- **Band 3:** combine two clues or read an implied one. Use near misses. Include the lesson's trap in at least one task.
- **Band 4:** judge or explain, compare versions, say what a choice does for the reader, or apply the move to an unusual case.

Also check Band 1. A weak reader must be able to reach it with one clear clue. Fix any Band 1 task that needs more than that.

Keep each Encounter's id, Band and topic. You may change its format if the new thinking needs it. Keep at least three formats per Band.

### 2. Add the `write` task

Every Skill on islands 1 to 8 needs a `skill.write` (see the brief). Use `given` sentences to combine or rewrite wherever the move allows it.

The `model` must meet every check. The `checks` must be things a student can honestly tick.

### 3. Fix your island's open items

These are the items listed for your island in the island prompt.

## Keep every rule

- The task-level rules:
  - exactly one defensible answer
  - `piecesNeeded` for builds
  - at least 3 tappable parts
  - topic spread
  - longest/shortest tells
  - no even sorts
  - no wrong-answer reason that quotes the answer
  - the error in fix tasks not last most of the time
  - word limits
  - jargon
- Australian spelling.
- No word work.
- No First Nations stories.
- No idioms that EAL readers would take literally.

## Check

Run all three before you report:

- `npx vite-node scripts/content-report.ts <prefix>` shows no `!` for your Skills.
- `npx vite-node scripts/jargon.ts <prefix>` shows 0.
- `npx vitest run tests/content.test.ts` has no failures that name your Skills. Other islands are being edited at the same time, so ignore failures that name theirs.

## Report

Per Skill:

- how many Band 3 and 4 tasks you rewrote, and what the new thinking is, in one line
- the write task's `ask`

Then the open items you fixed.

End with a line `CHANGED:` followed by every Encounter id whose answer, options, taps, piles, passage or prompt changed, comma-separated, so they can be blind-solved.
