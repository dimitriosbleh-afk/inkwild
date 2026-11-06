# Audit the trimmed crew lines

Context: read `.scratch/review/trim-brief.md` first. Agents cut every lesson step's `say` and `win` to 12 words or fewer. Some cuts dropped the point of the step. Example found in 5.13 step 1: the win went from "Yes! A doer and a verb that make sense alone. That is a main clause." to "Yes! That's a main clause." It lost the definition, which is the whole lesson.

Your job: for each of your Skills, compare every step's old and new `say` and `win`, and fix any line where the student now loses something they need.

Get the old version with `git show 8c4cc91:content/skills/<id>.json` and compare it with the working copy. A quick way to see the pairs side by side:

```
node -e "const id='5.13';const cur=require('./content/skills/'+id+'.json').skill.teach.iDo.steps;const old=JSON.parse(require('child_process').execSync('git show 8c4cc91:content/skills/'+id+'.json').toString()).skill.teach.iDo.steps;cur.forEach((s,i)=>console.log(i+1,'\n  SAY',old[i].say,'\n   => ',s.say,'\n  ASK',s.ask,'\n  WIN',old[i].win,'\n   => ',s.win))"
```

Flag and fix a line when:
- a definition, rule, test or reason the step exists to teach was dropped (what a term means, how to check it, why the trap is wrong);
- the new line is no longer true, or says something different from the old one;
- the new `say` gives away the answer to the step's `ask` (it names the answer chunk or option);
- the line no longer makes sense with the step's `show` and `ask` (for example a win that names a term the student didn't just tap).

Do not change lines that are fine. Shorter is the goal. A line that drops only a restatement, a warm-up or an example is fine.

Fixes must still be 12 words or fewer. Change only `say` and `win`, with targeted replacements (read the file fresh, replace one exact `"say": "..."` or `"win": "..."` string that occurs once, and write it back). Never rewrite a whole file from an old copy. Australian English, no em dashes, at most one exclamation mark per line.

When done, run `npx vite-node scripts/content-report.ts` and make sure your Skills show no problems.

Report: each line you changed as `id step N say|win: old → new` with a few words on why, and the count of steps you checked.
