// window.onload: 화면의 모든 요소(HTML, CSS 등)가 다 로딩된 후에 실행하라는 뜻입니다.
window.onload = function() {
    const world = document.getElementById('world');
    const presetTriggers = document.querySelectorAll('[data-rotate]');

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

    const randomRange = (min, max) => Math.random() * (max - min) + min;

    const rotateSteps = {
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

    applyRotation();

    document.addEventListener('mousedown', (event) => {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        document.body.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging) return;

        const deltaX = event.clientX - startX;
        const deltaY = event.clientY - startY;

        rotateY += deltaX * 0.5;
        rotateX -= deltaY * 0.5;

        applyRotation();

        startX = event.clientX;
        startY = event.clientY;
    });

    document.addEventListener('mouseup', () => {
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
            rotateRelative(preset);
        });
    });

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const placeImageInRange = (container, card, minRatio, maxRatio) => {
        if (!container || !card) return;

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 500;
        const aspectRatio = 4 / 3;
        const cardWidth = card.offsetWidth || width * 0.28;
        const cardHeight = cardWidth / aspectRatio;

        const minX = width * minRatio;
        const maxX = Math.max(minX, width * maxRatio - cardWidth);
        const jitterX = Math.max(width * 0.02, 12);
        const jitterY = Math.max(height * 0.12, 24);
        const extraRight = width * 0.05;
        const centerY = height * 0.5;

        let left = randomRange(minX, maxX + extraRight) + randomRange(-jitterX, jitterX);
        let top = centerY - cardHeight / 2 + randomRange(-jitterY, jitterY);

        left = clamp(left, 0, width - cardWidth);
        top = clamp(top, 0, height - cardHeight);

        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
    };

    const scatterImagesOnBack = () => {
        const container = document.getElementById('imagesContainer');
        if (!container) return;

        requestAnimationFrame(() => {
            // 중앙 YZ 평면: 가로 34~66%
            const mainCard = container.querySelector('#img2');
            placeImageInRange(container, mainCard, 0.34, 0.66);

            // 좌측 YZ 평면: 5~33%
            const leftPlane = document.querySelector('.plane-yz-offset-left');
            if (leftPlane) {
                const leftContainer = leftPlane.querySelector('.back-content');
                const leftCard = leftPlane.querySelector('.image-card');
                placeImageInRange(leftContainer, leftCard, 0.05, 0.33);
            }

            // 우측 YZ 평면: 67~95%
            const rightPlane = document.querySelector('.plane-yz-offset-right');
            if (rightPlane) {
                const rightContainer = rightPlane.querySelector('.back-content');
                const rightCard = rightPlane.querySelector('.image-card');
                placeImageInRange(rightContainer, rightCard, 0.67, 0.95);
            }
        });
    };

    scatterImagesOnBack();
    window.addEventListener('resize', scatterImagesOnBack);
}
