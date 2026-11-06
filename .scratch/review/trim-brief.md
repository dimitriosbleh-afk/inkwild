# Trim the crew talk in Tap to learn lessons

Inkwild is an iPad game for Grade 5/6 students in Victoria, Australia. Students play with no sound. Their teacher watched them play: they do not read long lines. They tap, try and pass. Each lesson step's `say` (the crew's lead-in) and `win` (the line after a right tap) are the lines they skip. Your job is to make those lines short enough to actually be read.

## Where

`content/skills/<id>.json` → `skill.teach.iDo.steps[]`. Each step has `say`, `show`, `ask`, `check`, `win` and sometimes `trap`. Change **only** `say` and `win`. Do not touch `ask`, `show`, `check`, nudges, reasons, the Move card, `weDo`, encounters or any other field.

Edit with the Edit tool, as targeted string replacements. Never rewrite a whole file with Write, because another agent may be editing other fields of the same files at the same time.

## The target

- Every `say` and every `win` must be **12 words or fewer**. Aim for **about 8**. Most should be 5 to 10 words.
- Count words by splitting on spaces.

## How to cut, like a strong explicit teacher

- `say` sets up the step, in one idea: what to look at or what I'm about to do. Cut warm-up, repeats of the ask, and "Now I...", "Let's...", "Here's a...". The `ask` already tells the student what to tap, so `say` must not repeat it.
- `win` confirms and names the point. Keep the rule, the term, or the reason in the fewest words. Drop the restatement of what they just tapped if the point stands without it. "Yes!" or "Right!" may open it but is optional.
- Keep every taught term. Terms are taught in `say` and `win` (and in chunk tags). If a line is where a term like INFERENCE, MAIN CLAUSE or COHESION is first named or defined, the trimmed line must still name it and say what it is, briefly. A later step's `ask` may depend on it.
- Keep the trap step's point: the usual mistake and why it's wrong.
- Keep the meaning true and the grammar terms exact. Do not invent new terms.
- Plain words a 10-year-old reads easily. Short sentences. Australian English. No em dashes. No exclamation-mark spam: at most one per line.
- Fragments are fine: "Clue plus what I know. That gives the feeling."

Example, from 1.2:
- say: "Writers don't always tell you how someone feels. They show you. Watch Mo." becomes "Writers show feelings. They don't always tell. Watch Mo."
- win: "Yes! The text never says 'Mo is angry'. Working it out is called inferring, or making an inference." becomes "Yes! You worked it out. That's an inference."

## Check your work

Run `npx vite-node scripts/content-report.ts` and look only at lines for your Skills. You are done when your Skills show no `keep it to 12` problems and no new problems of any other kind (in particular, jargon problems like "uses ... before it is taught"). Other agents' Skills, and any test failures in `src/`, are not yours; ignore them.

Report: how many lines you changed, the median `say` and `win` length in your Skills afterwards, and any line you could not get under 12 without losing a taught term (there should be none).
