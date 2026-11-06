import { describe, expect, it } from 'vitest';
import { sentencesOf } from '../src/core/check';

describe('sentencesOf', () => {
  it('splits at the end of each sentence', () => {
    expect(sentencesOf('Mo ran. Gus hid! Was it a ghost?')).toEqual(['Mo ran.', 'Gus hid!', 'Was it a ghost?']);
  });

  it('keeps speech with the words that follow it', () => {
    expect(sentencesOf("'Stop!' he yelled. Then he ran.")).toEqual(["'Stop!' he yelled.", 'Then he ran.']);
    expect(sentencesOf("She whispered, 'Who is that?', Lila shrugged. Nobody knew.")).toEqual(["She whispered, 'Who is that?', Lila shrugged.", 'Nobody knew.']);
  });

  it('does not split at abbreviations, times or decimals', () => {
    expect(sentencesOf('Dr. Lin came at 6 a.m. today. It was 9.02 exactly. P.S. Bring snacks.')).toEqual(['Dr. Lin came at 6 a.m. today.', 'It was 9.02 exactly.', 'P.S. Bring snacks.']);
  });

  it('keeps a single initial with its name', () => {
    expect(sentencesOf('Mr E. Grumble frowned. Then he left.')).toEqual(['Mr E. Grumble frowned.', 'Then he left.']);
  });

  it('treats a new line as a break', () => {
    expect(sentencesOf('Day 1\nIt rained.')).toEqual(['Day 1', 'It rained.']);
  });
});
