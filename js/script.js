    // ------------------------------------------
    // 사람(작은 사각형) 10명을 만들어 땅 위에서 걷게 하기
    // ------------------------------------------
    const PEOPLE_COUNT = 16;
    const PERSON_WIDTH = 5; // CSS .person width와 동일하게 유지
    const persons = [];
    const scene = document.getElementById("scene");

    // 사람 생성 함수
    function createPeople() {
      const viewportWidth = window.innerWidth;

      for (let i = 0; i < PEOPLE_COUNT; i++) {
        const el = document.createElement("div");
        el.className = "person";

        // 시작 x 위치: 화면 내 임의의 곳
        const startX = Math.random() * viewportWidth;

        // 방향: -1(왼쪽) 또는 1(오른쪽) 중 하나
        const dir = Math.random() < 0.5 ? -1 : 1;

        // 속도: 1초에 20~40px 정도 (걷는 느낌)
        const speed = 20 + Math.random() * 20;

        // 방향 전환 예정 시각 (ms 단위 타임스탬프)
        const now = performance.now();
        const nextTurn =
          now + 1000 + Math.random() * 4000; // 1~5초 사이에 한 번씩 방향 바꿀 기회

        scene.appendChild(el);

        const person = {
          el,
          x: startX,
          dir,
          speed,
          nextTurn,
        };

        el.style.left = person.x + "px";
        persons.push(person);
      }
    }

    // 애니메이션 루프 (requestAnimationFrame 사용)
    let lastTime = null;

    function animate(timestamp) {
      if (!lastTime) lastTime = timestamp;
      const dt = (timestamp - lastTime) / 1000; // 초 단위 delta time
      lastTime = timestamp;

      const width = window.innerWidth;

      persons.forEach((p) => {
        // 일정 시간마다 방향을 랜덤하게 바꿀 기회 부여
        if (timestamp > p.nextTurn) {
          if (Math.random() < 0.5) {
            p.dir *= -1; // 50% 확률로 방향 전환
          }
          p.nextTurn =
            timestamp + 1000 + Math.random() * 4000; // 다음 전환 시각 예약
        }

        // x 위치 갱신 (속도 * 방향 * 시간)
        p.x += p.dir * p.speed * dt;

        // 화면 밖으로 나가면 반대쪽에서 다시 등장
        if (p.x < -PERSON_WIDTH) {
          p.x = width;
        } else if (p.x > width) {
          p.x = -PERSON_WIDTH;
        }

        // 실제 DOM 요소 위치 반영
        p.el.style.left = p.x + "px";
      });

      requestAnimationFrame(animate);
    }

    // 창 크기가 바뀌더라도 최소한 화면을 벗어나지 않게 정리 (선택 사항)
    window.addEventListener("resize", () => {
      const width = window.innerWidth;
      persons.forEach((p) => {
        if (p.x > width) {
          p.x = width - PERSON_WIDTH;
        }
      });
    });

    // 초기화 및 애니메이션 시작
    createPeople();
    requestAnimationFrame(animate);

    // ------------------------------------------
    // [추가 기능] 흐르는 텍스트 생성 및 관리
    // ------------------------------------------
    
    const textConfig = {
      // 동시 등장 개수 (요청사항: 5개)
      count: 3, 
      // 텍스트 목록
      messages: [
        "매물 있습니다. 7개 사무실 선택 가능합니다. 눌러보시고 편하게 문의주세요.",
        "사무실 임대 룸 17개 계약완료. 7개 즉시 입주 가능.",
        "매물 있습니다! 직접 눌러보세요!", "바로 눌러보세요!",
        "온라인 무빙 오피스입니다. 지금 바로 눌러주세요!",
        "오프라인 무빙 오피스는 12월 19일부터 12월 21일까지 서울대학교 49동, 디자인연구동에서 진행됩니다.",
        "새로 만든 단기 사무실 임대 공간 7개! 관악 전문! 눌러보세요!",
        "전용 무제한 평방 픽셀, 넓은 개방형 업무공간, 채광/환기 우수, 즉시 누르기 가능!",
        "사무실 단기임대 합리적인 최적의 풀옵션 시설! 눌러보세요!",
        "무보증 사무실 단기임대 12월 19일부터 21일까지!"
      ],
      // 생성 높이 (화면 상단 5% ~ 50%)
      topRange: { min: 5, max: 75 },
      // 이동 속도 (초 단위, 숫자가 클수록 느림)
      duration: { min: 20, max: 25 }
    };

    /**
     * 개별 텍스트 요소를 생성하고 애니메이션을 설정하는 함수
     * @param {boolean} isInitial - 초기 실행 여부 (true면 화면 안쪽 랜덤 위치에서 시작)
     */
    function spawnSingleText(isInitial = false) {
      const el = document.createElement("div");
      el.className = "floating-text";

      // 1. 내용 랜덤 선택
      const randomMsgIndex = Math.floor(Math.random() * textConfig.messages.length);
      el.textContent = textConfig.messages[randomMsgIndex];

      // 2. 높이 랜덤 설정 (vh)
      const randomTop = textConfig.topRange.min + Math.random() * (textConfig.topRange.max - textConfig.topRange.min);
      el.style.top = randomTop + "vh";

      // 3. 속도(지속시간) 랜덤 설정
      const randomDuration = textConfig.duration.min + Math.random() * (textConfig.duration.max - textConfig.duration.min);
      
      // 4. 애니메이션 설정
      // linear: 일정한 속도, forwards: 끝난 후 상태 유지
      el.style.animationName = "moveLeft";
      el.style.animationDuration = `${randomDuration}s`;
      el.style.animationTimingFunction = "linear";
      el.style.animationFillMode = "forwards";

      // [핵심 로직] 초기 실행 시 화면 안쪽 랜덤 위치 잡기
      if (isInitial) {
        // 전체 지속 시간 중 임의의 시간만큼 '이미 지났다'고 설정 (음수 delay)
        // 예: 20초짜리 애니메이션에 -10초 delay를 주면 화면 정중앙에서 시작함
        const randomDelay = -Math.random() * randomDuration;
        el.style.animationDelay = `${randomDelay}s`;
      } else {
        // 초기 실행이 아니면 오른쪽 끝에서 정상적으로 대기 없이 시작
        el.style.animationDelay = "0s";
      }

      // 5. 씬에 추가
      document.getElementById("scene").appendChild(el);

      // 6. 애니메이션 종료 후 처리 (순환 구조)
      // 화면 왼쪽으로 완전히 사라지면 요소를 지우고, 즉시 새로운 텍스트를 오른쪽 끝에서 생성함
      el.addEventListener("animationend", () => {
        el.remove();           // 현재 요소 제거
        spawnSingleText(false); // 새로운 요소 생성 (이제는 오른쪽 끝에서 시작)
      });
    }

    /**
     * 초기화 함수: 설정된 개수만큼 텍스트를 한 번에 생성
     */
    function initFloatingTexts() {
      for (let i = 0; i < textConfig.count; i++) {
        // 처음 5개는 true를 전달하여 화면 안쪽에 흩뿌려지게 함
        spawnSingleText(true);
      }
    }

    // 기능 시작
    initFloatingTexts();

    // 현수막 관리 및 유휴 감지 기능 추가 
    document.addEventListener('DOMContentLoaded', function() {
      const overlay = document.getElementById('banner');
      const toggleBtn = document.querySelector('.toggle-moving-btn'); 
      
      // 1. 유휴 상태로 간주할 시간 (단위: 밀리초, 1000 = 1초)
      const IDLE_TIMEOUT = 60000; 

      // 2. 초기 현수막 상태 (true: 펴짐, false: 접힘)
      let isExpanded = true; 

      // 3. 감지할 사용자 동작 목록 (필요 없는 감지 동작은 삭제 가능)
      const userEvents = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

      // -----------------------------------------------------------
      // 내부 로직
      // -----------------------------------------------------------
      let idleTimer = null;

      // 현수막 높이 업데이트 함수
      function updateOverlay() {
        overlay.style.height = isExpanded ? '56vh' : '1.6vh';
      }

      // 현수막 토글 (버튼 클릭 등 수동 조작 시)
      function toggleOverlay() {
        isExpanded = !isExpanded;
        updateOverlay();
        resetIdleTimer(); // 버튼 클릭도 사용 활동으로 간주
      }
      
      // 현수막 자동 확장 (유휴 상태 진입 시)
      function expandOverlay() {
        // 이미 펴져 있다면 동작하지 않음 (상태 유지)
        if (!isExpanded) {
            isExpanded = true;
            updateOverlay();
            // console.log("3초간 입력이 없어 현수막이 자동 확장되었습니다.");
        }
      }

      // 타이머 리셋 함수 (사용자 활동 감지 시 호출)
      function resetIdleTimer() {
         // 기존 타이머가 돌고 있었다면 취소 (아직 3초가 안 지났으므로)
         if (idleTimer) clearTimeout(idleTimer);
         
         // "사용 중이거나 현수막이 펴져 있는 동안은 펴진 상태로 유지"
         // 활동이 감지되면 확장을 예약했던 타이머를 미루는 것이므로, 
         // 현재 상태(접힘/펴짐)가 그대로 유지됩니다.
         
         // 다시 3초 카운트 시작
         idleTimer = setTimeout(expandOverlay, IDLE_TIMEOUT);
      }

      // 이벤트 리스너 등록: 토글 버튼
      toggleBtn?.addEventListener('click', toggleOverlay);
      
      // 이벤트 리스너 등록: 배너 직접 클릭 (모바일 등)
      overlay.addEventListener('click', function(e) {
        toggleOverlay(); 
      });

      // 사용자 활동 감지 이벤트 등록
      userEvents.forEach(evt => {
          window.addEventListener(evt, resetIdleTimer);
      });

      // 초기 실행
      resetIdleTimer(); // 감시 시작
      updateOverlay();  // 초기 상태 적용
    });
