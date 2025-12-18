document.addEventListener('DOMContentLoaded', () => {
    const panel = document.getElementById('djPanel');
    const summaryEl = document.getElementById('djSummary');
    const detailsEl = document.getElementById('djDetails');
    const codeEl = document.getElementById('djCode');
    const explainEl = document.getElementById('explain');

    if (!panel || !codeEl || typeof Tone === 'undefined') {
        return;
    }

    const kick = new Tone.MembraneSynth({
        pitchDecay: 0.03,
        octaves: 3,
        envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.5 }
    }).toDestination();

    const hat = new Tone.NoiseSynth({
        noise: { type: 'pink' },
        envelope: { attack: 0.001, decay: 0.08, sustain: 0 }
    }).toDestination();

    let padSynth = null;
    let bassSynth = null;
    let activeParts = [];
    let currentProfile = null;
    let currentBlueprint = null;
    let hasStarted = false;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    function analyzeText(text, variation = 0) {
        const raw = (text || '').replace(/\s+/g, ' ').trim();
        const numbers = (raw.match(/\d+/g) || []).map(Number);
        const ledHits = (raw.match(/LED|조명|빛|화이트|밝/gi) || []).length;
        const calmHits = (raw.match(/빈|휴식|여유|편하게/gi) || []).length;

        let bpm = 96 + numbers.length * 4 + variation;
        bpm = clamp(bpm, 85, 140);

        const density = numbers.length > 6 ? 'dense' : calmHits ? 'airy' : 'steady';
        const mode = ledHits > 0 ? 'major' : 'minor';
        const colorWord = ledHits > 0 ? '밝은 조명' : '차분한 공간';
        const summary = `${numbers.length}개의 수치와 ${colorWord} 단서를 바탕으로 ${bpm}BPM ${mode === 'major' ? '메이저' : '마이너'} 루프를 구성합니다.`;

        return {
            bpm,
            density,
            mode,
            colorWord,
            summary,
            keywordCount: numbers.length
        };
    }

    function buildBlueprint() {
        const padNotes = currentProfile.mode === 'major'
            ? ['C4', 'E4', 'G4', 'B4']
            : ['A3', 'C4', 'E4', 'G4'];
        const bassNotes = currentProfile.mode === 'major'
            ? ['C2', 'G1', 'C2', 'A1', 'F2', 'G1', 'C2', 'G1']
            : ['A1', 'E1', 'A1', 'G1', 'F1', 'E1', 'D1', 'E1'];

        const kickRate = currentProfile.density === 'dense'
            ? '4n'
            : currentProfile.density === 'airy'
                ? '2n'
                : '4n';
        const hatRate = currentProfile.density === 'dense' ? '8n' : '4n';

        return {
            padNotes,
            bassNotes,
            kickRate,
            hatRate
        };
    }

    function renderCode() {
        if (!currentProfile || !currentBlueprint) return;

        const modeLabel = currentProfile.mode === 'major' ? 'Ionian' : 'Aeolian';

        const code = `// --- AUTO PATCH FROM JIWON EXPLAIN TEXT ---
const PROFILE = {
    bpm: ${currentProfile.bpm},
    mode: '${currentProfile.mode}',
    density: '${currentProfile.density}',
    keywords: ${currentProfile.keywordCount}
};

Tone.Transport.bpm.value = PROFILE.bpm;

const padNotes = ${JSON.stringify(currentBlueprint.padNotes)};
const bassNotes = ${JSON.stringify(currentBlueprint.bassNotes)};

const padSynth = new Tone.PolySynth({
    oscillator: { type: '${currentProfile.mode === 'major' ? 'triangle' : 'sine'}' },
    envelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 1.2 }
}).toDestination();

const bassSynth = new Tone.MonoSynth({
    oscillator: { type: '${currentProfile.mode === 'major' ? 'sawtooth' : 'square'}' },
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
}, '${currentBlueprint.kickRate}').start(0);

new Tone.Loop(time => {
    hat.triggerAttackRelease('16n', time, 0.4);
}, '${currentBlueprint.hatRate}').start(0);

// MODE · ${modeLabel}  |  DENSITY · ${currentProfile.density.toUpperCase()}
Tone.Transport.start('+0.05');`;

        codeEl.textContent = code;
    }

    function updateProfile(variation = 0) {
        const text = explainEl ? explainEl.innerText : '';
        currentProfile = analyzeText(text, variation);
        currentBlueprint = buildBlueprint();

        if (summaryEl) {
            summaryEl.textContent = currentProfile.summary;
        }

        if (detailsEl) {
            const densityLabel = currentProfile.density === 'dense'
                ? '고밀도 리듬'
                : currentProfile.density === 'airy'
                    ? '여유로운 루프'
                    : '표준 펄스';
            detailsEl.textContent = `Density · ${densityLabel} / Mode · ${currentProfile.mode.toUpperCase()} / Keywords ${currentProfile.keywordCount}`;
        }

        renderCode();
    }

    function disposeParts() {
        activeParts.forEach(part => {
            part.stop();
            if (typeof part.dispose === 'function') {
                part.dispose();
            }
        });
        activeParts = [];

        if (padSynth) {
            padSynth.dispose();
            padSynth = null;
        }
        if (bassSynth) {
            bassSynth.dispose();
            bassSynth = null;
        }
    }

    async function buildMusic() {
        if (!currentProfile || !currentBlueprint) {
            updateProfile();
        }

        disposeParts();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = currentProfile.bpm;

        padSynth = new Tone.PolySynth({
            oscillator: { type: currentProfile.mode === 'major' ? 'triangle' : 'sine' },
            envelope: { attack: 0.02, decay: 0.4, sustain: 0.4, release: 1.2 }
        }).toDestination();
        padSynth.volume.value = -12;

        bassSynth = new Tone.MonoSynth({
            oscillator: { type: currentProfile.mode === 'major' ? 'sawtooth' : 'square' },
            filter: { Q: 1, type: 'lowpass', rolloff: -12 },
            envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.5 }
        }).toDestination();
        bassSynth.volume.value = -8;

        const padSequence = new Tone.Sequence((time, note) => {
            padSynth.triggerAttackRelease(note, '2n', time);
        }, currentBlueprint.padNotes, '2n').start(0);

        const bassSequence = new Tone.Sequence((time, note) => {
            if (note) {
                bassSynth.triggerAttackRelease(note, '8n', time);
            }
        }, currentBlueprint.bassNotes, '4n').start(0);

        const kickLoop = new Tone.Loop(time => {
            kick.triggerAttackRelease('C1', '16n', time);
        }, currentBlueprint.kickRate).start(0);

        const hatLoop = new Tone.Loop(time => {
            hat.triggerAttackRelease('16n', time, 0.4);
        }, currentBlueprint.hatRate).start(0);

        activeParts = [padSequence, bassSequence, kickLoop, hatLoop];
    }

    async function startMusic() {
        if (hasStarted) return;
        hasStarted = true;
        try {
            await Tone.start();
            await buildMusic();
            Tone.Transport.start('+0.05');
        } catch (err) {
            console.error('오디오 시작 실패:', err);
            if (summaryEl) {
                summaryEl.textContent = '⚠️ 오디오 권한이 필요합니다. 다시 탭해주세요.';
            }
            hasStarted = false;
        }
    }

    function remixMusic() {
        const variation = Math.round((Math.random() * 2 - 1) * 8);
        updateProfile(variation);
        if (hasStarted) {
            Tone.Transport.stop();
            buildMusic().then(() => Tone.Transport.start('+0.05'));
        }
    }

    panel.addEventListener('pointerdown', () => {
        if (!hasStarted) {
            startMusic();
        } else {
            remixMusic();
        }
    });

    panel.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (!hasStarted) {
                startMusic();
            } else {
                remixMusic();
            }
        }
    });

    updateProfile();
});
