const characterImage = document.getElementById('character-image');
const dialogueText = document.getElementById('dialogue-text');
const choicesContainer = document.getElementById('choices-container');
const gameContainer = document.getElementById('game-container');
const nameInputContainer = document.getElementById('name-input-container');
const protagonistNameInput = document.getElementById('protagonist-name-input');
const startGameButton = document.getElementById('start-game-button');
const dialogueBox = document.getElementById('dialogue-box'); // 추가된 요소
const affinityBarsContainer = document.getElementById('affinity-bars-container'); // 추가된 요소
const backButton = document.getElementById('back-button'); // 새로 추가된 요소
const resetButton = document.getElementById('reset-button'); // 새로 추가된 요소
const settingsButton = document.getElementById('settings-button'); // 새로 추가된 요소
const settingsOverlay = document.getElementById('settings-overlay'); // 새로 추가된 요소
const saveGameButton = document.getElementById('save-game-button'); // 새로 추가된 요소
const loadGameButton = document.getElementById('load-game-button'); // 새로 추가된 요소
const interactionContainer = document.getElementById('interaction-container'); // 새로 추가된 요소

let protagonistName = "주인공"; // 기본값 설정
let favorability = { ryujin: 0, hayul: 0, sea: 0, jiyu: 0, mysteryInterest: 0 }; // 캐릭터별 호감도 초기화 (teacher 제거)
let selfIntroType = ""; // 자기소개 타입 저장
let schoolImpressionType = ""; // 학교 첫인상 타입 저장
let adaptationFeelingType = ""; // 적응에 대한 감정 타입 저장

let gameStateHistory = []; // 게임 상태 이력을 저장할 배열
let isSettingsMenuOpen = false; // 설정 메뉴 열림/닫힘 상태

// 게임 상태를 로컬 스토리지에 저장 (가장 최근 상태만)
function saveLatestGameStateToLocalStorage() {
    const gameState = {
        currentState: currentState,
        protagonistName: protagonistName,
        favorability: favorability,
        selfIntroType: selfIntroType,
        schoolImpressionType: schoolImpressionType,
        adaptationFeelingType: adaptationFeelingType,
        gameStateHistory: gameStateHistory // history도 저장
    };
    localStorage.setItem('myVisualNovelGame', JSON.stringify(gameState));
    console.log("Latest game state saved to localStorage:", gameState);
}

// 게임 상태를 로컬 스토리지에서 불러오기
function loadGameStateFromLocalStorage() {
    const savedState = localStorage.getItem('myVisualNovelGame');
    if (savedState) {
        const gameState = JSON.parse(savedState);
        currentState = gameState.currentState || 'chapter1_scene1_new_morning_start';
        protagonistName = gameState.protagonistName || "주인공";
        favorability = gameState.favorability || { ryujin: 0, hayul: 0, sea: 0, jiyu: 0, mysteryInterest: 0 };
        selfIntroType = gameState.selfIntroType || "";
        schoolImpressionType = gameState.schoolImpressionType || "";
        adaptationFeelingType = gameState.adaptationFeelingType || "";
        gameStateHistory = gameState.gameStateHistory || []; // history 불러오기
        console.log("Game state loaded from localStorage:", gameState);
        return true; // 불러오기 성공
    }
    console.log("No saved game state found in localStorage.");
    return false; // 불러오기 실패
}

function createAffinityBar(characterName, initialValue) {
    const barContainer = document.createElement('div');
    barContainer.classList.add('affinity-bar-item');
    barContainer.style.marginBottom = '10px';
    barContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    barContainer.style.borderRadius = '5px';
    barContainer.style.width = '150px';
    barContainer.style.height = '20px';
    barContainer.style.overflow = 'hidden';
    barContainer.style.position = 'relative'; // 내부 요소 위치 조정을 위해 추가

    const barFill = document.createElement('div');
    barFill.classList.add('affinity-bar-fill');
    barFill.style.height = '100%';
    barFill.style.width = `${initialValue + 50}%`; // 호감도 범위가 -50~50이므로 0~100%로 매핑
    barFill.style.backgroundColor = '#ff69b4'; // 핑크색
    barFill.style.transition = 'width 0.5s ease-in-out';

    const barLabel = document.createElement('span');
    barLabel.classList.add('affinity-bar-label');
    barLabel.style.color = 'white';
    barLabel.style.fontSize = '0.8em';
    barLabel.style.position = 'absolute';
    barLabel.style.left = '5px';
    barLabel.style.lineHeight = '20px'; // 세로 중앙 정렬
    barLabel.textContent = `${characterName}: ${initialValue}`;

    barContainer.appendChild(barFill);
    barContainer.appendChild(barLabel);
    affinityBarsContainer.appendChild(barContainer);

    return { barFill, barLabel };
}

const affinityBarElements = {};
for (const char in favorability) {
    affinityBarElements[char] = createAffinityBar(char.charAt(0).toUpperCase() + char.slice(1), favorability[char]);
}

function updateAffinityBars() {
    for (const char in favorability) {
        const value = favorability[char];
        affinityBarElements[char].barFill.style.width = `${Math.max(0, Math.min(100, value + 50))}%`; // 호감도 범위를 0-100으로 클램프
        affinityBarElements[char].barLabel.textContent = `${char.charAt(0).toUpperCase() + char.slice(1)}: ${value}`;
    }
}

// 게임 상태를 history에 저장
function saveCurrentStateToHistory() {
    const currentStateSnapshot = {
        currentState: currentState,
        protagonistName: protagonistName,
        favorability: { ...favorability }, // 호감도 객체 깊은 복사
        selfIntroType: selfIntroType,
        schoolImpressionType: schoolImpressionType,
        adaptationFeelingType: adaptationFeelingType
    };
    gameStateHistory.push(currentStateSnapshot);
    console.log("State saved to history:", currentStateSnapshot);
    updateBackButtonVisibility();
}

// 뒤로 가기
function goBack() {
    if (gameStateHistory.length > 1) {
        gameStateHistory.pop(); // 현재 상태 제거
        const prevState = gameStateHistory[gameStateHistory.length - 1]; // 이전 상태 가져오기

        currentState = prevState.currentState;
        protagonistName = prevState.protagonistName;
        favorability = { ...prevState.favorability }; // 호감도 객체 깊은 복사
        selfIntroType = prevState.selfIntroType;
        schoolImpressionType = prevState.schoolImpressionType;
        adaptationFeelingType = prevState.adaptationFeelingType;

        updateGame(false); // UI만 업데이트 (history에 다시 저장하지 않도록 false 전달)
        updateAffinityBars();
        saveLatestGameStateToLocalStorage(); // localStorage 업데이트
        console.log("Go back to state:", prevState);
    } else {
        console.log("Cannot go back further.");
    }
    updateBackButtonVisibility();
}

function updateBackButtonVisibility() {
    if (isSettingsMenuOpen) {
        backButton.style.display = gameStateHistory.length > 1 ? 'block' : 'none';
        resetButton.style.display = 'block'; // 항상 보이게 변경
        saveGameButton.style.display = 'block'; // 항상 보이게 변경
        loadGameButton.style.display = 'block'; // 항상 보이게 변경
    } else {
        backButton.style.display = 'none';
        resetButton.style.display = 'none';
        saveGameButton.style.display = 'none';
        loadGameButton.style.display = 'none';
    }
}

// 설정 메뉴 토글
function toggleSettingsMenu() {
    isSettingsMenuOpen = !isSettingsMenuOpen;
    if (isSettingsMenuOpen) {
        settingsOverlay.style.display = 'block'; // 오버레이 표시
    } else {
        settingsOverlay.style.display = 'none'; // 오버레이 숨기기
    }
    updateBackButtonVisibility(); // 설정 메뉴 상태에 따라 버튼 가시성 업데이트
}

// 게임을 초기 상태로 리셋
function resetGame() {
    if (confirm("정말로 게임을 초기화하시겠습니까? 모든 진행 상황이 삭제됩니다.")) {
        localStorage.removeItem('myVisualNovelGame'); // 자동 저장 데이터만 삭제
        
        // 게임 변수들을 초기 상태로 리셋
        protagonistName = "주인공";
        favorability = { ryujin: 0, hayul: 0, sea: 0, jiyu: 0, mysteryInterest: 0 };
        selfIntroType = "";
        schoolImpressionType = "";
        adaptationFeelingType = "";
        gameStateHistory = []; // 기록 초기화
        currentState = 'chapter1_scene1_new_morning_start'; // 시작 씬으로

        // 초기화 시 설정 메뉴 닫고 오버레이 숨김
        isSettingsMenuOpen = false;
        settingsOverlay.style.display = 'none';

        initializeGame(); // 게임 UI 초기화 및 시작 화면으로 복귀
        updateAffinityBars(); // 호감도 바 초기화 상태로 업데이트
        updateBackButtonVisibility(); // 버튼 가시성 업데이트
        console.log("Game has been reset.");
    }
}

// 게임 상태 수동 저장
function saveGame() {
    const gameState = {
        currentState: currentState,
        protagonistName: protagonistName,
        favorability: favorability,
        selfIntroType: selfIntroType,
        schoolImpressionType: schoolImpressionType,
        adaptationFeelingType: adaptationFeelingType,
        gameStateHistory: gameStateHistory // history도 저장
    };
    localStorage.setItem('myVisualNovelGameManualSave', JSON.stringify(gameState));
    alert("게임이 저장되었습니다!");
    console.log("Manual game state saved:", gameState);
}

// 게임 상태 수동 불러오기
function loadGame() {
    if (confirm("저장된 게임을 불러오시겠습니까? 현재 진행 상황은 사라집니다.")) {
        const savedState = localStorage.getItem('myVisualNovelGameManualSave');
        if (savedState) {
            const gameState = JSON.parse(savedState);
            currentState = gameState.currentState;
            protagonistName = gameState.protagonistName;
            favorability = gameState.favorability;
            selfIntroType = gameState.selfIntroType;
            schoolImpressionType = gameState.schoolImpressionType;
            adaptationFeelingType = gameState.adaptationFeelingType;
            gameStateHistory = gameState.gameStateHistory; // history도 불러오기

            // initializeGame() 호출 대신 직접 UI 업데이트
            nameInputContainer.style.display = 'none';
            characterImage.style.display = 'block';
            // dialogueBox.style.display = 'block'; // interactionContainer가 제어
            // choicesContainer.style.display = 'flex'; // interactionContainer가 제어
            affinityBarsContainer.style.display = 'block';
            interactionContainer.style.display = 'flex'; // interactionContainer 보이도록 설정 (추가)
            gameContainer.style.backgroundImage = gameStory[currentState].background ? `url('assets/${gameStory[currentState].background}')` : 'none'; // 배경 이미지 적용 (추가)

            updateGame(false); // history에 다시 저장하지 않도록 false 전달
            updateAffinityBars();
            alert("게임을 불러왔습니다!");
            console.log("Manual game state loaded:", gameState);
        } else {
            alert("저장된 게임이 없습니다!");
            console.log("No manual saved game state found.");
        }
        isSettingsMenuOpen = false; // 불러오기 후 설정 메뉴 닫힘
        settingsOverlay.style.display = 'none';
        updateBackButtonVisibility(); // 버튼 가시성 업데이트
    }
}


// 게임 스토리 데이터
const gameStory = {
    // 챕터 1: 새로운 아침, 새로운 교정 (추가된 씬)
    chapter1_scene1_new_morning_start: {
        text: "새벽부터 잠을 설쳤다. 오늘은 별빛 고등학교에서의 첫날. 전날 밤 아무리 짐을 정리하고 잠을 청해도, 낯선 환경에 대한 설렘과 막연한 불안감에 좀처럼 잠들 수 없었다.",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_school_gate_impression" }
        ]
    },
    chapter1_scene1_school_gate_impression: {
        text: "교문 앞에 서자, 낡았지만 고풍스러운 느낌의 건물들이 눈에 들어왔다. 최신식은 아니지만, 오랜 세월을 견딘 듯한 벽돌 건물과 잘 가꿔진 정원이 묘한 조화를 이루고 있었다.",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "생각보다 분위기 있네. 기대된다.", next: "chapter1_scene1_impression_positive", favorabilityChange: { ryujin: 1, hayul: 1, sea: 1, jiyu: 1, mysteryInterest: 1 }, onChoose: () => { schoolImpressionType = "positive"; } },
            { text: "음… 왠지 모르게 좀 으스스한 느낌인데.", next: "chapter1_scene1_impression_eerie", favorabilityChange: { mysteryInterest: -1 }, onChoose: () => { schoolImpressionType = "eerie"; } },
            { text: "빨리 안에 들어가고 싶다. 낯선 시선은 좀 부담스러운데.", next: "chapter1_scene1_impression_impatient", favorabilityChange: { hayul: -1, sea: 1 }, onChoose: () => { schoolImpressionType = "impatient"; } }
        ]
    },
    chapter1_scene1_impression_positive: {
        text: "왠지 모르게 좋은 예감이 들었다. 이곳에서의 학교생활이 평범하지만은 않을 것 같았다.",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_enter_school" }
        ]
    },
    chapter1_scene1_impression_eerie: {
        text: "오래된 건물들이 주는 중압감 때문일까. 묘한 불안감이 가슴 한켠을 스쳤다.",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_enter_school" }
        ]
    },
    chapter1_scene1_impression_impatient: {
        text: "벌써부터 등교하는 학생들의 시선이 느껴지는 것 같았다. 얼른 교정 안으로 들어가고 싶었다.",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_enter_school" }
        ]
    },
    chapter1_scene1_enter_school: {
        text: "마음을 다잡고 교문 안으로 발걸음을 옮겼다. 발을 들이자마자, 왠지 모르게 싸늘한 기운이 느껴지는 듯했다. 착각일까?",
        character: "",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_hallway" }
        ]
    },
    chapter1_scene1_hallway: {
        text: "복도는 활기찼지만, 동시에 묘한 정적도 느껴졌다. 분명 많은 학생들이 있지만, 어떤 낯선 공기가 감도는 듯했다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "새로운 친구들을 만날 생각에 두근거린다.", next: "chapter1_scene1_adaptation_excited", favorabilityChange: { ryujin: 1, hayul: 2, sea: 1, jiyu: 1 }, onChoose: () => { adaptationFeelingType = "excited"; } },
            { text: "낯선 사람들 투성이네… 잘 적응할 수 있을까?", next: "chapter1_scene1_adaptation_anxious", favorabilityChange: {}, onChoose: () => { adaptationFeelingType = "anxious"; } }
        ]
    },
    chapter1_scene1_adaptation_excited: {
        text: "과연 어떤 친구들을 만나게 될까? 벌써부터 기대됐다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_find_classroom" }
        ]
    },
    chapter1_scene1_adaptation_anxious: {
        text: "괜히 위축되는 기분이었다. 원래 새로운 환경에 적응하는 데 시간이 좀 걸리는 편이다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_find_classroom" }
        ]
    },
    chapter1_scene1_find_classroom: {
        text: "어쨌든, 이제 내 반으로 찾아가야 할 시간이다. 교실 문 앞에 서자, 심장이 두근거렸다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "교실로 들어가기", next: "chapter1_scene1_classroom" }
        ]
    },
    // 씬 2: 전학 첫날, 별빛 고등학교 (기존 씬)
    chapter1_scene1_classroom: {
        text: "드디어 별빛 고등학교로 전학 왔다. 부모님의 전근 때문에 갑작스럽게 결정된 일이지만… 새로운 곳에서 새로운 시작을 할 수 있다는 생각에 나쁘지 않았다. 이곳은 왠지 모르게 오래된 듯하면서도 신비로운 분위기를 풍겼다.",
        character: "", // 주인공 내레이션 (이미지 없음)
        background: "backgrounds/school_gate.png", // 배경 이미지 추가
        choices: [
            { text: "다음으로", next: "chapter1_scene1_classroom" }
        ]
    },
    chapter1_scene1_classroom: {
        text: "자, 모두 주목. 오늘부터 너희와 함께할 새 친구다. 다들 친하게 지내도록 해.",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_self_intro" }
        ]
    },
    chapter1_scene1_self_intro: {
        text: "자기소개 부탁해.",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/classroom.png",
        choices: [
            { text: "안녕하세요. [주인공 이름]입니다. 잘 부탁드립니다! (밝게 웃으며)", next: "chapter1_scene1_intro_bright", favorabilityChange: { hayul: 3, ryujin: 3, sea: 3, jiyu: 3 }, onChoose: () => { selfIntroType = "bright"; } },
            { text: "…[주인공 이름]입니다. (조금 긴장한 목소리로)", next: "chapter1_scene1_intro_nervous", favorabilityChange: {}, onChoose: () => { selfIntroType = "nervous"; } },
            { text: "…… (말없이 고개를 숙인다)", next: "chapter1_scene1_intro_silent", favorabilityChange: { hayul: -3, ryujin: -3, sea: -5, jiyu: -3 }, onChoose: () => { selfIntroType = "silent"; } }
        ]
    },
    chapter1_scene1_intro_bright: {
        text: "그래, 환영한다!",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_after_intro" }
        ]
    },
    chapter1_scene1_intro_nervous: {
        text: "으흠, 긴장했구나. 괜찮다.",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_after_intro" }
        ]
    },
    chapter1_scene1_intro_silent: {
        text: "(담임 선생님은 곤란한 듯 헛기침하며 말했다.) 으흠, 전학생이 좀 낯을 가리는 것 같으니 다들 이해해 주렴. 자리에 앉아.",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter1_scene1_after_intro" }
        ]
    },
    chapter1_scene1_after_intro: {
        text: () => {
            if (selfIntroType === "bright") {
                return "첫인상은 성공적이었을지도 모른다. 환영받는 분위기 속에서 무사히 자기소개를 마쳤다. 내 자리엔 창가 제일 뒷자리. 역시 주인공은 창가 아니겠어?";
            } else if (selfIntroType === "nervous") {
                return "조금 긴장했지만, 그래도 무사히 자기소개를 마쳤다. 몇몇 학생들이 수군거리는 소리가 들렸지만 괜찮았다. 내 자리엔 창가 제일 뒷자리. 역시 주인공은 창가 아니겠어?";
            } else { // silent
                return "어색한 침묵 속에서 자기소개를 마쳤다. 담임 선생님의 한숨이 들린 것 같았다. 내 자리엔 창가 제일 뒷자리. 역시 주인공은 창가 아니겠어?";
            }
        },
        character: "",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene2_lunch_start" }
        ]
    },
    // 씬 2: 점심시간, 도서관에서의 첫 만남 (류진) (확장된 씬)
    chapter1_scene2_lunch_start: {
        text: "드디어 점심시간. 첫날인데도 묘하게 긴장해서인지 벌써부터 피곤했다. 시끌벅적한 급식실은 아무래도 적응하기 어려울 것 같았다. 조용히 혼자 있을 만한 곳을 찾던 중, 문득 눈에 들어온 곳이 있었다.",
        character: "",
        background: "backgrounds/school_hallway_lunch.png", // 새로운 배경 이미지 (가정)
        choices: [
            { text: "다음", next: "chapter1_scene2_library_enter_extended" }
        ]
    },
    chapter1_scene2_library_enter_extended: {
        text: "별빛 고등학교 도서관은 생각보다 훨씬 넓고, 층고가 높아서 웅장한 느낌마저 들었다. 오래된 책들이 빼곡히 꽂힌 책장 사이로 옅은 먼지가 햇빛을 받아 반짝이는 것이 보였다. 마치 시간이 멈춘 듯한 공간이었다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "책 냄새 좋다… 완전 내 취향인데.", next: "chapter1_scene2_library_impression_positive", favorabilityChange: { ryujin: 1, jiyu: 1 } },
            { text: "생각보다 오래된 느낌이네. 여기도 왠지 모르게 좀 으스스한데.", next: "chapter1_scene2_library_impression_eerie", favorabilityChange: {} },
            { text: "조용해서 좋긴 한데… 너무 적막해서 오히려 부담스러운데.", next: "chapter1_scene2_library_impression_burden", favorabilityChange: { ryujin: -1 } }
        ]
    },
    chapter1_scene2_library_impression_positive: {
        text: "마음이 편안해졌다. 이곳이라면 첫날의 긴장감도 풀 수 있을 것 같았다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_appear_extended" }
        ]
    },
    chapter1_scene2_library_impression_eerie: {
        text: "조용하다 못해 적막에 가까운 분위기에 괜히 어깨가 움츠러들었다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_appear_extended" }
        ]
    },
    chapter1_scene2_library_impression_burden: {
        text: "어딘가 불편한 기분이 들었다. 빨리 자리를 찾아 앉아야겠다고 생각했다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_appear_extended" }
        ]
    },
    chapter1_scene2_ryujin_appear_extended: {
        text: "",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_first_talk" }
        ]
    },
    chapter1_scene2_ryujin_first_talk: {
        text: "검은 긴 머리에 창백한 피부. 마치 도서관의 일부인 것처럼 책에 파묻혀있는 모습이 인상적이다. 감히 말을 걸기 어려울 만큼 조용하고… 차가워 보였다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "저… 혹시 여기도 자리 있나요? (조심스럽게 묻는다)", next: "chapter1_scene2_ask_seat", favorabilityChange: { ryujin: 2 } },
            { text: "(말없이 근처의 비어있는 자리에 앉는다. 그녀와의 거리는 최대한 유지한다.)", next: "chapter1_scene2_sit_silently", favorabilityChange: { ryujin: 1 } },
            { text: "…(도서관 다른 쪽, 비교적 밝은 곳으로 자리를 옮긴다.)", next: "chapter1_scene2_avoid_ryujin", favorabilityChange: { ryujin: -2 } }
        ]
    },
    chapter1_scene2_ask_seat: {
        text: "…비어있는 곳은 많습니다. 원하는 곳에 앉으십시오.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_book_light_question" }
        ]
    },
    chapter1_scene2_sit_silently: {
        text: "괜히 말을 걸었다가 방해하는 것 같았다. 조용히 앉아 그녀를 관찰하기로 했다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_ryujin_book_light_question" }
        ]
    },
    chapter1_scene2_avoid_ryujin: {
        text: "왠지 모르게 다가가기 힘들었다. 그녀가 있는 곳은 너무 어두웠다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_end" }
        ]
    },
    chapter1_scene2_ryujin_book_light_question: {
        text: "(속으로) '고대 별빛 문명'이라니… 표지만 봐도 오래된 역사서나 전설집 같았다. 그런데 어딘가… 묘한 기운이 느껴진다. 혹시… 저 책에서 빛이 난 건가?",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "무슨 책 읽으세요? 표지가 특이하네요. 혹시… 책에서 빛나는 것 같았는데 착각인가요?", next: "chapter1_scene2_ryujin_book_alive_response", favorabilityChange: { ryujin: 4 } },
            { text: "…(더 이상 방해하지 않고 내 책을 편다. 아까 본 빛은 착각이라고 생각한다.)", next: "chapter1_scene2_read_my_book", favorabilityChange: {} },
            { text: "죄송합니다. 방해해서.", next: "chapter1_scene2_apologize_and_leave", favorabilityChange: { ryujin: -3 } }
        ]
    },
    chapter1_scene2_read_my_book: {
        text: "괜히 말을 걸었다가는 더 이상 나를 상대해주지 않을 것 같았다. 조용히 내 할 일을 하기로 했다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_end" }
        ]
    },
    chapter1_scene2_ryujin_book_alive_response: {
        text: "…빛이라. 당신의 착각이 아닐 겁니다. 이 책은… 살아있으니까요.",
        character: "ryujin_glare.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "(놀라서) 살아있다니… 무슨 말씀이세요?", next: "chapter1_scene2_ask_book_meaning" }
        ]
    },
    chapter1_scene2_ask_book_meaning: {
        text: "문자 그대로입니다. 모든 고서에는… 숨 쉬는 영혼이 깃들 수 있으니까요. 특히 이 서고에 있는 책들은 더욱 그렇습니다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "혹시 이 도서관에 뭔가 특별한 비밀이라도 있는 건가요?", next: "chapter1_scene2_ask_library_secret", favorabilityChange: { ryujin: 3 } },
            { text: "…(더 이상 묻지 않고 조용히 앉아 있는다)", next: "chapter1_scene2_sit_silently_after_ryujin_talk", favorabilityChange: {} }
        ]
    },
    chapter1_scene2_ask_library_secret: {
        text: "…그것은 당신이 직접 찾아야 할 비밀입니다. 혹은… 아직 알 때가 되지 않았을지도 모르죠.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_end" }
        ]
    },
    chapter1_scene2_sit_silently_after_ryujin_talk: {
        text: "더 이상 그녀를 자극하고 싶지 않았다. 그녀에게서 느껴지는 알 수 없는 위압감에 나는 조용히 입을 다물었다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_end" }
        ]
    },
    chapter1_scene2_apologize_and_leave: {
        text: "그녀의 분위기에 압도당했다. 더 이상 이곳에 머물기 힘들었다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter1_scene2_end" }
        ]
    },
    chapter1_scene2_end: {
        text: "짧은 점심시간이 끝나고 종이 울렸다. 류진은 내가 일어서는 것을 개의치 않고 다시 책에 몰두했다. 그녀의 존재는 강렬한 인상을 남겼다. 이곳에서의 학교생활이 평범하지 않을 것 같다는 예감이 더욱 강해졌다.",
        character: "",
        background: "backgrounds/library.png", // 점심시간 후 교실로 돌아오는 배경
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene3_start_extended" }
        ]
    },
    // 씬 3: 방과 후, 첫 미스터리 현상과 강하율 (확장된 씬)
    chapter1_scene3_start_extended: {
        text: "첫날치고는 나쁘지 않았다. 류진과의 만남은 왠지 모르게 섬뜩했지만, 동시에 묘한 호기심을 불러일으켰다. 이제 집에 가서 좀 쉬어야지.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_hayul_appear_extended" }
        ]
    },
    chapter1_scene3_hayul_appear_extended: {
        text: "???:야, 진짜 웃기지 않냐? ㅋㅋㅋㅋㅋ 내가 어제 진짜… 막 달리는데 갑자기 엉덩방아를 찧은 거야!",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_hayul_greeting_extended" }
        ]
    },
    chapter1_scene3_hayul_greeting_extended: {
        text: "어? 쟤 혹시 전학생? 안녕! 아까 반에서 봤지? 난 강하율이야! 체육부 소속! 너 혹시 지금 집에 가는 길이야? 같이 나갈래?",
        character: "hayul_default.png",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "아, 안녕! [주인공 이름]이야. 좋지! 같이 나갈까?", next: "chapter1_scene3_go_with_hayul_extended", favorabilityChange: { hayul: 5 } },
            { text: "미안, 좀 피곤해서… 다음에 같이 가자.", next: "chapter1_scene3_decline_hayul_extended", favorabilityChange: { hayul: -3 } }
        ]
    },
    chapter1_scene3_go_with_hayul_extended: {
        text: "오예! 그럼 같이 나가자! 내가 학교 근처 맛집도 알려줄게! 걸어가면서 얘기하면 시간 금방 갈 거야!",
        character: "hayul_smile.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_walk_with_hayul_extended" }
        ]
    },
    chapter1_scene3_decline_hayul_extended: {
        text: "아… 그렇구나. 아쉽네! 그럼 다음에 꼭 같이 가자! 잘 가!",
        character: "hayul_sad.png",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene4_start_extended" }
        ]
    },
    chapter1_scene3_walk_with_hayul_extended: {
        text: "그나저나 요즘 학교가 좀 이상해. 우리 반 애가 말이야, 자기가 제일 아끼던 축구공을 어디다 뒀는지 통 기억을 못 하는 거야! 분명 어제까지 자기 책상 밑에 뒀다고 하는데… 아예 까맣게 잊었대. 자기가 축구공을 가지고 있었다는 사실 자체도 헷갈려 하고.",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "어? 그런 일이 있었어? 심각한데?", next: "chapter1_scene3_hayul_mystery_2_extended" }
        ]
    },
    chapter1_scene3_hayul_mystery_2_extended: {
        text: "응! 신기하지 않아? 심지어 얼마 전에는 미술부 선배가 자기 그림을 그리다가 갑자기 모든 걸 잊어버렸다고 한 적도 있어. 막 자기 작업실에 들어갔는데 자기가 뭘 하려 했는지 까맣게 잊었대나? (주인공에게 고개를 기울이며) 너도 혹시 그런 경험 있어? 뭔가 해야 할 일을 갑자기 잊어버린다거나…",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "방금… 뭔가 지나간 것 같은데? 나도 어딘가 싸늘한 기운을 느낀 것 같아.", next: "chapter1_scene3_ask_about_shadow_extended", favorabilityChange: { hayul: 2 } },
            { text: "음… 딱히 그런 적은 없는 것 같아. (괜히 불안하게 만들고 싶지 않아 얼버무린다)", next: "chapter1_scene3_ignore_shadow_extended", favorabilityChange: { hayul: -1 } },
            { text: "혹시 그게 요즘 학교에 도는 이상한 소문이랑 관련이 있는 걸까?", next: "chapter1_scene3_ask_rumor_mystery", favorabilityChange: { hayul: 3 } }
        ]
    },
    chapter1_scene3_ask_about_shadow_extended: {
        text: "어? 진짜? 난 아무것도 못 봤는데… 으음, 바람이 좀 세게 부네! 너 기분 탓 아닐까?",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_shadow_effect" }
        ]
    },
    chapter1_scene3_ignore_shadow_extended: {
        text: "왠지 모르게 말하기가 꺼려졌다. 괜히 하율이까지 불안하게 만들고 싶지 않았다. 하지만 나조차 불안해지는 건 어쩔 수 없었다.",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_shadow_effect" }
        ]
    },
    chapter1_scene3_ask_rumor_mystery: {
        text: "오! 너도 그런 소문 들었어? 맞아, 그런 말도 있더라. 학교 도서관 깊숙한 곳에 뭔가 비밀이 숨겨져 있다던가? 하하, 설마 진짜겠어?",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_shadow_effect" }
        ]
    },
    chapter1_scene3_shadow_effect: {
        text: "(속으로) 방금 그건… 정말 뭐였지? 바람? 그림자? 아니면… 또 착각? 머리가… 조금 아파왔다.",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_hayul_uncertainty_extended" }
        ]
    },
    chapter1_scene3_hayul_uncertainty_extended: {
        text: "뭐지? 갑자기 왜 이렇게 춥지? 으으, 소름 돋았어! 빨리 집에 가자! 감기 걸리겠네!",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_end_extended" }
        ]
    },
    chapter1_scene3_end_extended: {
        text: "하율이는 밝게 웃었지만, 그녀의 눈빛에는 묘한 불안감이 스쳐 지나갔다. 이 학교… 단순히 오래된 것뿐 아니라, 뭔가 숨겨진 비밀이 있는 걸까? 방금 그 통증은 뭐였지?",
        character: "hayul_default.png",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음", next: "chapter1_scene3_farewell_hayul" }
        ]
    },
    chapter1_scene3_farewell_hayul: {
        text: "그럼 내일 봐! 조심해서 가!",
        character: "hayul_default.png",
        background: "backgrounds/school_gate.png",
        choices: [
            { text: "그래, 하율이도 조심해서 가.", next: "chapter1_scene3_walk_home_alone" }
        ]
    },
    chapter1_scene3_walk_home_alone: {
        text: "하율이와 헤어져 집으로 돌아오는 길. 방금 학교에서 겪었던 이상한 일들이 계속 머릿속을 맴돌았다. 단순히 피곤해서 생긴 일일까? 아니면…",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene4_start" }
        ]
    },
    // 씬 4: 교내 순찰, 도도한 학생회장 윤세아 (확장된 씬)
    chapter1_scene4_start: {
        text: "다음날..",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_sea_appear_extended" }
        ]
    },
    chapter1_scene4_start_extended: {
        text: "어제 하율이와 나눴던 이야기가 계속 머릿속에 맴돌았다. 사라진 기억, 이상한 소문, 그리고 내가 느꼈던 싸늘한 기운까지. 단순히 우연이라고 치부하기엔 너무 많은 일들이 일어나는 것 같았다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_sea_appear_extended" }
        ]
    },
    chapter1_scene4_sea_appear_extended: {
        text: "복도에서 뛰지 마십시오. 뛰는 행위는 타인에게 피해를 줄 수 있습니다. 질서를 지켜주십시오.",
        character: "se_a_default.png",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_sea_greeting_extended" }
        ]
    },
    chapter1_scene4_sea_greeting_extended: {
        text: "전학생이군요. 윤세아입니다. 학생회장으로서 학교의 규율은 엄격하게 지켜주기를 바랍니다.",
        character: "se_a_default.png",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "네, 알겠습니다. 신경 쓰겠습니다. 학생회장님.", next: "chapter1_scene4_obey_sea_extended", favorabilityChange: { sea: 4, hayul: -1 } },
            { text: "죄송하지만… 혹시 요즘 학교에 도는 이상한 소문에 대해서 아는 게 있으신가요?", next: "chapter1_scene4_ask_rumor_extended", favorabilityChange: { sea: -5, ryujin: 1, jiyu: 1 } },
            { text: "학생회장이 되면 그렇게 딱딱해야 하는 건가요?", next: "chapter1_scene4_question_strict_extended", favorabilityChange: { sea: -3, hayul: 2, jiyu: 2 } }
        ]
    },
    chapter1_scene4_obey_sea_extended: {
        text: "좋습니다. 학교의 질서는 모든 학생의 노력으로 유지됩니다.",
        character: "se_a_default.png",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_end_extended" }
        ]
    },
    chapter1_scene4_ask_rumor_extended: {
        text: "…불필요한 소문에 현혹되지 마십시오. 학교의 명예를 실추시키는 행위는 용납하지 않습니다. 학생 본분에 충실하십시오. 지나친 호기심은 때로 해로울 수 있습니다.",
        character: "se_a_angry.png",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_sea_warning_extended" }
        ]
    },
    chapter1_scene4_sea_warning_extended: {
        text: "그녀의 말에서 왠지 모를 경고가 느껴졌다. 마치 내가 무언가를 알게 되는 것을 막으려는 듯했다. 학교의 비밀을 덮으려 하는 걸까?",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_end_extended" }
        ]
    },
    chapter1_scene4_question_strict_extended: {
        text: "저의 역할은 학교의 질서를 유지하는 것입니다. 그에 필요한 태도를 취할 뿐입니다. 이러한 질문은 적절하지 않습니다. 학생 본분에 충실하십시오.",
        character: "se_a_default.png",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter1_scene4_end_extended" }
        ]
    },
    chapter1_scene4_end_extended: {
        text: "윤세아는 냉정한 표정으로 지나쳐갔지만, 그녀의 말은 왠지 모르게 꺼림칙했다. '불필요한 소문'이라니. 학교에서 벌어지는 기이한 일들을 알고 있으면서도 일부러 덮으려 하는 걸까? 아니면… 그녀 자신이 그 소문의 일부인 걸까?",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene5_start_extended" }
        ]
    },
    // 씬 5: 미술실의 엉뚱한 선배, 이지유 (확장된 씬)
    chapter1_scene5_start_extended: {
        text: "오늘 하루도 우여곡절이 많았다. 류진의 알 수 없는 말과 윤세아의 경고. 그리고 하율이가 겪었다는 기억 소실까지. 머릿속이 점점 더 복잡해지는 기분이었다. 집에 갈 생각에 발걸음을 재촉하는데, 문득 미술실 문이 살짝 열려 있는 것이 눈에 들어왔다.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png", // 방과 후 학교 복도 이미지
        choices: [
            { text: "다음", next: "chapter1_scene5_jiyu_appear_extended" }
        ]
    },
    chapter1_scene5_jiyu_appear_extended: {
        text: "",
        character: "jiyu_default.png",
        background: "backgrounds/art_room_door.png", // 방과 후 학교 복도 이미지
        choices: [
            { text: "다음", next: "chapter1_scene5_jiyu_first_talk" }
        ]
    },
    chapter1_scene5_jiyu_first_talk: {
        text: "어라? 나왔다. 근데 표정이 왜 저러지? 꼭 꿈을 꾸는 사람 같아.",
        character: "jiyu_default.png",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "저… 혹시 미술부 이지유 선배세요?", next: "chapter1_scene5_ask_jiyu_extended", favorabilityChange: { jiyu: 3 } },
            { text: "…(그냥 지나간다. 괜히 말을 걸었다가 이상한 사람 취급받을 것 같다.)", next: "chapter1_scene5_pass_jiyu_extended", favorabilityChange: {} }
        ]
    },
    chapter1_scene5_ask_jiyu_extended: {
        text: "…어? 너… 누구지? 뭔가… 반짝이는 게 보여. 아름다운 색깔이… 너한테서 흘러나오네…",
        character: "jiyu_default.png",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "다음", next: "chapter1_scene5_jiyu_grab_extended" }
        ]
    },
    chapter1_scene5_pass_jiyu_extended: {
        text: "왠지 말을 걸기가 망설여졌다. 그녀의 몽롱한 분위기가 나를 주춤하게 만들었다. 괜히 엮였다가 피곤해질 것 같았다.",
        character: "",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene6_start" }
        ]
    },
    chapter1_scene5_jiyu_grab_extended: {
        text: "잠깐… 너에게서… 낯선 기운이 느껴져. 뭔가… 잊혀진 그림자의 조각 같은 게… 꼭 내 그림 속에서 본 것 같아…",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "(놀라서 손목을 빼려 한다) 선배, 무슨 말씀을 하시는지… 그 그림자라뇨?", next: "chapter1_scene5_ask_jiyu_meaning_extended" }
        ]
    },
    chapter1_scene5_ask_jiyu_meaning_extended: {
        text: "아… 미안. 내가 가끔 이래. 그림에 너무 몰두하면… 헛것이 보이거나, 보이지 않던 게 보이기도 하거든. 난 이지유. 미술부의 영원한 부원이지. 너는?",
        character: "jiyu_smile.png",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: `${protagonistName}입니다. 이번에 전학 왔어요.`, next: "chapter1_scene5_jiyu_introduce_extended" }
        ]
    },
    chapter1_scene5_jiyu_introduce_extended: {
        text: "아하… 전학생이구나. 그래, 뭐… 어서 와. 우리 학교는 꽤 흥미로운 곳이야. 특히 이 미술실은… 수많은 이야기들을 품고 있지.",
        character: "jiyu_default.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "수많은 이야기요? 혹시 미술실에 뭔가 특별한 게 있는 건가요?", next: "chapter1_scene5_jiyu_art_room_secret_question", favorabilityChange: { jiyu: 4 } },
            { text: "네, 알겠습니다. 그럼 이만.", next: "chapter1_scene5_jiyu_art_room_secret_end", favorabilityChange: {} },
            { text: "혹시 선배도… 기억이 사라지거나, 이상한 환영을 보는 경험을 하신 적 있으세요?", next: "chapter1_scene5_jiyu_ask_memory_loss", favorabilityChange: { jiyu: 5, hayul: 1, sea: -1 } }
        ]
    },
    chapter1_scene5_jiyu_art_room_secret_question: {
        text: "글쎄… 그냥 그렇다는 거지. 눈에 보이는 게 다가 아니잖아? 때로는 눈에 보이지 않는 것이 더 많은 것을 말해줄 때도 있어. 그림이 그렇고… 꿈이 그렇고… 보이지 않는 영감 같은 거?",
        character: "jiyu_smile.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter1_scene5_end_extended" }
        ]
    },
    chapter1_scene5_jiyu_art_room_secret_end: {
        text: "왠지 대화가 통하지 않는 기분이었다. 더 이상 묻지 않고 갈 길을 갔다.",
        character: "",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene6_start" }
        ]
    },
    chapter1_scene5_jiyu_ask_memory_loss: {
        text: "…어떻게 알았지? 너도 봤어? 그… 검은 그림자 같은 거? 난 그걸 그림으로 그렸는데… 그리고 나서 중요한 걸 잊어버렸어. 아주 중요한 걸… 도대체 뭘까? 그게… 내 기억을 가져간 걸까…?",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room_door.png",
        choices: [
            { text: "다음", next: "chapter1_scene5_end_extended" }
        ]
    },
    chapter1_scene5_end_extended: {
        text: "이지유 선배와의 대화는 왠지 모르게 불길한 예감을 안겨주었다. '잊혀진 그림자', '기억을 가져간 것'… 이 모든 미스터리들이 결국 하나의 거대한 그림을 그리고 있는 것 같았다. 별빛 고등학교… 이곳은 단순한 학교가 아니었다.",
        character: "",
        background: "backgrounds/school_yard.png",
        choices: [
            { text: "다음 씬으로", next: "chapter1_scene6_start" }
        ]
    },
    // 씬 6: 챕터 1 마무리, 서서히 드러나는 진실의 조각들
    chapter1_scene6_start: {
        text: "전학 온 첫 주가 이렇게 정신없을 줄이야. 조용한 도서관의 류진, 활기찬 하율이, 냉철한 세아, 그리고 엉뚱한 지유 선배까지. 모두 개성 넘치는 친구들이었다.",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "다음", next: "chapter1_scene6_mystery_elements" }
        ]
    },
    chapter1_scene6_mystery_elements: {
        text: "하지만 그들의 이야기 속에서 공통적으로 '기억', '환영', '이상한 소문' 같은 단어들이 맴돌았다. 그리고 내 눈앞에 스쳐 지나갔던 그 희미한 그림자…",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "이 모든 게 우연일까? 아니면…? (더 깊이 파고들기로 결심한다)", next: "chapter1_scene6_deep_dive", favorabilityChange: { ryujin: 1, hayul: 1, sea: 1, jiyu: 1, mysteryInterest: 1 }, onChoose: () => {} },
            { text: "괜한 신경 쓰지 말고 그냥 평범하게 학교나 다니자. (평범한 일상을 택한다)", next: "chapter1_scene6_stay_normal", favorabilityChange: { ryujin: -5, hayul: -5, sea: -5, jiyu: -5, mysteryInterest: -5 }, onChoose: () => {} }
        ]
    },
    chapter1_scene6_deep_dive: {
        text: "단순한 우연이라고 치부하기에는 너무 많은 것들이 연결되어 있는 듯했다. 나는 이 학교의 숨겨진 비밀을 파헤치기로 결심했다.",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "챕터 1 종료", next: "chapter1_end" }
        ]
    },
    chapter1_scene6_stay_normal: {
        text: "괜히 복잡한 일에 휘말리고 싶지 않았다. 나는 그저 조용히 학교생활을 마치고 싶었다.",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "챕터 1 종료", next: "chapter1_end" }
        ]
    },
    chapter1_end: {
        text: "별빛 고등학교는 겉보기와는 다른, 거대한 비밀을 품고 있는 듯했다. 나는 이제 그 비밀의 문을 서서히 열어가기 시작했다. - 챕터 1 종료 -",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: [
            { text: "챕터 2로 넘어가기", next: "chapter2_start" }
        ]
    },
    // 챕터 2 시작
    chapter2_start: {
        text: "챕터 2: 그림자 속으로의 발걸음. 별빛 고등학교의 비밀은 점점 더 깊어진다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png", // 예시 배경
        choices: [
            { text: "계속하기", next: "chapter2_scene1_memory_loss_start" }
        ]
    },
    // 챕터 2: 미스터리의 서막과 '황혼의 서고'
    // 씬 1: 확산되는 기억 소실 (학교 복도 & 교실)
    chapter2_scene1_memory_loss_start: {
        text: "전학 온 지 일주일. 별빛 고등학교는 겉으로는 여전히 평화로워 보였다. 하지만 내 눈에는 그 평화 뒤에 숨겨진 불안감이 더욱 선명하게 느껴졌다. 그리고 그 불안감은 점점 더 커지고 있었다.",
        character: "",
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_hallway_students" }
        ]
    },
    chapter2_scene1_hallway_students: {
        text: "???:야, 너 진짜 기억 안 나? 어제 우리 반 철수, 아침에 오자마자 자기가 제일 아끼던 게임기 어디다 뒀는지 통 기억을 못 한대! 분명 어제까지 자기 침대 옆에 뒀다고 했는데… 아예 까맣게 잊었대. 자기가 게임기를 가지고 있었다는 사실 자체도 헷갈려 하고.",
        character: "", // 남학생들 대화 (이미지 없음)
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_hallway_students_2" }
        ]
    },
    chapter2_scene1_hallway_students_2: {
        text: "???:진짜? 완전 심각하네. 우리 반 수진이도 어제 아침에 뭘 먹었는지 기억 안 난다고 했었는데… 뭐야, 이거 진짜 심상치 않잖아? 우리 반에도 벌써 두 명째야.",
        character: "", // 남학생들 대화 (이미지 없음)
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_hallway_students_3" }
        ]
    },
    chapter2_scene1_hallway_students_3: {
        text: "???:우리 언니도 어제 자기가 보던 드라마 내용이 하나도 기억 안 난다고 난리더라니까? 분명 어제 밤에 다 봤다고 했는데, 내용이 통 기억이 안 난대.",
        character: "", // 여학생 대화 (이미지 없음)
        background: "backgrounds/school_hallway_morning.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_hayul_appear" }
        ]
    },
    chapter2_scene1_hayul_appear: {
        text: "(속으로) 기억 소실… 하율이가 말했던 현상이었다. 점점 더 많은 학생들이 겪고 있나 보다. 단순한 소문이 아니었어. 이건… 분명히 뭔가 심각한 일이 벌어지고 있다는 증거였다.",
        character: "",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_hayul_greeting" }
        ]
    },
    chapter2_scene1_hayul_greeting: {
        text: `${protagonistName}! 너도 들었지? 요즘 학교가 완전 난리야! 다들 자꾸 뭘 잊어버린대. 너는 괜찮아? 혹시 너도 뭔가 잊어버린 거 없어?`,
        character: "hayul_default.png",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "응, 들었어. 확실히 심상치 않아. 뭔가 큰 문제가 있는 것 같아. 나도 어딘가 묘한 기운을 느껴.", next: "chapter2_scene1_agree_hayul", favorabilityChange: { hayul: 3 } },
            { text: "글쎄… 다들 스트레스가 많아서 그런 거 아닐까? 너무 신경 쓰지 마.", next: "chapter2_scene1_disagree_hayul", favorabilityChange: { hayul: -2 } }
        ]
    },
    chapter2_scene1_agree_hayul: {
        text: "그치?! 너도 그렇게 생각하지?! 다들 단순한 피로라고 하는데… 난 아니라는 생각이 들어. 우리 이대로 가만히 있으면 안 될 것 같아! 뭔가 알아봐야 해!",
        character: "hayul_default.png",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_end" }
        ]
    },
    chapter2_scene1_disagree_hayul: {
        text: () => {
            const baseText = "괜히 불안감을 증폭시키고 싶지 않았다. 하지만 내 마음속에서도 '그럴 리 없다'는 생각이 들었다.";
            if (favorability.mysteryInterest < 0) { // 챕터 1에서 미스터리 추적 회피를 선택한 경우
                return baseText + " 나도 사실은 믿고 싶지 않았다. 이 모든 게 단순한 해프닝이기를 바랐다.";
            } else {
                return baseText;
            }
        },
        character: "",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음", next: "chapter2_scene1_end" }
        ]
    },
    chapter2_scene1_end: {
        text: "기억 소실… 이 현상이 과연 어디서부터 시작된 걸까? 그리고 왜 하필 별빛 고등학교에서만 벌어지는 걸까? 류진이 말했던 '황혼의 서고'와 관련이 있는 걸까? 머릿속이 복잡해졌다.",
        character: "",
        background: "backgrounds/classroom.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene2_library_call_start" } // 챕터 2의 다음 씬으로 연결
        ]
    },
    // 씬 2: 도서관의 호출 (확장된 씬)
    chapter2_scene2_library_call_start: {
        text: "점심시간. 주인공은 점심을 먹고 교실로 돌아오던 중, 복도에서 담임 선생님과 마주친다.",
        character: "",
        background: "backgrounds/school_hallway_lunch.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_teacher_talk_1" }
        ]
    },
    chapter2_scene2_teacher_talk_1: {
        text: "어, [주인공 이름]! 마침 잘 만났다. 너 도서부 활동 신청했었지? 오늘부터 바로 시작인데, 지금 도서관으로 가서 류진 학생한테 인수인계받아.",
        character: "", // 담임 선생님 이미지 제거
        background: "backgrounds/school_hallway_lunch.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_teacher_ask_book_club" }
        ]
    },
    chapter2_scene2_teacher_ask_book_club: {
        text: "(속으로) 도서부? 내가? 나는 도서부 신청을 한 기억이 전혀 없었다. 전학 와서 이것저것 서류를 작성하긴 했지만, 도서부는… 분명 아니었는데.",
        character: "",
        background: "backgrounds/school_hallway_lunch.png",
        choices: [
            { text: "네? 제가요? 제가 도서부 신청을… 했던가요?", next: "chapter2_scene2_accept_book_club", favorabilityChange: { ryujin: 1 } },
            { text: "아, 네! 신청했습니다! 지금 바로 가겠습니다!", next: "chapter2_scene2_confirm_book_club", favorabilityChange: { ryujin: 2 } }
        ]
    },
    chapter2_scene2_accept_book_club: {
        text: "뭐야, 기억 안 나? 네가 신청서에 분명 '도서부'라고 썼잖아. 아무튼, 지금 도서관으로 가서 류진한테 인수인계받아. 지각하지 말고!",
        character: "",
        background: "backgrounds/school_hallway_lunch.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_library_approach" }
        ]
    },
    chapter2_scene2_confirm_book_club: {
        text: "오, 그래! 아주 적극적이네. 보기 좋다! 그럼 바로 가봐라!",
        character: "",
        background: "backgrounds/school_hallway_lunch.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_library_approach" }
        ]
    },
    chapter2_scene2_library_approach: {
        text: "(어떤 선택지를 골랐든, 주인공은 도서관으로 향한다.)",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_ryujin_greeting" }
        ]
    },
    chapter2_scene2_ryujin_greeting: {
        text: "저… 류진? 담임 선생님이 도서부 활동 때문에 오라고 하셔서…",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_ryujin_expected" }
        ]
    },
    chapter2_scene2_ryujin_expected: {
        text: "오셨군요. 예상대로입니다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "예상대로라뇨? 혹시… 제가 도서부 신청한 거 알고 있었어요? 아니면… 혹시 당신이 제 신청서를…", next: "chapter2_scene2_ask_ryujin_plan", favorabilityChange: { ryujin: 3 } },
            { text: "…무슨 말씀이신지 모르겠네요.", next: "chapter2_scene2_ignore_ryujin", favorabilityChange: { ryujin: -1 } }
        ]
    },
    chapter2_scene2_ask_ryujin_plan: {
        text: "알고 있었습니다. 당신은 이 서고에 끌릴 운명이었으니까요. 그리고 신청서는 제가 제출했습니다. 당신이 스스로 기억하지 못할 뿐.",
        character: "ryujin_smile.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_ryujin_task" }
        ]
    },
    chapter2_scene2_ignore_ryujin: {
        text: "곧 알게 될 겁니다. 이 서고의 비밀, 그리고 당신의 역할에 대해. 이곳에 올 수 있는 자는 정해져 있습니다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_ryujin_task" }
        ]
    },
    chapter2_scene2_ryujin_task: {
        text: "도서부의 첫 업무입니다. 이 책들을 분류하고 제자리에 꽂으세요. 특히 이 책은… '황혼의 서고'로 가져가야 합니다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_twilight_archive_question" }
        ]
    },
    chapter2_scene2_twilight_archive_question: {
        text: "'황혼의 서고'요? 그게 어딘데요? 제가 알기로 도서관 끝은 막힌 벽인데요…",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음", next: "chapter2_scene2_twilight_archive_location" }
        ]
    },
    chapter2_scene2_twilight_archive_location: {
        text: "이곳 도서관 가장 깊숙한 곳에 숨겨진 공간입니다. (손가락으로 도서관 한 구석, 평범해 보이는 벽 쪽을 가리킨다.) 저 벽을 통해서 들어갈 수 있습니다.",
        character: "ryujin_default.png",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene2_end" } // 챕터 2의 씬 2 종료
        ]
    },
    chapter2_scene2_end: {
        text: "(속으로) 평범한 벽? 설마… 류진이 나를 속이는 건가? 아니면 정말 비밀 통로라도 있는 걸까? 어쩐지 등골이 오싹해졌다. 그녀는 나에게 이 학교의 비밀에 대한 첫 단서를 너무나 태연하게 던져준 것 같았다. 나는 이제 돌이킬 수 없는 강을 건너는 기분이었다.",
        character: "",
        background: "backgrounds/library.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene3_art_room_start" } // 챕터 2의 다음 씬으로 연결
        ]
    },
    // 씬 3: 사라진 그림의 미스터리 (확장된 씬)
    chapter2_scene3_art_room_start: {
        text: "도서부 활동을 마치고 돌아오는 길이었다. 류진의 말들은 머릿속을 맴돌며 혼란을 가중시켰다. '황혼의 서고', '이 서고에 끌릴 운명'… 내가 정말 이 미스터리의 중심에 서게 된 걸까? 생각에 잠겨 걷던 중, 문득 미술실 문이 평소보다 활짝 열려 있는 것이 눈에 들어왔다. 안에서 옅은 물감 냄새와 함께 깊은 한숨 소리가 들려왔다.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png", // 복도 배경
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_appear" }
        ]
    },
    chapter2_scene3_jiyu_appear: {
        text: "(속으로) 이지유 선배인가? 무슨 일이라도 있나? 하율이가 말했던 그 미술부 선배… 기억을 잃었다는 그 선배가 바로 이지유 선배였지.",
        character: "jiyu_concerned.png", // 이지유 초조한 표정
        background: "backgrounds/art_room.png", // 미술실 배경
        choices: [
            { text: "선배, 무슨 일 있으세요? 괜찮으세요?", next: "chapter2_scene3_ask_jiyu_problem", favorabilityChange: { jiyu: 2 } },
            { text: "…(그냥 지나간다. 괜히 엮였다가 피곤해질 것 같다.)", next: "chapter2_scene3_pass_jiyu", favorabilityChange: { jiyu: -3 } }
        ]
    },
    chapter2_scene3_ask_jiyu_problem: {
        text: "아… [주인공 이름]이구나. 큰일 났어. 내 그림이… 사라졌어!",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_lost_painting" }
        ]
    },
    chapter2_scene3_pass_jiyu: {
        text: "그녀의 모습에서 느껴지는 불안감에 왠지 모르게 발길이 떨어지지 않았다. 하지만 굳이 나서서 복잡한 일에 엮이고 싶지 않은 마음도 있었다.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene4_sea_start" } // 이지유와 엮이지 않을 경우 다음 씬으로 연결
        ]
    },
    chapter2_scene3_jiyu_lost_painting: {
        text: "그림이요? 어떤 그림인데요? 여기저기 둘러봐도 보이지 않는데요…",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_lost_painting_details" }
        ]
    },
    chapter2_scene3_jiyu_lost_painting_details: {
        text: "내가 지난주 내내 밤새워 그렸던 그림! 엄청 크고… 뭔가 거대한 어둠 속에 잠긴 듯한 형상들이 그려진 그림이었는데… 분명 어제까지만 해도 여기 이젤에 있었는데… 감쪽같이 사라졌어! 흔적도 없이!",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_lost_memory" } // 새롭게 추가될 씬
        ]
    },
    chapter2_scene3_jiyu_lost_memory: {
        text: "난 그 그림을 그릴 때마다 뭔가 중요한 것을… 잃어버리는 기분이었어. 그리고 지금은 그림 자체가 사라졌네… 마치 내가 뭘 그렸는지 기억하지 못하는 것처럼 말이야. 분명 내가 그린 건 맞는데… 내용은 희미해… 꿈처럼.",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "선배… 혹시 그 그림이… 요즘 학교에 도는 '기억 소실' 사건이랑 관련이 있는 걸까요? 저도 비슷한 걸 느꼈어요.", next: "chapter2_scene3_connect_mystery", favorabilityChange: { jiyu: 4, mysteryInterest: 1 } },
            { text: "다시 그릴 수 있지 않을까요? 선배의 실력이면 충분히 멋진 그림을 그릴 수 있을 거예요.", next: "chapter2_scene3_console_jiyu", favorabilityChange: { jiyu: 1 } }
        ]
    },
    chapter2_scene3_connect_mystery: {
        text: "…어떻게 알았지? 너도 봤어? 그… 검은 그림자 같은 거? 난 그걸 그림으로 그렸는데… 그리고 나서 중요한 걸 잊어버렸어. 아주 중요한 걸… 도대체 뭘까? 그게… 내 기억을 가져간 걸까…?",
        character: "jiyu_concerned.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_resolve" }
        ]
    },
    chapter2_scene3_console_jiyu: {
        text: "다시 그릴 수 있을까? 뭘 그렸는지 정확히 기억도 안 나는데… 마치 꿈처럼 희미해. 처음부터 다시 시작해야 할 것 같아. 그래도… 위로해줘서 고마워, [주인공 이름].",
        character: "jiyu_smile.png",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene3_jiyu_resolve" }
        ]
    },
    chapter2_scene3_jiyu_resolve: {
        text: "아냐! 여기서 이럴 순 없어! 분명 그림이 사라진 이유가 있을 거야! 내 그림은… 단순한 그림이 아니었어! 기억을 잃는다는 건… 마치 존재 자체가 희미해지는 것 같아. 찾고 말겠어, 내 그림!",
        character: "jiyu_determined.png", // 새로운 이지유 표정 (결연한) 추가 (가정)
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene3_end" }
        ]
    },
    chapter2_scene3_end: {
        text: "사라진 그림… 그것은 단순한 분실이 아니라, 미스터리의 중요한 열쇠가 될 것 같았다. 이지유 선배의 그림이 가진 비밀은 무엇일까? 그리고 그 그림이 기억 소실 현상과 어떤 관련이 있는 걸까?",
        character: "",
        background: "backgrounds/art_room.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene4_sea_start" } // 챕터 2의 다음 씬으로 연결
        ]
    },
    // 씬 4: 윤세아의 경계와 제안 (확장된 씬)
    chapter2_scene4_sea_start: {
        text: "도서부 활동을 마치고 돌아오는 길이었다. 류진의 말들은 머릿속을 맴돌며 혼란을 가중시켰다. '황혼의 서고', '이 서고에 끌릴 운명'… 내가 정말 이 미스터리의 중심에 서게 된 걸까? 생각에 잠겨 걷던 중, 문득 학생회장실 문이 살짝 열려 있는 것이 눈에 들어왔다.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png", // 복도 배경
        choices: [
            { text: "다음", next: "chapter2_scene4_sea_phone_call" }
        ]
    },
    chapter2_scene4_sea_phone_call: {
        text: "…예. 알겠습니다. 더 이상의 혼란은 없어야 합니다. 어떤 일이 있어도, 학교의 명예는 지켜져야 합니다. 현재 상황은 단순히 학생들의 불안감으로 치부하기에는 너무나 심각합니다.",
        character: "se_a_default.png",
        background: "backgrounds/student_council_room.png", // 학생회장실 배경 (가정)
        choices: [
            { text: "다음", next: "chapter2_scene4_sea_discover_protagonist" }
        ]
    },
    chapter2_scene4_sea_discover_protagonist: {
        text: "[주인공 이름]? 무슨 일입니까? 학생회장실 근처에서 서성이는 것은 금지되어 있습니다. 개인적인 공간이니 함부로 접근하지 마십시오.",
        character: "se_a_default.png",
        background: "backgrounds/student_council_room.png",
        choices: [
            { text: "죄송합니다. 지나가던 길이었는데… 혹시 무슨 문제라도 있으신가요? 표정이 안 좋아 보이셔서요.", next: "chapter2_scene4_ask_sea_problem" },
            { text: "아닙니다. 그냥 지나가던 길이었습니다. 실례했습니다.", next: "chapter2_scene4_retreat_from_sea", favorabilityChange: { sea: 1, ryujin: -1 } }
        ]
    },
    chapter2_scene4_ask_sea_problem: {
        text: "당신이 알 필요 없는 일입니다. 그리고… 요즘 학교에서 벌어지는 불필요한 일들에 대해 지나치게 관심을 갖지 마십시오. 학교의 안녕을 위해선, 불필요한 소문은 더 이상 확산돼서는 안 됩니다.",
        character: "se_a_default.png",
        background: "backgrounds/student_council_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene4_sea_offer_cooperation", favorabilityChange: { sea: -2, hayul: -1 } }
        ]
    },
    chapter2_scene4_retreat_from_sea: {
        text: "그녀와의 대화는 항상 불편했다. 하지만 그녀의 표정에서 뭔가 심각한 일이 벌어지고 있음을 느꼈다. 왠지 모르게 도망치는 기분이었다.",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene5_twilight_archive_start" } // 윤세아와 엮이지 않을 경우 다음 씬으로 연결 (예시)
        ]
    },
    chapter2_scene4_sea_offer_cooperation: {
        text: "…하지만 당신이 호기심이 많다는 것은 알고 있습니다. 좋습니다. 정식으로 제안하죠. 요즘 학교에서 벌어지는 일들은 단순히 '소문'이 아닙니다. 하지만 학생들 사이에서 불필요한 동요를 일으켜서는 안 됩니다. 만약 당신이 정말로 이 문제를 해결하고 싶다면… 저에게 협력하십시오. 저에게 보고하십시오.",
        character: "se_a_default.png",
        background: "backgrounds/student_council_room.png",
        choices: [
            { text: "협력하겠습니다. 제가 무엇을 도우면 될까요? 학교의 안정을 위해서라면.", next: "chapter2_scene4_accept_cooperation", favorabilityChange: { sea: 4, mysteryInterest: 2 } },
            { text: "죄송합니다. 저는 제 방식대로 움직이고 싶습니다. 제가 직접 파헤치고 싶습니다.", next: "chapter2_scene4_decline_cooperation", favorabilityChange: { sea: -4, hayul: 1, ryujin: 1 } }
        ]
    },
    chapter2_scene4_accept_cooperation: {
        text: "좋습니다. 현명한 판단입니다. 우선, 당신은 제가 지시하는 대로 움직여야 합니다. 그리고 당신이 얻은 어떤 정보도 저에게 보고해야 합니다. 이 모든 것은 학교의 질서와 안정을 위해서입니다. 정보는 공유하되, 함부로 행동해서는 안 됩니다.",
        character: "se_a_default.png",
        background: "backgrounds/student_council_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene4_end" }
        ]
    },
    chapter2_scene4_decline_cooperation: {
        text: "…어리석은 선택입니다. 혼자서는 아무것도 할 수 없습니다. 이 문제는 당신의 생각보다 훨씬 심각합니다. 당신의 안전은 보장할 수 없군요. 그리고 당신의 돌발 행동이 오히려 학교에 해를 끼칠 수도 있습니다.",
        character: "se_a_angry.png",
        background: "backgrounds/student_council_room.png",
        choices: [
            { text: "다음", next: "chapter2_scene4_end" }
        ]
    },
    chapter2_scene4_end: {
        text: "윤세아는 냉정한 표정으로 지나쳐갔지만, 그녀의 말은 왠지 모르게 꺼림칙했다. '불필요한 소문'이라니. 학교에서 벌어지는 기이한 일들을 알고 있으면서도 일부러 덮으려 하는 걸까? 아니면… 그녀 자신이 그 소문의 일부인 걸까?",
        character: "",
        background: "backgrounds/school_hallway_after_class.png",
        choices: [
            { text: "다음 씬으로", next: "chapter2_scene5_twilight_archive_start" } // 챕터 2의 다음 씬으로 연결
        ]
    },
    // 씬 5: 황혼의 서고로의 첫 발 (확장된 씬)
    chapter2_scene5_twilight_archive_start: {
        text: "윤세아와의 대화는 나에게 또 다른 숙제를 남겼다. 학교의 명예를 지키려는 그녀의 방식은 나와 달랐지만, 결국 우리는 같은 미스터리에 얽혀 있었다. 하지만 지금 가장 중요한 건… 류진이 말했던 '황혼의 서고'였다. 그곳에 분명 이 모든 비밀의 열쇠가 있을 것이다.",
        character: "",
        background: "backgrounds/library_night.png", // 가정: 도서관 밤 배경
        choices: [
            { text: "다음", next: "chapter2_scene5_ryujin_ask_books" }
        ]
    },
    chapter2_scene5_ryujin_ask_books: {
        text: "도서부 업무입니다. 어제 드린 책들을 가져왔습니까?",
        character: "ryujin_default.png",
        background: "backgrounds/library_night.png",
        choices: [
            { text: "네, 가져왔어요. 그런데… 류진, '황혼의 서고'는 정말 어떻게 들어가는 건가요? 제가 아는 도서관 끝은 그냥 벽인데요.", next: "chapter2_scene5_ask_twilight_archive" }
        ]
    },
    chapter2_scene5_ask_twilight_archive: {
        text: "따라오십시오.",
        character: "ryujin_default.png",
        background: "backgrounds/library_night.png",
        choices: [
            { text: "다음", next: "chapter2_scene5_ryujin_lead" }
        ]
    },
    chapter2_scene5_ryujin_lead: {
        text: "(류진이 자리에서 일어나 도서관 가장 깊숙한 곳, 마치 일반적인 벽처럼 보이는 공간으로 걸어간다. 낡은 책장과 먼지 쌓인 벽돌이 전부인 듯한 그곳에 류진이 조용히 손을 얹는다.)",
        character: "", // 류진 이미지, 뒷모습이나 측면으로 연출
        background: "backgrounds/library_dim_corner.png", // 가정: 도서관 어두운 구석 배경
        choices: [
            { text: "다음", next: "chapter2_scene5_enter_twilight_archive" }
        ]
    },
    chapter2_scene5_enter_twilight_archive: {
        text: "(효과음: 희미한 웅웅거림과 함께 공간이 일렁이는 소리.) 숨을 들이켰다. 믿을 수 없었다. 정말 비밀 통로였다니! 말로만 듣던 '황혼의 서고'가 눈앞에 펼쳐졌다. 어둠 속에서도 빛나는 책장들이 마치 살아있는 듯했다. 책에서는 옅은 먼지 냄새와 함께 알 수 없는 고서의 향기가 풍겨 나왔다. 발을 들여놓자, 바깥 도서관과는 확연히 다른, 묘한 중압감이 느껴졌다.",
        character: "",
        background: "backgrounds/twilight_archive.png", // 가정: 황혼의 서고 배경
        choices: [
            { text: "다음", next: "chapter2_scene5_twilight_archive_explanation" }
        ]
    },
    chapter2_scene5_twilight_archive_explanation: {
        text: "이곳이 '황혼의 서고'입니다. 평범한 학생들은 이곳의 존재조차 알지 못합니다. 그리고 이곳에 있는 책들은… 바깥세상의 지식과는 다른, 특별한 힘을 가지고 있습니다.",
        character: "ryujin_default.png",
        background: "backgrounds/twilight_archive.png",
        choices: [
            { text: "대단해요… 정말 이런 곳이 있다니…! 믿을 수가 없네요. 마치 꿈을 꾸는 것 같아요!", next: "chapter2_scene5_archive_impression_positive", favorabilityChange: { ryujin: 3, mysteryInterest: 2 } },
            { text: "조금… 으스스한데요. 여기 정말 안전한 곳 맞나요? 어쩐지 오싹한 기운이 느껴져요.", next: "chapter2_scene5_archive_impression_negative", favorabilityChange: { ryujin: -1 } }
        ]
    },
    chapter2_scene5_archive_impression_positive: {
        text: "흥미로워하는군요. 당신은 분명 이 서고의 선택을 받은 자입니다. 이곳의 비밀을 이해할 자격이 있습니다.",
        character: "ryujin_default.png", // 만족감 표현 가능한 이미지 사용
        background: "backgrounds/twilight_archive.png",
        choices: [
            { text: "다음", next: "chapter2_scene5_ryujin_last_words" }
        ]
    },
    chapter2_scene5_archive_impression_negative: {
        text: "안전하다고는 장담할 수 없습니다. 이곳의 힘은 양날의 검과 같으니까요. 하지만 이곳의 비밀을 알아야만, 학교의 문제도 해결할 수 있을 겁니다. 선택은 당신의 몫입니다.",
        character: "ryujin_default.png",
        background: "backgrounds/twilight_archive.png",
        choices: [
            { text: "다음", next: "chapter2_scene5_ryujin_last_words" }
        ]
    },
    chapter2_scene5_ryujin_last_words: {
        text: "이곳에 있는 책 중 일부는 스스로 지식을 선택하고, 필요한 자에게만 모습을 드러냅니다. 당신이 찾아야 할 책은… 아마도 당신을 부를 겁니다.",
        character: "ryujin_default.png",
        background: "backgrounds/twilight_archive.png",
        choices: [
            { text: "다음", next: "chapter2_scene5_end" }
        ]
    },
    chapter2_scene5_end: {
        text: "('나를 부른다'? 마치 살아있는 생명체 같다는 그녀의 말이 현실로 다가오는 듯했다. 이 거대한 서고에 숨겨진 비밀. 그리고 기억을 잃는 학생들. 사라진 그림… 이 모든 미스터리가 이 '황혼의 서고'와 연결되어 있는 걸까? 이곳에서 나는 무엇을 알게 될까? 그리고 이 미스터리의 끝에는 무엇이 기다리고 있을까? 나는 이곳에서… 나의 '역할'을 찾을 수 있을까?)\n\n- 챕터 2 종료 -",
        character: "",
        background: "backgrounds/twilight_archive.png",
        choices: [
            { text: "게임 종료", next: "chapter2_end_game" } // 챕터 2 종료 후 게임 종료 씬으로 연결 (예시)
        ]
    },
    chapter2_end_game: {
        text: "게임이 종료되었습니다. 플레이해주셔서 감사합니다!",
        character: "",
        background: "backgrounds/player_room_night.png",
        choices: []
    }
};

let currentState = 'chapter1_scene1_new_morning_start'; // 게임 시작점을 새로운 씬으로 변경

function updateGame(saveToHistory = true) { // saveToHistory 매개변수 추가
    console.log("Current State:", currentState);

    if (saveToHistory) {
        saveCurrentStateToHistory(); // 매개변수에 따라 history에 저장
    }

    const currentScene = gameStory[currentState];
    let displayText;
    if (typeof currentScene.text === 'function') {
        displayText = currentScene.text();
    } else {
        displayText = currentScene.text;
    }
    displayText = displayText.replace(/\[주인공 이름\]/g, protagonistName); // 주인공 이름 대체
    dialogueText.textContent = displayText;
    characterImage.src = currentScene.character ? `assets/characters/${currentScene.character}` : '';
    characterImage.alt = currentScene.character ? '캐릭터 이미지' : '';
    gameContainer.style.backgroundImage = currentScene.background ? `url('assets/${currentScene.background}')` : 'none'; // 배경 이미지 적용

    choicesContainer.style.display = 'none'; // 선택지 버튼 컨테이너를 먼저 숨깁니다.
    choicesContainer.innerHTML = ''; // 기존 선택지 버튼들을 지웁니다.
    currentScene.choices.forEach(choice => {
        const button = document.createElement('button');
        button.classList.add('choice-button');
        button.textContent = choice.text.replace(/\[주인공 이름\]/g, protagonistName); // 선택지 텍스트에도 이름 대체
        button.onclick = () => {
            console.log("Button clicked! Next scene:", choice.next, "Choice text:", choice.text); // 디버깅용 로그 추가
            // onChoose 액션 실행 (자기소개 타입 설정 등)
            if (choice.onChoose) {
                choice.onChoose();
            }
            // 호감도 변경 적용
            if (choice.favorabilityChange) {
                for (const char in choice.favorabilityChange) {
                    favorability[char] += choice.favorabilityChange[char];
                    console.log(`${char} 호감도: ${favorability[char]}`); // 개발용: 호감도 변화 콘솔 출력
                }
                updateAffinityBars(); // 호감도 변경 시 바 업데이트
            }
            currentState = choice.next;
            // 다음 씬으로 넘어가기 전에 선택지들을 페이드 아웃시키고, 완전히 사라지면 다음 씬으로 전환
            Array.from(choicesContainer.children).forEach(button => {
                button.style.opacity = '0';
            });
            setTimeout(() => {
                choicesContainer.style.display = 'none'; // 모든 버튼이 사라지면 컨테이너 숨기기
                updateGame(); // 다음 씬으로 넘어갈 때 saveToHistory는 기본값(true) 유지
            }, 500); // CSS transition 시간 (0.5초)과 동일하게 설정
        };
        choicesContainer.appendChild(button);
        // 버튼 생성 후 페이드 인 효과 적용 (여기서는 이미 opacity 0이므로 setTimeout으로 1로 변경)
        setTimeout(() => {
            button.style.opacity = '1';
        }, 50); // 약간의 지연 후 opacity를 1로 설정하여 전환 효과 발동
    });
    // 모든 선택지 버튼이 추가된 후 choicesContainer를 다시 보이게 함
    choicesContainer.style.display = 'flex'; // 선택지 버튼 컨테이너를 다시 보이게 합니다.
    saveLatestGameStateToLocalStorage(); // 항상 최신 상태를 localStorage에 저장
}

// 초기 게임 시작 화면 설정
function initializeGame() {
    const gameLoaded = loadGameStateFromLocalStorage();

    if (gameLoaded && protagonistName) { // 저장된 게임이 있고 주인공 이름이 있으면 바로 게임 시작 화면으로
        nameInputContainer.style.display = 'none';
        characterImage.style.display = 'block';
        // dialogueBox.style.display = 'block'; // interactionContainer가 제어
        // choicesContainer.style.display = 'flex'; // interactionContainer가 제어
        affinityBarsContainer.style.display = 'block';
        interactionContainer.style.display = 'flex'; // interactionContainer 보이도록 설정
        gameContainer.style.backgroundImage = gameStory[currentState].background ? `url('assets/${gameStory[currentState].background}')` : 'none'; // 배경 이미지 적용
        // 로드된 상태로 게임 시작 (history는 이미 loadGameStateFromLocalStorage에서 불러옴)
        updateGame(false); // UI만 업데이트 (history에 중복 저장 방지)
        updateAffinityBars();
    } else { // 저장된 게임이 없거나 주인공 이름이 없으면 이름 입력 화면으로
    nameInputContainer.style.display = 'flex';
    characterImage.style.display = 'none';
        // dialogueBox.style.display = 'none'; // interactionContainer가 제어
    // choicesContainer.style.display = 'none'; // interactionContainer가 제어
        interactionContainer.style.display = 'none'; // interactionContainer 숨기도록 설정
        affinityBarsContainer.style.display = 'block'; // 호감도 바는 항상 보이도록
        gameContainer.style.backgroundImage = `url('assets/backgrounds/school_gate.png')`; // 시작 화면 배경 이미지 적용 (수정)
        // 이전에 저장된 주인공 이름이 있다면 입력 필드에 미리 채워줍니다.
        const savedProtagonistName = localStorage.getItem('myVisualNovelGame') ? JSON.parse(localStorage.getItem('myVisualNovelGame')).protagonistName : "";
        if (savedProtagonistName) {
            protagonistNameInput.value = savedProtagonistName;
        }
        // 초기 시작 상태를 history에 저장
        currentState = 'chapter1_scene1_new_morning_start'; // 초기 씬 설정
        gameStateHistory = []; // history 초기화
        saveCurrentStateToHistory(); // history에 첫 상태 추가
    }
    isSettingsMenuOpen = false; // 초기화 시 설정 메뉴 닫힘
    updateBackButtonVisibility(); // 초기 버튼 가시성 설정
}

// 게임 시작 버튼 이벤트 리스너
startGameButton.addEventListener('click', () => {
    const name = protagonistNameInput.value.trim();
    if (name) {
        protagonistName = name;
        localStorage.removeItem('myVisualNovelGame'); // 새 게임 시작 시 자동 저장 데이터만 초기화 (수정)
        nameInputContainer.style.display = 'none';
        characterImage.style.display = 'block'; // 게임 시작 시 캐릭터 이미지 보이기
        // dialogueBox.style.display = 'block'; // interactionContainer가 제어
        // choicesContainer.style.display = 'flex'; // interactionContainer가 제어
        affinityBarsContainer.style.display = 'block'; // 게임 시작 시 호감도 바 보이기
        interactionContainer.style.display = 'flex'; // interactionContainer 보이도록 설정
        
        // 게임 시작 시 history 초기화 및 첫 상태 저장
        gameStateHistory = []; // 새로운 게임 시작 시 history 초기화
        currentState = 'chapter1_scene1_new_morning_start'; // 첫 씬으로 설정
        updateGame(); // 게임 시작 (자동으로 history에 첫 상태 저장)
        updateAffinityBars();
        // saveLatestGameStateToLocalStorage(); // updateGame에서 처리
    } else {
        alert("주인공 이름을 입력해주세요!");
    }
});

// 뒤로 가기 버튼 이벤트 리스너
backButton.addEventListener('click', goBack);

// 초기화 버튼 이벤트 리스너
resetButton.addEventListener('click', resetGame);

// 설정 버튼 이벤트 리스너
settingsButton.addEventListener('click', toggleSettingsMenu);

// 저장 버튼 이벤트 리스너
saveGameButton.addEventListener('click', saveGame);

// 불러오기 버튼 이벤트 리스너
loadGameButton.addEventListener('click', loadGame);

// 페이지 로드 시 초기화
initializeGame(); 
