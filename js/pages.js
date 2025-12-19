// NOTE: 회전/모드/오디오 같은 동작만 담당합니다.
window.addEventListener('DOMContentLoaded', () => {
    const world = document.getElementById('world');
    const scene = document.querySelector('.scene') || document;
    let axisGizmo = document.querySelector('.axis-gizmo');
    if (!axisGizmo) {
        axisGizmo = document.createElement('div');
        axisGizmo.className = 'axis-gizmo';
        axisGizmo.setAttribute('aria-hidden', 'true');
        document.body.appendChild(axisGizmo);
    }

    axisGizmo.innerHTML = `
        <div class="axis-gizmo__frame">
            <canvas class="axis-gizmo__canvas"></canvas>
        </div>
    `.trim();

    const axisCanvas = axisGizmo.querySelector('.axis-gizmo__canvas');
    const axisCtx = axisCanvas ? axisCanvas.getContext('2d') : null;
    let axisCanvasSize = { w: 0, h: 0, dpr: 1 };

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
    let autoRotateStartTimer = null;

    const stopAutoRotate = () => {
        hasUserInteracted = true;
        isAutoRotating = false;
        if (autoRotateStartTimer) {
            window.clearTimeout(autoRotateStartTimer);
            autoRotateStartTimer = null;
        }
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

    const renderAxisGizmo = () => {
        if (!axisCanvas || !axisCtx) return;

        const rect = axisGizmo.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        const w = Math.max(1, Math.round(rect.width));
        const h = Math.max(1, Math.round(rect.height));

        if (axisCanvasSize.w !== w || axisCanvasSize.h !== h || axisCanvasSize.dpr !== dpr) {
            axisCanvasSize = { w, h, dpr };
            axisCanvas.width = Math.round(w * dpr);
            axisCanvas.height = Math.round(h * dpr);
            axisCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        } else {
            axisCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        const cx = w / 2;
        const cy = h / 2;
        const isDj = document.body.classList.contains('view-dj');

        axisCtx.clearRect(0, 0, w, h);

        axisCtx.save();
        axisCtx.translate(cx, cy);

        const toRad = (deg) => (deg * Math.PI) / 180;
        const rx = toRad(rotateX);
        const ry = toRad(rotateY);

        const rotateVec = (v) => {
            // Match CSS transform order: rotateY then rotateX (right-to-left in `rotateX() rotateY()`).
            const cosy = Math.cos(ry);
            const siny = Math.sin(ry);
            const cosx = Math.cos(rx);
            const sinx = Math.sin(rx);

            const x1 = v.x * cosy + v.z * siny;
            const y1 = v.y;
            const z1 = -v.x * siny + v.z * cosy;

            const x2 = x1;
            const y2 = y1 * cosx - z1 * sinx;
            const z2 = y1 * sinx + z1 * cosx;

            return { x: x2, y: y2, z: z2 };
        };

        const project = (v) => {
            const camera = 3.2;
            const scale = camera / (camera - v.z);
            return { x: v.x * scale, y: -v.y * scale, z: v.z, scale };
        };

        const axisLen = Math.min(w, h) * 0.24;
        const axisColor = isDj ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.92)';
        const axes = [
            { name: 'X', color: axisColor, dir: { x: 1, y: 0, z: 0 } },
            { name: 'Y', color: axisColor, dir: { x: 0, y: 1, z: 0 } },
            { name: 'Z', color: axisColor, dir: { x: 0, y: 0, z: 1 } }
        ];

        const items = axes.map((axis) => {
            const pos = project(rotateVec(axis.dir));
            const neg = project(rotateVec({ x: -axis.dir.x, y: -axis.dir.y, z: -axis.dir.z }));
            return { axis, pos, neg };
        });

        items.sort((a, b) => a.pos.scale - b.pos.scale);

        const drawAxisLine = (end, alpha, color) => {
            axisCtx.beginPath();
            axisCtx.moveTo(0, 0);
            axisCtx.lineTo(end.x * axisLen, end.y * axisLen);
            axisCtx.strokeStyle = color;
            axisCtx.globalAlpha = alpha;
            axisCtx.lineWidth = 2;
            axisCtx.stroke();
        };

        for (const item of items) {
            drawAxisLine(item.neg, 1, axisColor);
        }

        for (const item of items) {
            drawAxisLine(item.pos, 1, item.axis.color);
            axisCtx.globalAlpha = 1;
            axisCtx.font = '700 10px Pretendard, Arial, sans-serif';
            axisCtx.fillStyle = axisColor;
            axisCtx.fillText(
                item.axis.name,
                item.pos.x * axisLen + 6,
                item.pos.y * axisLen + 4
            );
        }

        axisCtx.globalAlpha = 1;
        const originSize = 8;
        axisCtx.fillStyle = axisColor;
        // axisCtx.fillRect(-originSize / 2, -originSize / 2, originSize, originSize);
        axisCtx.lineWidth = 2;
        axisCtx.strokeStyle = isDj ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.75)';
        axisCtx.strokeRect(-originSize / 2, -originSize / 2, originSize, originSize);

        axisCtx.restore();
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
            renderAxisGizmo();
        }
    };

    const applyRotation = () => {
        const transformValue = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        world.style.transform = transformValue;
        updateModeClasses();
        renderAxisGizmo();
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
    window.addEventListener('resize', renderAxisGizmo);

    const isInteractiveTarget = (target) => {
        if (!target) return false;
        const element = target instanceof Element ? target : target.parentElement;
        if (!element) return false;
        return Boolean(
            element.closest(
                '[data-rotate], button, a, input, textarea, select, .axis-gizmo, .back-content, .dj-panel, #explain'
            )
        );
    };

    if (axisGizmo) {
        let isGizmoDragging = false;
        let gizmoStartX = 0;
        let gizmoStartY = 0;

        const stopGizmoDrag = () => {
            isGizmoDragging = false;
            axisGizmo.classList.remove('axis-gizmo--dragging');
        };

        axisGizmo.addEventListener(
            'pointerdown',
            (event) => {
                stopAutoRotate();
                if (event.pointerType === 'mouse' && event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                isGizmoDragging = true;
                gizmoStartX = event.clientX;
                gizmoStartY = event.clientY;
                axisGizmo.classList.add('axis-gizmo--dragging');
                if (axisGizmo.setPointerCapture) axisGizmo.setPointerCapture(event.pointerId);
            },
            { capture: true }
        );

        axisGizmo.addEventListener(
            'pointermove',
            (event) => {
                if (!isGizmoDragging) return;
                event.preventDefault();
                event.stopPropagation();

                const deltaX = event.clientX - gizmoStartX;
                const deltaY = event.clientY - gizmoStartY;

                rotateY += deltaX * 0.5;
                rotateX -= deltaY * 0.5;

                applyRotation();

                gizmoStartX = event.clientX;
                gizmoStartY = event.clientY;
            },
            { capture: true }
        );

        axisGizmo.addEventListener('pointerup', stopGizmoDrag, { capture: true });
        axisGizmo.addEventListener('pointercancel', stopGizmoDrag, { capture: true });
    }

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
        let lastAt = performance.now();
        const speedDegPerSec = 1.2;
        const delayMs = 5000;

        const tick = (now) => {
            if (!isAutoRotating || hasUserInteracted) return;
            const dt = Math.min(0.05, (now - lastAt) / 1000);
            lastAt = now;
            rotateY -= speedDegPerSec * dt;
            applyRotation();
            requestAnimationFrame(tick);
        };

        autoRotateStartTimer = window.setTimeout(() => {
            if (hasUserInteracted) return;
            isAutoRotating = true;
            lastAt = performance.now();
            requestAnimationFrame(tick);
        }, delayMs);
    }
});
