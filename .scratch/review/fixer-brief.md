# Wave 1 fixer brief

**Goal:** James Hooke, a Grade 5/6 teacher, wants Inkwild to teach as well as the best teacher in the country would. A teacher review found wrong answers, wrong claims, and shortcuts that let students pass without the Skill. You are fixing those in your files, in Wave 1. Read .scratch/review/plan.md for the whole picture.

## Read first
- `.scratch/review/plan.md`
- your review file
- `docs/agents/content-writing.md` (the writer brief, which is binding)
- `src/content/rules.ts`

## Do
1. **Clear the content checks.** Run `npx vite-node scripts/content-report.ts <your prefix>` and fix every `!` problem it lists for your Skills, including the three new rules:
   - A wrong-answer reason must not quote the right answer. Point at the clue in the text instead, so the student thinks again.
   - The wrong part in fix tasks must not sit in the last slot more than half the time. Move some wrong parts earlier by reordering or rewriting the passage.
   - A We do check needs at least 3 options.
2. **Fix the review findings.** In your review file, fix every finding with severity `blocker` or `major`, of kind accuracy, task, feedback or language, that sits in a weDo task or an Encounter. Use the review's suggested fix where it is sound. Use your own judgement where it isn't. You are an expert teacher too.
3. **Wrong-answer reasons that name the exact word or mark that is right.** Also rewrite these, including ones the checker misses (for example "The comma goes after Yesterday"), so they nudge rather than tell.
4. **Apply the plan's stated terminology assumptions:**
   - The complication is the story's problem.
   - Use "narrator" in Encounter wording only where the island's I do already introduces it. Otherwise leave "teller" for Wave 2.
   - Leave "adverb group" and "adverbial" alone. That question is open.

## Don't
- Don't edit `skill.teach.iDo`. The I do is rewritten in Wave 2. If an I do beat is factually wrong, list it in your report instead.
- Don't redesign Band difficulty. That is Wave 3. The exception is a blocker that needs a task replaced.
- Don't change ids, formats or the number of Encounters.
- Keep every task to exactly one defensible answer.
- Keep within all word limits and every existing rule: build `piecesNeeded`, at least 3 taps, topic spread, the longest/shortest tells and even sorts.
- Use Australian spelling and words a 9 to 10 year old knows.
- Edit only the files in your group.

## Check
1. Run `npx vite-node scripts/content-report.ts <prefix>` until it shows no `!` for your Skills.
2. Run `npx vite-node scripts/jargon.ts <prefix>` until it shows 0 for your Skills.
3. Other groups are editing other islands at the same time. A failing whole-suite test that names another island's Skill isn't yours.

## Report
- A short list of what you changed and why, grouped by Skill.
- I do beats that are wrong, for Wave 2.
- A final line: `CHANGED:` followed by every Encounter or weDo id whose answer, options, taps, piles or passage changed, comma-separated. Use the form `5.3-weDo1` for We do tasks. Leave out ids where only feedback wording changed.
