# WrongWayio

Minigames that teach left from right. React + Vite + Tailwind frontend in `frontend/` (Capacitor for Android), Rust backend in `backend/`.

## Adding a new game

A game combines a **Display** (presents a direction) with an **Input** (the player's answer). `GameRound` runs the flow: display, then input, one wrong answer loses. Reuse existing displays and inputs where possible; most new games only need a new pairing.

1. **Display** (only if no existing one fits): `frontend/src/components/games/components/displays/`. It receives `direction` and calls `onDirectionSet` once the direction is presented. It is remounted every round.
2. **Input** (only if no existing one fits): `frontend/src/components/games/components/inputs/`. It receives `onSubmit(direction, origin)` and `disabled` (true once time ran out). If it can't take an answer right away (permissions, loading), call `onPause(true)` to stop the round clock and `onPause(false)` to resume. Set the static `timeoutSeconds` and, if it needs more than the default `h-40`, `footerHeight`. Inputs are remounted every round, so share expensive resources (camera, models) in a module-level session, as `inputs/handTracking.ts` does.
3. **Game component**: `frontend/src/components/games/minigames/<Name>Game.tsx`, a thin wrapper such as `<WordGame {...props} Display={...} Input={...} />`. Use `WordGame` when the player acts out a word, `DirectionGame` when they name what they see.
4. **Register it** by adding `{ nameKey: 'game.<name>', Component: <Name>Game }` to the `games` array in `minigames/index.ts`. Order matters: the array index is the number shown on the games page (`GamePage.tsx`), and the daily challenge picks from the same array (`dailyGameIndices(games.length)`). Append at the end so existing numbers don't shift.
5. **Translations**: add `game.<name>` and any new strings to all three of `frontend/src/i18n/locales/{en,es,pt}.json`. `tests/i18n.test.ts` checks the files stay in sync.
6. **Assets**: anything the game loads at runtime goes in `frontend/public/` (served as-is). Keep large libraries lazy with a dynamic `import()` so the main bundle stays small. Offline speech models are not committed: `make -C frontend models` downloads them into `public/models/` (`make install` runs it). Native features (camera, speech) go through `frontend/src/native`, never directly, so tests can mock them.
7. **Tests**: unit-test pure logic in `frontend/tests/` (for example `handTracking.test.ts`).
8. **Verify** from `frontend/`: `npx tsc -b`, `npx vitest run`, `npx vite build`. Then play the game from the games page, and check that it appears there as the next number.
