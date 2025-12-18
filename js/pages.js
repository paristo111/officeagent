// window.onload: 화면의 모든 요소(HTML, CSS 등)가 다 로딩된 후에 실행하라는 뜻입니다.
window.onload = function() {
    const world = document.getElementById('world');
    const presetTriggers = document.querySelectorAll('[data-rotate]');
    const scene = document.querySelector('.scene') || document;

    if (!world) {
        console.error("에러: 'world' 아이디를 가진 요소를 찾을 수 없습니다.");
        return;
    }

    let isDragging = false;
    let startX;
    let startY;
    let rotateX = 0;
    let rotateY = 0;

    const applyRotation = () => {
        const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        world.style.transform = transformValue;
    };

    const rotateSteps = {
        text: -90,
        image: 90
    };

    const snapToQuarterTurn = (deg) => Math.round(deg / 90) * 90;

    const rotateRelative = (preset) => {
        const step = rotateSteps[preset];
        if (step === undefined) return;
        rotateX = 0;
        rotateY = snapToQuarterTurn(rotateY) + step;
        applyRotation();
    };

    applyRotation();

    const isInteractiveTarget = (target) => {
        if (!target) return false;
        const element = target instanceof Element ? target : target.parentElement;
        if (!element) return false;
        return Boolean(
            element.closest(
                '[data-rotate], button, a, input, textarea, select, .content, .back-content, .dj-panel, #explain'
            )
        );
    };

    scene.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        if (isInteractiveTarget(event.target)) return;
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        if (scene.setPointerCapture) scene.setPointerCapture(event.pointerId);
    });

    scene.addEventListener('pointermove', (event) => {
        if (!isDragging) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        rotateY += deltaX * 0.5;
        rotateX -= deltaY * 0.5;

        applyRotation();

        startX = event.clientX;
        startY = event.clientY;
    });

    const stopDragging = () => {
        isDragging = false;
    };

    scene.addEventListener('pointerup', stopDragging);
    scene.addEventListener('pointercancel', stopDragging);

    let lastPresetActivationAt = 0;
    const activatePreset = (preset) => {
        const now = Date.now();
        if (now - lastPresetActivationAt < 250) return;
        lastPresetActivationAt = now;
        rotateRelative(preset);
    };

    presetTriggers.forEach((element) => {
        const preset = element.dataset.rotate;
        if (!preset) return;

        element.addEventListener('pointerup', (event) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging = false;
            activatePreset(preset);
        });

        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging = false;
            activatePreset(preset);
        });
    });
}
