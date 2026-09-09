# Bend Lite roadmap

Living document for product ideas, priorities, and future plans.

## Current product

The MVP is a local-first stretching app with:

- A homepage listing saved personal routines
- A catalog of all 100 Bend routines with source step durations
- Ranked Explore search across names, descriptions, and muscle coverage
- One-tap importing from Explore into My Routines
- Local editing for exercise durations and ordering
- Routine details, durations, exercise illustrations, and expandable instructions
- A guided player with side switching, transitions, audio cues, controls, and wake lock
- Start and next-exercise previews
- Exercise and whole-routine progress
- Mobile viewport handling and pull-to-refresh prevention
- Installable app metadata and icons

Hardcoded defaults remain in `src/data/routines.ts`, while personal changes persist
in versioned `localStorage` on the current device.

## Next priorities

### Editable routines

- Remove exercises
- Add exercises from the existing library
- Adjust transition and side-switch time
- Reset a routine to its hardcoded default

### Player settings

- Voice cues on/off
- Countdown beeps on/off
- Transition chimes on/off
- Configurable countdown lead time
- Configurable voice and speech rate

### Routine collection

- Add more hardcoded personal routines
- Duplicate a routine as a starting point
- Search exercises by name
- Filter exercises by body area

## Later ideas

### History and progress

- Log completed sessions locally
- Weekly minutes and session count
- Current and longest streak
- Calendar heatmap
- JSON export and import for backup

### Offline and installation

- Cache the app shell and exercise images
- Verify standalone behavior on Android and iOS
- Add an offline indicator
- Consider calendar or shortcut-based reminders

### Optional accounts and sync

- Add Google sign-in or another simple authentication provider
- Store personal routines, settings, and history in a database
- Sync routines across devices
- Keep accounts optional so the app remains simple to try
- Define an import path from hardcoded routines if cloud storage is added

### Player improvements

- Optional vibration cues
- Keep the next exercise preview visible for a configurable duration
- Display remaining routine time
- Skip or extend the current exercise hands-free
- Landscape and tablet layouts

## Product principles

- Local-first and usable without an account
- Fast enough to start a routine immediately
- Large, readable controls for hands-free use
- Minimal interruptions during a workout
- Static defaults remain editable in source control

## Open questions

- Which authentication and database provider would keep optional cloud sync simple?
- Should completing part of a routine count toward history?
- Should exercise durations be total time or per-side time in the editor?
- Which additional personal routines should be added next?

## Notes

- Keep this file updated when priorities change or ideas are accepted.
- Move completed work into the Current product section.
- Prefer small, testable additions over building full account or database systems.
