# Island 5 review: Sentence building (Skills 5.1 to 5.13)

Reviewer group: island-5. Files: `content/skills/5.1.json` to `5.13.json`. Numbers checked with `npx vite-node scripts/content-report.ts 5.` (all 13 pass the content rules, and `scripts/jargon.ts 5.` reports 0 untaught terms). Passing those checks is not the same as teaching well, and the jargon checker is part of the problem (see Problem 3).

**James's four comments, answered briefly**

- *"pull up a reminder of what a simple, a compound, and a complex sentence is"*: there is a MOVE CARD button on every Encounter screen (`src/ui/screens/activity.ts`, `openMoveCard`), but it only replays the I do beats and the WHY line. For 5.1 that means "Spot the doer and the action." and "That chunk is a clause. Just one? It's a simple sentence.", which is a script, not a definition card. Each Skill's `how` line, the nearest thing to a summary rule, is written but never shown anywhere in the app. It is only checked in `src/content/rules.ts`.
- *"Did I just guess them?"*: you could have. In 5.1, Bands 1 and 2, "spot the joining word" (and or but means compound, because or when or although means complex, no joining word means simple) gets 11 of the 12 Encounters right without knowing what a clause is. Only 5.1-b2-1 ("Dolphins and seals...") catches it out. The items that need the real idea (phrase or clause, "because of", "then", "however") start at Band 3. Mastery can be earned at whatever Band the student is on (`masteredAt` in `src/core/route.ts`), so a student can master 5.1 on keyword spotting alone.
- *"the way that this is written is so poor"*: three causes. Beats are capped at 12 words (`LIMITS.beat` in `src/content/rules.ts`), so the teaching comes out as clipped fragments ("Two doers, two actions. So two clauses.") on the island that teaches students not to write fragments. Words used as words are never marked, which gives lines like "could each be a sentence, and and joins them" (5.1 weDo 1) and "Glue two clauses with and, but or or." And the key tests are idioms: "leaves you hanging", "blurts out", "bucketing down".
- *"I still also don't think that this is the best way to be teaching it"*: agreed, in part. Most Encounters ask students to label sentences someone else wrote. The VC code itself (VC2E5LA05) asks students to understand "how writers can use this structure for effect", and the better-supported approaches have students build and combine sentences. See Problem 1.

## 1. Biggest problems

### Problem 1: The island teaches labels, not sentence building, and the I do shows a rule instead of the thinking

**The problem.** Each I do is 4 or 5 lines of rule plus one example. There is no think-aloud on a hard case, no non-example, and no check before the We do. 5.1 introduces clause, simple, compound, complex and "can't stand alone" in five beats of 12 words or fewer. Several ideas the Encounters depend on are never taught at all:
- phrase or clause (decides most Band 3 and 4 items in 5.1, 5.2 and 5.4)
- had, has and will have + verb, and was + -ing (most of 5.12 from Band 2)
- whose (5.7-b4-5)
- whereas, provided that, given that, so that (5.3 Band 4)
- commas mean "extra fact" (5.5, first met at b4-3)

The Encounters then mostly ask students to sort, tap or label. Building a sentence is rare, and most build tasks are a single choice in disguise (Problem 2). The Move card cannot work as a reminder because it is the same thin script.

**Why it matters for learning.** The student 18 months below level cannot build a concept from one example and a rule. The strong student meets the hard items with no model and has to learn from wrong-answer feedback. Students who label well often still can't use the structure in their own writing, and using it is what the code asks for.

**The evidence it rests on.**
- The worked-example effect (Sweller and colleagues): novices learn more from studying a fully worked solution, with the steps shown, than from solving problems straight away.
- Rosenshine's Principles of Instruction: give models, and check for understanding before independent practice.
- On grammar for writing: the Writing Next meta-analysis (Graham and Perin, 2007) found sentence combining helped student writing while traditional grammar teaching did not. Myhill and colleagues' Exeter study (2012) found grammar taught in the context of writing helped, more for stronger writers. I am reporting the direction of these findings, not effect sizes.

**The one move.** Rebuild every I do to one template, and make the Move card a reference card drawn from it:
1. a concrete example, with the move named
2. a think-aloud on a second example, saying the test in words ("Cover this part. Could it be a sentence by itself? No. So...")
3. a non-example that looks right, and why it isn't
4. a one-line rule (this line goes on the Move card)
5. We do 1 is a two-option check: the example or the non-example

For 5.1 the Move card should read:

> **Simple:** one clause. *The slime bubbled.*
> **Compound:** two clauses that could each be a sentence, joined by 'and', 'but', 'or' or 'so'. *The slime bubbled, and Mo ran.*
> **Complex:** a main clause plus a clause that can't stand alone. It starts with a word like 'because', 'when', 'if' or 'although'. *When I added vinegar, the slime bubbled.*
> **Test:** find each verb and who or what is doing it. Cover one part. Could it be a sentence by itself?
> **Trap:** 'because of the smell' has no verb. It's a phrase, not a clause.

This needs two small developer changes: a card field (or showing `how`) in `moveCardFor`, and a beat limit of about 20 words for steps 2 and 3. In each Band, swap one or two label tasks for combining tasks: "Make these two sentences into one, using the word that shows they clash."

### Problem 2: Spotting a signal word gets students to mastery, and many tasks can be solved from their shape

**The problem.**
- 5.1, 5.2 and 5.4 can be solved at Bands 1 and 2 by spotting the joining word.
- 5.5 is mostly "person or thing?": 13 of its 26 tasks (24 Encounters plus 2 We do) are choosing who, which or that.
- 5.12's taught strategy is "find the time clue", and almost every item plants one.
- Build tasks: the game shows how many tiles are needed, the first tile has the capital letter and the last has the full stop. That turns most builds into a 50/50 choice (5.1-b1-4, 5.1-b2-5, 5.4-b1-3, 5.10 and 5.12 builds), and 5.4-b1-5 into a free order.
- Fix tasks: the tap step is often free because the right tap is the only word of its kind (5.1-b1-5: castle, although, lives).
- Some choose tasks are solved by finding the option that ends with a named word (5.4-b1-4 "eyeball", 5.4-b3-1 "ankle").
- Feedback leaks the answer. Sort reasons name the pile ("so it's complex"), and some Second looks name the answer outright ("so use unless", "For a person, use who", "like so").

**Why it matters.** "4 of the last 5 right first try on 2 days" is a good bar only if the items need the concept. Here mastery at Band 1 or 2 can certify keyword spotting, the Creature evolves, and the misconception ("and means compound", "if it starts with after it's a dependent clause") turns up later in the student's writing.

**The evidence it rests on.** Teaching a concept means showing examples and non-examples that differ only in the feature that matters, side by side. This is a core principle of Engelmann and Carnine's Direct Instruction design. Interleaved practice that mixes look-alike categories helps students learn to tell them apart (Rohrer and colleagues; Kornell and Bjork). A set where the surface cue always works teaches the cue.

**The one move.** In every Band, including Band 1, make at least 2 of the 6 Encounters "trap" items where the signal word misleads. For example: and joining two verbs ("Mo grabbed a towel and ran"), "because of" + noun, "then" or "however" between clauses, "who" in a question, "after lunch" (a phrase), or a 5.12 item with no time word. Alongside it, have the game add the capital and full stop to build tiles, so tile shape stops giving the order away, and rewrite Second looks as questions ("Is the OK a surprise, or something that has to happen first?").

### Problem 3: Terms drift between Skills, and some don't match VC v2.0

**The problem.**
- **"Doer" and "action" stand in for subject and verb.** They break on "The lizard was tiny" (no action) and on passives: 5.1-b4-3 says "The music has been remixed" has "its own doer", but the music did nothing. The island also uses "action word", "verb" and "proper verb" (5.2-b3-4, 5.13-b4-5). "Proper verb" (a verb that shows time: raced, not racing) decides answers but is never defined. VC v2.0 describes a clause as usually containing a subject and a verb. I believe that is at Level 3, but I haven't got the Level 3 text in the repo, so please check the code.
- **"Joining word" is never tied to "conjunction".** That is the word Victorian teachers use from the early years. `src/content/jargon.ts` lists "conjunction" as an untaught term, so the content has avoided it rather than taught it. Meanwhile "linking word" (5.2-b4-3, and 7.8) names a different class. "Joining word" and "linking word" are near-identical in plain English.
- **"Main clause" is never linked to "independent clause"**, the term VC2E5LA05 and VC2E6LA09 both use.
- **5.11 calls every when, where, how or why chunk an "adverb group".** That includes prepositional phrases ("on the canteen wall"), noun groups ("every Tuesday night", "last week") and whole dependent clauses ("because its sensors were dusty", "as soon as the alarm beeps"). 5.2 taught those last two as dependent clauses. As I understand the Australian Curriculum glossary, an adverb group is built around an adverb ("very carefully", "slowly and patiently"), and the umbrella term is adverbial. The VC v2.0 Level 4 achievement standard says "adverbial phrases". Please check the VC v2.0 glossary before changing this.
- **5.5 and 5.7 teach the same structure ("the wombat that dug") under two names**, and neither says so. 5.5 also uses "embedded clause" for comma clauses (see the 5.5 notes; I'm flagging that, not ruling on it).
- **Labels change mid-Skill.** 5.3 calls although a "surprise" and because a "reason" for five Bands, then switches to "contrast" and "cause" in b4-6. 5.12 names "past perfect" once, in a success line (b4-6).

**Why it matters.** Students carry these words into class, NAPLAN feedback and their teacher's marking. Two names for one idea, or one name for two ideas, adds load that has nothing to do with the grammar (cognitive load theory's extraneous load). An adult as careful as James couldn't hold the terms together, and a 10 year old EAL learner will do worse.

**The one move.** Write one island term sheet and use it word for word in every beat, reason and Move card. Give the plain gloss first and the VC term once in brackets:

| plain gloss | VC term (check against the VC v2.0 glossary) |
|---|---|
| who or what the clause is about | subject |
| a verb that shows time (raced, races) | verb (finite verb, teacher notes only) |
| a joining word inside a sentence | conjunction |
| a linking word between sentences | connective, text connective |
| the part that can stand alone | main clause (independent clause) |
| the part that can't stand alone | dependent clause |
| a group of words with no verb | phrase |
| a when, where, how or why chunk | adverbial (adverb group only when built on an adverb) |
| a clause tucked in after a noun | embedded clause or relative clause (decide once) |

## 2. Skill notes

### 5.1 Simple, compound or complex?

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | teaching | Five clipped beats introduce clause, simple, compound, complex and "stand alone" with one example each and no non-example. Phrase vs clause, which decides most Band 3 and 4 items, is never taught. | Beats: "A clause has a subject and a verb: **The slime** **bubbled**." / "One clause by itself is a simple sentence." / "Two clauses that could each be a sentence, joined by 'and', 'but', 'or' or 'so': compound." show "The slime bubbled, **and** Mo ran." / "A clause starting with 'when', 'because' or 'if' can't stand alone. Add one to a main clause: complex." / "Careful: 'because of the smell' has no verb. It's a phrase." show "**Because of the smell**, Mo ran. (simple)" |
| skill | major | teaching | `how` says "Count clauses", but compound and complex both have two, so counting can't tell them apart. Students never see `how` anyway. | `how`: "One clause: simple. Two equal clauses: compound. A clause that can't stand alone: complex." Show it on the Move card with the card text in Problem 1. |
| 5.1-b1-6, 5.1-b2-3 | major | task | 11 of 12 Band 1 and 2 Encounters fall to joining-word spotting; only 5.1-b2-1 traps it. | b1-6 becomes: text "Mo grabbed a towel and ran for the door." answer simple; compound reason: "Look at 'ran for the door'. Who ran? It shares Mo with the first part, so it isn't a clause of its own." In b2-3 change the complex option to "Because of the cheesy joke, Gus groaned." with reason "'Because of the cheesy joke' has no verb. This one is simple." |
| weDo 1 | minor | language | "could each be a sentence, and and joins them" is unreadable. Words used as words are unmarked throughout the island. | "...could each be a sentence, and the word 'and' joins them." Put quote marks round every word used as a word in all 13 files. |
| 5.1-b4-3 | minor | accuracy | Reason says "The music has been remixed" has "its own doer". It is passive: the music didn't do anything. | "Two equal clauses, each with its own subject and verb, joined by 'and'." |
| 5.1-b4-2 | minor | language | Distractor "simple: since is about time, so it starts a phrase" is hard to parse, and nobody believes it. | "simple: there is only one verb" with reason "There are two verbs, collapsed and has been. 'Since the bridge collapsed' is a clause of its own." |

### 5.2 Main clause and dependent clause

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | language | The whole test hangs on the idiom "leaves you hanging", and "Say it alone. Does it work?" fails on questions. "When the joey sneezed?" works alone as a question. | Beat 4: "Say it as a statement. Is it finished? 'When the joey sneezed.' No. You want to ask: then what?" Beat 5: "Words like 'when', 'because', 'if', 'although' and 'until' make a clause that can't stand alone. That's a dependent clause." |
| skill | major | curriculum | "Main clause" is never linked to "independent clause", the term in VC2E5LA05 and VC2E6LA09. Also, this Skill sits after 5.1, which already relied on the idea without naming it. | Beat 3: "It stands on its own. That's the main clause (some books say independent clause)." Put 5.2 before 5.1 in the unlock order. |
| 5.2-b1-6, b2-5, b3-5, b4-5 | minor | task | All four fix tasks share one shape: the wrong word is the first word, and the answer is the only option that isn't a "hanging" word (Finally, Then, Every night, By noon). After one, the pattern is free. | Add a non-hanging distractor that's wrong for meaning, so students must read the result. b3-5: add "Never" (reason: "'Never Mo tells a joke at dinner' doesn't make sense."). b4-5: add "Meanwhile" (reason: "Meanwhile needs an earlier event to point back to, and this is the first line of the log."). |
| 5.2-b4-1 | minor | task | The "which" part is judged by "As a statement it leaves you hanging", which is abstract, and "which" clauses aren't taught until 5.5. | Replace the fourth part with "because there was no other way." and reason "'Because there was no other way' gives a reason, but it can't stand alone." |
| 5.2-b4-6 | minor | teaching | A good stretch item, but the main clause is split around the "who" part and nobody says so. | Success: "'The lighthouse keeper ... locked every door twice' is the main clause. The who part sits inside it, and the whenever part hangs off the front." |

### 5.3 The joining word that gives the right meaning

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | teaching | Beat 4 crams until and unless into one line. They sound alike and are the pair students mix up most. "Unless" is never glossed ("if not"), and the example "No footy unless the rain stops" has no verb in its main part. | Two beats: "'Until' is about time: up to that moment." show "We train **until** dark." / "'Unless' means 'if not'. Swap it to check." show "We play **unless** it rains. = We play **if** it does **not** rain." |
| 5.3-b4-1 to b4-6 | major | teaching | Band 4 depends on whereas, provided that, given that and so that, which are never taught. Students meet them only through wrong-answer feedback. | Add a Move card list: "Reason: because, since, given that. Surprise: although, even though. Time: until, after, when. Condition: unless, if, provided that, as long as. Two different things side by side: whereas." Add one weDo on provided that. |
| 5.3-b4-6 | major | teaching | Bins switch to "contrast / condition / cause" and put "even though" with "whereas", after five Bands calling even though a "surprise" and because a "reason". | Bins: "a surprise / a condition / a reason". Swap the whereas item for "although the sun was out" (a surprise). |
| weDo 2, 5.3-b1-3, 5.3-b2-1, 5.3-b2-4 | minor | feedback | Second looks give the answer: "so use unless", "so you need unless", "so you need the surprise word". | b1-3 although: "Although would mean no feeding even after the keeper says OK. Is the OK a surprise, or something that has to happen first?" |
| 5.3-b3-6 | minor | accuracy | "it was the best thing at the fair": "it" has no clear noun to point back to, and the success line says Indi "won", which the sentence never says. | Sentence: "Because Indi had never painted a mural before, hers was the best thing at the fair." Success: "Although. Never having painted a mural should make it harder, so being the best is a surprise." |

### 5.4 Lead with the dependent clause for effect

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | teaching | Teaches one effect (suspense) as if it were the rule: WHY says "Save the big moment for last!" Both orders are correct, and b2-1 and b4-1 rely on a different reason (situation before instruction) that the I do never gives. | Add a beat: "Both orders are correct. Choose what the reader meets first: the setting, the reason or the condition." WHY: "Clause order picks what the reader meets first. Choose it on purpose." |
| 5.4-b1-4, 5.4-b3-1 | major | task | Both can be solved by finding the option that ends with 'eyeball' or 'ankle'. No clause knowledge needed. | b1-4: replace the one-clause distractor with "We stared as the hatch creaked open on a giant eyeball." (main clause first, still ends with eyeball). Prompt: "Which version leads with the dependent clause, so you wait for the eyeball?" Do the same for b3-1. |
| 5.4-b4-4 | major | task | It tests the capital letter (Under or under), not clause order, and "until every diver is back on board, under no circumstances should the boat leave" muddles the logic. | Tiles: "Until every diver is back on board," / "the boat must stay" / "and the boat must stay" / "at the reef." Accept "Until every diver is back on board, the boat must stay at the reef." Reason: "The until clause already joins the ideas. No 'and' after the comma." |
| 5.4-b1-3, 5.4-b1-5 | minor | task | The capital on "While" and "When" and the full stop on the last tile give the order away. | Have the game add the capital and full stop after CHECK (see Problem 2), or add a lower-case distractor tile "and the smoke alarm". |
| skill | minor | range | Band 4 is still "which version leads with it". The real stretch, linked to VC2E5LA04, is choosing the order that fits the sentence before. | New Band 4 choose: text "The storm raged all night." prompt "Which sentence should come next, so the paragraph flows?" answer "When it finally passed, we found the trampoline in the pool." distractor "We found the trampoline in the pool when the storm finally passed." Success: "Leading with 'when it finally passed' picks up the storm from the sentence before." |

### 5.5 Embedded clauses: who, which, that

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | accuracy | "Embedded clause" is used for both no-comma clauses ("The mural that Indi painted") and comma clauses ("The bus, which was late"). In the functional grammar used in many Australian schools, only the first kind is strictly embedded in the noun group; the comma kind is a non-defining relative clause. Plenty of classroom resources use "embedded" loosely, so I am flagging this, not ruling on it. Check the VC v2.0 glossary and VC2E6LA05 elaborations. | If the glossary is strict, keep "embedded clause" for no-comma clauses and call the comma kind "extra information between commas" (which 6.5 already teaches). Either way, teach the difference in the I do, not first at b4-3. |
| teach | major | teaching | Beat 2 "Take it out. The sentence still works" is the test for comma clauses, but the example is a no-comma clause whose job (beat 3) is to say which mural. The which-one or extra-fact difference, which decides comma or no comma, first appears at b4-3. | Beat 2: "Take it out. Now you don't know which mural." show "The mural has a secret door. (Which one?)" Add beat: "Commas round it? Then it's an extra fact. You already know which one." show "Indi's mural, **which took a week**, has a secret door." |
| skill | major | range | 13 of 26 tasks are choosing who, which or that, so Band 4 is no harder in the Skill itself than Band 1. The code's purpose, to "elaborate, extend and explain ideas", is tested only by b4-2 and b4-6. | Replace 5.5-b3-6 and 5.5-b4-5 with combining tasks. Text "The bridge collapsed. It had been built in a hurry." Prompt "Make one sentence where the tucked-in part hints at why it fell." Tiles "The bridge," / "which had been built in a hurry," / "that had been built in a hurry," / "collapsed in the first storm." |
| 5.5-b4-3 | minor | accuracy | "Biscuit, which is the smallest penguin": many style guides use who for a named animal. It's not wrong, but it clashes with the island rule "which: animals". I'm unsure which way the school goes. | "Biscuit, who is the smallest penguin," and add to the Move card: "Pets and named animals can take who." |
| weDo 2, 5.5-b2-5, 5.5-b3-6 | minor | feedback | Second looks name the answer: "For a person, use who.", "so use who", "use which". | weDo 2 "what": "'What' doesn't start this kind of clause. Is your neighbour a person or a thing?" |
| skill | minor | teaching | 5.5 and 5.7 teach the same structure under two names, and neither says so. | 5.7 beat 4: "This one has a verb, dug, so it's a clause. It's the same tucked-in clause the Tuckbill showed you." |

### 5.6 Expand a noun group

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| skill | major | teaching | Nothing warns against piling up describers, and the creature blurb ("piles shiny words in front of a plain noun until everyone stops to look") rewards the most common Grade 5 noun-group fault. | Blurb: "...picks the one or two shiny words that make a plain noun stand out." New beat: "Two sharp words beat five blurry ones." show "a **snarling guard** dog, not a big scary huge dog". |
| 5.6-b1-5, b2-5, b3-5, b4-5 | major | task | All four fix tasks test whether a word clashes with the context (tiny or huge, swimming or netball). That is word meaning (5.8), not expanding a noun group. | Rewrite all four in the style of 5.6-b4-6: give a short situation and ask "Which noun group tells the reader exactly which one?", where each wrong option leaves out a needed part (how many, whose, what kind). |
| teach | minor | curriculum | Plain glosses only. Many Victorian schools use functional grammar labels for the parts (pointer, number, describer, classifier, thing). Naming them once helps students carry the idea into class. Check which labels the school uses. | Move card: "Which one or how many (pointer, number), what it's like (describer), what kind (classifier), then the main noun." |
| teach | minor | accuracy | Beat 5 "Car stays at the end" is only true for words in front; 5.7 then adds detail after the noun. | "The whole lot is a noun group. Car is still the main noun." |
| 5.6-b4-6 | minor | engagement | Keep this item. It is the real purpose of the Skill (pick the noun group that picks out Biscuit and no other dog). Make it the model for the others. | Add a Band 3 version with two dogs, so weaker readers meet the idea earlier. |

### 5.7 Add detail after the noun

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | accuracy | Beat 3 says a phrase has "no action word". Elsewhere the island says "verb", "doer and verb" and "proper verb". Prepositional phrase, the term VC2E5LA09 uses, is never named. | Beat 3: "'With the sore paw' has no verb. It's a phrase. It starts with 'with', so it's a prepositional phrase." |
| 5.7-b4-5 | major | teaching | "Whose" is tested here, and as a distractor in 5.5, but never taught. | Add an I do beat: "'Whose' hooks on something the noun owns." show "the diver **whose** tank was empty". Or move this item to 5.5 Band 4 after that beat. |
| 5.7-b4-6 | minor | language | The right answer, "For sale from a careful inventor: a robot dog that only barks at cats", is awkward, and one distractor hinges on subject-verb agreement (bark or barks), a different skill. | Answer: "For sale: a robot dog that only barks at cats, from a careful inventor." Replace the remote-control distractor with "For sale: a robot dog from a careful inventor that only barks at cats." Reason: "Now the clause sits after 'inventor', so it sounds like the inventor barks." |
| 5.7-b3-5 | minor | language | "'The boss what breathes fire' isn't how careful writers hook on a clause" suggests people who speak that way are careless. | "Some people say 'the boss what breathes fire', but in writing we use 'that' or 'who'." |
| 5.7-b1-1 | minor | task | "Quickly" and "yesterday" don't make sense after the noun, so the answer is the only phrase on offer. | Options: "with the floppy ears" / "at full speed" / "in the morning". Reasons: "At full speed tells you how something moves, not which puppy." and "In the morning tells you when, not which puppy." |

### 5.8 Precise word for a vague one

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | minor | teaching | The best I do on the island: it rejects "chilled" and "spicy" with reasons. But "steaming" swaps "nice" (how good it was) for a temperature, so it changes the meaning rather than sharpening it. | Beat 4: "Warming fits every clue. That's the precise word!" show "The soup was **warming**." |
| 5.8-b4-3 | major | task | "Hurt" to "wounded" adds no precision. The sentence already says "with a deep cut", so the "precise" version is just a synonym. | Text: "The vet said the wombat had a bad cut on its back leg. It was long and deep and needed twelve stitches." Prompt "Which word could replace 'bad cut'?" Options "gash" / "scratch" / "bruise" / "sprain". |
| 5.8-b1-1 | minor | task | The answer "half-frozen" is clumsy, and the clue says the middle was frozen solid. A cook would say "undercooked". | Options "undercooked" / "burnt" / "soggy". Success: "Undercooked. A frozen middle means it wasn't cooked for long enough." |
| 5.8-b4-4 | minor | accuracy | "A dozen" is offered as the exact truth when the counter showed "exactly twelve". "Twelve" is more precise. | Answer "twelve", distractors unchanged. Success: "Twelve. The counter showed exactly twelve, so say exactly twelve." |
| skill | minor | range | Every task plants the clue in the text, so Band 4 is mostly harder words (placid, mountainous), not a harder move. | Band 4 tapText with no planted clue: a three-sentence recount with two vague words, prompt "Which vague word hides the thing the reader most needs to know?" |

### 5.9 Specialist and technical words in context

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| 5.9-b1-3, 5.9-b2-3, 5.9-b1-4 | major | task | These test knowledge, not working a word out from context. b1-3 sorts handball, ruck and behind with no sentence at all. A newly arrived EAL student, or anyone who doesn't follow AFL, can't get there. | Give every item a context: "The ruck jumped high to tap the ball at the centre bounce." / "The band slowed the tempo for the sad song." Then sort the sentences. Swap one of the four footy items for soccer, cricket or basketball. |
| skill | minor | curriculum | WHY says use technical words "to sound like an expert". VC2E5LA08's point is precision: the reader knows exactly what you mean. | WHY: "Each subject has exact words. Use them so readers know exactly what you mean." |
| teach | minor | accuracy | "Water evaporates when you heat it" suggests it only evaporates when heated. Puddles evaporate on a cool day too. | Show "Puddles **evaporate** on a sunny day." Beat 2 show "The water **turns from a liquid into a gas** called water vapour." |
| 5.9-b3-4, 5.9-b4-4 | minor | curriculum | The scale and pitch sorts are about multiple-meaning words: worth doing, but closer to 1.5 than to specialist terms. Two in one Skill is one too many. | Keep pitch (it has the specialist music and sport senses) and replace scale with a fix task on a specialist word used wrongly in a report. |
| 5.9-b4-6 | minor | engagement | Keep. Maxx confusing extinct with endangered is funny, and it puts the student in the expert's seat. | None. |

### 5.10 Strong verbs

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| 5.10-b4-2 | blocker | accuracy | "Without gravity to pull it down" and "Without gravity, nothing falls" are wrong science. There is plenty of gravity at the space station; things float because the station and everything in it are falling around Earth together. It's a misconception science teachers work to undo. | Text: "On the space station, where everything floats, the spilled orange juice ___ across the cabin in wobbling, shining blobs." Dripped reason: "Dripping is falling in drops. On the space station, nothing drips down." Success: "Floated. On the space station, the juice drifts along in blobs instead of falling." |
| skill | major | teaching | Same move as 5.8 (and 4.9): read the clue, pick the word. Nothing teaches that a plain verb is sometimes the right one, so students learn that fancy means strong. | New beat: "Strong doesn't mean fancy. It means the verb that fits." New Band 3 choose: "Mia ___ to the shop for milk. She was in no hurry." options walked / sprinted / charged / stormed. Success: "Walked. Nothing here is fast or dramatic, so a plain verb tells the truth." |
| 5.10-b3-4 | minor | teaching | Sorting snapped, fumed, stammered, boasted and bragged as speech verbs nudges the "said is dead" habit. Good writers use said most of the time. | Success: "The verb does the work. Use one like this when the feeling matters. Most of the time, said is fine." |
| 5.10-b1-3 | minor | task | Tap step is free: "went" is the only verb you can tap (ball, high, goalposts). | Parts: "Tully [kicked] the ball. It [went] [high] over the [goalposts]." with kicked reason "Kicked is already strong. Look for the verb that's flat." |

### 5.11 Adverb groups: how, when, where, why

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| skill | blocker | accuracy | Every when, where, how or why chunk is called an "adverb group": prepositional phrases ("on the canteen wall"), noun groups ("every Tuesday night", "last week") and whole dependent clauses ("because its sensors were dusty", "as soon as the alarm beeps"), which 5.2 taught as dependent clauses. As I understand the Australian Curriculum glossary, an adverb group is built around an adverb, and the umbrella term is adverbial (the VC v2.0 Level 4 standard says "adverbial phrases"). Please check the VC v2.0 glossary. | Rename to "Adverbials: how, when, where, why". Beat 4: "These are adverbials. Some are one word (quickly). Some are phrases (on the wall). Some are whole clauses (because it rained)." Keep "adverb group" for the "very carefully" kind. |
| teach | major | teaching | No misconception is dealt with. The common one is taking a phrase about a noun ("the girl in the red cap") for a where. 5.7-b4-4 tests this; 5.11 doesn't. | New beat: "Careful: in 'The dog under the table barked', 'under the table' tells you which dog. It belongs to the noun." Add a Band 3 sort with piles "about the action / about a noun". |
| weDo 2 | minor | feedback | The hint "Look for the word 'because'" hands over the answer and trains keyword spotting. Later why items ("to save power", "so that", "in the hope of") have no because. | Hint: "Why is about a reason. Which part answers 'Why did Gus do it?'" |
| 5.11-b1-4, b2-4, b3-4, b4-4 | minor | curriculum | VC2E6LA06 is about choosing adverbials to "expand and sharpen ideas". The "Mum asked where" fix tasks (b1-3, b2-3, b3-3, b4-3) do that well; the classify-only sorts don't. | Replace two of the four sorts with more "answers the wrong question" fix tasks, for example "The coach asked when. Tap the part that answers the wrong question." |

### 5.12 Tense that tells the reader when

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | teaching | The I do teaches simple past, "am feeding" and will. From Band 2 the Encounters test had grown, has flown, have won, had bandaged, have studied, will have cleaned and was juggling. "Past perfect" is named once, in a success line (b4-6). These elaborated tenses are the actual content of VC2E6LA06. | Three new beats: "Had + verb: done before another past moment." show "When the vet **arrived**, Wren **had** already **bandaged** the leg." / "Has or have + verb: started in the past and still true now." show "Scientists **have studied** slime for 200 years." / "Was or were + -ing: still going when something else happened." show "Mo **was juggling** when Dad **walked** in." Make weDo 2 a had + verb item. |
| 5.12-b2-3 | major | accuracy | Reason: "Repair is the present, for things that happen now or regularly." That contradicts the I do (right now = am feeding). The plain present is for habits and facts, and the difference between "haunt" (b2-5, these days) and "is growing" (b2-1, right now) is never taught. | Reason: "Repair is the present, for things that happen regularly. 'Two hours ago' is finished time." New beat: "Habits and facts use the plain present." show "Flying foxes **sleep** by day." |
| skill | major | teaching | The taught strategy is "find the time clue", and almost every item plants one. In students' own writing there usually isn't a "yesterday", and nothing trains keeping the tense steady across sentences. | Two Band 3 and 4 items with no time word. Text "Mo opened the oven. Smoke poured out. He ___ the fire blanket." options grabs / grabbed / will grab / is grabbing. Success: "Grabbed. The story is already in the past, so it stays in the past." |
| 5.12-b4-4 | minor | task | The order can be solved from "During the night", "Right now" and "Tomorrow" without reading the verbs, though the frame says "The verbs will tell you". | Remove the time words: "A fox had raided the henhouse." / "Wren found three frightened chickens." / "She is patching the fence." / "She will fix the gate." |
| 5.12-b4-3 | minor | accuracy | With "before", plain "practised" is also correct, because "before" already shows the order. It isn't offered, so the item works, but the success line implies "had" is required. | Success: "Had practised makes the order extra clear: the practising was finished before she walked on." |

### 5.13 Run-ons and fragments

| where | severity | kind | problem | fix |
|---|---|---|---|---|
| teach | major | accuracy | Beat 1 defines a sentence as "one whole thought". Beat 4 then joins two thoughts into one sentence. Students can't use a definition the next beat breaks. | Beat 1: "A sentence needs at least one main clause: who or what, plus a verb, and it makes sense alone." Beat 2: "Two main clauses with nothing between them make a run-on." |
| skill | major | curriculum | 5.13 is the Level 4 foundation (what counts as a sentence) but unlocks last, after twelve Skills that assume it. The weakest readers need it first. | Move 5.13 to the front of the island, then 5.2, then 5.1. |
| 5.13-b1-5, 5.13-b4-5 | minor | teaching | The key idea, that "hiding" or "diving" can't be the verb by itself, appears only in the reasons. | New beat: "An -ing word can't be the verb by itself. It needs was or were." show "A crab **was hiding** under the jetty." |
| 5.13-b2-5, 5.13-b3-6 | minor | teaching | "Then a creak from the stairs." and "Except the principal..." are fragments real authors use on purpose in stories. Calling them simply wrong will puzzle strong readers who see them in novels. | Final beat: "Authors sometimes use a fragment on purpose. In reports and answers, write whole sentences." b2-5 frame: "Zed's teacher wants whole sentences in his ghost story." |
| weDo 2 | minor | feedback | The Second look gives the fix: "Use a full stop, or a joining word like so." | "A comma alone can't hold two complete thoughts together. What else could go with the comma?" |

## 3. What's good

- The world carries it. Mo's frozen pies, Gus's snot samples, and Maxx being wrong on his stream (5.1-b2-2, 5.9-b4-6, 5.13-b4-6) put the student in the expert's seat. The jokes are kind and land at the right age. Every wrong option has its own reason, so the Second look machinery is ready for better wording.
- Some tasks are genuine writing decisions, and are the model for the rest: the "Although ... but" fix in 5.4 (b2-4, b3-5, b4-5, a very common EAL error), the misplaced clause items (5.5-b4-6, 5.7-b3-6, 5.7-b4-6), picking out Biscuit with a noun group (5.6-b4-6), "Mum asked where" (5.11 fix tasks), and "read the whole sentence first" (5.3-b4-4).
- The 5.8 and 5.10 I dos show the thinking: rejecting "chilled" and "spicy" with reasons, and "Now I don't even need 'as fast as he could'." Every other I do should be written like these.
