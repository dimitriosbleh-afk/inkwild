# 4. Backup code layouts are published and never edited

Date: 2026-11-05
Status: accepted

## Context

A Backup code holds a Student's progress in 12 characters. That only fits because the code stores, per Branch, a route position (how far along the Island's route of Skills and Keeper the Student has mastered, in order) and a Band, rather than every Skill and Creature. Creatures, levels and cosmetics are rebuilt from that progress. Students copy the code into their books, and some codes may only be typed back months later, after content updates.

## Decision

The meaning of a code (each Branch's route length, the order of fields, the alphabet and the check character) is a numbered layout. Once a layout ships, it is never edited. Adding or removing Skills on a route means adding a new layout version. The 4-bit version field allows 16 layouts. A test pins the current layout to the signed-off Skill list, so changing the list without a new layout fails the build.

## Consequences

- A code written in any book stays readable by every later version of the game.
- Adding a Skill costs a layout version and a little payload space. 52.6 of 53.4 bits are used today.
- Progress outside the route order, plus swapped and shiny Creatures and Pieces, isn't in the code. Only the optional Save to Files restores those.
