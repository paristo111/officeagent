// window.onload: 화면의 모든 요소(HTML, CSS 등)가 다 로딩된 후에 실행하라는 뜻입니다.
// NOTE: DOM(HTML 구조)은 건드리지 않고, 회전/모드/오디오 같은 동작만 담당합니다.
window.onload = function () {
    const world = document.getElementById('world');
    const scene = document.querySelector('.scene') || document;

    if (!world) {
        console.error("에러: 'world' 아이디를 가진 요소를 찾을 수 없습니다.");
        return;
    }

    const presetTriggers = Array.from(document.querySelectorAll('[data-rotate]'));

    let isDragging = false;
    let startX;
    let startY;
    let rotateX = 0;
    let rotateY = 0;
    let lastIsDj = null;
    let hasUserInteracted = false;
    let isAutoRotating = false;

    const stopAutoRotate = () => {
        hasUserInteracted = true;
        isAutoRotating = false;
    };

    const setDjBackgroundFromHero = () => {
        const setDjBg = (url) => {
            if (!url) return;
            document.documentElement.style.setProperty('--dj-bg-image', `url("${url}")`);
        };

        const resolveUrl = (maybeUrl) => {
            if (!maybeUrl) return null;
            try {
                return new URL(maybeUrl, window.location.href).href;
            } catch {
                return maybeUrl;
            }
        };

        const tryImageCandidates = (candidates) => {
            if (!Array.isArray(candidates) || candidates.length === 0) return;

            let resolved = false;
            const tryAt = (idx) => {
                if (resolved) return;
                if (idx >= candidates.length) return;
                const candidate = resolveUrl(candidates[idx]);
                if (!candidate) return tryAt(idx + 1);

                const img = new Image();
                img.onload = () => {
                    resolved = true;
                    setDjBg(candidate);
                };
                img.onerror = () => tryAt(idx + 1);
                img.src = candidate;
            };

            tryAt(0);
        };

        const heroImg = document.querySelector('#img1 img');
        if (heroImg) {
            const src = heroImg.getAttribute('src') || heroImg.src;
            const resolved = resolveUrl(heroImg.src || src);
            if (resolved) setDjBg(resolved);
            return;
        }

        const heroVideo = document.querySelector('#img1 video');
        if (heroVideo) {
            const poster = heroVideo.getAttribute('poster');
            if (poster) {
                const resolved = resolveUrl(poster);
                if (resolved) setDjBg(resolved);
                return;
            }
        }

        const pathname = (window.location.pathname || '').toLowerCase();
        const filename = pathname.split('/').pop() || '';
        const slug = filename.replace(/\.html?$/i, '').trim();
        if (!slug) return;

        let folder = slug;
        const videoSourceEl = document.querySelector('#img1 video source');
        if (videoSourceEl) {
            const videoSrc = videoSourceEl.getAttribute('src') || '';
            const match = videoSrc.match(/\/img\/([^/]+)\//i);
            if (match && match[1]) folder = match[1];
        }

        const exts = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
        const candidates = [];
        for (let n = 1; n <= 12; n += 1) {
            for (const ext of exts) {
                candidates.push(`/img/${folder}/${folder}${n}.${ext}`);
            }
        }

        tryImageCandidates(candidates);
    };

    const applyDjVolume = (isDj) => {
        if (typeof Tone === 'undefined') return;
        if (!Tone.Destination || !Tone.Destination.volume) return;

        const quietDb = -30;
        const djDb = -20;
        const target = isDj ? djDb : quietDb;

        try {
            if (typeof Tone.Destination.volume.rampTo === 'function') {
                Tone.Destination.volume.rampTo(target, 0.25);
            } else {
                Tone.Destination.volume.value = target;
            }
        } catch (e) {
            // ignore
        }
    };

    const normalizeAngle = (deg) => {
        const normalized = deg % 360;
        return normalized < 0 ? normalized + 360 : normalized;
    };

    const updateModeClasses = () => {
        const angleY = normalizeAngle(rotateY);
        const angleX = normalizeAngle(rotateX);
        const distY180 = Math.abs(angleY - 180);
        const distX0 = Math.min(angleX, 360 - angleX);
        const isDj = distY180 <= 25 && distX0 <= 25;

        document.body.classList.toggle('view-dj', isDj);

        if (lastIsDj !== isDj) {
            lastIsDj = isDj;
            applyDjVolume(isDj);
        }
    };

    const applyRotation = () => {
        const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        world.style.transform = transformValue;
        updateModeClasses();
    };

    const rotateToY = (targetY) => {
        stopAutoRotate();
        rotateX = 0;
        rotateY = targetY;
        applyRotation();
    };

    const targetYFromTrigger = (element) => {
        if (!element) return null;

        const label = (element.textContent || '').trim().toLowerCase();
        if (label === 'music' || label === 'bgm') return 180;
        if (label === 'title') return 0;
        if (label === 'text' || label.includes('텍스트')) return -90;
        if (label === 'image' || label.includes('이미지')) return 90;

        const preset = element.dataset.rotate;
        if (preset === 'text') return -90;
        if (preset === 'image') return 90;

        return null;
    };

    applyRotation();
    setDjBackgroundFromHero();

    const isInteractiveTarget = (target) => {
        if (!target) return false;
        const element = target instanceof Element ? target : target.parentElement;
        if (!element) return false;
        return Boolean(
            element.closest(
                '[data-rotate], button, a, input, textarea, select, .back-content, .dj-panel, #explain'
            )
        );
    };

    scene.addEventListener('pointerdown', (event) => {
        stopAutoRotate();
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
    const activatePreset = (element) => {
        const now = Date.now();
        if (now - lastPresetActivationAt < 250) return;
        lastPresetActivationAt = now;
        const targetY = targetYFromTrigger(element);
        if (typeof targetY === 'number') rotateToY(targetY);
    };

    presetTriggers.forEach((element) => {
        element.addEventListener('pointerup', (event) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging = false;
            activatePreset(element);
        });

        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            isDragging = false;
            activatePreset(element);
        });
    });

    const titleTop = document.getElementById('titleTop');
    if (titleTop) {
        titleTop.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.reload();
        });
    }

    const shouldAutoRotate = window.location.pathname.includes('/html/');
    if (shouldAutoRotate) {
        isAutoRotating = true;
        let lastAt = performance.now();
        const speedDegPerSec = 1.2;

        const tick = (now) => {
            if (!isAutoRotating || hasUserInteracted) return;
            const dt = Math.min(0.05, (now - lastAt) / 1000);
            lastAt = now;
            rotateY -= speedDegPerSec * dt;
            applyRotation();
            requestAnimationFrame(tick);
        };

        requestAnimationFrame((now) => {
            lastAt = now;
            requestAnimationFrame(tick);
        });
    }
};
