// =======================================================
// === JAVASCRIPT: TONE.JS + MONACO LOGIC (분리됨) ===
// =======================================================

// --- 0. DOM 및 상수 정의 ---
const generateButton = document.getElementById('generate-button');
const missionText = document.getElementById('mission-text');
const statusMessage = document.getElementById('status-message');
const webcamFeed = document.getElementById('webcam-feed');
const toggleButton = document.getElementById('toggle-view');
const djButton = document.getElementById('toggle-dj'); // 🎛 Live DJing 버튼

let editor = null; 
let bassSynth; 

// 페이지 로드 시 확실히 기본 모드로 설정
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.remove('live-mode');
    document.body.classList.remove('dj-mode');
});

// --- 1. Tone.js 악기 및 이펙터 설정 (글로벌) ---
const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05, 
    octaves: 2, 
    envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 0.6 }
}).toDestination();
kick.volume.value = -6;

const hihat = new Tone.NoiseSynth({ 
    noise: { type: 'white' }, 
    envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
}).toDestination();
hihat.volume.value = -12;

const reverb = new Tone.Reverb(5).toDestination(); 
const filter = new Tone.Filter(20000, 'lowpass').toDestination(); 
const crusher = new Tone.BitCrusher(1).toDestination(); 

kick.chain(filter, crusher, Tone.Destination);
hihat.chain(reverb, Tone.Destination);

// --- 2. 음악적 데이터 매핑 ---
const spaceData = [
    { text: "카페",           reverb: 0.1,  filterFreq: 12000, desc: "약한 잔향." },
    { text: "집 (방문 닫고)", reverb: 0.01, filterFreq: 8000,  desc: "드라이하고 포커스됨." },
    { text: "야외 벤치",      reverb: 0.5,  filterFreq: 18000, desc: "광활한 잔향." },
    { text: "물리치료실",     reverb: 0.3,  filterFreq: 5000,  desc: "중간 잔향." },
    { text: "코인노래방 부스", reverb: 0.8, filterFreq: 2000,  desc: "과도한 잔향." }
];

const timeData = [
    { text: "밤에 2시간 동안",      bpm: 128, density: '4n',  desc: "안정적인 미드 템포." },
    { text: "새벽에 20분 동안",     bpm: 135, density: '8n',  desc: "빠르고 고밀도의 템포." },
    { text: "아침에 5분씩 끊어서",  bpm: 122, density: '4n',  desc: "느긋한 템포." },
    { text: "수업 직전에 4시간 동안", bpm: 138, density: '16n', desc: "최고 속도." }
];

const toolData = [
    { text: "블렌더",      bassOscillator: 'square',  bassFreq: 'C2',  desc: "메탈릭한 스퀘어 베이스." },
    { text: "피그마",      bassOscillator: 'sine',    bassFreq: 'D#2', desc: "부드러운 사인파 베이스." },
    { text: "비주얼 스튜디오", bassOscillator: 'sawtooth', bassFreq: 'A1',  desc: "묵직한 톱니파 베이스." },
    { text: "그림판",      bassOscillator: 'pulse',   bassFreq: 'F#2', desc: "날카로운 펄스파." }
];

const styleData = [
    { text: "커피를 마시며",      swing: 0,    desc: "정확한 4/4 박자." },
    { text: "엉덩이를 흔들며",    swing: 0.15, desc: "스윙 적용." },
    { text: "복식호흡을 하며",    swing: 0.05, desc: "미세한 스윙." },
    { text: "술에 취한 상태에서", swing: 0.25, desc: "과도한 스윙." }
];

const constraintData = [
    { text: "마감 효율을 최대로 끌어올려서",   crush: 8,  desc: "강력한 BitCrusher (8)." },
    { text: "인터넷 없이",                     crush: 4,  desc: "중간 BitCrusher (4)." },
    { text: "특별한 제한 조건 없이",           crush: 1,  desc: "BitCrusher Off (1)." },
    { text: "교수님을 비난하며(맹렬하게)",     crush: 16, desc: "극단적인 왜곡." }
];

function getRandomElement(arr) { 
    return Math.random() < 1 && arr[Math.floor(Math.random() * arr.length)];
}

// --- 3. 음악 생성 코드 (Monaco에 삽입될 템플릿) ---
function generateCode(p) {
    const startNow = 'Tone.Transport.now()'; 
    
    return `// ----------------------------------------------------
// [TODAY'S TECHNO MISSION]
// SPACE: ${p.space.desc}
// TEMPO: ${p.time.desc} (${p.time.bpm} BPM)
// BASS: ${p.tool.desc} (${p.tool.bassOscillator})
// GROOVE: ${p.style.desc} (Swing: ${p.style.swing})
// INTENSITY: ${p.constraint.desc} (Crusher: ${p.constraint.crush})
// ----------------------------------------------------

// 1. GLOBAL PARAMETER SETTING
Tone.Transport.bpm.value = ${p.time.bpm}; 
Tone.Transport.swing = ${p.style.swing}; 
Tone.Transport.swingSubdivision = '8n';

// 2. FX SETTING
reverb.decay = ${p.space.reverb * 5 > 0.01 ? p.space.reverb * 5 : 0.01}; 
filter.frequency.value = ${p.space.filterFreq}; 
crusher.bits = ${p.constraint.crush};

// 3. INSTRUMENT OVERHAUL
bassSynth = new Tone.FMSynth({
    harmonicity: 3.0, modulationIndex: 10,
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 },
    carrier: { oscillator: { type: '${p.tool.bassOscillator}' } } 
}).toDestination();
bassSynth.chain(filter, Tone.Destination); 
bassSynth.volume.value = -10; 


// 4. CORE BEAT LOOP DEFINITION
const kickLoop = new Tone.Loop(time => {
    kick.triggerAttackRelease('C1', '8n', time);
}, '4n').start(${startNow});

const hihatLoop = new Tone.Loop(time => {
    hihat.triggerAttackRelease('16n', time, 0.5); 
}, '${p.time.density}').start(${startNow}); 

const bassPattern = ['${p.tool.bassFreq}', null, '${p.tool.bassFreq}', null, 'G1', null, 'G1', null];
const bassSeq = new Tone.Sequence((time, note) => {
    if (note) {
        bassSynth.triggerAttackRelease(note, '8n', time);
    }
}, bassPattern, '4n').start(${startNow}); 
`;
}

// --- 4. 코드 실행 함수 (Monaco / DJ 모드 공통 사용) ---
function runCode(code) {
    if (document.body.classList.contains('live-mode')) {
        console.log('EXECUTING...');
    } else {
        statusMessage.textContent = 'EXECUTING...';
    }
    
    Tone.Transport.cancel(0); 

    try {
        eval(code); 
        if (!document.body.classList.contains('live-mode')) {
            statusMessage.textContent = '';
        }
    } catch (err) {
        if (!document.body.classList.contains('live-mode')) {
            statusMessage.textContent = `CODE ERROR: ${err.message}. Check Console.`;
        }
        console.error("--- LIVE CODING EXECUTION ERROR ---", err);
    }
}

// --- 5. 미션 생성 + 랜덤 음악 실행 ---
async function generateMission() {
    if (Tone.Transport.state !== 'started') {
        try {
            await Tone.start(); 
        } catch (e) {
            statusMessage.textContent = 'ERROR: Cannot start AudioContext. Click the button again!';
            return;
        }
    }
    
    Tone.Transport.start();

    const selectedSpace = getRandomElement(spaceData);
    const selectedTime = getRandomElement(timeData);
    const selectedTool = getRandomElement(toolData);
    const selectedStyle = getRandomElement(styleData);
    const selectedConstraint = getRandomElement(constraintData); 

    const missionParams = {
        space: selectedSpace, 
        time: selectedTime, 
        tool: selectedTool,
        style: selectedStyle, 
        constraint: selectedConstraint
    };

    const missionHTML = `
        <strong>[오늘의 오피스 미션]</strong><br>
        <span>${selectedSpace.text}</span>에서, <span>${selectedTime.text}</span> <span>${selectedTool.text}</span> 작업을 진행하세요.<br>
        작업은 <span>${selectedStyle.text}</span> 진행하며, <span>${selectedConstraint.text}</span> 완료해야 합니다.
    `;
    
    missionText.innerHTML = missionHTML;
    
    const generatedCode = generateCode(missionParams);
    
    if (editor) {
        editor.setValue(generatedCode);
    }

    runCode(generatedCode);
}

// --- 6. 웹캠 및 토글 로직 ---
let mediaStream = null;

async function startWebcam() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Error: Your browser does not support webcam access.");
        return;
    }
    
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        webcamFeed.srcObject = mediaStream;
        webcamFeed.play();
    } catch (err) {
        console.error("Error: Webcam access denied. Check browser permissions.");
    }
}

function stopWebcam() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
    }
}

// 🎥 Live Coding View: 웹캠 / 블루 스크린만 담당
function toggleView() {
    const isLiveMode = document.body.classList.toggle('live-mode');

    if (isLiveMode) {
        startWebcam();
        if (toggleButton) toggleButton.textContent = "기본 화면";
        if (editor) editor.layout(); 
    } else {
        stopWebcam();
        if (toggleButton) toggleButton.textContent = "🎥";
        if (editor) editor.layout();
    }
}

// 🎛 Live DJing: Monaco 에디터 / 오디오 그래픽 담당 (live-mode와 독립)
function toggleDJ() {
    const isDJMode = document.body.classList.toggle('dj-mode');

    if (isDJMode) {
        if (djButton) djButton.textContent = "⏹ 디제잉 그만";
        if (editor) editor.layout();
    } else {
        if (djButton) djButton.textContent = "🎛 Live DJing";
    }
}

// --- 7. Monaco Editor 초기화 (Live/DJ 모드와 분리) ---
require.config({ 
    paths: { 
        'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' 
    }
});

require(['vs/editor/editor.main'], function() {

    // 1. BSOD 커스텀 테마 정의
    monaco.editor.defineTheme('bsodTheme', {
        base: 'vs-dark',
        inherit: true,
        rules: [
            { token: '',          foreground: 'FFFFFF' }, // 기본 텍스트
            { token: 'keyword',   foreground: 'FFFF00' }, // 키워드
            { token: 'string',    foreground: '00FFFF' }, // 문자열
            { token: 'number',    foreground: '00FFFF' }, // 숫자
            { token: 'comment',   foreground: 'AAAAAA' }, // 주석
            { token: 'identifier',foreground: 'FFFFFF' }, // 함수 이름 등
        ],
        
        colors: {
            'editor.background': '#00000000',
            'editor.foreground': '#FFFFFF',
            'editorLineNumber.foreground': '#FFFF00',
            'editorCursor.foreground': '#FFFFFF',
            'minimap.background': '#00000033',
            'scrollbarSlider.background': '#FFFFFF33',
            'scrollbarSlider.hoverBackground': '#FFFFFF66',
            'scrollbarSlider.activeBackground': '#FFFFFF99',
        }
    });

    // 2. Monaco Editor 생성 (DJ 모드에서만 CSS로 보이게 제어)
    editor = monaco.editor.create(document.getElementById('editor-container'), {
        value: '// Click the button to generate an office!',
        language: 'javascript',
        theme: 'bsodTheme',
        fontSize: 16,
        automaticLayout: true,
        minimap: { enabled: true, side: 'right' } 
    });
    
    // 3. Ctrl+Enter / Cmd+Enter 실행 커맨드
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function() {
        const codeToRun = editor.getValue();
        runCode(codeToRun);
    });

    // 4. 이벤트 리스너 연결 (null 체크 추가)
    if (generateButton) {
        generateButton.addEventListener('click', generateMission);
    }
    if (toggleButton) {
        toggleButton.addEventListener('click', toggleView);
    }
    if (djButton) {
        djButton.addEventListener('click', toggleDJ);
    } else {
        console.warn('⚠️ djButton(#toggle-dj)이 HTML에 없습니다. Live DJing 버튼을 추가하거나 JS에서 제거하세요.');
    }
});
