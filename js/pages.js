// window.onload: 화면의 모든 요소(HTML, CSS 등)가 다 로딩된 후에 실행하라는 뜻입니다.
window.onload = function() {
    const world = document.getElementById('world');
    const scene = document.querySelector('.scene') || document;

    if (!world) {
        console.error("에러: 'world' 아이디를 가진 요소를 찾을 수 없습니다.");
        return;
    }

    const ensureFixedLabels = () => {
        const body = document.body;
        if (!body) return;

        const nameBottom = document.getElementById('nameBottom');
        const titleTop = document.getElementById('titleTop');
        const nameTop = document.getElementById('nameTop');
        const titleBottom = document.getElementById('titleBottom');

        const ensureLabel = (id) => {
            let el = document.getElementById(id);
            if (el) return el;
            el = document.createElement('div');
            el.className = 'fixed-label';
            el.id = id;
            body.insertBefore(el, body.firstChild);
            return el;
        };

        const nameLabel = ensureLabel('nameBottom');
        const titleLabel = ensureLabel('titleTop');

        if (!nameLabel.textContent.trim() && nameTop?.textContent) {
            nameLabel.textContent = nameTop.textContent.trim();
        }

        if (!titleLabel.textContent.trim() && titleBottom?.textContent) {
            titleLabel.textContent = titleBottom.textContent.trim();
        }

        if (nameTop) nameTop.style.display = 'none';
        if (titleBottom) titleBottom.style.display = 'none';
        if (nameBottom && nameBottom !== nameLabel) nameBottom.style.display = '';
        if (titleTop && titleTop !== titleLabel) titleTop.style.display = '';
    };

    const ensurePlaneXyStructure = () => {
        const plane = document.querySelector('.plane.plane-xy');
        if (!plane) return;

        let front = plane.querySelector('.plane-face.plane-front');
        let back = plane.querySelector('.plane-face.plane-back');

        if (!front || !back) {
            const content = plane.querySelector('.content');
            front = document.createElement('div');
            front.className = 'plane-face plane-front';
            if (content) front.appendChild(content);

            back = document.createElement('div');
            back.className = 'plane-face plane-back';

            plane.innerHTML = '';
            plane.appendChild(front);
            plane.appendChild(back);
        }

        let textBtn = front.querySelector('#textB');
        if (!textBtn) {
            textBtn = document.createElement('div');
            textBtn.id = 'textB';
            front.insertBefore(textBtn, front.firstChild);
        }
        textBtn.className = 'axis-label interactive';
        textBtn.dataset.rotate = 'text';
        textBtn.textContent = 'text';

        let imgBtn = front.querySelector('#imgB');
        if (!imgBtn) {
            imgBtn = document.createElement('div');
            imgBtn.id = 'imgB';
            front.insertBefore(imgBtn, front.firstChild?.nextSibling || null);
        }
        imgBtn.className = 'axis-label interactive';
        imgBtn.dataset.rotate = 'image';
        imgBtn.textContent = 'image';

        let djRight = back.querySelector('.dj-nav-right');
        if (!djRight) {
            djRight = document.createElement('div');
            djRight.className = 'axis-label interactive dj-nav dj-nav-right';
            back.insertBefore(djRight, back.firstChild);
        }
        djRight.dataset.rotate = 'text';
        djRight.textContent = 'image';

        let djLeft = back.querySelector('.dj-nav-left');
        if (!djLeft) {
            djLeft = document.createElement('div');
            djLeft.className = 'axis-label interactive dj-nav dj-nav-left';
            back.insertBefore(djLeft, djRight.nextSibling);
        }
        djLeft.dataset.rotate = 'image';
        djLeft.textContent = 'text';

        if (!back.querySelector('#djCode')) {
            const backContent = document.createElement('div');
            backContent.className = 'back-content back-content--editor';
            backContent.innerHTML = `
                <div class="dj-editor" aria-label="Office DJ code">
                    <pre class="dj-editor__pre"><code id="djCode">// loading...</code></pre>
                </div>
            `;
            back.appendChild(backContent);
        }
    };

    const ensurePlaneYzStructure = () => {
        const plane = document.querySelector('.plane.plane-yz');
        if (!plane) return;

        let front = plane.querySelector('.plane-face.plane-front');
        let back = plane.querySelector('.plane-face.plane-back');
        const content = plane.querySelector('.content');

        if (!front || !back) {
            front = document.createElement('div');
            front.className = 'plane-face plane-front';
            if (content) front.appendChild(content);

            back = document.createElement('div');
            back.className = 'plane-face plane-back';
            const backContent = document.createElement('div');
            backContent.className = 'content back-content';
            back.appendChild(backContent);

            plane.innerHTML = '';
            plane.appendChild(front);
            plane.appendChild(back);
        }

	        const ensureNav = (face, rightText, leftText) => {
	            let right =
	                face.querySelector('.yz-nav-right') ||
	                Array.from(face.querySelectorAll('.axis-label.interactive[data-rotate="text"]')).find(
	                    (el) => el.style.right === '10px' && el.style.top === '50%'
	                );
	            if (!right) {
	                right = document.createElement('div');
	                right.className = 'axis-label interactive yz-nav-right';
	                right.style.top = '50%';
	                right.style.right = '10px';
	                face.insertBefore(right, face.firstChild);
	            }
	            right.dataset.rotate = 'text';
	            right.textContent = rightText;
	            right.classList.add('yz-nav-right');

            let left =
                face.querySelector('.yz-nav-left') ||
                Array.from(face.querySelectorAll('.axis-label.interactive[data-rotate="image"]')).find(
                    (el) => el.style.left === '10px' && el.style.top === '50%'
                );
	            if (!left) {
	                left = document.createElement('div');
	                left.className = 'axis-label interactive yz-nav-left';
	                left.style.top = '50%';
	                left.style.left = '10px';
	                face.insertBefore(left, right.nextSibling);
	            }
	            left.dataset.rotate = 'image';
	            left.textContent = leftText;
	            left.classList.add('yz-nav-left');
	        };

        ensureNav(front, 'music', 'title');
        ensureNav(back, 'title', 'music');
    };

    ensureFixedLabels();
    ensurePlaneXyStructure();
    ensurePlaneYzStructure();

    const presetTriggers = document.querySelectorAll('[data-rotate]');

    let isDragging = false;
    let startX;
    let startY;
    let rotateX = 0;
    let rotateY = 0;
    let lastIsDj = null;

    const setDjBackgroundFromHero = () => {
        const heroImg = document.querySelector('#img1 img');
        if (!heroImg) return;
        const src = heroImg.getAttribute('src') || heroImg.src;
        if (!src) return;
        const resolved = heroImg.src || src;
        document.documentElement.style.setProperty('--dj-bg-image', `url("${resolved}")`);
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
    setDjBackgroundFromHero();

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
