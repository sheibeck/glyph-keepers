# Glyph Keepers

A local fantasy typing adventure for a young Egg Keeper. Type careful spells, meet friendly pixel guardians, and hatch a collection of 35 original pixel creatures. Built with Vue 3, TypeScript, and Vite. No accounts, ads, paid assets, image APIs, or gameplay network services.

## Run locally

Requires Node.js 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the local URL Vite prints (normally `http://127.0.0.1:5173`). On Windows, use `npm.cmd` if PowerShell blocks npm scripts.

```sh
npm test             # Vitest domain tests
npm run build       # Strict TypeScript checking and production build
npm run preview     # Serve dist locally
npm run test:e2e    # Playwright browser tests (install Chromium first)
```

Before browser tests, run `npx playwright install chromium`. The test configuration starts its own local Vite server. Nothing is published or deployed by these commands.

## GitHub Pages

The hosted game is published at `https://sheibeck.github.io/glyph-keepers/`. The `.github/workflows/pages.yml` workflow installs locked dependencies, runs domain tests, builds with `--mode github-pages`, and deploys the static `dist/` artifact when changes reach `master`. It can also be started manually from GitHub Actions. Pages must use GitHub Actions as its publishing source.

The GitHub Pages build uses `/glyph-keepers/` as its asset base; ordinary local builds keep `/`. To preview the Pages build locally, run `npm run build -- --mode github-pages`, then `npm run preview -- --mode github-pages` and open `/glyph-keepers/` on the printed origin. The repository and published game are public. Player saves and statistics stay in the browser and are never committed to the repository.

Progress remains local to each browser even when hosted. Export/import a save in the parent journal to transfer progress from localhost or another device. Hosting does not provide account sync or send practice statistics to a server.

## How to play

Choose any of six worlds and begin an expedition with five hearts and ten randomized encounters. Type the displayed prompt exactly; the guardian yields automatically without Enter. Combat transitions disable typing. At ten victories, earn an egg, hatch it, and discover a friend. Five mistakes that cost hearts cause retreat with practice statistics retained and no egg. Retrying samples a fresh sequence; chance overlaps with earlier expeditions remain possible.

The first character that makes the buffer an invalid prefix costs one heart. Further mistakes in that error state cost no additional hearts. Backspace until the buffer is a valid prefix to re-arm damage. Every printable character is counted, including mistakes made while damage is suppressed. Each attempt is compared to the target character at its buffer position, even when a previous error remains. Backspace does not erase recorded attempts. Matching characters and mistakes are highlighted separately.

Paste, dropping text, and composition commits cannot solve prompts. Held character and Backspace repeats are ignored; release and press again. Shortcuts, modifier keys, navigation, Enter, and Backspace do not count as attempts. The MVP targets a physical keyboard in English input mode.

Use Escape or Pause for a break. Leaving the tab, window, or typing field automatically pauses active combat. Resume explicitly when ready. There are no time limits and no damage for typing slowly. All worlds are available immediately.

## Curriculum and adaptation

| World | Practice | Speed bonus target |
| --- | --- | --- |
| Key Meadow | Home-row keys and combinations | 100 CPM |
| Tiny Woods | 2–4 letter words | 25 WPM |
| Goblin Grove | Common 4–6 letter words | 30 WPM |
| Crystal Caverns | Longer words | 35 WPM |
| Wizard’s Library | Short lowercase phrases | 40 WPM |
| Dragon Peaks | Capitals, sentences, punctuation | 45 WPM |

Key Meadow starts with eight individual home-row keys, introduces pairs after the first completion, and opens longer patterns after the second. With only eight initial prompts, repetition occurs after all eight are used. Other pools contain dozens of curated prompts. Selection deduplicates each pool and samples without replacement until exhausted.

For each prompt, calculate the mean of `errors / (attempts + 5)` over its distinct characters. Its sampling weight is `1 + 0.6 × mean`, bounded between 1 and 1.6. This modestly favors struggling keys without crossing difficulty or lesson boundaries. Per-key statistics attribute an attempt to the expected character at the current position; attempts beyond the target length are attributed to the typed character.

## Metrics and exact reward formula

`accuracy = correct printable attempts / all printable attempts`. An empty encounter is displayed as 100% but cannot complete or earn an egg without typing.

`WPM = (correctly completed prompt characters / 5) / active minutes`. Key Meadow shows characters per minute (CPM) in the parent journal instead. Only completed prompts contribute characters; deleted or repeatedly typed characters do not inflate speed. Active time includes ordinary thinking time and excludes transitions, menus, pauses, and hidden-tab time. Player screens use broad rhythm labels; parent results show numerical speeds and accuracy.

Base odds, in percent:

| World | Common | Uncommon | Rare | Epic | Legendary | Mythic | Cosmic |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Key Meadow | 70 | 23 | 5.5 | 1.3 | 0.15 | 0.04 | 0.01 |
| Tiny Woods | 63 | 27 | 7.5 | 2.2 | 0.2 | 0.08 | 0.02 |
| Goblin Grove | 56 | 29 | 11 | 3.4 | 0.4 | 0.15 | 0.05 |
| Crystal Caverns | 49 | 30 | 15 | 5 | 0.7 | 0.23 | 0.07 |
| Wizard’s Library | 43 | 30 | 19 | 6.5 | 1.1 | 0.3 | 0.1 |
| Dragon Peaks | 37 | 30 | 23 | 7.5 | 1.8 | 0.5 | 0.2 |

Let `a` be accuracy in [0, 1], `v` measured CPM/WPM, and `t` the world’s speed target:

```text
A = clamp((a - 0.80) / 0.20, 0, 1)
S = a >= 0.95 ? clamp(v / t, 0, 1) : 0
P = 0.75 × A + 0.25 × S
F = a == 1 and attempts > 0 ? 0.5 : 0
M = 1 + 1.5 × P + F
weight[i] = baseProbability[i] × M^(i / 2), for i = 0..6
probability[i] = weight[i] / sum(weight)
```

`M` is bounded from 1 to 3. Probabilities remain positive and sum to 1. Accuracy supplies 75% of the performance component, speed 25%, and flawless typing adds a separate bonus. Below 95% accuracy, speed contributes nothing. Even an arbitrarily slow flawless run has better rarity odds than a maximum-speed 95%-accurate run. Speed never gates an egg or level completion.

The UI shows actual adjusted percentages rather than an ambiguous luck multiplier. Final odds are frozen at completion. Each tier contains five equally likely creatures, so the chance of any specific creature is its tier probability divided by five. Duplicate hatches increase cosmetic friendship; companions do not alter damage, odds, or speed. RNG uses `Math.random`, suitable for a local practice game rather than prizes with monetary value.

## Saves and privacy

One versioned profile is stored under `glyph-keepers.save.v1` in localStorage. It includes collection counts, companion, world completion counts, settings, lifetime statistics, up to 100 recent expedition results, and a pending hatch. Reward and pending-hatch records are written together **before** egg presentation. Refreshing during a ceremony restores the same reward without rolling or awarding again.

Practice checkpoints save every five active seconds, at encounter completion, on pause, and on page exit. An unfinished expedition is not resumed after a reload, but saved practice remains. The parent journal exports/imports validated JSON saves; import requires confirmation before replacing the profile. Malformed or unsupported saves recover to a fresh in-memory profile with a visible warning. The malformed record is not overwritten merely by loading; the next actual save replaces it. Export backups before clearing browser data.

If storage is denied or full, play continues in memory with a warning and an export-backup button. Refresh safety cannot be guaranteed until storage works or a backup is exported. Saves belong to this browser origin: changing ports, browsers, or machines requires export/import. There is no cloud sync or telemetry.

## Architecture

```text
src/data/                 Curated curriculum, creature catalog, rarity definitions
src/game/typing.ts        Pure prefix validation and character accounting
src/game/metrics.ts       Accuracy, CPM/WPM, broad rhythm labels
src/game/rewards.ts       Bounded rarity weights and creature selection
src/game/expedition.ts    Explicit state machine, combat clock, award lifecycle
src/game/persistence.ts   Versioned records, validation, localStorage boundary
src/components/           Pixel artwork, typing UI, odds, collection, parent journal
src/App.vue               Screen orchestration and browser lifecycle handling
src/style.css             Responsive layout, pixel scenery, reduced motion
tests/                    Browser gameplay and accessibility interaction checks
```

The state machine is `idle → encounter → transition → encounter … → egg → hatching → hatched → idle`, with explicit `paused` and `retreat` branches. State guards disable input and duplicate actions outside legal phases. Timer generations prevent stale transition callbacks from starting overlapping encounters. Domain tests inject clocks and use fake timers to verify time accounting and single awards.

## Accessibility and MVP limitations

Keyboard navigation, visible focus, large prompts, an optional keyboard guide, a focused pause dialog, readable contrast, responsive layouts, system reduced-motion support, and a saved reduce-motion option are included. Ordinary thinking time remains practice time until paused. Pixel art is original SVG using a low-resolution grid and crisp edges; no external fonts or artwork are loaded.

This MVP uses one profile and assumes one active tab. Concurrent tabs can overwrite each other’s saves. Mobile layouts are supported, but the custom typing surface requires a physical keyboard; touch keyboards and IME composition are not supported. No audio, user-generated lessons, authentication, parental lock, cloud backup, spaced-repetition scheduler, or unfinished-expedition recovery is included. The parent journal is informational rather than password protected. Lesson pools and rarity balance can be tuned in the data/domain modules.
