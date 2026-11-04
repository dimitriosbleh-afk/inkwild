# Writing Encounter content

You are writing reading and writing tasks for Inkwild, a creature-collecting iPad game for a Grade 5/6 composite class in Victoria, Australia. Students choose it over silent reading in spare minutes, so every task has to be worth reading, a little funny, and never feel like a worksheet. Read `GLOSSARY.md` for the game's words (Skill, Band, Encounter, Second look, Teach sequence).

## What you produce

One JSON file per Skill at `content/skills/<id>.json`. The shape is the `SkillFile` type in `src/content/bank.ts`, built from `src/content/types.ts`. `content/skills/5.3.json` is the model file. Match its depth, tone and structure.

Each file has:

- `skill.name` and `skill.codes` copied exactly from `docs/curriculum/skill-list.md`.
- `why`: one sentence on why the Skill matters to a reader or writer. `how`: one or two sentences on how to do it.
- `teach`: a crew member (`content/crew.json` ids), an I do (a worked example told by that crew member in 3 to 5 short lines), and two We do tasks with a `hint`. Write the Teach sequence in plain Band 1 to 2 language.
- `creature`: an original Creature for this Skill. Base it loosely on Australian wildlife or landscape, never on First Nations cultural beings. Give it a two- or three-syllable invented name and an evolved name, both new words not used by any existing game or brand, and a blurb of one or two sentences that ties it to the Skill.
- `encounters`: exactly 6 per Band, Bands 1 to 4, 24 in all. Ids are `<skill>-b<band>-<n>`.

## Bands

Bands change the text, never the Skill.

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
3. **The success line teaches.** It says why the answer is right, in one or two short sentences.
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
14. **Students tap, never drag.** Prompts say "Match each...", "Put..." or "Tap...", never "Drag".

## Check your work

Run both commands. Both must be clean before you finish.

```
npx vitest run tests/content.test.ts
npm run -s content:report -- <skill id prefix, e.g. 5.6>
```

## Fences

Write only your assigned `content/skills/<id>.json` files. Never edit anything in `src/`, `tests/`, `docs/`, `content/branches.json`, `content/crew.json` or another writer's skill files. If a rule seems wrong, say so in your report instead of working around it.
