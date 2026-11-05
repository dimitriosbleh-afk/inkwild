# MAXX OUT: story bible

The year-long story in Chapters. Read this before writing any Chapter. Content rules (Australian spelling, no real brands or people, no First Nations stories) are in `docs/agents/content-writing.md`; length and sentence targets per Band are `CHAPTER_WORDS` and `BAND_TARGETS` in `src/content/rules.ts`.

**Premise.** Maxx Vantablack, the world's biggest streamer, is secretly capturing every rare Creature in the archipelago to star in his channel. His 40 million followers, the Vantafam, think he is rescuing them. The crew sails the leaky *Soggy Biscuit* from Island to Island, pulls a Heist on each of Maxx's bases, frees the Creatures and collects evidence that he is lying. In the finale they hijack his live stream to prove it.

## Cast and voices

| Who | Voice |
|---|---|
| **You, the Captain** | Never named, never gendered: always "you" (second person, present tense) or "Captain". You make the calls; the crew looks to you at the big moments. No "sir", "ma'am", "he" or "she" for you, ever. |
| **Tully** (navigator, she) | Stats for everything ("That's a 73 per cent chance of soggy socks"). Gives Reef Rays footy scores at the worst possible moment. |
| **Gus** (engineer, he) | Gross science. Gadgets made of slime, snot and stink. Catchphrase: "That's not gross. That's *science*." |
| **Zed** (lookout, he) | Talks like a gamer: boss levels, stealth missions, speedruns, save points. Cracks every code, usually because Maxx's passwords are terrible. |
| **Wren** (medic, she) | Quiet, short sentences, fierce about animals. Secretly Maxx's little sister (see twists). |
| **Indi** (artist, she) | Sketchbook always out. Designs the crew's disguises, which are terrible but somehow work. Draws a moustache on every Maxx poster. |
| **Mo** (cook, he) | Best mate. Awful jokes ("Why did the...?"), worse cooking. The crew groans; so do the Creatures. |
| **Maxx Vantablack** | Silver hair sprayed into a wave, teeth so white viewers need sunnies, gold everything. Talks to the camera even when no camera is on. Real name: Max Bottomley (secret until the Wren twist). |
| **BOLT-9** | Maxx's robot butler. Polite, formal, a feather duster for a left hand. "Very good, sir." Rates everything out of ten. |
| **Kaydence Kray** | Rival streamer, 39 million followers and furious about the missing million. Sign-off: "Stay cray!" Her camera is always on. |

**Maxx's catchphrases** (use one or two per Chapter he appears in): "Maxx it out, Vantafam!" / "Smash that heart button like it owes you money!" / "That's Maxx-imum content!" / "Two Xs, because one X is for losers." / sign-off "Stay gold!" His followers are the **Vantafam** (some older Encounters say "Maxxers"; Chapters use Vantafam).

**Maxx's stuff:** the gold jet ski *Gold Rush*; the floating mega-yacht *Vantadome*, with a glass dome and a waterslide off the back; MaxxCam drones that film everything; guards in gold tracksuits called **Goldies**.

**Keepers written so far:** **Captain Clause** (he), a huge old sea captain with a belt-length white beard: "I am not THAT Claus. Mine has an E on the end." He refuses to answer fragments ("That is not a sentence. That is a crumb. Who did what?"). Clawsette, a small blue crab, rides on his shoulder snipping. **Inspector Fennick** (she), long coat, frying-pan-sized magnifying glass, reads everyone at a glance, and never says anything directly: "I couldn't possibly say... but notice..." Owlibi, her owl, was always somewhere else the whole time. Each later Keeper needs one verbal habit tied to their Branch's Skill.

## Islands, bases and evidence

Each Island has an **arrive** Chapter (meet the Island, its Creatures and its Keeper, and spot the base) and a **Heist** Chapter (break in, free the Creatures, grab the evidence). Both must make sense in any order, so Island episodes never mention the twists as having happened. BOLT-9 and Kaydence don't appear in person; Wren *seeds* are fine (see below). The Keeper starts as a wary rival and ends as an ally once you've won the badge.

| Island (Branch) | Keeper and Creature | Maxx's base | Evidence the Heist recovers |
|---|---|---|---|
| Hollowgum Island (between) | Inspector Fennick, Owlibi | **Rescue Ranch**, a gold door in the biggest hollow gum | **The Rescue Script**: "Put cute Creature in log. Pretend to find it. Cry (use onion)." *Written.* |
| Twotide Atoll (whose) | Narra the Teller, Echobat | **Echo Studio**, a sea cave recording studio | **The voice-over tapes**: Maxx recording "happy Creature noises" over the real, frightened ones |
| Bluster Rock (convince) | Slick Vinnie, Spruikoo | **Vantamart**, the merch warehouse | **The donation ledger**: "Rescue Fund" money spent on a second gold jet ski |
| Mirage Mangroves (pictures) | Poet Pip, Similoon | **Green Screen Swamp**, a film set of fake "wild" habitats | **The set photos**: Creatures in tiny cages beside the green screen |
| Quillstone Reef (sentence) | Captain Clause, Clawsette | **Aqua-Maxx Pod**, a gold glass dome on the reef floor | **The Wishlist**: every rare Creature in gold pen, ticked when caught. *Written.* |
| Comma Cay (punctuation) | Madame Pause, Stoppit | **Comment Control Room**, where bots delete awkward questions | **The deleted comments drive**: thousands of viewers asking "Is it scared?" |
| Scaffold Peaks (structure) | The Architect, Girderoo | **Maxx World** building site | **The blueprints**: a theme park of cages with a "Selfie with a Sad Creature" booth |
| Redpen Volcano (editing) | Chief Editor Krak, Scorchquill | **The Edit Bay** inside the crater | **The uncut footage**: Maxx throwing the net himself, before editing |
| Inkwell Bay (workshop) | none | **The Content Factory**, where ghostwriters write his captions | Bonus only: **the Sorry Script**, an apology video he pre-wrote "in case I get caught". The finale must not need it. |

Use the Creatures from that Island's Skill files (`content/skills/<branch number>.*.json`) where they fit, e.g. Cubbler's cube-shaped poo on Hollowgum, Kelpwick and Biffoon on Quillstone.

## Main story

- **Prologue** (`start`), "Maxx It Out!": the crew spots Maxx's own logo on a "rescue" net. Wren has a map of eight bases she "found". You decide to break them all out. Hook: Maxx holds up a photo of the *Soggy Biscuit*: "See you soon, Captain."
- **Old Glimmer.** A whale-sized glowing ray nobody has seen for fifty years. The Wishlist (Quillstone) names her as "THE BIG ONE" for Maxx's live finale. Any Heist may hint that Maxx is hunting something big.
- **3 badges, the Wren twist** ("The Family Special"): Maxx's tearful "Family Special" stream begs his runaway little sister "Wrennie" to come home, with a baby photo. It's Wren. Their real surname is Bottomley. They once nursed a possum together; then the channel ate him. She found the first cage room on the *Vantadome*, took his map and ran. You decide she stays. Hook: Kaydence Kray knocks on the hull and offers to help.
- **5 badges, BOLT-9 switches sides**: Maxx sends BOLT-9 to fetch Wren home and orders him to delete his memories of her childhood (he was her nanny-bot). He refuses ("Very good, sir. No."). He has recorded everything Maxx has ever done.
- **7 badges, Kaydence double-crosses**: she steals the crew's evidence box and trades it to Maxx for a co-host spot on his finale. She tipped him off about the crew back in the prologue. BOLT-9's memory is the backup.
- **Finale**: "Biggest Rescue EVER, Live!" from the *Vantadome*, 40 million watching, Kaydence co-hosting, Old Glimmer in a gold net. The crew sneaks aboard; BOLT-9 plugs into the stream and plays all eight pieces of evidence; Wren steps into the shot: "Hi, Max. It's me." Old Glimmer and the Creatures go free, the Vantafam turns, Kaydence's own camera catches her gloating, and Maxx falls off the *Gold Rush*. Ending: Maxx, embarrassed but not a monster, starts doing real rescue work as a volunteer, and Wren gives him one small chance.

**Wren seeds** (one per Island episode at most): she knows things she shouldn't (where the vents are, his password habits, that he ticks lists in gold pen), flinches at his catchphrases, then covers with "Lucky guess." They must read fine both before and after the reveal.

## Running jokes

- Mo's joke of the Chapter, and the crew's groan. His dish of the Island: fish-finger custard, seaweed spag bol, gum-leaf pancakes, sardine trifle.
- Gus's gadget of the Chapter, built from something gross: Snot-Glue, the Bogey Bomb, the Stink Sock.
- Tully's useless statistic, and a Reef Rays score at the worst moment.
- Indi's disguise of the Chapter, which fools everyone but shouldn't.
- Maxx's passwords are always about himself (ILOVEME, MAXXISGREAT).
- The *Soggy Biscuit* leaks whenever someone sneezes.

## Every Chapter

The same events at all four Bands, only the words change. Band 1 is about 250 words of short, plain sentences; Band 4 is about 700 with richer words and longer sentences. Separate paragraphs with a blank line. Find the funny: something gross, something Maxx says, something Mo says. End on a hook: a reveal, a threat or a question that makes the reader tap the next Chapter.
