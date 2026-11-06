# Writing Encounter content

You are writing reading and writing tasks for Inkwild, a creature-collecting iPad game for a Grade 5/6 composite class in Victoria, Australia. Students choose it over silent reading in spare minutes, so every task has to be worth reading, a little funny, and never feel like a worksheet. Read `GLOSSARY.md` for the game's words (Skill, Band, Encounter, Second look, Teach sequence).

## What you produce

One JSON file per Skill at `content/skills/<id>.json`. The shape is the `SkillFile` type in `src/content/bank.ts`, built from `src/content/types.ts`. `content/skills/5.3.json` is the model for Encounters. For the I do, follow the Tap to learn format below. `content/skills/5.2.json` is the model I do.

Each file has:

- `skill.name` and `skill.codes` copied exactly from `docs/curriculum/skill-list.md`.
- `why`: why the Skill matters, in 14 words or fewer. `how`: how to do it, in 16 words or fewer.
- `teach`: a crew member (`content/crew.json` ids), an I do, and two We do tasks with a `hint`.
  - **I do is Tap to learn: 4 to 8 steps.** The types are `Step` and `MoveCard` in `src/content/types.ts`, and `content/skills/5.2.json` is the model.
    - Each step has:
      - `say`: one line from the crew member, at most 20 words.
      - `show`: an example made of chunks. A chunk can have a `tag` (a label such as MAIN CLAUSE, in capitals) and `lit: true` to show the label from the start.
      - `ask`: what to do, at most 14 words.
      - `check`: one of these:
        - **`tap`** a chunk. `answer` counts chunks only, from 0. Every other chunk needs a `nudge`.
        - **`yesno`**, with a `nudge`.
        - **`pick`** from options. Every wrong option needs a `reason`.
      - `win`: what the crew member says once the student gets it.
    - The student can't move on until they get the check right. A wrong tap gets the nudge and another go, with no penalty.
    - **Show before you name.** First let the student see the idea work on a concrete sentence. Name the term in a `win` or a `tag` only after that. A step's `ask` may only use a term that an earlier step, its own `say`, or an earlier Skill on the island has already given. The jargon check enforces this.
    - **Think aloud.** Over the steps, walk through one worked example the way an expert would check it ("Say it alone. Does it make sense?"). Don't just state the rule.
    - **Name the trap.** At least one step has `trap: true`. It shows the mistake students actually make, or the shortcut that fails, and why it fails. For example, "When did the joey sneeze?" starts with when but is a main clause. Use `.scratch/review/ido-errors.md` and the review files to find the trap for your Skill.
    - **Three or more things to choose from in most steps.** No more than half the steps may be a two-way choice (yes/no, or two chunks or options).
    - **Bridge once to the curriculum word.** For example: "When is a joining word, also called a conjunction." Use "main clause (some books say independent clause)" and "doer (the subject)" the same way.
    - **Write for a nine-year-old who is a weak reader.** One idea per step, everyday words, no idioms an EAL learner would read literally. Funny is good. Keep the whole lesson to about two minutes.
  - **The Move card** is the reminder a student opens mid-task:
    - `terms`: 2 to 5 terms, each one a tag used in the lesson so the colours match, with `means` of at most 16 kid words.
    - `examples`: 2 example sentences made of tagged chunks.
    - `test`: the one-line test, at most 20 words.

- `write`: every marked Skill (islands 1 to 8) has one "your turn" writing task. The type is `WriteTask` in `src/content/types.ts`. The student writes one sentence of their own that uses the move. Nobody marks it: they tick their own checks, then see a model answer.
  - `ask` (at most 20 words) says exactly what to write.
  - `given` (optional, up to 3 short sentences) gives sentences to combine or rewrite. Sentence combining helps weak writers most, so use `given` wherever the move allows it.
  - `starter` (optional) is a sentence opener for students who freeze.
  - `checks` are 2 or 3 items, each at most 10 kid words, that a student can tick honestly, such as "My sentence starts with a when clause". Don't use "My sentence is good."
  - `model` (at most 30 words) is one strong answer, shown after the student finishes.
  - Reading Skills write too. 1.2 might be "Write one sentence that shows a feeling without naming it." 2.1 might be "Rewrite this line as if Mo is telling it."
- `creature`: an original Creature for this Skill. Base it loosely on Australian wildlife or landscape, never on First Nations cultural beings. Give it a two- or three-syllable invented name and an evolved name, both new words not used by any existing game or brand, and a blurb of one or two sentences that ties it to the Skill.
- `encounters`: exactly 6 per Band, Bands 1 to 4, 24 in all. Ids are `<skill>-b<band>-<n>`.

## Bands

Every Band uses the same Skill, but each Band asks for harder thinking with it. A longer text is not a harder Band. The thinking must step up:

1. **Band 1: one clear clue.** It sits next to the answer. The wrong options are ruled out by that clue.
2. **Band 2: the clue is a sentence or two away.** One wrong option is a near miss that the clue still rules out.
3. **Band 3: put two clues together, or read a clue the text only hints at.** The near misses look right at a glance. Include the trap the lesson named in at least one task.
4. **Band 4: judge or explain.** For example:
   - pick the best of two acceptable answers for a reason
   - say what a choice does for the reader
   - compare two versions or texts
   - use the move on an unusual case

   The near misses are as close as they can be while still having one defensible answer. A strong reader should have to stop and think.

Text length and vocabulary still rise with the Band, as in the table below, but they are not what makes a Band harder.

| Band | Level | Average sentence length | Options | Distractors |
|---|---|---|---|---|
| 1 | 4 | 12 words or fewer | 3 | clearly wrong once you think |
| 2 | 5 | 15 words or fewer | 3 | plausible |
| 3 | 6 | 18 words or fewer | 4 | subtle |
| 4 | 7 | 22 words or fewer | 4 | subtle, with richer vocabulary and structures |

Use at least three different formats in each Band (`choose`, `tapText`, `order`, `build`, `fix`, `sort`).

## Rules that matter most

1. **Exactly one defensible answer.** Before you finish an Encounter, try every wrong option and ask: could a careful adult argue this is also right? If yes, rewrite it. This is the rule that breaks trust when it fails. A separate reviewer will solve every task blind, without your answer key.
2. **Every wrong option has its own reason.** One plain sentence saying why *that* option is wrong, written to the student, never "Wrong!" or "Try again".
3. **The success line teaches.** It says why the answer is right, in 20 words or fewer. Every reason is also 20 words or fewer. Students at every Band read these, so keep them plain.
4. **Australian spelling and life:** colour, centre, realise, mum, footy, arvo, ute, thongs, lollies, Year 5.
5. **No word work.** Never ask about spelling, phonics, syllables, prefixes, suffixes or morphemes. Those belong to the school's OG program.
6. **Adult words.** Use the words adults really use. No baby talk.
7. **Spread topics.** Use the `topic` field and rotate through `sport`, `animals`, `space`, `gross-science`, `gaming`, `art`, `music`, `ocean`, `spooky`, `funny`, `food`, `robots` and `general`. Don't repeat a topic more than twice in a Band.
8. **Frame it in the world.** The `frame` line puts the task in the game: the crew, this Skill's Creature, a sign, a diary, a broadcast from Maxx Vantablack (the lying mega-streamer villain).
9. **Keep it clean.** No real brands, real people, scary violence or First Nations stories. Make it funny where you can.
10. **Build tasks:** the tiles must build each accepted sentence exactly, punctuation and capitals included. The game tells the student how many pieces to use (the number in the first accepted sentence), so a leftover tile can never make a second answer. No other arrangement of that many tiles may make a defensible answer *to the prompt*. The prompt may set the constraint, such as "lead with the dependent clause". **Fix tasks:** `spot` and the `answer` index count only the tappable parts. **tapText and fix:** every tappable part except the answer needs a reason.
11. **One grammar.** Use the Victorian Curriculum v2.0 metalanguage. Leave out any case where traditional and functional grammar disagree, so a careful adult can't argue either way. Examples: compound predicates ("Mia ran and bought milk"), "-ing" and "to" clauses as the thing classified, reported speech, "so" as a joining word, "who" for animals, and "that" offered as wrong where it's acceptable. This applies to what students choose between; success lines and reasons may use everyday "so".
12. **Sentence length counts everything the student reads:** passage, tappable text, the built sentence, sort and order items, and options of five words or more. Run-on Skills (5.13, 8.2) are exempt, because their long sentences are the point.
13. **Bands 3 and 4 need 4 options** in choose tasks (sort bins can be 2 to 4 at any Band). When a Skill has only three categories, offer four sentences or four "type: reason" statements instead.
14. **Students tap, never drag.** tapText and fix tasks need at least 3 tappable parts. Prompts say "Match each...", "Put..." or "Tap...", never "Drag".

## Reading Branches

Branches 1 to 4 and 7 are about reading whole texts, so most of their Encounters need a passage in `text`. Passage lengths per Band: 60 to 120 words, 100 to 180, 150 to 250, then 200 to 350. Use original texts only: stories, diary entries, news reports, letters, ads, signs and Maxx Vantablack's streams. Vary the genre. The answer must be decidable from the passage alone, never from world knowledge the passage doesn't give.

## Check your work

Run both commands. Both must be clean before you finish.

```
npx vitest run tests/content.test.ts
npm run -s content:report -- <skill id prefix, e.g. 5.6>
```

## Fences

Write only your assigned `content/skills/<id>.json` files. Never edit anything in `src/`, `tests/`, `docs/`, `content/branches.json`, `content/crew.json` or another writer's skill files. If a rule seems wrong, say so in your report instead of working around it.

## Don't let the answer give itself away

Students learn patterns fast. Across a Skill, the right option must not usually be the longest, the shortest, the only one with "because", or the only one that hedges. Write wrong options that are as long and as detailed as the right one. A good summary option and a too-narrow one can be the same length. The check fails a Skill when the right answer is the longest or shortest option in more than half its choose tasks.

In fix tasks, every replacement option is a plausible word of the same kind, so the student has to check the text to choose. Never plant a flat opposite (loved/hated) and offer its antonym as the only sensible swap.

Sorts must not always split evenly (3 and 3, or 2, 2 and 2). Vary the counts, for example 4 and 2, or 3, 2 and 1, so the last item can't be placed by counting. In sorts, don't let every item in one bin share a surface feature (every backed claim has a number) that the other bin lacks.
