---
title: Sound library
subtitle: 1982 TRON sounds, experiments and future resources
---

Reviewed 2026-09-14. Personal-use resource shelf; retain attribution and source history; candidates are not automatically installed in gameplay.

[Game sound study](../../audio.html) · [Machine-readable catalog](catalog.json)

Start with the Syna-Max Recognizer and derezz recreations. Four public HQ MP3 previews are saved locally; full original downloads use the creator’s Freesound pages. The shelf also retains current game sounds, cleanup experiments, six stock-effect leads, and two complete vendor metadata catalogs. Auditory comparison is pending; file verification is not a claim of film fidelity.

## Recorded Recognizer audio restored — October 29

The user rejected the synthesized Recognizer and background ambience. Gameplay again uses the recorded film-derived flight and approach samples, and the added ambient synth is removed. Recognizers remain silent until recordings load rather than playing a noise fallback. The sound study uses the recorded flyby again. Synthesis code and FFT reports remain offline experiments and are not imported by the game or sound-study page.

## New light cycle engine — October 29

The game uses the user's light cycle sfx.mp4 34–35-second selection for world and cabin engine sound. A steady inner waveform grain (34.425–34.775) is looped with a 50 ms overlap and circular level smoothing, preserving the recording rather than resynthesizing its spectrum. In-game pitch follows actual speed multipliers; player audio excludes camera Doppler. Audition it on the [sound study](../../audio.html). Mixed soundtrack, no source-isolation or listening-approval claim. Source/timecodes/processing and hash are recorded in cycle-source.json. Older engine listings below remain historical.

## CycleInteriorSound1 engine — November 4

World and cabin cycle engines now use the user-supplied CycleInteriorSound1.mp4 recording. The inner stereo waveform has an 80 ms phase-matched raised-cosine loop join and circular stereo-linked level smoothing. No spectral resynthesis. Source hash, timecodes and reproducible conversion command are recorded in cycle-source.json. Listening review remains with the user.

## Recreations

### Recognizer — Syna-Max

**Local HQ MP3 preview; original download requires Freesound login** · Aircraft propulsion

Synthesized recreation of the 1982 Recognizer; creator describes 3xOSC plus flanging. Strong candidate for a clean flight loop.

<audio controls preload="none" aria-label="Recognizer — Syna-Max" src="previews/syna-max-69757.mp3"></audio>

[Open audio file](previews/syna-max-69757.mp3)

[Source](https://freesound.org/people/Syna-Max/sounds/69757/) · Syna-Max · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

91.95 seconds · 2 channels · 2.55 MB · HQ MP3 preview, not the original master.

### Derezz — Syna-Max

**Local HQ MP3 preview; original download requires Freesound login** · Destruction

Recreated 1982 derezz effects; audition individual events as alternatives to mixed-film explosions.

<audio controls preload="none" aria-label="Derezz — Syna-Max" src="previews/syna-max-69966.mp3"></audio>

[Open audio file](previews/syna-max-69966.mp3)

[Source](https://freesound.org/people/Syna-Max/sounds/69966/) · Syna-Max · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

20.61 seconds · 2 channels · 0.24 MB · HQ MP3 preview, not the original master.

### Lightcycle — Syna-Max

**Local HQ MP3 preview; original download requires Freesound login** · Future vehicles

Recreated original-film lightcycle; retained for possible later vehicle experiments.

<audio controls preload="none" aria-label="Lightcycle — Syna-Max" src="previews/syna-max-69764.mp3"></audio>

[Open audio file](previews/syna-max-69764.mp3)

[Source](https://freesound.org/people/Syna-Max/sounds/69764/) · Syna-Max · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

48.82 seconds · 2 channels · 1.03 MB · HQ MP3 preview, not the original master.

### Synth ambience — Syna-Max

**Local HQ MP3 preview; original download requires Freesound login** · Environment / carrier interior

Original futuristic ambience in the same pack; not claimed to be a specific movie stem.

<audio controls preload="none" aria-label="Synth ambience — Syna-Max" src="previews/syna-max-69967.mp3"></audio>

[Open audio file](previews/syna-max-69967.mp3)

[Source](https://freesound.org/people/Syna-Max/sounds/69967/) · Syna-Max · [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)

27.19 seconds · 2 channels · 0.68 MB · HQ MP3 preview, not the original master.

## Current game sounds

### Tank Drive

**Active** · Vehicle / combat

Video time 10.750s; 0.580s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Tank Drive" src="../../audio/tank-drive.wav"></audio>

[Open audio file](../../audio/tank-drive.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Recognizer Flight

**Active** · Vehicle / combat

Video time 124.000s; 1.880s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Recognizer Flight" src="../../audio/recognizer-flight.wav"></audio>

[Open audio file](../../audio/recognizer-flight.wav)

[Source](../references/videos/1982 tron clu scene.m4a) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Recognizer Approach

**Active** · Vehicle / combat

Video time 126.200s; 2.080s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Recognizer Approach" src="../../audio/recognizer-approach.wav"></audio>

[Open audio file](../../audio/recognizer-approach.wav)

[Source](../references/videos/1982 tron clu scene.m4a) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### CLU cannon — supplied fire clip

**Active** · CLU cannon fire

User-supplied clue fire.mp3. Used unchanged at its original pitch; decoded during startup and reused for every shot. Stereo, approximately 0.57 seconds. Enemy tanks retain the previous cannon sample.

<audio controls preload="none" aria-label="CLU cannon — supplied fire clip" src="../references/sounds/clue%20fire.mp3"></audio>

[Open audio file](../references/sounds/clue%20fire.mp3)

[Source](../references/sounds/clue%20fire.mp3) · User-supplied clip; original sound creator not identified · User-supplied reference for this project; redistribution rights not established

### Cannon

**Active** · Vehicle / combat

Video time 121.380s; 0.380s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Cannon" src="../../audio/cannon.wav"></audio>

[Open audio file](../../audio/cannon.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Recognizer Explosion

**Active** · Vehicle / combat

Video time 107.840s; 0.850s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Recognizer Explosion" src="../../audio/recognizer-explosion.wav"></audio>

[Open audio file](../../audio/recognizer-explosion.wav)

[Source](../references/videos/1982 tron clu scene.m4a) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Terminal Key 1

**Active** · Terminal UI

Video time 0.885s; 0.060s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Terminal Key 1" src="../../audio/terminal-key-1.wav"></audio>

[Open audio file](../../audio/terminal-key-1.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Terminal Key 2

**Active** · Terminal UI

Video time 1.395s; 0.060s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Terminal Key 2" src="../../audio/terminal-key-2.wav"></audio>

[Open audio file](../../audio/terminal-key-2.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Terminal Key 3

**Active** · Terminal UI

Video time 0.995s; 0.060s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Terminal Key 3" src="../../audio/terminal-key-3.wav"></audio>

[Open audio file](../../audio/terminal-key-3.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Terminal Key 4

**Active** · Terminal UI

Video time 1.585s; 0.060s prepared audio. Mixed film soundtrack; may include score or other effects.

<audio controls preload="none" aria-label="Terminal Key 4" src="../../audio/terminal-key-4.wav"></audio>

[Open audio file](../../audio/terminal-key-4.wav)

[Source](../references/videos/1982 tron clu scene.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Recognizer armor hit

**Active — nonfatal Recognizer hits** · Combat feedback

Original 0.48-second stereo pressure thump, saturated electrical crack and falling electronic tail; no sustained metallic ring. Tank impacts use a shorter 0.36-second variation. Three variants with spatial playback and subtle pitch variation; fatal hits use the explosion instead. Audition WAV is generated by scripts/generate-hit-sfx.mjs from the same synthesis used in game.

<audio controls preload="none" aria-label="Recognizer armor hit" src="../../audio/recognizer-hit.wav"></audio>

[Open audio file](../../audio/recognizer-hit.wav)

[Source](https://github.com/stevedekorte/TRON/blob/main/src/audio/recognizer-hit.js) · Project synthesis · Original project sound

### Tank destruction — layered electronic blast

**Active for CLU and enemy tanks** · Tank destruction

Original 1.65-second low shock, electrical rupture, noise blast and scattered inharmonic debris. Three procedural variants and slight playback-rate variation; stereo world placement and distance attenuation. Audition below uses the same synthesis as gameplay.

<audio controls preload="none" aria-label="Tank destruction — layered electronic blast" src="../../audio/tank-explosion.wav"></audio>

[Open audio file](../../audio/tank-explosion.wav)

[Source](../../src/audio/tank-explosion.js) · Project synthesis · Original project sound

### Carrier — steady machinery drone

**Active** · Carrier presence

Synthesized 16-second stereo loop: stable bass harmonics and quiet diffuse machinery texture. Whole-cycle frequencies avoid a crossfade dip; no amplitude modulation. Generated with scripts/generate-carrier-drone.mjs.

<audio controls preload="none" aria-label="Carrier — steady machinery drone" src="../../audio/carrier-drone.wav"></audio>

[Open audio file](../../audio/carrier-drone.wav)

[Source](undefined) · Project synthesis · Project-generated audio

### Data transfer ring — forming

**Film-derived adaptation; listening review pending** · CLU data transfer surround

Sark and MCP.mp4, 52.75–54.25 s. Filtered mixed soundtrack, stretched to about three seconds with soft fades. Opening cue reverses the extract. Rebuild: scripts/extract-transfer-sfx.py. Residual soundtrack may remain.

<audio controls preload="none" aria-label="Data transfer ring — forming" src="../../audio/data-ring-close.wav"></audio>

[Open audio file](../../audio/data-ring-close.wav)

[Source](../references/videos/Sark%20and%20MCP.mp4) · TRON (1982) film soundtrack / Disney · User-supplied film reference; unofficial personal fan project

### Data transfer ring — opening

**Film-derived adaptation; listening review pending** · CLU data transfer surround

Sark and MCP.mp4, 52.75–54.25 s. Filtered mixed soundtrack, stretched to about three seconds with soft fades. Opening cue reverses the extract. Rebuild: scripts/extract-transfer-sfx.py. Residual soundtrack may remain.

<audio controls preload="none" aria-label="Data transfer ring — opening" src="../../audio/data-ring-open.wav"></audio>

[Open audio file](../../audio/data-ring-open.wav)

[Source](../references/videos/Sark%20and%20MCP.mp4) · TRON (1982) film soundtrack / Disney · User-supplied film reference; unofficial personal fan project

### Light cycle startup

**Archived startup candidate; replaced by materialization cue** · Cycle startup

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack.

<audio controls preload="none" aria-label="Light cycle startup" src="../../public/assets/audio/cycle-startup.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-startup.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle launch

**Film-mix candidate; wired into gameplay** · Cycle launch

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack.

<audio controls preload="none" aria-label="Light cycle launch" src="../../public/assets/audio/cycle-launch.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-launch.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle driving loop

**Film-mix candidate; wired into gameplay** · Cycle driving loop

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack. User-selected source interval: 0:47–0:48; 0.1-second seam crossfade.

<audio controls preload="none" aria-label="Light cycle driving loop" src="../../public/assets/audio/cycle-drive.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-drive.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle turn

**Film-mix candidate; wired into gameplay** · Cycle turn

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack. User-selected source interval: 0:51–0:52; 12 ms edge fades.

<audio controls preload="none" aria-label="Light cycle turn" src="../../public/assets/audio/cycle-turn.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-turn.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle explosion

**Film-mix candidate; wired into gameplay** · Cycle explosion

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack. Extended to two seconds (1:15.85–1:17.85), 1.15 seconds longer than the initial extract.

<audio controls preload="none" aria-label="Light cycle explosion" src="../../public/assets/audio/cycle-explosion.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-explosion.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle trail deactivation

**Film-mix candidate; wired into gameplay** · Cycle trail deactivation

Extracted from the supplied TRON light cycles.mp4 using scripts/extract-cycle-sfx.py. Picture-selected timing; auditory fidelity review pending. Source times and filters: public/assets/audio/cycle-source.json. Stereo PCM, edge fades; driving loop crossfaded. May retain background soundtrack.

<audio controls preload="none" aria-label="Light cycle trail deactivation" src="../../public/assets/audio/cycle-wall-down.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-wall-down.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle player cabin loop

**Film-mix candidate; wired into gameplay** · Player cycle driving

Restored film waveform after the synthesized drone was rejected as harsh and irritating. Uses 1:36.7–1:37.8 of the user-selected 1:36–1:38 interval, with a 0.2-second equal-power crossfade and stereo-linked RMS leveling. Finished loop: 0.9 seconds. The recording’s pitch variation remains unresolved; volume smoothing does not fix it. Other cycles retain 0:47–0:48.

<audio controls preload="none" aria-label="Light cycle player cabin loop" src="../../public/assets/audio/cycle-drive-cabin.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-drive-cabin.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

### Light cycle materialization

**Film-mix candidate; wired into gameplay** · Fast cycle reveal before launch

Single materialization beat from 26.7–27.4 seconds in the supplied film clip; avoids repeating the full intercut team sequence. One team cue accompanies the 0.3-second reveal and its tail carries into launch. Film-mix candidate; auditory review pending. Reproduce with scripts/extract-cycle-sfx.py.

<audio controls preload="none" aria-label="Light cycle materialization" src="../../public/assets/audio/cycle-materialize.wav"></audio>

[Open audio file](../../public/assets/audio/cycle-materialize.wav)

[Source](../references/videos/TRON%20light%20cycles.mp4) · TRON (1982), Walt Disney Productions · Film reference; no redistribution license supplied

## Experiments

### Carrier rumble — archived film candidate

**Reserved for future use** · Unassigned

Carrier and solar sailer video, 116.2–120.2 seconds; filtered and looped to 3.6 seconds. Removed from carrier playback September 17; retained unchanged for future effects.

<audio controls preload="none" aria-label="Carrier rumble — archived film candidate" src="../../audio/carrier-rumble.wav"></audio>

[Open audio file](../../audio/carrier-rumble.wav)

[Source](../references/videos/carrier%20and%20solar%20sailer.mp4) · TRON (1982) film soundtrack; local edit · User-supplied film reference; personal project

### Explosion cleanup — original

**Audition only** · Destruction

Supplied short edit aligned at 113.207s. Shared stereo tonal suppression; stronger processing also removes explosion texture. Overlapping cannon may remain.

<audio controls preload="none" aria-label="Explosion cleanup — original" src="../../audio/studies/recognizer-explosion-original.wav"></audio>

[Open audio file](../../audio/studies/recognizer-explosion-original.wav)

[Source](../references/sounds/Recognizer%20Explosion.m4a) · Film soundtrack; project processing · User-supplied film reference; personal project

### Explosion cleanup — balanced

**Audition only** · Destruction

Supplied short edit aligned at 113.207s. Shared stereo tonal suppression; stronger processing also removes explosion texture. Overlapping cannon may remain.

<audio controls preload="none" aria-label="Explosion cleanup — balanced" src="../../audio/studies/recognizer-explosion-balanced.wav"></audio>

[Open audio file](../../audio/studies/recognizer-explosion-balanced.wav)

[Source](../references/sounds/Recognizer%20Explosion.m4a) · Film soundtrack; project processing · User-supplied film reference; personal project

### Explosion cleanup — strong

**Audition only** · Destruction

Supplied short edit aligned at 113.207s. Shared stereo tonal suppression; stronger processing also removes explosion texture. Overlapping cannon may remain.

<audio controls preload="none" aria-label="Explosion cleanup — strong" src="../../audio/studies/recognizer-explosion-strong.wav"></audio>

[Open audio file](../../audio/studies/recognizer-explosion-strong.wav)

[Source](../references/sounds/Recognizer%20Explosion.m4a) · Film soundtrack; project processing · User-supplied film reference; personal project

## Stock-library leads

### Heavy Caliber Lazer — synth piano

**Catalog verified; film match unconfirmed; audio not acquired** · Tank cannon

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Cartoon_Trax_Sound_Effects.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

### Heavy Caliber Lazer — echo variant

**Catalog verified; film match unconfirmed; audio not acquired** · Distant cannon

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Cartoon_Trax_Sound_Effects.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

### Heavy Caliber Lazer — scratchy variant

**Catalog verified; film match unconfirmed; audio not acquired** · Cannon impact

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Cartoon_Trax_Sound_Effects.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

### Laser Blast Short

**Catalog verified; film match unconfirmed; audio not acquired** · Weapon accents

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Cartoon_Trax_Sound_Effects.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

### Synth Energy Zaps 1 — tonal delay

**Catalog verified; film match unconfirmed; audio not acquired** · Recognizer power-up

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Premiere_Edition_Vol._1_Sound_Effects_Library.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

### Descending multipitched synth laser

**Catalog verified; film match unconfirmed; audio not acquired** · Derezz / laser

Publisher catalog verifies the effect ID. A community film-effects index associates it with TRON (1982); exact scene/match still needs listening comparison.

[Source](https://portal.sound-ideas.com/Files/SpecificationFile/Premiere_Edition_Vol._1_Sound_Effects_Library.pdf) · The Hollywood Edge / Sound Ideas · Commercial library; no purchase made

[Community film-match lead](https://soundeffects.fandom.com/wiki/Tron_(1982))

## Library resources

### Serafine Sci-Fi I

**Catalog saved; full audio not acquired** · Future ambience, machinery, weapons and transitions

General Frank Serafine collection, not a verified original TRON stems release. Product variants were marked sold out when checked. Local CSV is metadata only.

[Source](https://sound-ideas.com/products/sci-fi-i-sound-effects-library-by-serafine) · Frank Serafine / Sound Ideas · Commercial library; no purchase made

[Local catalog: 420 rows](catalogs/serafine-scifi-i.csv) · [Publisher CSV](https://portal.sound-ideas.com/CSVexport/product=476) · [Publisher audition page](https://soundideas.sourceaudio.com/album/3304227)

### Serafine Sci-Fi II

**Catalog saved; full audio not acquired** · Future ambience, machinery, weapons and transitions

General Frank Serafine collection, not a verified original TRON stems release. Product variants were marked sold out when checked. Local CSV is metadata only.

[Source](https://sound-ideas.com/products/sci-fi-ii-sound-effects-library-by-serafine) · Frank Serafine / Sound Ideas · Commercial library; no purchase made

[Local catalog: 1028 rows](catalogs/serafine-scifi-ii.csv) · [Publisher CSV](https://portal.sound-ideas.com/CSVexport/product=477) · [Publisher audition page](https://soundideas.sourceaudio.com/album/3304306)

## Film-derived candidates

### Carrier derezz — film excerpt

**Extracted; awaiting auditory review** · Carrier materialization/dematerialization candidate

Second half of the original excerpt: 1.5 seconds from 2:38.5–2:40, high-pass 70 Hz / low-pass 9 kHz, normalized to peak 0.7 with 25 ms edge fades. Mixed film soundtrack, not an isolated effects stem. Not loaded by gameplay. Regenerate with scripts/extract-carrier-derez.py.

<audio controls preload="none" aria-label="Carrier derezz — film excerpt" src="../../audio/carrier-derez.wav"></audio>

[Open audio file](../../audio/carrier-derez.wav)

[Source](../references/videos/Carrier%20derezed.mp4) · TRON (1982) film soundtrack; user-supplied reference · Film-derived reference; no standalone redistribution license supplied

### Carrier materialization — loop candidate

**Extracted; awaiting auditory review** · Carrier materialization/dematerialization candidate

1.38-second forward-playing loop with a 120 ms cosine crossfade, prepared from 2:38.5–2:40 (the second half of the original excerpt). Mixed film soundtrack, not an isolated effects stem. Not loaded by gameplay. Regenerate with scripts/extract-carrier-derez.py.

<audio controls preload="none" aria-label="Carrier materialization — loop candidate" src="../../audio/carrier-derez-loop.wav"></audio>

[Open audio file](../../audio/carrier-derez-loop.wav)

[Source](../references/videos/Carrier%20derezed.mp4) · TRON (1982) film soundtrack; user-supplied reference · Film-derived reference; no standalone redistribution license supplied

## Next auditions

1. Compare the Syna-Max Recognizer against the current film-derived flight loop.
2. Pick useful events from the derezz recording and compare with the supplied explosion edit.
3. Check CRT059908–10 and PE205401 against the film before treating them as matches.
4. Keep lightcycle and synth ambience available for later vehicle/environment experiments.

The Serafine collections provide further design material, but no exact Recognizer or tank stem has been verified there. No new library audio is loaded by the game.
