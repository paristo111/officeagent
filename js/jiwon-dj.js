document.addEventListener('DOMContentLoaded', () => {
    const codeEl = document.getElementById('djCode');
    const explainEl = document.getElementById('explain');
    const nameEl = document.getElementById('nameBottom') || document.getElementById('nameTop');

    if (!codeEl || typeof Tone === 'undefined') return;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

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

    const pickRandomUnique = (items, count) => {
        const pool = [...items];
        const picked = [];
        const limit = Math.min(count, pool.length);
        for (let i = 0; i < limit; i += 1) {
            const idx = Math.floor(Math.random() * pool.length);
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

    const analyzeExplain = () => {
        const text = explainEl ? explainEl.innerText : '';
        const words = tokenizeWords(text);
        const picked = pickRandomUnique(words, words.length >= 6 ? 6 : 3);
        const seed = hashString(picked.join(' ') || 'office dj');

        const brightnessHits = picked.filter((w) => /LED|조명|빛|화이트|밝|깔끔/gi.test(w)).length;
        const calmHits = picked.filter((w) => /빈|휴식|여유|편하게|유예|기간/gi.test(w)).length;

        const bpmBase = 88 + (seed % 48);
        const bpm = clamp(bpmBase + picked.length * 2, 85, 140);
        const density = seed % 3 === 0 ? 'dense' : calmHits ? 'airy' : 'steady';
        const mode = brightnessHits ? 'major' : seed % 2 === 0 ? 'minor' : 'major';
        const scaleRoot = ['C', 'D', 'E', 'F', 'G', 'A', 'B'][seed % 7];
        const vibe = brightnessHits ? 'bright' : calmHits ? 'calm' : 'neutral';

        return { bpm, density, mode, scaleRoot, vibe, words: picked };
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
        const padNotes = (profile.mode === 'major' ? majorPad : minorPad)[root] || majorPad.C;
        const bassNotes =
            profile.mode === 'major'
                ? [`${root}2`, `${root}1`, `${root}2`, 'A1', 'F2', `${root}1`, `${root}2`, `${root}1`]
                : [`${root}1`, `${root}1`, `${root}1`, 'G1', 'F1', `${root}1`, 'D1', `${root}1`];

        const kickRate = profile.density === 'dense' ? '4n' : profile.density === 'airy' ? '2n' : '4n';
        const hatRate = profile.density === 'dense' ? '8n' : profile.density === 'airy' ? '2n' : '4n';

        return { padNotes, bassNotes, kickRate, hatRate };
    };

    const renderCode = (profile, blueprint) => {
        const name = (nameEl?.innerText || '').trim() || '누군가';
        const code = `// --- OFFICE DJ MODE ---
// ${name}의 오피스 음악 입니다.

const WORDS = ${JSON.stringify(profile.words, null, 2)};

const PROFILE = {
  bpm: ${profile.bpm},
  mode: '${profile.mode}',
  density: '${profile.density}',
  root: '${profile.scaleRoot}',
  vibe: '${profile.vibe}'
};

Tone.Transport.bpm.value = PROFILE.bpm;

const padNotes = ${JSON.stringify(blueprint.padNotes, null, 2)};
const bassNotes = ${JSON.stringify(blueprint.bassNotes, null, 2)};

const kick = new Tone.MembraneSynth({
  pitchDecay: 0.03,
  octaves: 3,
  envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.5 }
}).toDestination();

const hat = new Tone.NoiseSynth({
  noise: { type: 'pink' },
  envelope: { attack: 0.001, decay: 0.08, sustain: 0 }
}).toDestination();

const padSynth = new Tone.PolySynth({
  oscillator: { type: PROFILE.mode === 'major' ? 'triangle' : 'sine' },
  envelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 1.2 }
}).toDestination();

const bassSynth = new Tone.MonoSynth({
  oscillator: { type: PROFILE.mode === 'major' ? 'sawtooth' : 'square' },
  filter: { Q: 1, type: 'lowpass', rolloff: -12 },
  envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.5 }
}).toDestination();

new Tone.Sequence((time, note) => {
  padSynth.triggerAttackRelease(note, '2n', time);
}, padNotes, '2n').start(0);

new Tone.Sequence((time, note) => {
  if (note) bassSynth.triggerAttackRelease(note, '8n', time);
}, bassNotes, '4n').start(0);

new Tone.Loop(time => {
  kick.triggerAttackRelease('C1', '16n', time);
}, '${blueprint.kickRate}').start(0);

new Tone.Loop(time => {
  hat.triggerAttackRelease('16n', time, 0.4);
}, '${blueprint.hatRate}').start(0);

Tone.Transport.start('+0.05');`;

        codeEl.textContent = code;
    };

    let hasStarted = false;
    let activeParts = [];
    let padSynth = null;
    let bassSynth = null;
    let kick = null;
    let hat = null;

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

        padSynth = null;
        bassSynth = null;
        kick = null;
        hat = null;
    };

    const buildMusic = async (profile, blueprint) => {
        disposeAudio();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = profile.bpm;

        kick = new Tone.MembraneSynth({
            pitchDecay: 0.03,
            octaves: 3,
            envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.5 }
        }).toDestination();

        hat = new Tone.NoiseSynth({
            noise: { type: 'pink' },
            envelope: { attack: 0.001, decay: 0.08, sustain: 0 }
        }).toDestination();

        padSynth = new Tone.PolySynth({
            oscillator: { type: profile.mode === 'major' ? 'triangle' : 'sine' },
            envelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 1.2 }
        }).toDestination();
        padSynth.volume.value = -12;

        bassSynth = new Tone.MonoSynth({
            oscillator: { type: profile.mode === 'major' ? 'sawtooth' : 'square' },
            filter: { Q: 1, type: 'lowpass', rolloff: -12 },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.5 }
        }).toDestination();
        bassSynth.volume.value = -8;

        const padSequence = new Tone.Sequence((time, note) => {
            padSynth.triggerAttackRelease(note, '2n', time);
        }, blueprint.padNotes, '2n').start(0);

        const bassSequence = new Tone.Sequence((time, note) => {
            if (note) bassSynth.triggerAttackRelease(note, '8n', time);
        }, blueprint.bassNotes, '4n').start(0);

        const kickLoop = new Tone.Loop((time) => {
            kick.triggerAttackRelease('C1', '16n', time);
        }, blueprint.kickRate).start(0);

        const hatLoop = new Tone.Loop((time) => {
            hat.triggerAttackRelease('16n', time, 0.4);
        }, blueprint.hatRate).start(0);

        activeParts = [padSequence, bassSequence, kickLoop, hatLoop];
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
