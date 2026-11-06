# Wave 2 brief: rewrite the I do as Tap to learn

**Goal.** James Hooke is a Grade 5/6 teacher. He tested Inkwild and found the teaching hard to follow, even as an adult. Five expert-teacher reviews agreed on why. Each I do states a rule in clipped lines and never shows the thinking. It never names the usual mistake and never checks understanding. James chose a new design, "Tap to learn": short steps, each with one thing the student must get right before moving on. You are rewriting the I do for your island's Skills in that design.

## Read first

1. `docs/agents/content-writing.md`, the writer brief. The I do section is new and binding.
2. `content/skills/5.2.json` → `skill.teach.iDo`. This is the hand-written model. Match its quality and tone.
3. `src/content/types.ts`, the `Step`, `Chunk`, `Check` and `MoveCard` types.
4. `.scratch/review/ido-errors.md`. Every item listed for your Skills must be fixed by your new I do.
5. Your island's review file in `.scratch/review/`. Read its teaching findings and misconceptions for each Skill.
6. Each Skill's We do tasks and a sample of its Encounters. The I do must teach everything they test, and in the same words.

## For each Skill in your files

1. **Find what to teach.** Work out what the Encounters actually test, and the mistake students usually make. Plan the trap before you write anything.
2. **Replace `skill.teach.iDo` entirely** with `{ "steps": [...], "card": {...} }`. The old `beats` must be gone.
3. **Shape the steps:**
   - 4 to 8 steps that walk one or two worked examples through, concrete before abstract.
   - Name each term only after showing it. Bridge once to the curriculum word.
   - At least one `trap: true` step.
   - Most steps offer three or more chunks or options. No more than half may be a two-way choice.
4. **Make every check have exactly one right answer** that a weak reader can find from what the steps have shown. Write each nudge as a hint that sends the student back to the clue. A nudge must never be just "wrong".
5. **Write the Move card:**
   - terms, each one a tag used in the lesson
   - two tagged examples
   - the one-line test
6. **Island 9 (Story workshop) uses the same design.** Teach the writer's move with a mentor sentence. For example, tap the sense word, or pick the stronger opening and say why. Its terms are craft terms, such as SENSE WORD, HOOK or SHOW, NOT TELL.

## Don't

- Don't change Encounters, We do tasks, ids, `name` or `codes`. The exception is a We do or `how` line that now contradicts your corrected teaching. Fix those, and list each one in your report.
- Don't use a term the jargon check flags.
- Don't write US spelling, word work, the word "drag", First Nations stories, or idioms that EAL learners would read literally.

## Check

For each prefix, run:

- `npx vite-node scripts/content-report.ts <prefix>`. It must show no `!` for your Skills.
- `npx vite-node scripts/jargon.ts <prefix>`. It must show 0.

Other writers are converting other islands at the same time, so whole-suite tests will fail until everyone finishes. Ignore failures that name other islands.

Then reread each lesson as a nine-year-old reading below level would. Every line should be easy to say aloud. If one isn't, rewrite it.

## Report

Per Skill, give:

- the trap you chose
- any We do or `how` lines you changed
- anything you were unsure of

Keep it short.
