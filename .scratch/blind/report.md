# Blind solve report

2045 Encounters checked, 449 flagged for rewrite.

| Encounter | Flag | Detail |
|---|---|---|
| 1.6-b1-4 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"Snot does a useful job in your body.":"main idea","Snot traps dust and germs before they reach your lungs.":"detail that backs it up","Snot stops your nose from drying out.":"detail that backs it up","Some snails make slime like snot.":"fun extra","You swallow most of your snot.":"fun extra"} / also: 'You swallow most of your snot' as a detail that backs it up (it is a fact about snot, though not about usefulness). |
| 5.8-b4-5 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"The applause was loud, like a storm rolling in.":"thunderous","The kettle's whistle was loud: a thin, high scream.":"shrill","The radio next door was loud, and it stayed on all arvo.":"blaring","A car horn outside was loud, and it would not stop.":"blaring","The drums were loud and deep, and they shook the floor.":"thunderous"} / also: car horn could be shrill; radio blaring vs applause thunderous is subtle / 2/1/2 split across bins |
| 6.3-b3-5 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"Inside Mo's lunchbox, a sandwich had grown fur.":"punctuated right","Inside Mo's, lunchbox a sandwich had grown fur.":"comma inside the opening phrase","Under Mo's bed sheets and socks lay in a heap.":"comma missing","Under the couch cushions Zed, found six chips.":"comma after the doer","Inside Mo's lunchbox a sandwich, had grown fur.":"comma after the doer","Behind the school bins, Indi found Mo's left sock.":"punctuated right","Under the couch cushions, Zed found six chips.":"punctuated right"} / also: The three wrong-comma items also lack the comma after the opening phrase, so 'comma missing' could be argued for 'Under the couch cushions Zed, found', 'Inside Mo's lunchbox a sandwich, had' and 'Inside Mo's, lunchbox a sandwich'; the more specific bin (wrong comma) is the intended answer. / Bins overlap: each misplaced-comma item is also missing the correct comma. |
| 7.10-b3-3 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"the dumplings → the things":"keeps the chain","She says → They say":"breaks the chain","Mrs Tran's dumplings → someone's food":"breaks the chain","a tiny café → a tiny shop":"keeps the chain","Mrs Tran → the cook":"keeps the chain"} / also: 'the dumplings → the things' could be argued as breaking the chain because 'the things' is vague / 'the things' still points back to the dumplings |
| 7.12-b1-1 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said "Could the council please buy new goalposts for the snow oval?" / also: 'Can you buy us some new goalposts, please?' is polite and addressed to the mayor; it is less formal but a student could defend it. The first is the more formal register. / Also, the first addresses 'the council' though the letter is to the mayor. |
| 7.12-b3-4 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"Thank you for your help.":"email to the support team","I'm never touching that tablet again. Ever.":"message in the crew chat","Can someone come round after tea and cheer me up?":"message in the crew chat","Could you please tell me whether the file can be recovered?":"email to the support team","Guess who just lost forty hours of Peak Panic.":"message in the crew chat","I am writing because my saved game has disappeared.":"email to the support team","My account name is ZedPlays, and I play on a tablet.":"email to the support team"} / also: 'My account name is ZedPlays, and I play on a tablet.' is neutral enough to sit in the chat, though the crew already knows it; it is only really needed by support. / The account-name line is the one item with no register marker; it is decided by who needs the information. |
| 8.5-b1-1 | DISAGREES, SECOND ANSWER, CONFIDENCE medium | solver said {"spot":"good","replacement":"fizzy"} / also: Spot 'cold' with replacement 'icy' is arguable, since 'icy' sharpens 'cold' and matches the frost. / 'icy' and 'cool' do not sharpen 'good'; 'fizzy' is right only by elimination, as nothing in the text supports it. |
| 1.1-b4-4 | SECOND ANSWER, CONFIDENCE low | also: sentences 3,8,10 (each fixes one instruction) / no single sentence proves the whole answer |
| 3.2-b1-5 | SECOND ANSWER, CONFIDENCE low | also: sentences 5 / answer is not a sentence in the text, so proof is the claim itself |
| 3.2-b4-1 | SECOND ANSWER, CONFIDENCE low | also: sentences 9 / answer option is not in the text, so proof is the claim sentence |
| 4.1-b3-5 | SECOND ANSWER, CONFIDENCE low | also: 6, 7 or 8 |
| 4.5-b1-5 | SECOND ANSWER, CONFIDENCE low | also: 1, 7 or 9 |
| 4.7-b4-4 | SECOND ANSWER, CONFIDENCE low | also: 14 to 21 (the short lines themselves) |
| 7.2-b4-6 | DISAGREES, CONFIDENCE medium | solver said {"Every autumn, Pinch filled the hut's old teapot with seeds, ready for her long winter sleep.":"sets the scene","As the truck rumbled away and the first snow began to fall, Pinch had nowhere to sleep and nothing to eat.":"the problem starts and grows","Then one morning, a terrible crash woke Pinch: builders were smashing the hut's walls to make room for Maxx World.":"the problem starts and grows","High on Tower Six, in a hut that nobody had used for years, lived a mountain pygmy possum called Pinch.":"sets the scene","Wren rescued the teapot from the truck, found Pinch shivering nearby, and tucked them both into a hollow log.":"the problem is solved","By lunchtime, the builders had carried off the teapot, seeds and all, and tossed it onto a truck.":"the problem starts and grows"} / Slight story-logic wrinkle: the truck 'rumbled away' with the teapot, yet Wren then rescues the teapot 'from the truck'. A child could briefly wonder about the order of the two middle-bin truck sentences, but the bin assignment is unaffected. |
| 1.1-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6 / asks finally into the sea; gap is how she left the tank |
| 1.1-b2-5 | DISAGREES | solver said {"option":"412","proof":3} |
| 1.1-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: Pizza before hatch: the text says she noticed the hatch, meant to tell Dad, 'then' pizza arrived, so hatch first; fairly clear. / Hatch/pizza order rests on 'then'. |
| 1.1-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: sentences 9 (gives the 'closer than any probe' part) |
| 1.1-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 1 (start time; both needed) / proof needs two sentences |
| 1.2-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: sentences 2,6,7,8 |
| 1.2-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 10,11,13 |
| 1.2-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4,5,8,11 |
| 1.2-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 7,8,12 / proof ambiguous; the quoted lines are the proof themselves |
| 1.2-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: He said he wasn't hungry... (the untouched sausage rolls) is the second slip; the 'walked over' and 'asked about sensors' parts are coping, so only mild ambiguity / Packing Clank away is the first non-spoken leak. |
| 1.2-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: Rex leaning back with hands behind head could be 'relaxed/confident' rather than smug, but smug is the only fitting bin. / Both frustrated Rex items could also read as 'smug turned sore' but frustrated is clear. |
| 1.2-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 3,12 / no obvious proof sentence for a blank |
| 1.3-b2-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 3,4,6 |
| 1.3-b2-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4,7 |
| 1.3-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4,6 |
| 1.3-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4,8,9 |
| 1.4-b1-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 3,5,6,7 |
| 1.4-b1-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6,7 |
| 1.4-b2-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6,8,11 |
| 1.4-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 16,17 |
| 1.4-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 13,14 / option 3 is also true in the text |
| 1.4-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,2,3 |
| 1.5-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,6 |
| 1.5-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8,11 |
| 1.5-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 14,11,4 |
| 1.5-b4-4 | SECOND ANSWER, CONFIDENCE medium | also: sentences 9,10,11 / proof is spread over four sentences |
| 1.6-b2-2 | SECOND ANSWER, CONFIDENCE medium | also: I've played Mole Mayhem for three weeks straight. (opening sentence, but it only sets up the review) / Opinion sentence is the claim the rest supports. |
| 1.6-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: sentences 1,10 |
| 1.6-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,8,10 |
| 1.6-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 3,9 / options 0 and 1 are close; option 3 is a topic label |
| 1.6-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 3 |
| 1.7-b1-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 2,7 |
| 1.7-b2-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4,6,8 |
| 1.7-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8,11 / option 1 is a vague but defensible summary |
| 1.7-b3-4 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,11,12 |
| 1.7-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,7 |
| 1.7-b4-4 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8,9 |
| 1.7-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8 / option 1 is vague but true |
| 1.9-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 9 |
| 1.9-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 5,7 |
| 1.9-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8 |
| 1.9-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6,8 |
| 2.1-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 'He's starving,' Mo said, + and the seagull stole + his pie. (3 tiles, but the task says exactly 4) / Only the 4-tile build satisfies the count; it keeps the quote in first person, which is normal in third-person narration. |
| 2.1-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 0 (since 1971) and 1 also show how long the tuba has known Vic. |
| 2.2-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 0 and 1 (the smell, smoke) prove the smoke half; 3 also. |
| 2.2-b2-4 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 7 (he said 'Delicious!') also shows what Dad said aloud was different. |
| 2.2-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 11 (he won't talk about the waterfall) and 5 (narrator didn't know at the time) also support it. |
| 2.3-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 2 (beak clacked by his ear) is also in Sam's telling only, but it is not an option. |
| 2.3-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 13, 10, 12 also; option 3 (checking teeth, sentence 10) is arguably defensible too. |
| 2.3-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 24, 25 and 15 also. |
| 2.4-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: 'She knocked on the toilet door and talked to the bass player' could be argued as 'what Mei says', but it is reported as an action. |
| 2.4-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 4 (they 'told each other', so it is hearsay) and 6, 7 also. |
| 2.4-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: 'Judges stood before her painting' could be said to show her work is good, not that she is modest; 'Mine's still not finished' could be read as an excuse, but modest fits. |
| 2.5-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: The pelican refusing is the obstacle; the final line (free fish life) is not bracketed so no real rival / Cue 'more than anything' appears in the text, not options. |
| 2.6-b1-1 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 5, 6 and 9 prove the goldfields half. |
| 2.6-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 2 (winter storms), 6 (supply boat) and 3/7/8 also. |
| 2.6-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: Sentence 1 (nearly midnight) also proves half of the option. |
| 2.8-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: Mission control said it was the smelliest landing ever (final sentence, could be read as coda/resolution) |
| 2.8-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 2 and 3; also 5 and 6 (stingray sits on it) could be read as the complication. |
| 2.8-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: The pelican coughing up the ball solves the missing-ball problem, but the prompt names the six-runs problem. |
| 2.8-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: 'The ship roared away' and 'Dot fixed the engine' both fit resolution; one could be argued as the climax, but no such bin exists. |
| 2.8-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: Sentences 15 and 16 also; option 2 (tiny and shy, sentence 2) is arguably defensible. |
| 2.8-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: Broadcast item could be read as part of the complication (raising stakes) rather than it gets worse; text says 'to make it worse' so it gets worse is favoured / Two items in 'it gets worse', none-extra elsewhere. |
| 2.8-b4-4 | SECOND ANSWER, CONFIDENCE medium | also: 'No,' said Mr Osei... is where idea is voiced; 'It was messier than anything she had ever painted...' also shows learning, but the painting itself is the first act of learning / Strong reader could narrow quickly but needs thought. |
| 3.1-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 2 |
| 3.1-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: Option 2 if 'brightest' is read as a judgement, but a camera can record brightness, so it is checkable. |
| 3.10-b1-3 | SECOND ANSWER, CONFIDENCE medium | also: 'The canteen sells pies and chips, but it has no icy poles.' has a 'but' pattern like the other-side items, though it states no opposing view / The 'but' cue is a decoy only if students pattern-match |
| 3.10-b2-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8 |
| 3.10-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 8 |
| 3.11-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: Poster and text could be swapped: the poster is out of date (superseded by the change), so a child could argue it is as unreliable as the guess. But the poster comes from the school and was once accurate, while the cousin is not at the school and only guesses, so poster above text. / Newsletter first is certain; the order of the last two rests on 'who made it' (school vs outsider) outweighing 'when'. |
| 3.11-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: sentences 11,17 / proof sentence is indirect |
| 3.11-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: Leaflet and Bugle could swap: both are eight years old; I put the official general advice above the news report of a past flood. |
| 3.2-b1-3 | SECOND ANSWER, CONFIDENCE medium | also: 'The Reef Rays are the best. They won the last three cups.' is backed-up by the intended reading, but winning three cups does not strictly prove 'the best'; a strict reader could call it bare. / The 2 pm item is a number that does not support 'best ever'. |
| 3.2-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 'The band is fantastic. It has 24 players in red jackets.' has a fact attached, but the fact does not support 'fantastic', so bare. 'Won state competition' supports 'deserves' moderately. / 3 backed / 2 bare. |
| 3.2-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: Chips item could be called backed (it gives a reason, a personal feeling). |
| 3.2-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: sentences 12 / option 1 is vague but not bare |
| 3.2-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 4 |
| 3.3-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: Ruby's dentist could be read as expert (a dentist) but it is one person's case, so example / 'Every class that swapped...' is a record-type claim without numbers |
| 3.3-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6 |
| 3.3-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: Tash Moore contains a number (6,000) so could be called facts and figures; but it is one person's story. Rosa Ferri could be called an example by someone ignoring her role / Marked tricky by the prompt |
| 3.3-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 'Example: twenty dogs in one test is still just one story' could be defended since it is one company test / Option 4 is clearly wrong on logic; option 1 is the real rival |
| 3.4-b1-2 | SECOND ANSWER, CONFIDENCE medium | also: sentences 1 |
| 3.4-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: sentences 6 |
| 3.4-b2-6 | SECOND ANSWER, CONFIDENCE medium | also: 'The tour dragged on for three hours in the cold.' also uses exactly 6 tiles; only the loaded 'dragged on' makes it non-neutral, which a child may judge mild. / Forced to use 'in the cold' just to reach six tiles. |
| 3.4-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: sentences 2,5 |
| 3.4-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: sentences 18,8 / option 2 is arguable but B keeps 'much-loved' |
| 3.5-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 4 (the original sentence being rewritten) |
| 3.5-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 1 (gives the real score, 15 goals) |
| 3.5-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 5, 10 or 2 (more judgement words) |
| 3.6-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: 9 or 11 (the bad things left out) |
| 3.6-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 5 (the sentence where it is left out) |
| 3.6-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 2, 3 or 4 (the quotes shown) |
| 3.6-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 1 (premierships) or 3 (decision was her own) |
| 3.7-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: 9, or 7 |
| 3.7-b3-4 | SECOND ANSWER, CONFIDENCE medium | also: Line 3 could be argued as 'no trick, just information' (it gives a visitor count), but 'so book before the holidays fill up' is bandwagon plus urgency. / Replacement option duplicates the label already given to Line 2, which hints at the answer. |
| 3.7-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: 'Is your child under four?' could be labelled rhetorical question (a question in form); 'own little train' could be labelled exaggeration. |
| 3.7-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 10 |
| 3.7-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 12 |
| 3.8-b2-2 | SECOND ANSWER, CONFIDENCE medium | also: 2 or 4 |
| 3.8-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 2, 6 or 7 |
| 3.8-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 'Places at the preview are strictly limited, so please reply by 1 May' is also pressure, but it asks for a reply by 1 May, not a Friday-night purchase. |
| 3.9-b2-6 | SECOND ANSWER, CONFIDENCE medium | also: 3, 5 or 6 |
| 3.9-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: 9 (Text B 'We are not sure yet') or 7 |
| 3.9-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: 13, 14 or 15 (Jai's doubts) |
| 3.9-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 7, 8 or 14 |
| 3.9-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 5, 6 or 7 (Letter 2 waiting) |
| 3.9-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 12 or 15 |
| 4.1-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 5 |
| 4.1-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: Draft 4 (wet cement) is slow-ish and thick, but nothing suggests clear or stringy / Honey covers clear, stretchy strings and slow slide. |
| 4.1-b4-4 | SECOND ANSWER, CONFIDENCE medium | also: 5 or 6 |
| 4.10-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 4 |
| 4.10-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: 4, 5 or 9 |
| 4.10-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 3 |
| 4.10-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 8 |
| 4.10-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 2 or 12 |
| 4.10-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 3 (spoon stood up is in 2) |
| 4.2-b2-2 | SECOND ANSWER, CONFIDENCE medium | also: 'a sponge for a hand' could be read as a metaphor (hand = sponge), though it is literal in a built robot. / Two bracketed parts have 'X was/for a Y' shape. |
| 4.2-b2-3 | SECOND ANSWER, CONFIDENCE medium | also: 'throws' fits the boomerang image (thrown and returns), though 'same five jokes' supports repeats. / The word right after the spot, 'same', points to repeats. |
| 4.2-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 5, 6 or 9 |
| 4.2-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 2 or 3 |
| 4.2-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 3 |
| 4.3-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 2 or 11 |
| 4.3-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 5 or 10 |
| 4.3-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 11 |
| 4.3-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 5 |
| 4.4-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 3, 5 or 7 |
| 4.4-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 4 |
| 4.4-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 13, 17 or 18 |
| 4.5-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 5 or 7 |
| 4.5-b2-4 | SECOND ANSWER, CONFIDENCE medium | also: 'so hot that the teachers are all sitting in the shade' uses 'so...that' form and could be read as mild exaggeration, though it is plausible literally. / Pattern 'so X that' may mislead. |
| 4.5-b3-1 | SECOND ANSWER, CONFIDENCE medium | also: 10, 11 or 12 |
| 4.5-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 16 (the small print shows it is untrue) |
| 4.5-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 4, 5 or 6 |
| 4.7-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: 15 or 16 |
| 4.7-b2-6 | SECOND ANSWER, CONFIDENCE medium | also: 9 or 0 |
| 4.7-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: 'Pale coral, chalky white and cinnamon brown' has repeated c letters, but the sounds differ (k, ch, s) / Trap relies on letter vs sound; also 'bumps' could be onomatopoeia-ish, but it's in the rhyme item. |
| 4.7-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 2, 13 or 14 |
| 4.7-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 10 (ironic 'very... nice') |
| 4.7-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 17 or 10 |
| 4.8-b1-1 | SECOND ANSWER, CONFIDENCE medium | also: 7, 8 or 10 |
| 4.8-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: 3, 4 or 6 |
| 4.8-b3-6 | SECOND ANSWER, CONFIDENCE medium | also: 5, 7 or 9 |
| 4.8-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: 9, 10, 15 |
| 4.8-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 2, 6, 8 or 9 |
| 4.9-b2-3 | SECOND ANSWER, CONFIDENCE medium | also: 'beamed' reads as happy/pleased; 'proud' is the closest of the three bins but not the only reading. 'flinched' could be read as startled rather than scared. / Bins have 2/2/3 items. |
| 4.9-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: 'bold colours leap off the canvas' could be neutral/energetic rather than admiring; 'tiny, delicate' vs 'fussy little' differ only by connotation. / Connotation pairs (slender/scrawny, bold/garish) are the point, but Year 5/6 may find 'garish', 'scrawny', 'fussy' hard. |
| 5.1-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: The door creaked open, / and / a bat flew out. is equally valid (lowercase 'a bat flew out.' tile ends a sentence). |
| 5.1-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: Because / its battery ran out, / the robot shut down. is also a correct complex sentence. |
| 5.1-b4-2 | DISAGREES | solver said "complex: 'since the bridge collapsed during the storm' depends on the main clause" |
| 5.1-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: When the divers found the wreck, they stayed down for an hour because the water was freezing. is grammatical, but the unpunctuated 'they stayed down for an hour' tile has no full stop and the meaning is odd / Resulting sentence is awkward (two dependent clauses stacked). Punctuation/capital cues in tiles largely decide the answer. |
| 5.11-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: Swapping the last two tiles (for the gallery's recycling show, then with forty twisted coat hangers) is also a grammatical sentence. / Order of how/why is not fixed by the text; the frame says 'how ... and what it's for'. |
| 5.12-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: She / painted / the first giant stroke. is equally valid (She refers to Indi). |
| 5.2-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: Because the power had failed, + the whole class screamed. is equally a complete sentence / two openers both work |
| 5.2-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: 'the fog rolled in' could literally stand alone as a sentence, but it is the clause inside 'Whenever the fog rolled in', not the main clause. / Prompt wording 'could stand alone as the main clause' is loose; a literal reader could pick the fog option. |
| 5.3-b1-4 | SECOND ANSWER, CONFIDENCE medium | also: Because / the rain was pelting down, / Mia wore her raincoat. is also sensible and uses exactly 3 tiles. |
| 5.3-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: The match went ahead as planned / although / the forecast had promised storms. is equally valid. |
| 5.4-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: Option 3 (clause at the end) also links to the cloud, but only the version that leads with the clause 'picks up' from it. |
| 5.6-b4-2 | SECOND ANSWER, CONFIDENCE medium | also: exhausted could be argued as implied by just hatching / baby is already told by the hatched-a-week-ago sentence |
| 6.1-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 'We arrived on Tuesday the snow was perfect.' and 'The chairlift stopped halfway up we swung in the wind.' are run-ons; a reader could say the problem is a missing comma/joining word rather than a missing full stop (neither bin 'missing a comma' exists, so full stop is the best fit). / Mid-sentence 'zed' and 'tully' are proper names lacking capitals. |
| 6.10-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: If the lowercase 'maybe' were meant as acceptable, the line would be 'punctuated correctly'. / Lowercase 'maybe' begins a quoted sentence introduced by 'Tully said,', so it needs a capital: 'Maybe'. Treated as needs fixing. |
| 6.2-b1-3 | SECOND ANSWER, CONFIDENCE medium | also: Item order is free (any order of the four items with the same punctuation is a valid list sentence); only grammar/sense, not the text, fixes the order. / Needs 4 items, 2 commas, and, full stop. One comma tile is spare. |
| 6.2-b2-3 | SECOND ANSWER, CONFIDENCE medium | also: Any order of the four items is equally valid. / One spare comma tile. |
| 6.2-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: 'Lily Rose' could be read as two people (Lily and Rose) if a comma were missing, shifting counts by one. / Treats 'Lily Rose' as one person's two-part name and 'Ava Grace' likewise, per the instruction to count by commas. |
| 6.2-b3-3 | SECOND ANSWER, CONFIDENCE medium | also: honey, cake, nuts and berries (swap nuts and cake in the middle) / Prompt fixes only first and last items, so nuts and cake can swap. |
| 6.3-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: 'It stops readers from thinking the lab itself was dancing' is a loose paraphrase of the same idea, though it is a weaker fit than the 'lab robots' misreading. / Options 2 and 3 overlap in meaning. |
| 6.4-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 'Because the pitch, was frozen the match was called off.' has a stray comma AND a missing comma, so 'comma missing' could also be argued. / Chose 'wrong place' since a comma is present but misplaced. |
| 6.8-b2-1 | SECOND ANSWER, CONFIDENCE medium | also: goose's, if a reader treats it as a single goose; the frame (a flock of geese) makes it plural, so geese's. / Irregular plural possessive geese's looks odd to students; 'geeses'' is the clear trap. |
| 7.10-b4-5 | SECOND ANSWER, CONFIDENCE medium | also: 'the dish' to 'the giant pan' could be argued to break the chain, since the dish is a satellite dish, not a pan / 'the thing' is too vague to point clearly back to the pancake |
| 7.12-weDo1 | SECOND ANSWER, CONFIDENCE medium | also: 'Hi Ms Lee! Can we please use the hall for our cooking show?' is polite and respectful; only the exclamation and 'Hi' make it less formal. 'Dear ... I am writing' is the conventional letter opening. / Answerable by form: 'Dear' signals letter. |
| 7.5-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 'If the snot jar bubbles, step back slowly.' could be seen as making the reader wait for the action, but the brief says leading with the moment counts / Relies on the text's rule that a moment-to-do-it opening counts |
| 7.5-b4-6 | SECOND ANSWER, CONFIDENCE medium | also: Through the secret door, also leads to the final room, but it names a door rather than the room players scan for / The Throne Room option is the only one naming an unmentioned-by-opener room that matches the paragraph's pattern; the Ice Queen/throne text confirms it. |
| 8.2-b4-1 | SECOND ANSWER, CONFIDENCE medium | also: Indi only, if a reader insists a full stop leaves a fragment, but that claim is false. / Option 3's reasoning is wrong; a full stop is a valid fix. |
| 8.4-b2-4 | SECOND ANSWER, CONFIDENCE medium | also: Possum item could be argued 'keep it' since it is a sequence of different actions, only 'and then it' repeats. / Possum item is the shaky one. |
| 8.4-b3-2 | SECOND ANSWER, CONFIDENCE medium | also: the turtle -> it (but 'it' could be read as the net). / Choice relies on nearest-noun reading. |
| 8.4-b3-4 | DISAGREES | solver said {"The choir sang a song, and the song they sang was about the sea.":"cut a repeat","Zed put his guitar next to the drum, then tuned the guitar.":"cut a repeat","Mo sat between Zed and Gus, and Gus played the drums.":"keep it as it is","The band played and then the band bowed and then the band walked off.":"cut a repeat","The violin squeaked, the cello groaned, and the triangle went ding.":"keep it as it is","Mo picked up the triangle and dropped the triangle on his foot.":"cut a repeat","The trumpet solo lasted ten minutes, and it went for ten whole minutes.":"cut a repeat"} |
| 8.4-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: [Mo's] -> his, but 'his' could mix up with Zed. / 'it' could in theory point to Zed's pie. |
| 8.6-b2-5 | SECOND ANSWER, CONFIDENCE medium | also: 'It took Zed a whole year to play one song without stopping.' is personal, but it supports 'harder than it looks'. |
| 8.6-b3-4 | SECOND ANSWER, CONFIDENCE medium | also: Gus's opinion line could be argued as off-topic personal comment. / Gus line is the shaky one. |
| 8.6-b3-5 | SECOND ANSWER, CONFIDENCE medium | also: 'The new bus had air conditioning that blasted freezing air...' is arguably off-topic too, but it is a mishap so it fits. |
| 8.6-b4-3 | SECOND ANSWER, CONFIDENCE medium | also: None strong; the mural-size sentence is the only one not about the thrown-away paint. / Some might call the bakery sentence relevant to the mural. |
| 8.9-b1-2 | SECOND ANSWER, CONFIDENCE medium | also: Bin sizes are 3 and 2. The rusty-bike Mars line is a simile, but a Space Club reader could enjoy it; the 'iron oxide' line is the paired technical version, which settles it. / Items work in pairs (Mars x2, Sun x2), which helps; the dragon line has no pair. |
| 1.1-b2-2 | SECOND ANSWER | also: To pause it, clap your hands loudly. (pause is not off) |
| 1.1-b4-2 | SECOND ANSWER | also: The sudden-death sentence is about a future change, not the current rule; the judges-awarded sentence is the application, not the rule. |
| 1.2-b1-1 | SECOND ANSWER | also: sentences 1,2,6,8 |
| 1.2-b1-6 | SECOND ANSWER | also: sentences 2,4,5,6 |
| 1.2-b2-1 | SECOND ANSWER | also: sentences 5,6,7 |
| 1.2-b2-3 | SECOND ANSWER | also: sentences 5,8 |
| 1.2-b2-6 | SECOND ANSWER | also: sentences 2,3,4,8 |
| 1.2-b3-3 | SECOND ANSWER | also: sentences 10,11,14 |
| 1.2-b4-4 | SECOND ANSWER | also: sentences 8 |
| 1.3-b1-3 | SECOND ANSWER | also: sentences 4,7 |
| 1.3-b1-6 | SECOND ANSWER | also: sentences 7,9 |
| 1.3-b2-1 | SECOND ANSWER | also: sentences 4,7 |
| 1.3-b3-3 | SECOND ANSWER | also: sentences 3,8 |
| 1.3-b4-4 | SECOND ANSWER | also: sentences 11 |
| 1.3-b4-6 | SECOND ANSWER | also: sentences 12,13 |
| 1.4-b1-2 | SECOND ANSWER | also: sentences 6,8 |
| 1.4-b2-1 | SECOND ANSWER | also: sentences 9,10 |
| 1.4-b2-2 | SECOND ANSWER | also: sentences 8,9 |
| 1.4-b3-1 | SECOND ANSWER | also: sentences 4,9,11 |
| 1.4-b3-3 | SECOND ANSWER | also: sentences 8,10 |
| 1.4-b4-2 | SECOND ANSWER | also: sentences 20 |
| 1.5-b1-1 | SECOND ANSWER | also: sentences 5 |
| 1.5-b1-2 | SECOND ANSWER | also: sentences 2,4,7 |
| 1.5-b1-5 | SECOND ANSWER | also: sentences 3,4 |
| 1.5-b1-6 | SECOND ANSWER | also: sentences 5,8 |
| 1.5-b2-1 | SECOND ANSWER | also: sentences 8 |
| 1.5-b2-2 | SECOND ANSWER | also: sentences 3 |
| 1.5-b2-4 | SECOND ANSWER | also: sentences 6,8,9,10 |
| 1.5-b2-5 | SECOND ANSWER | also: sentences 2,6,8 |
| 1.5-b3-1 | SECOND ANSWER | also: sentences 6,7,11 |
| 1.5-b3-3 | SECOND ANSWER | also: sentences 2,4 |
| 1.5-b3-4 | SECOND ANSWER | also: sentences 6,7,9 |
| 1.5-b3-6 | SECOND ANSWER | also: desperate (no: it would also clash) |
| 1.5-b4-3 | SECOND ANSWER | also: sentences 5,7 |
| 1.6-b1-1 | SECOND ANSWER | also: sentences 1 |
| 1.6-b2-1 | SECOND ANSWER | also: sentences 6,8 |
| 1.6-b2-3 | SECOND ANSWER | also: sentences 7 |
| 1.6-b3-5 | SECOND ANSWER | also: sentences 6,7 |
| 1.6-b4-1 | SECOND ANSWER | also: sentences 3,7 |
| 1.6-b4-3 | SECOND ANSWER | also: sentences 1,12 |
| 1.6-b4-5 | SECOND ANSWER | also: sentences 5 |
| 1.7-b1-1 | SECOND ANSWER | also: sentences 1,8 |
| 1.7-b1-2 | SECOND ANSWER | also: sentences 8 |
| 1.7-b1-6 | SECOND ANSWER | also: sentences 7 |
| 1.7-b2-1 | SECOND ANSWER | also: sentences 4,9 |
| 1.7-b2-4 | SECOND ANSWER | also: sentences 6 |
| 1.7-b3-6 | SECOND ANSWER | also: sentences 3,9 |
| 1.7-b4-3 | SECOND ANSWER | also: sentences 6 |
| 1.8-b1-3 | SECOND ANSWER | also: sentences 2 |
| 1.8-b2-3 | SECOND ANSWER | also: sentences 2,7 |
| 1.8-b2-6 | SECOND ANSWER | also: sentences 2,3 |
| 1.8-b3-3 | SECOND ANSWER | also: sentences 1 |
| 1.8-b4-3 | SECOND ANSWER | also: sentences 4 |
| 1.9-b1-1 | SECOND ANSWER | also: sentences 3,5 |
| 1.9-b1-3 | SECOND ANSWER | also: sentences 6,9 |
| 1.9-b1-5 | SECOND ANSWER | also: sentences 8,9 |
| 1.9-b1-6 | SECOND ANSWER | also: sentences 4 |
| 1.9-b2-1 | SECOND ANSWER | also: sentences 7,8 |
| 1.9-b2-2 | SECOND ANSWER | also: sentences 8 |
| 1.9-b2-5 | SECOND ANSWER | also: sentences 7,8,9 |
| 1.9-b2-6 | SECOND ANSWER | also: sentences 4,6 |
| 1.9-b3-5 | SECOND ANSWER | also: sentences 5,6 |
| 1.9-b3-6 | SECOND ANSWER | also: sentences 10 |
| 1.9-b4-1 | SECOND ANSWER | also: sentences 7,8 |
| 1.9-b4-5 | SECOND ANSWER | also: sentences 6 |
| 2.1-b1-1 | SECOND ANSWER | also: Sentence 9 (I grabbed the biggest chip and flew away) also shows a seagull narrating; sentence 1 names the narrator's home. |
| 2.1-b1-2 | SECOND ANSWER | also: Any narration sentence that names Kenji and uses he/his: 1, 3, 4, 5, 8, 10. Not 2 or 9 (the 'I' there is in speech). |
| 2.1-b2-1 | SECOND ANSWER | also: Sentence 1 (inside my shell) and 7 (I pulled my legs in) also show the narrator is the shelled creature, but only 10 gives the name. |
| 2.1-b2-5 | SECOND ANSWER | also: Sentence 9 (I floated down from the rafters) also proves a ghost narrates. |
| 2.1-b3-1 | SECOND ANSWER | also: Other narration sentences with Tully/she: 1, 8, 10, 15, 16. |
| 2.1-b3-5 | SECOND ANSWER | also: Sentences 3, 4, 6, 11 and 13 (steering wheel, mast, hull, sailed on, my crew) also prove the boat narrates. |
| 2.1-b4-6 | SECOND ANSWER | also: Sentences 12, 4, 5 and 14 also work: 12 and 4/5 show what the camera captured that Maxx wants hidden. |
| 2.10-b1-1 | SECOND ANSWER | also: Sentences 2 and 3 are also naughty acts, but the option text matches 1. |
| 2.10-b1-6 | SECOND ANSWER | also: Sentences 4, 6, 9 are also creepy but are not what the option says. |
| 2.10-b2-1 | SECOND ANSWER | also: Sentences 4, 5 and 8 also show selfishness. |
| 2.10-b2-2 | SECOND ANSWER | also: The power cut is bad luck, not the unfair decision; coin toss is clearly the unfairness |
| 2.10-b2-5 | SECOND ANSWER | also: Sentences 6 and 7 (Tully's eyes watered, fed it to the seagulls) also support it; 1 and 5 less directly. |
| 2.10-b3-1 | SECOND ANSWER | also: Sentences 13, 14, 15 also show she was scared, but 12 is the word-choice evidence. |
| 2.10-b3-5 | SECOND ANSWER | also: Sentence 8 (the repeat) equally; sentence 9 also. |
| 2.10-b3-6 | SECOND ANSWER | also: Sentences 0, 3 and 5 carry the other times (8:52, 8:55, nine o'clock) and equally prove it. |
| 2.10-b4-1 | SECOND ANSWER | also: Sentence 0 proves the 'hates' half only. |
| 2.10-b4-5 | SECOND ANSWER | also: Sentence 9 (walked home by himself past Leo's old garage) and 2 (two-player level) are supporting. |
| 2.2-b1-1 | SECOND ANSWER | also: Sentence 1 (the mess was found after getting home) also shows the narrator wasn't there. |
| 2.2-b2-1 | SECOND ANSWER | also: Sentence 6/7 (attic locked since 1990) also shows narrator couldn't have seen inside. |
| 2.2-b3-1 | SECOND ANSWER | also: Sentence 4 (announcer says only 'a runner' tripped) and 8 (she won't say what happened) also prove it. |
| 2.2-b3-4 | SECOND ANSWER | also: Sentence 8 (I wasn't so sure) and 9/10 (the logbook only shows what the keeper promised). |
| 2.2-b4-4 | SECOND ANSWER | also: Sentence 9 (egg only seen on the lid when they got home) also supports it. |
| 2.3-b1-1 | SECOND ANSWER | also: Sentences 6, 7 and 8 equally show the dog looking silly. |
| 2.3-b1-4 | SECOND ANSWER | also: Sentences 8 and 9 (came out an hour later, sock on head) also show what Zed left out. |
| 2.3-b1-5 | SECOND ANSWER | also: Sentences 6, 7, 9 and 5 equally. |
| 2.3-b2-1 | SECOND ANSWER | also: Sentences 10 and 11 (controller 'broken') also. |
| 2.3-b2-4 | SECOND ANSWER | also: Sentence 7 also shows he didn't really save the penalty, but the option is about the butterfly. |
| 2.3-b2-5 | SECOND ANSWER | also: Sentences 8 and 10 also. |
| 2.3-b3-1 | SECOND ANSWER | also: Sentences 8, 9, 10 and 13 equally show him silly. |
| 2.3-b4-3 | SECOND ANSWER | also: Sentences 10 and 11 also show the tent was on the burrow. |
| 2.4-b1-1 | SECOND ANSWER | also: Sentences 2, 3 and 8 also. |
| 2.4-b1-4 | SECOND ANSWER | also: Sentences 3, 5 and 7 also. |
| 2.4-b1-6 | SECOND ANSWER | also: Sentences 6, 3 and 1 also. |
| 2.4-b2-1 | SECOND ANSWER | also: Sentences 7 and 9 also. |
| 2.4-b2-4 | SECOND ANSWER | also: Sentences 1, 2, 3, 7, 9 and 11 equally. |
| 2.4-b2-6 | SECOND ANSWER | also: Sentences 3, 4 and 12 also. |
| 2.4-b3-1 | SECOND ANSWER | also: Sentences 5, 11 and 16 also. |
| 2.4-b3-5 | SECOND ANSWER | also: Sentences 7 and 4 also. |
| 2.4-b3-6 | SECOND ANSWER | also: Sentences 2, 6 and 8 also. |
| 2.4-b4-4 | SECOND ANSWER | also: Sentences 6, 7, 8 and 9 for the secret help. |
| 2.4-b4-5 | SECOND ANSWER | also: Sentence 9 and 12 also. |
| 2.4-b4-6 | SECOND ANSWER | also: Sentences 2, 6, 7 and 13 also. |
| 2.5-b1-1 | SECOND ANSWER | also: Sentences 9 and 7 also. |
| 2.5-b1-4 | SECOND ANSWER | also: Sentence 6 also. |
| 2.5-b1-6 | SECOND ANSWER | also: Sentence 5 also. |
| 2.5-b2-1 | SECOND ANSWER | also: Sentences 7, 5, 6 and 10 also. |
| 2.5-b2-4 | SECOND ANSWER | also: Sentences 5 and 2 each prove one half. |
| 2.5-b2-6 | SECOND ANSWER | also: Sentences 1 to 5 set up the sister comparison. |
| 2.5-b3-1 | SECOND ANSWER | also: Sentences 4, 5 and 7 also. |
| 2.5-b3-5 | SECOND ANSWER | also: Sentences 4, 5 and 13 also. |
| 2.5-b3-6 | SECOND ANSWER | also: Sentence 6 also. |
| 2.5-b4-1 | SECOND ANSWER | also: Sentences 4, 5, 11 also. |
| 2.5-b4-5 | SECOND ANSWER | also: Sentences 6 to 10 equally. |
| 2.5-b4-6 | SECOND ANSWER | also: Sentence 8 also. |
| 2.6-b1-5 | SECOND ANSWER | also: Sentences 0, 1 and 3 also. |
| 2.6-b1-6 | SECOND ANSWER | also: Sentences 1, 3 and 4 also. |
| 2.6-b2-1 | SECOND ANSWER | also: Sentences 3, 6, 1 and 0. |
| 2.6-b2-4 | SECOND ANSWER | also: Sentences 2, 7 and 11 also. |
| 2.6-b2-6 | SECOND ANSWER | also: Sentence 3 and 1 also. |
| 2.6-b3-5 | SECOND ANSWER | also: Sentences 2, 4, 1 and 12 also. |
| 2.6-b3-6 | SECOND ANSWER | also: Sentences 3 and 5 also. |
| 2.6-b4-1 | SECOND ANSWER | also: Sentence 0 also. |
| 2.6-b4-4 | SECOND ANSWER | also: Sentences 5, 3, 8 and 11 equally. |
| 2.7-b1-1 | SECOND ANSWER | also: Sentence 6 also. |
| 2.7-b1-5 | SECOND ANSWER | also: Sentences 2, 3, 4 and 6 equally. |
| 2.7-b1-6 | SECOND ANSWER | also: Sentences 4, 5 and 7. |
| 2.7-b2-1 | SECOND ANSWER | also: Sentences 8 and 4 also. |
| 2.7-b2-4 | SECOND ANSWER | also: Sentences 1, 6, 8 and 9 also. |
| 2.7-b2-6 | SECOND ANSWER | also: Sentence 1 also. |
| 2.7-b3-1 | SECOND ANSWER | also: Sentences 6, 9 and 10 also. |
| 2.7-b3-5 | SECOND ANSWER | also: Sentences 7 and 2 also. |
| 2.7-b3-6 | SECOND ANSWER | also: Sentence 9 also. |
| 2.7-b4-1 | SECOND ANSWER | also: Sentence 6 also. |
| 2.7-b4-4 | SECOND ANSWER | also: Sentence 11 also. |
| 2.7-b4-6 | SECOND ANSWER | also: Sentences 3, 4, 6 and 11 also. |
| 2.8-b1-1 | SECOND ANSWER | also: Sentence 2 also. |
| 2.8-b1-3 | SECOND ANSWER | also: Sentences 9 and 8 also. |
| 2.8-b1-6 | SECOND ANSWER | also: Sentences 2 and 5 also. |
| 2.8-b2-4 | SECOND ANSWER | also: Sentences 9 and 10 also. |
| 2.8-b3-1 | SECOND ANSWER | also: Sentences 3, 12 and 13 also. |
| 2.8-b4-1 | SECOND ANSWER | also: Sentences 7 and 8 also. |
| 2.8-b4-2 | SECOND ANSWER | also: Sentence 13 and 6 (story 1), 14 and 16 (story 2). |
| 2.9-b1-1 | SECOND ANSWER | also: Other stand-alone sound words: 3, 4, 18, 19, 20. |
| 2.9-b1-5 | SECOND ANSWER | also: Other one or two word bursts: 3, 8, 11, 13, 15, 16. |
| 2.9-b1-6 | SECOND ANSWER | also: Sentence 14 also compares using like. |
| 2.9-b2-1 | SECOND ANSWER | also: Sentences 3, 5 and 7 also. |
| 2.9-b2-5 | SECOND ANSWER | also: Bracket sentences 3, 14 and 15 also. |
| 2.9-b2-6 | SECOND ANSWER | also: Sentences 3, 6 and 8 also. |
| 2.9-b3-1 | SECOND ANSWER | also: Sentences 3, 4, 9 and 10 also. |
| 2.9-b3-5 | SECOND ANSWER | also: Other stand-alone sound words: 27, 28, 30, 32. |
| 2.9-b3-6 | SECOND ANSWER | also: Sentence 8 (Clang) also. |
| 2.9-b4-1 | SECOND ANSWER | also: Sentences 17 and 18 (same bracket) are the clearest chats to the reader; 1, 2, 8 and 9 are bracketed jokes. |
| 2.9-b4-3 | SECOND ANSWER | also: Sentences 51, 52 and 53 also. |
| 2.9-b4-5 | SECOND ANSWER | also: Sentences 15, 17, 22 and 30 are also jokes Dash would not write. |
| 2.9-b4-6 | SECOND ANSWER | also: Bracket jokes 21, 28, 32 and 33 equally. |
| 3.10-b1-6 | SECOND ANSWER | also: sentences 6 |
| 3.10-b3-6 | SECOND ANSWER | also: sentences 6,7 |
| 3.10-b4-5 | SECOND ANSWER | also: sentences 9 |
| 3.10-b4-6 | SECOND ANSWER | also: sentences 5,7 |
| 3.11-b1-1 | SECOND ANSWER | also: sentences 2,4 |
| 3.11-b1-5 | SECOND ANSWER | also: sentences 7 |
| 3.11-b1-6 | SECOND ANSWER | also: 'Written by the surf club lifeguards' is a reason to trust, not distrust, so not a rival. / Passage lists only one negative clue. |
| 3.11-b2-1 | SECOND ANSWER | also: sentences 0 |
| 3.11-b2-6 | SECOND ANSWER | also: sentences 5,10 |
| 3.11-b3-1 | SECOND ANSWER | also: sentences 3,1 |
| 3.11-b3-2 | SECOND ANSWER | also: 'This article was written by the Brainy Bar Chocolate Company' shows bias rather than weak evidence; 'posted twelve years ago' shows age. / Longest bracket. |
| 3.11-b4-1 | SECOND ANSWER | also: sentences 10,16 |
| 3.11-b4-3 | SECOND ANSWER | also: sentences 3 |
| 3.11-b4-6 | SECOND ANSWER | also: sentences 3 |
| 3.2-b1-1 | SECOND ANSWER | also: sentences 7 |
| 3.2-b2-2 | SECOND ANSWER | also: sentences 10 |
| 3.2-b2-5 | SECOND ANSWER | also: sentences 9 |
| 3.3-b1-5 | SECOND ANSWER | also: sentences 3,5 |
| 3.3-b2-5 | SECOND ANSWER | also: sentences 4,6 |
| 3.4-b1-5 | SECOND ANSWER | also: sentences 5 |
| 3.4-b2-1 | SECOND ANSWER | also: sentences 3 |
| 3.4-b2-4 | SECOND ANSWER | also: 'painted' is a neutral word but would wrongly imply the mural was painted on Monday; 'ruined' is emotive. / Vocabulary level of 'marked' vs 'ruined' makes it easy. |
| 3.4-b3-5 | SECOND ANSWER | also: sentences 5 |
| 3.4-b4-1 | SECOND ANSWER | also: sentences 4 |
| 3.6-b1-1 | SECOND ANSWER | also: 6 or 7 |
| 3.6-b1-6 | SECOND ANSWER | also: 6 |
| 3.6-b2-1 | SECOND ANSWER | also: 6 or 8 |
| 3.6-b2-4 | SECOND ANSWER | also: 7 or 8 |
| 3.6-b3-4 | SECOND ANSWER | also: 8 or 12 |
| 3.6-b3-6 | SECOND ANSWER | also: 8 |
| 3.6-b4-2 | SECOND ANSWER | also: 10 |
| 3.6-b4-6 | SECOND ANSWER | also: 8, 10 or 11 |
| 3.7-b1-5 | SECOND ANSWER | also: 7 |
| 3.7-b4-2 | SECOND ANSWER | also: 4 |
| 3.8-b1-1 | SECOND ANSWER | also: 6 |
| 3.8-b1-6 | SECOND ANSWER | also: 0 or 7 |
| 3.8-b2-5 | SECOND ANSWER | also: 3, 6 or 7 |
| 3.8-b3-5 | SECOND ANSWER | also: 8 |
| 3.8-b4-5 | SECOND ANSWER | also: 6 |
| 3.9-b3-4 | SECOND ANSWER | also: 'possibly' is also weaker than 'definitely' but is less sure than Jules's 'I think they are probably'. / Text uses the word 'probably' verbatim. |
| 4.1-b1-4 | SECOND ANSWER | also: 4 |
| 4.1-b2-4 | SECOND ANSWER | also: 5 or 1 |
| 4.1-b3-6 | SECOND ANSWER | also: 4 |
| 4.1-b4-1 | SECOND ANSWER | also: 2 or 4 |
| 4.1-b4-6 | SECOND ANSWER | also: 8 or 9 |
| 4.10-b4-5 | SECOND ANSWER | also: 9 |
| 4.2-b1-4 | SECOND ANSWER | also: 4 or 7 |
| 4.2-b1-6 | SECOND ANSWER | also: 5 |
| 4.2-b2-1 | SECOND ANSWER | also: 7 or 8 |
| 4.2-b2-4 | SECOND ANSWER | also: 2 |
| 4.2-b2-6 | SECOND ANSWER | also: 4 or 5 |
| 4.2-b3-5 | SECOND ANSWER | also: 5 or 7 |
| 4.2-b4-1 | SECOND ANSWER | also: 4 |
| 4.3-b1-2 | SECOND ANSWER | also: 9 (Mo runs away) |
| 4.3-b1-6 | SECOND ANSWER | also: 6 |
| 4.3-b2-1 | SECOND ANSWER | also: 6 or 7 |
| 4.3-b2-5 | SECOND ANSWER | also: 4 |
| 4.3-b2-6 | SECOND ANSWER | also: 0, 3 or 4 |
| 4.4-b1-1 | SECOND ANSWER | also: 4 or 5 |
| 4.4-b1-4 | SECOND ANSWER | also: 5 |
| 4.4-b1-6 | SECOND ANSWER | also: 6 or 8 |
| 4.4-b2-1 | SECOND ANSWER | also: 5 |
| 4.4-b2-4 | SECOND ANSWER | also: 1 or 5 |
| 4.4-b2-6 | SECOND ANSWER | also: 5 |
| 4.4-b3-1 | SECOND ANSWER | also: 9, 10 or 12 |
| 4.4-b3-6 | SECOND ANSWER | also: 5 or 9 |
| 4.4-b4-6 | SECOND ANSWER | also: 6 |
| 4.5-b1-1 | SECOND ANSWER | also: 9 |
| 4.5-b2-5 | SECOND ANSWER | also: 3 or 9 |
| 4.5-b3-5 | SECOND ANSWER | also: 11 or 9 |
| 4.6-b2-5 | SECOND ANSWER | also: 2, 4, 5, 6, 7 or 8 (all sound words) |
| 4.6-b2-6 | SECOND ANSWER | also: 'Mo's cabin was a jumble of clothes and burnt toast.' is grammatical but does not help smell. / Tile text gives it away: 'stank' is the only smell tile; and it is the only tile pair that forms a smell sentence. |
| 4.6-b3-4 | SECOND ANSWER | also: 1, 2, 3, 5 or 7 |
| 4.6-b4-1 | SECOND ANSWER | also: 4, 6, 7 or 8 |
| 4.6-b4-5 | SECOND ANSWER | also: 4 |
| 4.7-b1-5 | SECOND ANSWER | also: 8 |
| 4.7-b3-2 | SECOND ANSWER | also: 8 (visual c in 'Cheering crowds circle', but not the same sound) |
| 4.8-b1-5 | SECOND ANSWER | also: 0 or 7 |
| 4.8-b2-5 | SECOND ANSWER | also: 4 or 8 |
| 4.8-b3-1 | SECOND ANSWER | also: 8, 9 or 10 |
| 4.8-b4-3 | SECOND ANSWER | also: 10 or 13 |
| 4.9-b1-1 | SECOND ANSWER | also: 8 |
| 4.9-b1-5 | SECOND ANSWER | also: 2 or 4 |
| 4.9-b2-1 | SECOND ANSWER | also: 4 |
| 4.9-b2-4 | SECOND ANSWER | also: 3, 5 or 8 |
| 4.9-b2-6 | SECOND ANSWER | also: 7 |
| 4.9-b3-1 | SECOND ANSWER | also: 2 or 8 |
| 4.9-b3-3 | SECOND ANSWER | also: 'flung' is a synonym of the wrong word, not a fix. / Fine. |
| 4.9-b3-5 | SECOND ANSWER | also: 5, 8 or 11 |
| 4.9-b4-1 | SECOND ANSWER | also: 4 or 7 |
| 4.9-b4-4 | SECOND ANSWER | also: 8, 9, 13 or 14 |
| 4.9-b4-5 | SECOND ANSWER | also: 'snapped' shows irritation but is aimed at the Goldie, not the Creature |
| 4.9-b4-6 | SECOND ANSWER | also: 8, 10 or 11 |
| 5.8-b4-1 | SECOND ANSWER | also: stuff is also vague but matters less for boat size |
| 1.1-b1-3 | CONFIDENCE medium | Sandflies is a team name; 'Who?' is the only bin that fits, but two items in one bin may surprise a child. |
| 1.7-b4-2 | CONFIDENCE medium | Item 'tricky questions' could be argued as an acceptable vague summary, but it is clearly less specific, so too broad. |
| 2.3-b2-6 | CONFIDENCE medium | 'clever' is weakly arguable from Mo's own telling, but the slot is Tully's telling, where Mo laughs at his own joke. |
| 2.3-b3-4 | CONFIDENCE medium | 'reckless, and a bit of a cheat' fails only on 'cheat' (the shortcut is allowed). |
| 3.1-b4-3 | CONFIDENCE medium |  |
| 3.10-b3-1 | CONFIDENCE medium | option 2 also names a worry but its reason does not fit |
| 3.10-b3-3 | CONFIDENCE medium | The sugary-drinks 'but this change is a good start' item could be read as naming a side. |
| 3.10-b4-3 | CONFIDENCE medium | Self-check and two batteries reduce breakdown rather than cover someone in trouble; arguably debatable. |
| 4.2-b3-4 | CONFIDENCE medium | 'pinballed' is a verb metaphor; some may call it neither. 'as slippery as a freshly mopped floor' compares similar things (floor to ground) arguably, but is a standard as-simile. |
| 4.2-b4-4 | CONFIDENCE medium | 'Gus trumpeted' is a verb metaphor, but loud is the only fit |
| 4.5-b4-5 | CONFIDENCE medium |  |
| 6.2-b4-3 | CONFIDENCE medium | Only way to use exactly 8 tiles and get three things: 'tea towels, ice owls and snow globes'. Tiles are not all unique-use (two spare commas), and 'tea' + 'towels' as separate tiles is a trick; solvable but unusual. |
| 6.3-b4-5 | CONFIDENCE medium | 'Before the final battle Zed' is mildly bumpy but still clear. |
| 6.8-b4-4 | CONFIDENCE medium | Relies on 'All three of them' implying several scientists; 'weeks' and 'The whole town voted' support it but the singular reading is not strictly excluded by text alone. |
| 7.1-b3-4 | CONFIDENCE medium | Only imperative in an otherwise describing text. |
| 7.10-b1-3 | CONFIDENCE medium | 'team' is vague (could be either side, and the Rams led at half-time); Snowcats is the only fix that works. Solved by elimination: Rams went home grumpy is correct. |
| 7.10-b4-3 | CONFIDENCE medium | Solved partly by elimination: Pip (the character) and the title are correct; 'the game' is ambiguous because Summit Smash is named in the same sentence. A reader could consider 'the game' acceptable, leaving no obvious error. |
| 7.4-b3-6 | CONFIDENCE medium | General sentence is at the end, not the start; a solver expecting a first-sentence topic sentence may pick the first bracket. |
| 7.4-b4-2 | CONFIDENCE medium | Topic sentence is last; the memory sentence is a decoy. |