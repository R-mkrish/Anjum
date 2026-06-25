# Pause — React Native (Expo)

An in-the-moment stress-relief flow. A gentle nudge leads the user through a five-step
reset: check-in → breathing pacer → sensory grounding → CBT thought reframer, with a
crisis-safety path that surfaces real helplines.

This is the intervention layer of the wellbeing-app concept — the part that helps someone
*in the moment*, built entirely from things an app is allowed to do (no background sensing,
no reading other apps).

---

## Run it

You need **Node.js 18+** and the **Expo Go** app on your phone.

```bash
cd pause-rn
npm install
npx expo start
```

Scan the QR code with Expo Go (Android: in-app scanner · iPhone: Camera app).
If the connection fails on a restricted network: `npx expo start --tunnel`.

---

## The flow

1. **The nudge** — a soft notification card in non-alarming language. Tap to begin.
2. **Check-in** — rate body tension (tap-segment scale 0–10) or tap an emoji. Haptic feedback on selection.
3. **Breathing** — an animated orb expands/contracts on a 4-4-4-4 box-breathing rhythm, with a haptic pulse at each phase. Unlocks after two rounds.
4. **Grounding** — a 5-4-3-2-1 sensory exercise (see → hear → feel); tap tiles, each gives a light haptic tap.
5. **Reframer** — type the anxious thought; it's reframed into Worst / Best / Most-realistic (CBT decatastrophizing), all on-device.

**Crisis path:** if the reframer text contains harm-related phrases, the flow routes to a
validation screen with tappable helpline cards (India: Tele-MANAS 14416, iCall) instead of
a generic reframe. Tapping a card opens the dialer. **Swap these for your region's lines.**

---

## Notes for your study

- The reframer and crisis detection use simple, transparent on-device rules (see `App.js`)
  — easy to explain to an ethics board, no data leaves the phone.
- The crisis keyword list (`CRISIS_FLAGS`) and helplines (`RESOURCES`) are at the top of
  `App.js` — review and localise them before any real use.
- The "nudge" here is a mock screen. In a shipped app it would fire from a local
  notification triggered by *consented* signals (e.g. late-night usage via UsageStatsManager)
  or on a schedule — never from reading other apps.
- Not a medical device. Pair it with a professional's input before using it with participants.
- Package a standalone APK later with `npx eas build` when ready to distribute.
