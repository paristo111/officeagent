document.addEventListener('DOMContentLoaded', () => {
    const codeEl = document.getElementById('djCode');
    const explainEl = document.getElementById('explain');
    const nameEl = document.getElementById('nameBottom') || document.getElementById('nameTop');

    if (!codeEl || typeof Tone === 'undefined') return;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const makeRng = (seed) => {
        let state = (seed >>> 0) || 1;
        return () => {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return ((state >>> 0) / 4294967296);
        };
    };

    const tokenizeWords = (text) => {
        const raw = (text || '')
            .replace(/<br\s*\/?>/gi, ' ')
            .replace(/[0-9]+/g, ' ')
            .replace(/[\[\]()<>{}.,!?/\\|:;"'`~@#$%^&*+=_-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!raw) return [];
        return raw
            .split(' ')
            .map((word) => word.trim())
            .filter((word) => word.length >= 2);
    };

    const pickRandomUnique = (items, count, rng = Math.random) => {
        const pool = [...items];
        const picked = [];
        const limit = Math.min(count, pool.length);
        for (let i = 0; i < limit; i += 1) {
            const idx = Math.floor(rng() * pool.length);
            picked.push(pool.splice(idx, 1)[0]);
        }
        return picked;
    };

    const hashString = (value) => {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
        }
        return hash;
    };

    const genreFromPath = () => {
        const pathname = (window.location.pathname || '').toLowerCase();
        if (pathname.includes('/jungah')) return 'arenaRock';
        if (pathname.includes('/jiwon')) return 'berlinTechno';
        if (pathname.includes('/chaebin')) return 'berlinTechnoMoist';
        if (pathname.includes('/yeju')) return 'cuteJpop';
        if (pathname.includes('/jasang')) return 'peggyHouse';
        if (pathname.includes('/seowoo')) return 'altIndieTeen';
        return null;
    };

    const analyzeExplain = () => {
        const text = explainEl ? explainEl.innerText : '';
        const stableSeed = hashString(`${window.location.pathname || ''}::${text || ''}` || 'office dj');
        const rng = makeRng(stableSeed);

        const words = tokenizeWords(text);
        const picked = pickRandomUnique(words, words.length >= 6 ? 6 : 3, rng);
        const seed = stableSeed;

        const brightnessHits = picked.filter((w) => /LED|조명|빛|화이트|밝|깔끔/gi.test(w)).length;
        const calmHits = picked.filter((w) => /빈|휴식|여유|편하게|유예|기간/gi.test(w)).length;

        const forcedGenre = genreFromPath();
        const genrePool = ['berlinTechno', 'peggyHouse', 'altIndieTeen', 'arenaRock', 'cuteJpop'];
        const genre = forcedGenre || genrePool[Math.floor(rng() * genrePool.length)];

        const scaleRoots = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
        const scaleRoot = scaleRoots[Math.floor(rng() * scaleRoots.length)];

        const vibe = brightnessHits ? 'bright' : calmHits ? 'calm' : 'neutral';

        const genreDefaults = {
            arenaRock: { bpmMin: 118, bpmMax: 158, mode: brightnessHits ? 'major' : 'minor', density: 'steady', swing: 0.0 },
            berlinTechno: { bpmMin: 128, bpmMax: 138, mode: 'minor', density: 'dense', swing: 0.06 },
            berlinTechnoMoist: { bpmMin: 126, bpmMax: 136, mode: 'minor', density: calmHits ? 'airy' : 'steady', swing: 0.06 },
            cuteJpop: { bpmMin: 142, bpmMax: 172, mode: 'major', density: 'dense', swing: 0.10 },
            peggyHouse: { bpmMin: 120, bpmMax: 126, mode: 'minor', density: 'steady', swing: 0.18 },
            altIndieTeen: { bpmMin: 94, bpmMax: 118, mode: brightnessHits ? 'major' : 'minor', density: 'airy', swing: 0.08 }
        };

        const defaults = genreDefaults[genre] || genreDefaults.altIndieTeen;
        const bpm = Math.round(clamp(defaults.bpmMin + rng() * (defaults.bpmMax - defaults.bpmMin), 85, 180));
        const mode = defaults.mode;
        const density = defaults.density;

        return { seed, genre, bpm, density, mode, swing: defaults.swing, scaleRoot, vibe, words: picked };
    };

    const buildBlueprint = (profile) => {
        const majorPad = {
            C: ['C4', 'E4', 'G4', 'B4'],
            D: ['D4', 'F#4', 'A4', 'C#5'],
            E: ['E4', 'G#4', 'B4', 'D#5'],
            F: ['F4', 'A4', 'C5', 'E5'],
            G: ['G4', 'B4', 'D5', 'F#5'],
            A: ['A3', 'C#4', 'E4', 'G#4'],
            B: ['B3', 'D#4', 'F#4', 'A#4']
        };

        const minorPad = {
            C: ['C4', 'Eb4', 'G4', 'Bb4'],
            D: ['D4', 'F4', 'A4', 'C5'],
            E: ['E4', 'G4', 'B4', 'D5'],
            F: ['F4', 'Ab4', 'C5', 'Eb5'],
            G: ['G4', 'Bb4', 'D5', 'F5'],
            A: ['A3', 'C4', 'E4', 'G4'],
            B: ['B3', 'D4', 'F#4', 'A4']
        };

        const root = profile.scaleRoot;
        const rng = makeRng(profile.seed);

        const chord = (profile.mode === 'major' ? majorPad : minorPad)[root] || majorPad.C;
        const rootLow = `${root}${profile.genre === 'cuteJpop' ? 2 : 1}`;
        const rootMid = `${root}2`;

        const patterns16 = {
            fourOnFloor: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
            backbeat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
            offbeatHat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
            eighthHat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]
        };

        const pick = (arr) => arr[Math.floor(rng() * arr.length)];

        const base = {
            padEvents: [chord, null, chord, null],
            padSubdiv: '2n',
            padDur: '2n',
            bassEvents: [rootLow, null, rootLow, null, rootLow, null, rootLow, null],
            bassSubdiv: '8n',
            bassDur: '16n',
            drumSubdiv: '16n',
            kickSteps: patterns16.fourOnFloor,
            snareSteps: patterns16.backbeat,
            hatSteps: patterns16.offbeatHat,
            openHatSteps: patterns16.offbeatHat.map((v, i) => (v && i % 4 === 2 ? 1 : 0)),
            mix: { kick: -10, snare: -16, hat: -18, openHat: -20, pad: -18, bass: -12, lead: -20 },
            fx: { masterFilterHz: null, distortion: 0.0, reverbWet: 0.12, delayWet: 0.0, chorusWet: 0.0 }
        };

        if (profile.genre === 'berlinTechno' || profile.genre === 'berlinTechnoMoist') {
            const technoBass = [
                rootLow, null, rootLow, null,
                rootLow, null, rootLow, null,
                rootMid, null, rootLow, null,
                rootLow, null, rootLow, null
            ];

            base.padEvents = [chord, null, chord, null, chord, null, chord, null];
            base.padSubdiv = '4n';
            base.padDur = '8n';
            base.bassEvents = technoBass;
            base.bassSubdiv = '16n';
            base.bassDur = '16n';
            base.kickSteps = patterns16.fourOnFloor;
            base.snareSteps = patterns16.backbeat.map((v) => (rng() < 0.5 ? v : 0));
            base.hatSteps = patterns16.eighthHat;
            base.openHatSteps = patterns16.offbeatHat;
            base.mix = { kick: -10, snare: -18, hat: -22, openHat: -18, pad: -22, bass: -12, lead: -99 };
            base.fx.masterFilterHz = profile.genre === 'berlinTechnoMoist' ? 1400 : 2400;
            base.fx.distortion = profile.genre === 'berlinTechnoMoist' ? 0.05 : 0.12;
            base.fx.reverbWet = profile.genre === 'berlinTechnoMoist' ? 0.35 : 0.10;
            base.fx.delayWet = profile.genre === 'berlinTechnoMoist' ? 0.08 : 0.0;
        } else if (profile.genre === 'peggyHouse') {
            base.padEvents = [chord, null, chord, null, chord, null, chord, null];
            base.padSubdiv = '4n';
            base.padDur = '8n';
            base.kickSteps = patterns16.fourOnFloor;
            base.snareSteps = patterns16.backbeat;
            base.hatSteps = patterns16.eighthHat;
            base.openHatSteps = patterns16.offbeatHat;
            base.bassEvents = [
                rootLow, null, rootLow, null,
                rootLow, null, null, rootLow,
                rootLow, null, rootLow, null,
                rootLow, null, null, rootLow
            ];
            base.bassSubdiv = '16n';
            base.bassDur = '16n';
            base.mix = { kick: -11, snare: -16, hat: -22, openHat: -18, pad: -22, bass: -13, lead: -99 };
            base.fx.masterFilterHz = 5200;
            base.fx.distortion = 0.06;
            base.fx.reverbWet = 0.14;
        } else if (profile.genre === 'cuteJpop') {
            base.kickSteps = [
                1, 0, 0, 0,
                0, 0, 1, 0,
                1, 0, 0, 0,
                0, 1, 0, 0
            ];
            base.snareSteps = patterns16.backbeat;
            base.hatSteps = patterns16.eighthHat;
            base.openHatSteps = patterns16.offbeatHat.map(() => 0);
            base.padEvents = [chord, chord, null, chord, chord, null, chord, null];
            base.padSubdiv = '8n';
            base.padDur = '8n';
            base.bassEvents = [rootMid, null, rootMid, null, rootLow, null, rootMid, null];
            base.bassSubdiv = '8n';
            base.bassDur = '16n';

            const scaleSteps = profile.mode === 'major' ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
            const leadBase = Tone.Frequency(`${root}4`);
            const scale = scaleSteps.map((s) => leadBase.transpose(s).toNote());
            const lead = Array.from({ length: 16 }, (_, i) => {
                if (i % 4 === 3 && rng() < 0.35) return null;
                if (i % 2 === 1 && rng() < 0.25) return null;
                return pick(scale);
            });

            base.leadEvents = lead;
            base.leadSubdiv = '16n';
            base.leadDur = '16n';
            base.mix = { kick: -12, snare: -16, hat: -22, openHat: -99, pad: -24, bass: -15, lead: -18 };
            base.fx.masterFilterHz = 9000;
            base.fx.reverbWet = 0.22;
            base.fx.chorusWet = 0.25;
            base.fx.delayWet = 0.08;
        } else if (profile.genre === 'arenaRock') {
            base.kickSteps = [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0];
            base.snareSteps = patterns16.backbeat;
            base.hatSteps = patterns16.eighthHat;
            base.openHatSteps = patterns16.offbeatHat.map((v) => (rng() < 0.25 ? v : 0));
            base.padEvents = [chord, null, chord, null];
            base.padSubdiv = '2n';
            base.padDur = '2n';
            base.bassEvents = [rootLow, rootLow, rootLow, rootLow, rootMid, rootLow, rootLow, rootLow];
            base.bassSubdiv = '8n';
            base.bassDur = '8n';
            base.mix = { kick: -11, snare: -14, hat: -22, openHat: -24, pad: -24, bass: -10, lead: -99 };
            base.fx.distortion = 0.22;
            base.fx.masterFilterHz = null;
            base.fx.reverbWet = 0.06;
        } else if (profile.genre === 'altIndieTeen') {
            base.kickSteps = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0];
            base.snareSteps = patterns16.backbeat.map((v) => (v ? 1 : 0));
            base.hatSteps = patterns16.offbeatHat.map((v) => (rng() < 0.6 ? v : 0));
            base.openHatSteps = patterns16.offbeatHat.map(() => 0);
            base.padEvents = [chord, null, null, chord];
            base.padSubdiv = '1m';
            base.padDur = '1m';
            base.bassEvents = [rootLow, null, null, null, rootLow, null, null, null];
            base.bassSubdiv = '4n';
            base.bassDur = '8n';
            base.mix = { kick: -16, snare: -20, hat: -28, openHat: -99, pad: -20, bass: -18, lead: -99 };
            base.fx.masterFilterHz = 6000;
            base.fx.reverbWet = 0.42;
            base.fx.chorusWet = 0.35;
            base.fx.delayWet = 0.10;
        }

        return base;
    };

    const renderCode = (profile, blueprint) => {
        const name = (nameEl?.innerText || '').trim() || '누군가';
        const code = `// --- OFFICE DJ ---
// ${name}의 작업 음악

const WORDS = ${JSON.stringify(profile.words, null, 2)};

const PROFILE = {
  bpm: ${profile.bpm},
  mode: '${profile.mode}',
  density: '${profile.density}',
  root: '${profile.scaleRoot}',
  vibe: '${profile.vibe}'
};

Tone.Transport.bpm.value = PROFILE.bpm;
Tone.Transport.swing = ${profile.swing};
`;

        codeEl.textContent = code;
    };

    let hasStarted = false;
    let activeParts = [];
    let padSynth = null;
    let bassSynth = null;
    let kick = null;
    let hat = null;
    let openHat = null;
    let snare = null;
    let leadSynth = null;
    let nodes = [];

    const disposeAudio = () => {
        activeParts.forEach((part) => {
            part.stop();
            if (typeof part.dispose === 'function') part.dispose();
        });
        activeParts = [];

        if (padSynth) padSynth.dispose();
        if (bassSynth) bassSynth.dispose();
        if (kick) kick.dispose();
        if (hat) hat.dispose();
        if (openHat) openHat.dispose();
        if (snare) snare.dispose();
        if (leadSynth) leadSynth.dispose();

        nodes.forEach((node) => {
            if (node && typeof node.dispose === 'function') node.dispose();
        });
        nodes = [];

        padSynth = null;
        bassSynth = null;
        kick = null;
        hat = null;
        openHat = null;
        snare = null;
        leadSynth = null;
    };

    const buildMusic = async (profile, blueprint) => {
        disposeAudio();
        Tone.Transport.cancel();
        Tone.Transport.swing = profile.swing || 0;
        Tone.Transport.swingSubdivision = '8n';
        Tone.Transport.bpm.value = profile.bpm;

        const output = new Tone.Gain(1).toDestination();
        nodes.push(output);

        let masterIn = output;
        if (blueprint.fx?.masterFilterHz) {
            const masterFilter = new Tone.Filter({
                type: 'lowpass',
                frequency: blueprint.fx.masterFilterHz,
                Q: 0.7
            }).connect(output);
            nodes.push(masterFilter);
            masterIn = masterFilter;
        }

        const reverb = new Tone.Reverb({
            decay: profile.genre === 'altIndieTeen' ? 5.0 : 2.6,
            preDelay: 0.01,
            wet: clamp(blueprint.fx?.reverbWet ?? 0.12, 0, 0.9)
        }).connect(masterIn);
        nodes.push(reverb);

        const delay = new Tone.FeedbackDelay({
            delayTime: profile.genre === 'cuteJpop' ? '8n' : '16n',
            feedback: 0.25,
            wet: clamp(blueprint.fx?.delayWet ?? 0, 0, 0.8)
        }).connect(masterIn);
        nodes.push(delay);

        let chorus = null;
        if ((blueprint.fx?.chorusWet ?? 0) > 0) {
            chorus = new Tone.Chorus(4, 2.5, clamp(blueprint.fx.chorusWet, 0, 0.9)).connect(masterIn);
            chorus.start();
            nodes.push(chorus);
        }

        let distortion = null;
        if ((blueprint.fx?.distortion ?? 0) > 0) {
            distortion = new Tone.Distortion(clamp(blueprint.fx.distortion, 0, 0.9)).connect(masterIn);
            nodes.push(distortion);
        }

        const connectDry = (node) => {
            if (!node) return;
            node.connect(masterIn);
        };

        const connectPad = (node) => {
            if (!node) return;
            node.connect(masterIn);
            node.connect(reverb);
            if ((blueprint.fx?.delayWet ?? 0) > 0) node.connect(delay);
            if (chorus) node.connect(chorus);
        };

        const connectBass = (node) => {
            if (!node) return;
            if (distortion) {
                node.connect(distortion);
            } else {
                node.connect(masterIn);
            }
        };

        kick = new Tone.MembraneSynth({
            pitchDecay: profile.genre === 'berlinTechno' || profile.genre === 'berlinTechnoMoist' ? 0.02 : 0.03,
            octaves: profile.genre === 'arenaRock' ? 2 : 3,
            envelope: { attack: 0.001, decay: 0.22, sustain: 0, release: 0.4 }
        });
        connectDry(kick);
        kick.volume.value = blueprint.mix?.kick ?? -12;

        snare = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: profile.genre === 'arenaRock' ? 0.12 : 0.08, sustain: 0 }
        });
        snare.connect(masterIn);
        snare.connect(reverb);
        snare.volume.value = blueprint.mix?.snare ?? -18;

        hat = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.001, decay: 0.05, sustain: 0 }
        });
        hat.connect(masterIn);
        if (profile.genre !== 'arenaRock') hat.connect(reverb);
        hat.volume.value = blueprint.mix?.hat ?? -22;

        openHat = new Tone.NoiseSynth({
            noise: { type: 'white' },
            envelope: { attack: 0.001, decay: 0.12, sustain: 0 }
        });
        openHat.connect(masterIn);
        openHat.connect(reverb);
        openHat.volume.value = blueprint.mix?.openHat ?? -24;

        padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type:
                    profile.genre === 'arenaRock'
                        ? 'sawtooth'
                        : profile.genre === 'peggyHouse'
                          ? 'triangle'
                          : profile.genre === 'cuteJpop'
                            ? 'square'
                            : 'sine'
            },
            envelope: {
                attack: profile.genre === 'cuteJpop' ? 0.005 : 0.02,
                decay: profile.genre === 'berlinTechno' || profile.genre === 'berlinTechnoMoist' ? 0.10 : 0.4,
                sustain: profile.genre === 'berlinTechno' || profile.genre === 'berlinTechnoMoist' ? 0.15 : 0.4,
                release: profile.genre === 'altIndieTeen' ? 2.8 : 1.1
            }
        });
        connectPad(padSynth);
        padSynth.volume.value = blueprint.mix?.pad ?? -22;

        bassSynth = new Tone.MonoSynth({
            oscillator: { type: profile.genre === 'arenaRock' ? 'sawtooth' : 'square' },
            filter: {
                Q: 1,
                type: 'lowpass',
                rolloff: -12,
                frequency: profile.genre === 'berlinTechnoMoist' ? 700 : 950
            },
            envelope: { attack: 0.01, decay: 0.25, sustain: 0.15, release: 0.25 }
        });
        connectBass(bassSynth);
        bassSynth.volume.value = blueprint.mix?.bass ?? -14;

        if (Array.isArray(blueprint.leadEvents)) {
            leadSynth = new Tone.Synth({
                oscillator: { type: 'square' },
                envelope: { attack: 0.005, decay: 0.08, sustain: 0.15, release: 0.15 }
            });
            leadSynth.connect(masterIn);
            leadSynth.connect(reverb);
            leadSynth.connect(delay);
            leadSynth.volume.value = blueprint.mix?.lead ?? -20;
        }

        const padSequence = new Tone.Sequence((time, chord) => {
            if (!chord) return;
            padSynth.triggerAttackRelease(chord, blueprint.padDur || '2n', time);
        }, blueprint.padEvents, blueprint.padSubdiv).start(0);

        const bassSequence = new Tone.Sequence((time, note) => {
            if (!note) return;
            bassSynth.triggerAttackRelease(note, blueprint.bassDur || '16n', time, 0.9);
        }, blueprint.bassEvents, blueprint.bassSubdiv).start(0);

        const kickSequence = new Tone.Sequence((time, hit) => {
            if (!hit) return;
            kick.triggerAttackRelease('C1', '16n', time, 0.9);
        }, blueprint.kickSteps, blueprint.drumSubdiv).start(0);

        const snareSequence = new Tone.Sequence((time, hit) => {
            if (!hit) return;
            snare.triggerAttackRelease('16n', time, 0.7);
        }, blueprint.snareSteps, blueprint.drumSubdiv).start(0);

        const hatSequence = new Tone.Sequence((time, hit) => {
            if (!hit) return;
            hat.triggerAttackRelease('32n', time, 0.35);
        }, blueprint.hatSteps, blueprint.drumSubdiv).start(0);

        const openHatSequence = new Tone.Sequence((time, hit) => {
            if (!hit) return;
            openHat.triggerAttackRelease('16n', time, 0.25);
        }, blueprint.openHatSteps || [], blueprint.drumSubdiv).start(0);

        const leadSequence =
            leadSynth && Array.isArray(blueprint.leadEvents)
                ? new Tone.Sequence((time, note) => {
                      if (!note) return;
                      leadSynth.triggerAttackRelease(note, blueprint.leadDur || '16n', time, 0.6);
                  }, blueprint.leadEvents, blueprint.leadSubdiv || '16n').start(0)
                : null;

        activeParts = [padSequence, bassSequence, kickSequence, snareSequence, hatSequence, openHatSequence].filter(Boolean);
        if (leadSequence) activeParts.push(leadSequence);
    };

    const profile = analyzeExplain();
    const blueprint = buildBlueprint(profile);
    renderCode(profile, blueprint);

    const startOnce = async () => {
        if (hasStarted) return;
        hasStarted = true;
        try {
            await Tone.start();
            await buildMusic(profile, blueprint);
            Tone.Transport.start('+0.05');
        } catch (err) {
            hasStarted = false;
        }
    };

    document.addEventListener('pointerdown', startOnce, { once: true });
    document.addEventListener('keydown', startOnce, { once: true });
});
