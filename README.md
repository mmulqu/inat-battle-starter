# iNat Battler Starter

A tiny React + Vite TypeScript game where you pick a team of creatures and battle a CPU.

## Tech
- React 18, TypeScript, Vite
- Simple stateful battle engine

## Getting started
```bash
npm install
npm run dev
```
Dev server will print a local URL. Open it to play.

## Build
```bash
npm run build
npm run preview
```

## Project structure
- `src/App.tsx`: App flow (team select -> battle -> game over)
- `src/components/*`: UI components
- `src/battle/engine.ts`: Minimal combat resolution
- `src/data/*`: Species and moves
- `src/utils/spriteMapping.ts`: Sprite mapping for species

## Assets
Sprites live in `src/assets/sprites`. Add new species by adding a sprite and updating `spriteMapping.ts` and `data/species.ts`.

## Notes
- Basic accessibility: labels, button states, auto-scrolling log
- The engine currently supports simple damage moves. Defensive/status moves are stubbed in `moves.ts` for future expansion.