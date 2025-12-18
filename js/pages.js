
// window.onload: 화면의 모든 요소(HTML, CSS 등)가 다 로딩된 후에 실행하라는 뜻입니다.
window.onload = function() {
    
    const world = document.getElementById('world');
    const axisIndicator = document.getElementById('axisIndicator');
    const presetTriggers = document.querySelectorAll('[data-rotate]');
    const axisNavButtons = document.querySelectorAll('.axis-nav-btn');
    
    // 안전장치: 만약 world를 못 찾았다면 에러를 띄우고 멈춥니다.
    if (!world) {
        console.error("에러: 'world' 아이디를 가진 요소를 찾을 수 없습니다.");
        return; 
    }

    let isDragging = false;
    let startX, startY;
    let rotateX = 0;
    let rotateY = 0;

    const applyRotation = () => {
        const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        world.style.transform = transformValue;
        if (axisIndicator) {
            axisIndicator.style.transform = transformValue;
        }
        axisNavButtons.forEach((button) => {
            button.style.transform = `rotateY(${-rotateY}deg) rotateX(${-rotateX}deg)`;
        });
    };

    const rotateSteps = {
        text: -90,  // 텍스트 버튼은 오른쪽(시계방향)으로 90도
        image: 90   // 이미지 버튼은 왼쪽(반시계방향)으로 90도
    };

    const absoluteAngles = {
        title: 0,
        text: -90,
        image: 90
    };

    const rotateRelative = (preset) => {
        const step = rotateSteps[preset];
        if (step === undefined) return;
        rotateX = 0;
        rotateY += step;
        applyRotation();
    };

    const rotateToPreset = (preset) => {
        const target = absoluteAngles[preset];
        if (target === undefined) return;
        rotateX = 0;
        rotateY = target;
        applyRotation();
    };

    applyRotation();

    // 마우스 클릭
    document.addEventListener('mousedown', function(e) {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        document.body.style.cursor = 'grabbing';
    });

    // 마우스 이동
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        rotateY += deltaX * 0.5;
        rotateX -= deltaY * 0.5;

        applyRotation();

        startX = e.clientX;
        startY = e.clientY;
    });

    // 마우스 뗌
    document.addEventListener('mouseup', function() {
        isDragging = false;
        document.body.style.cursor = 'default';
    });

    presetTriggers.forEach((element) => {
        const preset = element.dataset.rotate;
        if (!preset) return;
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging = false;
            document.body.style.cursor = 'default';
            const mode = element.dataset.rotateMode || 'relative';
            if (mode === 'absolute') {
                rotateToPreset(preset);
            } else {
                rotateRelative(preset);
            }
        });
    });
};
