// ============================================
// 3D CAR RACING GAME - Zero Overlap Fix
// - Track width increased to 20 units
// - 4 distinct lanes: -7.5, -2.5, +2.5, +7.5
// - Hard barrier collision (pushes car back)
// - AI lateral repulsion (no stacking)
// ============================================

window.racingState = {
    scene: null, camera: null, renderer: null, canvas: null,
    gameLoop: null, isRunning: false, isPaused: false, isGameOver: false, initialized: false,
    playerCar: null, playerSpeed: 0, playerMaxSpeed: 0.26, playerAccel: 0.007,
    playerBrake: 0.018, playerFriction: 0.006, playerAngle: 0, playerTurnSpeed: 0.038,
    playerPos: { x: 0, z: 0 },
    trackSegments: [], trackWidth: 20, totalSegments: 200, trackCurve: [],
    aiCars: [], aiCount: 3,
    lap: 1, totalLaps: 3, lapProgress: 0, lastProgress: 0,
    position: 1, lapTime: 0, bestLap: null, raceFinished: false,
    raceStarted: false, countdown: 3, countdownTimer: null, startTime: 0, lapStartTime: 0,
    keys: {}, touchControls: { accel: false, brake: false, left: false, right: false, nitro: false },
    roadMeshes: [], barrierMeshes: [], treeMeshes: [], ground: null,
    ambientLight: null, dirLight: null,
    checkpoints: [], passedCheckpoints: new Set(),
    exhaustParticles: [],
    _keyDown: null, _keyUp: null,
    // Upgrades
    difficulty: 'medium',
    playerColor: 0xFF2222,
    nitro: 0, nitroActive: false, nitroTimer: 0,
    NITRO_MAX: 15000, NITRO_DURATION: 2000, NITRO_BOOST: 1.4,
    cameraMode: 0,
    _mmBounds: null,
};

// 4 lanes spaced 5 units apart inside a 20-unit-wide track
// Car body = 1.8 wide → 3.2 units of clear air between any two adjacent cars
const RACING_LANES = [-7.5, -2.5, 2.5, 7.5];

const DIFFICULTY_CONFIG = {
    easy:   { aiMult: 0.75, rubberband: false, brakeEarly: true  },
    medium: { aiMult: 1.00, rubberband: false, brakeEarly: false },
    hard:   { aiMult: 1.20, rubberband: true,  brakeEarly: false },
};

const CAR_COLOR_OPTIONS = [
    { hex: 0xFF2222, css: '#ff2222', label: 'Red'    },
    { hex: 0x2255FF, css: '#2255ff', label: 'Blue'   },
    { hex: 0x22CC44, css: '#22cc44', label: 'Green'  },
    { hex: 0xFF8800, css: '#ff8800', label: 'Orange' },
    { hex: 0xEEEEEE, css: '#eeeeee', label: 'White'  },
];

// ============================================
// INIT
// ============================================

function initCarRacing() {
    const state = window.racingState;
    if (state.gameLoop)      { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    if (state.countdownTimer){ clearInterval(state.countdownTimer);  state.countdownTimer = null; }
    if (state.renderer)      { state.renderer.dispose();             state.renderer = null; }
    stopEngineSound();
    ['car-start-overlay','car-finish-overlay','car-countdown'].forEach(id => {
        const el = document.getElementById(id); if (el) el.remove();
    });
    Object.assign(state, {
        isRunning: false, isPaused: false, isGameOver: false, raceFinished: false,
        raceStarted: false, countdown: 3, lap: 1, lapProgress: 0, lastProgress: 0,
        position: 1, lapTime: 0, bestLap: null, initialized: false,
        keys: {}, touchControls: { accel: false, brake: false, left: false, right: false, nitro: false },
        passedCheckpoints: new Set(),
        aiCars: [], trackSegments: [], trackCurve: [], roadMeshes: [],
        barrierMeshes: [], treeMeshes: [], checkpoints: [],
        playerSpeed: 0, playerAngle: 0, playerPos: { x: 0, z: 0 },
        nitro: 0, nitroActive: false, nitroTimer: 0, cameraMode: 0, _mmBounds: null,
    });
    requestAnimationFrame(() => { setTimeout(() => _initCarRacingInternal(), 100); });
}

function _initCarRacingInternal() {
    const state = window.racingState;
    if (typeof THREE === 'undefined') {
        showCarRacingFallback('Three.js library failed to load.');
        return;
    }
    const wrapper = document.querySelector('.car-racing-canvas-wrapper');
    state.canvas  = document.getElementById('car-racing-canvas');
    if (!state.canvas) return;

    const w = wrapper ? Math.max(wrapper.offsetWidth, 300) : 600;
    const h = Math.min(Math.max(window.innerHeight - 300, 300), 460);
    state.canvas.width  = w; state.canvas.height  = h;
    state.canvas.style.width  = w + 'px';
    state.canvas.style.height = h + 'px';

    state.scene = new THREE.Scene();
    state.scene.background = new THREE.Color(0x4ab8ff);
    state.scene.fog = new THREE.FogExp2(0x7dd8ff, 0.004);
    state.camera = new THREE.PerspectiveCamera(65, w / h, 0.1, 500);

    try {
        state.renderer = new THREE.WebGLRenderer({ canvas: state.canvas, antialias: window.devicePixelRatio < 2 });
        state.renderer.setSize(w, h);
        state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        state.renderer.shadowMap.enabled = true;
        state.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    } catch(e) {
        showCarRacingFallback('WebGL not supported on this device.');
        return;
    }

    injectRacingCSS();
    buildTrack();
    buildEnvironment();
    buildCrowd();
    buildBillboards();
    buildLights();
    setupRacingControls();
    updateRacingUI();

    // ── Speedometer HUD ──
    if (!document.getElementById('cr-speedometer')) {
        const spd = document.createElement('div'); spd.id = 'cr-speedometer';
        spd.innerHTML = `<span id="cr-spd-val">0</span><span class="cr-spd-unit">KM/H</span>`;
        wrapper.appendChild(spd);
    }

    // ── Nitro bar ──
    if (!document.getElementById('cr-nitro-bar-wrap')) {
        const nb = document.createElement('div'); nb.id = 'cr-nitro-bar-wrap';
        nb.innerHTML = `<div class="cr-nitro-label">⚡ NITRO</div><div id="cr-nitro-track"><div id="cr-nitro-fill"></div></div>`;
        wrapper.appendChild(nb);
    }

    // ── Mini-map ──
    if (!document.getElementById('cr-minimap')) {
        const mm = document.createElement('canvas');
        mm.id = 'cr-minimap'; mm.width = 120; mm.height = 120;
        wrapper.appendChild(mm);
        // Cache track bounding box
        let minX=Infinity,maxX=-Infinity,minZ=Infinity,maxZ=-Infinity;
        state.trackCurve.forEach(p => {
            if(p.x<minX)minX=p.x; if(p.x>maxX)maxX=p.x;
            if(p.z<minZ)minZ=p.z; if(p.z>maxZ)maxZ=p.z;
        });
        state._mmBounds = {minX,maxX,minZ,maxZ};
    }

    // ── Camera label ──
    if (!document.getElementById('cr-cam-label')) {
        const cl = document.createElement('div'); cl.id = 'cr-cam-label';
        cl.textContent = 'FOLLOW';
        wrapper.appendChild(cl);
    }

    state.initialized = true;

    state.camera.position.set(0, 120, 0);
    state.camera.lookAt(0, 0, 0);
    state.renderer.render(state.scene, state.camera);
    drawRacingStartScreen();
}

// ============================================
// TRACK  (width = 20 units)
// ============================================

function buildTrack() {
    const state = window.racingState;
    const N  = state.totalSegments;
    const TW = state.trackWidth; // 20

    state.trackCurve = [];
    for (let i = 0; i < N; i++) {
        const t = (i / N) * Math.PI * 2;
        state.trackCurve.push({
            x: Math.cos(t) * (90 + 20 * Math.sin(t * 2)),
            z: Math.sin(t) * (55 + 10 * Math.cos(t * 3))
        });
    }

    const roadMat     = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const lineMat     = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
    const barrierMatR = new THREE.MeshLambertMaterial({ color: 0xCC2222 });
    const barrierMatW = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

    for (let i = 0; i < N; i++) {
        const curr  = state.trackCurve[i];
        const next  = state.trackCurve[(i + 1) % N];
        const dx = next.x - curr.x, dz = next.z - curr.z;
        const len   = Math.sqrt(dx*dx + dz*dz);
        const angle = Math.atan2(dx, dz);
        const mx = curr.x + dx * 0.5, mz = curr.z + dz * 0.5;
        const px = -dz / len, pz =  dx / len;

        // Road surface
        const road = new THREE.Mesh(new THREE.PlaneGeometry(TW, len + 0.5), roadMat);
        road.rotation.x = -Math.PI / 2; road.rotation.z = angle;
        road.position.set(mx, 0.01, mz); road.receiveShadow = true;
        state.scene.add(road); state.roadMeshes.push(road);

        // Centre dash
        if (i % 3 === 0) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 2.2), lineMat);
            dash.rotation.x = -Math.PI / 2; dash.rotation.z = angle;
            dash.position.set(mx, 0.02, mz);
            state.scene.add(dash);
        }

        // Lane divider dashes at -5, 0, +5 (separating the 4 lanes)
        [-5, 0, 5].forEach(lx => {
            if (i % 4 === 0) {
                const ld = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1.8), lineMat);
                ld.rotation.x = -Math.PI / 2; ld.rotation.z = angle;
                ld.position.set(mx + px*lx, 0.018, mz + pz*lx);
                state.scene.add(ld);
            }
        });

        // Edge white lines
        [-1, 1].forEach(s => {
            const sl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, len + 0.5), lineMat);
            sl.rotation.x = -Math.PI / 2; sl.rotation.z = angle;
            sl.position.set(mx + px*(TW/2 - 0.5)*s, 0.015, mz + pz*(TW/2 - 0.5)*s);
            state.scene.add(sl);
        });

        // Barriers at ±(TW/2 + 0.8) = ±10.8
        for (let s = -1; s <= 1; s += 2) {
            const bMat    = (i % 4 < 2) ? barrierMatR : barrierMatW;
            const barrier = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, len + 0.5), bMat);
            barrier.rotation.y = angle;
            barrier.position.set(mx + px*(TW/2 + 0.8)*s, 0.7, mz + pz*(TW/2 + 0.8)*s);
            barrier.castShadow = true;
            state.scene.add(barrier);
            state.barrierMeshes.push({ mesh: barrier, side: s, segIdx: i });
        }

        state.trackSegments.push({
            x: curr.x, z: curr.z, nx: next.x, nz: next.z,
            angle, len, perpX: px, perpZ: pz, progress: i / N
        });
    }

    for (let i = 0; i < N; i += 25) state.checkpoints.push(i);

    // Start/finish line
    const s0 = state.trackSegments[0];
    const sf = new THREE.Mesh(
        new THREE.PlaneGeometry(TW, 3),
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })
    );
    sf.rotation.x = -Math.PI / 2; sf.position.set(s0.x, 0.03, s0.z);
    state.scene.add(sf);

    const cbBlack = new THREE.MeshLambertMaterial({ color: 0x000000 });
    for (let ci = 0; ci < 8; ci++) for (let cj = 0; cj < 2; cj++) {
        if ((ci + cj) % 2 === 0) continue;
        const c = new THREE.Mesh(new THREE.PlaneGeometry(TW/8, 1.4), cbBlack);
        c.rotation.x = -Math.PI / 2; c.rotation.z = s0.angle;
        c.position.set(
            s0.x + s0.perpX*(ci - 3.5)*(TW/8) + s0.perpZ*(cj - 0.5),
            0.04,
            s0.z + s0.perpZ*(ci - 3.5)*(TW/8) - s0.perpX*(cj - 0.5)
        );
        state.scene.add(c);
    }
}

// ============================================
// ENVIRONMENT
// ============================================

function buildEnvironment() {
    const state = window.racingState;

    // Rich green ground
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(900, 900),
        new THREE.MeshLambertMaterial({ color: 0x3a8c3f })
    );
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05;
    ground.receiveShadow = true;
    state.scene.add(ground); state.ground = ground;

    // Distant mountains ring
    const mtColors = [0x7b6fa0, 0x9b7fb5, 0x6a5f8a, 0x8878aa];
    for (let m = 0; m < 16; m++) {
        const ang = (m / 16) * Math.PI * 2;
        const dist = 260 + Math.random() * 60;
        const h = 35 + Math.random() * 40;
        const r = 22 + Math.random() * 18;
        const mt = new THREE.Mesh(
            new THREE.ConeGeometry(r, h, 6),
            new THREE.MeshLambertMaterial({ color: mtColors[m % mtColors.length] })
        );
        mt.position.set(Math.cos(ang)*dist, h*0.4, Math.sin(ang)*dist);
        state.scene.add(mt);
    }

    // Trees — varied colors & sizes
    const treeColors = [0x2d5a27, 0x1e6b3c, 0x3d7a2f, 0x2a6040];
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x7a4520 });
    const N = state.totalSegments;

    for (let i = 0; i < N; i += 5) {
        const seg = state.trackSegments[i]; if (!seg) continue;
        for (let side = -1; side <= 1; side += 2) {
            const dist = state.trackWidth/2 + 8 + Math.random()*12;
            const tx = seg.x + seg.perpX*dist*side + (Math.random()-0.5)*4;
            const tz = seg.z + seg.perpZ*dist*side + (Math.random()-0.5)*4;
            const tH = 4 + Math.random()*5;
            const treeMat = new THREE.MeshLambertMaterial({ color: treeColors[Math.floor(Math.random()*treeColors.length)] });
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.13,0.2,tH*0.45,6), trunkMat);
            trunk.position.set(tx, tH*0.22, tz); trunk.castShadow = true; state.scene.add(trunk);
            const top = new THREE.Mesh(new THREE.ConeGeometry(1.2+Math.random()*0.7, tH*0.75, 7), treeMat);
            top.position.set(tx, tH*0.5+tH*0.38, tz); top.castShadow = true; state.scene.add(top);
            state.treeMeshes.push(trunk, top);
        }
    }

    // Grand stands at start/finish
    const seg0 = state.trackSegments[0];
    if (seg0) {
        [-1, 1].forEach(side => {
            const sx = seg0.x + seg0.perpX * (state.trackWidth + 14) * side;
            const sz = seg0.z;
            // Main stand body
            const stand = new THREE.Mesh(
                new THREE.BoxGeometry(20, 6, 8),
                new THREE.MeshLambertMaterial({ color: 0x5566aa })
            );
            stand.position.set(sx, 3, sz);
            stand.castShadow = true; state.scene.add(stand);
            // Roof
            const roof = new THREE.Mesh(
                new THREE.BoxGeometry(21, 0.4, 9),
                new THREE.MeshLambertMaterial({ color: side === -1 ? 0xff2244 : 0x2244ff })
            );
            roof.position.set(sx, 6.2, sz); state.scene.add(roof);
        });
    }

    // Flagpoles along track
    for (let i = 0; i < N; i += 40) {
        const seg = state.trackSegments[i]; if (!seg) continue;
        [-1, 1].forEach(side => {
            const fx = seg.x + seg.perpX*(state.trackWidth/2+2.5)*side;
            const fz = seg.z + seg.perpZ*(state.trackWidth/2+2.5)*side;
            const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.08,5,6),
                new THREE.MeshLambertMaterial({ color: 0xcccccc }));
            pole.position.set(fx, 2.5, fz); state.scene.add(pole);
            const flagColors = [0xff2244, 0xffcc00, 0x22aaff, 0x22cc44];
            const flag = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.05),
                new THREE.MeshLambertMaterial({ color: flagColors[Math.floor(Math.random()*flagColors.length)] }));
            flag.position.set(fx + side*0.65, 4.9, fz); state.scene.add(flag);
        });
    }
}

// ============================================
// CROWD — spectators watching the race
// ============================================

function makePerson(x, y, z, faceAngle) {
    const skinColors  = [0xFFDBAC, 0xC68642, 0xF1C27D, 0xE8B88A, 0x8D5524];
    const shirtColors = [0xFF2244, 0x2244FF, 0xFFCC00, 0x22CC44, 0xFF8800, 0xCC22FF, 0x00CCFF, 0xFF66AA, 0xFFFFFF];
    const shirt = shirtColors[Math.floor(Math.random() * shirtColors.length)];
    const skin  = skinColors [Math.floor(Math.random() * skinColors.length)];
    const g = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.55, 0.2),
        new THREE.MeshLambertMaterial({ color: shirt })
    );
    // body stays at local (0,0,0)
    g.add(body);

    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.17, 6, 5),
        new THREE.MeshLambertMaterial({ color: skin })
    );
    head.position.y = 0.42;
    g.add(head);

    if (Math.random() > 0.45) {
        [-0.22, 0.22].forEach(ax => {
            const arm = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 0.35, 0.1),
                new THREE.MeshLambertMaterial({ color: shirt })
            );
            arm.position.set(ax, 0.25, 0);
            arm.rotation.z = ax > 0 ? -0.9 : 0.9;
            g.add(arm);
        });
    }

    g.position.set(x, y, z);
    g.rotation.y = faceAngle;
    return g;
}

function buildCrowd() {
    const state = window.racingState;
    const seg0 = state.trackSegments[0];
    if (!seg0) return;

    // Dense crowd in the grand stands at start/finish
    [-1, 1].forEach(side => {
        const sx = seg0.x + seg0.perpX * (state.trackWidth + 14) * side;
        const sz = seg0.z;
        const faceAng = side === -1 ? Math.PI * 0.5 : -Math.PI * 0.5;
        for (let row = 0; row < 4; row++) {
            for (let col = 0; col < 9; col++) {
                const px = sx + (col - 4) * 2.2 + (Math.random() - 0.5) * 0.3;
                const py = 0.5 + row * 1.2;
                const pz = sz + side * (row * 0.8 - 1.0) + (Math.random() - 0.5) * 0.3;
                state.scene.add(makePerson(px, py, pz, faceAng));
            }
        }
    });

    // Sparse crowd along trackside
    const N = state.totalSegments;
    for (let i = 15; i < N; i += 12) {
        const seg = state.trackSegments[i]; if (!seg) continue;
        [-1, 1].forEach(side => {
            const count = 2 + Math.floor(Math.random() * 3);
            for (let p = 0; p < count; p++) {
                const dist = state.trackWidth / 2 + 4 + Math.random() * 4;
                const px = seg.x + seg.perpX * dist * side + (Math.random() - 0.5) * 2;
                const pz = seg.z + seg.perpZ * dist * side + (Math.random() - 0.5) * 2;
                const faceAng = Math.atan2(-seg.perpX * side, -seg.perpZ * side);
                state.scene.add(makePerson(px, 0.32, pz, faceAng));
            }
        });
    }
}

// ============================================
// BILLBOARDS
// ============================================

function buildBillboards() {
    const state = window.racingState;
    const N = state.totalSegments;
    const palette = [
        { top: 0xFF2244, bot: 0xFFFFFF },
        { top: 0x2244FF, bot: 0xFFDD00 },
        { top: 0xFF8800, bot: 0x111111 },
        { top: 0x22CC44, bot: 0xFFFFFF },
        { top: 0xCC22FF, bot: 0xFFFFFF },
    ];

    for (let i = 8; i < N; i += 25) {
        const seg = state.trackSegments[i]; if (!seg) continue;
        const side = (i % 50 < 25) ? 1 : -1;
        const dist = state.trackWidth / 2 + 10 + Math.random() * 5;
        const bx   = seg.x + seg.perpX * dist * side;
        const bz   = seg.z + seg.perpZ * dist * side;
        const m    = palette[Math.floor(Math.random() * palette.length)];
        const yAng = Math.atan2(seg.perpX * side, seg.perpZ * side);

        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.14, 0.18, 6, 6),
            new THREE.MeshLambertMaterial({ color: 0x999999 })
        );
        pole.position.set(bx, 3, bz);
        state.scene.add(pole);

        const board = new THREE.Mesh(
            new THREE.BoxGeometry(5, 2.4, 0.2),
            new THREE.MeshLambertMaterial({ color: m.top })
        );
        board.position.set(bx, 7, bz);
        board.rotation.y = yAng;
        state.scene.add(board);

        const stripe = new THREE.Mesh(
            new THREE.BoxGeometry(5, 0.7, 0.22),
            new THREE.MeshLambertMaterial({ color: m.bot })
        );
        stripe.position.set(bx, 5.85, bz);
        stripe.rotation.y = yAng;
        state.scene.add(stripe);
    }
}

// ============================================
// CARS — 4 separated lanes, 2×2 grid
// ============================================
// FRONT ROW:  Player @ RACING_LANES[0]=-7.5   |  Blue  @ RACING_LANES[3]=+7.5
// BACK  ROW:  Green  @ RACING_LANES[1]=-2.5   |  Yellow@ RACING_LANES[2]=+2.5
// Row separation = 12 m
// Minimum centre-to-centre gap:
//   Player ↔ Blue   = 15 m lateral (same row)
//   Player ↔ Green  = 12 m forward + 5 m lateral
//   Blue   ↔ Yellow = 10 m lateral + 12 m forward
//   Green  ↔ Yellow = 5 m lateral (same row)   ← tightest, still > car width (1.8)
// ============================================

function buildAllCars() {
    const state = window.racingState;
    const seg0  = state.trackSegments[0];
    const perpX = seg0.perpX;
    const perpZ = seg0.perpZ;
    const fwdX  = Math.sin(seg0.angle);
    const fwdZ  = Math.cos(seg0.angle);
    const ROW   = 12;

    function gridPos(lane, rowBack) {
        return {
            x: seg0.x + perpX*lane - fwdX*rowBack,
            z: seg0.z + perpZ*lane - fwdZ*rowBack,
        };
    }

    // Player — front-left
    const p = gridPos(RACING_LANES[0], 0);
    const pc = state.playerColor || 0xFF2222;
    const dc = Math.floor(pc * 0.75);
    state.playerCar = createCarMesh(pc, dc);
    state.playerCar.position.set(p.x, 0.35, p.z);
    state.playerCar.rotation.y = seg0.angle;
    state.playerAngle = seg0.angle;
    state.playerPos   = { x: p.x, z: p.z };
    state.scene.add(state.playerCar);

    const diff = DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.medium;
    const aiMult = diff.aiMult;
    const aiDefs = [
        { color: [0x2255FF, 0x0033CC], laneIdx: 3, row: 0,   speed: 0.255 * aiMult }, // Blue  — fastest, pole
        { color: [0x22CC44, 0x009922], laneIdx: 1, row: ROW, speed: 0.238 * aiMult }, // Green — mid
        { color: [0xFFAA00, 0xFF7700], laneIdx: 2, row: ROW, speed: 0.245 * aiMult }, // Yellow— aggressive
    ];

    aiDefs.forEach(def => {
        const laneOff = RACING_LANES[def.laneIdx];
        const pos     = gridPos(laneOff, def.row);
        const car     = createCarMesh(def.color[0], def.color[1]);
        car.position.set(pos.x, 0.35, pos.z);
        car.rotation.y = seg0.angle;
        state.scene.add(car);
        state.aiCars.push({
            mesh:          car,
            segIdx:        0,
            segProgress:   0,
            speed:         def.speed + (Math.random()-0.5)*0.01,
            homeLane:      laneOff,
            currentLane:   laneOff,
            targetLane:    laneOff,
            lap:           1,
            totalProgress: 0,
        });
    });
}

function createCarMesh(bodyColor, detailColor) {
    const g = new THREE.Group();

    const bMat  = new THREE.MeshPhongMaterial({ color: bodyColor,   shininess: 90 });
    const dMat  = new THREE.MeshPhongMaterial({ color: detailColor, shininess: 60 });
    const glMat = new THREE.MeshPhongMaterial({ color: 0x99DDFF, transparent: true, opacity: 0.50, shininess: 140 });
    const blkMat= new THREE.MeshPhongMaterial({ color: 0x111111, shininess: 30 });
    const tirMat= new THREE.MeshPhongMaterial({ color: 0x1a1a1a, shininess: 15 });
    const rimMat= new THREE.MeshPhongMaterial({ color: 0xdddddd, shininess: 130 });
    const hlMat = new THREE.MeshPhongMaterial({ color: 0xffffcc, emissive: 0xffff44, emissiveIntensity: 0.4 });
    const tlMat = new THREE.MeshPhongMaterial({ color: 0xff2200, emissive: 0xff0000, emissiveIntensity: 0.3 });

    function add(mesh, x, y, z, rx, ry, rz) {
        if (x !== undefined) mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.set(rx, ry || 0, rz || 0);
        mesh.castShadow = true;
        g.add(mesh);
        return mesh;
    }
    function box(mat, w, h, d) { return new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); }
    function cyl(mat, rt, rb, h, seg) { return new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg||12), mat); }

    // ── LOWER BODY (wide, flat pan)
    add(box(bMat, 2.05, 0.28, 4.3),  0, 0.16, 0);

    // ── SIDE PONTOONS (flared arches)
    [-1.0, 1.0].forEach(sx => {
        add(box(bMat, 0.22, 0.44, 3.4), sx, 0.3, -0.1);
    });

    // ── HOOD (slopes up toward windshield)
    add(box(bMat, 1.75, 0.1, 1.4),   0, 0.42, 1.1,  -0.07);

    // ── NOSE CONE (wedge front)
    add(box(bMat, 1.82, 0.2, 0.85),  0, 0.2,  2.1,   0.24);

    // ── FRONT SPLITTER
    add(box(blkMat, 2.1, 0.05, 0.38), 0, 0.04, 2.28);

    // ── CABIN UPPER
    add(box(dMat, 1.55, 0.28, 1.55), 0, 0.62, -0.05);

    // ── ROOF
    add(box(dMat, 1.45, 0.07, 1.30), 0, 0.77, -0.08);

    // ── WINDSHIELD (front)
    add(box(glMat, 1.42, 0.42, 0.07), 0, 0.60, 0.72, -0.52);

    // ── REAR WINDOW
    add(box(glMat, 1.38, 0.36, 0.07), 0, 0.60, -0.86, 0.50);

    // ── SIDE WINDOWS
    [-0.9, 0.9].forEach(sx => {
        add(box(glMat, 0.06, 0.25, 0.85), sx, 0.63, -0.08);
    });

    // ── SIDE SKIRTS
    [-1.04, 1.04].forEach(sx => {
        add(box(blkMat, 0.08, 0.14, 3.8), sx, 0.09, -0.05);
    });

    // ── REAR DIFFUSER
    add(box(blkMat, 1.9, 0.1, 0.42),  0, 0.06, -2.18, -0.3);

    // ── REAR WING (main plate + end plates + struts)
    add(box(dMat, 1.85, 0.07, 0.52),  0, 1.01, -1.88);          // main wing
    [-0.72, 0.72].forEach(sx => {
        add(box(dMat, 0.07, 0.30, 0.52), sx, 0.88, -1.88);      // end plates
        add(box(dMat, 0.07, 0.30, 0.09), sx, 0.74, -1.76);      // struts
    });

    // ── HEADLIGHTS
    [-0.62, 0.62].forEach(lx => {
        add(box(hlMat, 0.45, 0.15, 0.07), lx,  0.28,  2.14);
        add(box(hlMat, 0.20, 0.06, 0.07), lx,  0.36,  2.14);
    });

    // ── TAIL LIGHTS (wide strips)
    add(box(tlMat, 1.80, 0.10, 0.07), 0, 0.28, -2.14);
    add(box(blkMat,1.60, 0.06, 0.08), 0, 0.21, -2.14);

    // ── SIDE MIRRORS
    [-0.96, 0.96].forEach(sx => {
        add(box(bMat, 0.22, 0.09, 0.16), sx, 0.60, 0.52);
    });

    // ── EXHAUST PIPES
    [-0.3, 0.3].forEach(ex => {
        const pipe = cyl(blkMat, 0.055, 0.07, 0.28, 8);
        pipe.rotation.x = Math.PI / 2;
        add(pipe, ex, 0.10, -2.22);
    });

    // ── WHEELS (wheel group with spinning sub-group)
    [[-1.1, 1.28], [1.1, 1.28], [-1.1, -1.28], [1.1, -1.28]].forEach(([wx, wz]) => {
        const wg = new THREE.Group();  // wheel group (spins)

        // Tire
        const tire = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.30, 14), tirMat);
        tire.rotation.z = Math.PI / 2;
        tire.castShadow = true;
        wg.add(tire);

        // Rim base
        const rimBase = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.31, 12), rimMat);
        rimBase.rotation.z = Math.PI / 2;
        wg.add(rimBase);

        // 5 spokes
        for (let s = 0; s < 5; s++) {
            const ang = (s / 5) * Math.PI * 2;
            const spoke = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.44), rimMat);
            spoke.position.set(0, Math.sin(ang) * 0.13, Math.cos(ang) * 0.13);
            spoke.rotation.x = ang;
            wg.add(spoke);
        }

        // Center cap
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.33, 8), blkMat);
        cap.rotation.z = Math.PI / 2;
        wg.add(cap);

        wg.position.set(wx, 0.36, wz);
        wg.userData.isWheel = true;
        g.add(wg);
    });

    return g;
}

// ============================================
// LIGHTS
// ============================================

function buildLights() {
    const state = window.racingState;
    state.ambientLight = new THREE.AmbientLight(0xffe8cc, 0.7);
    state.scene.add(state.ambientLight);
    state.dirLight = new THREE.DirectionalLight(0xfff4e0, 1.1);
    state.dirLight.position.set(80, 140, 60);
    state.dirLight.castShadow = true;
    state.dirLight.shadow.mapSize.width  = 2048;
    state.dirLight.shadow.mapSize.height = 2048;
    state.dirLight.shadow.camera.near   = 1;
    state.dirLight.shadow.camera.far    = 500;
    state.dirLight.shadow.camera.left   = -220;
    state.dirLight.shadow.camera.right  = 220;
    state.dirLight.shadow.camera.top    = 220;
    state.dirLight.shadow.camera.bottom = -220;
    state.scene.add(state.dirLight);
    // Warm hemisphere — sky blue top, warm green bounce
    state.scene.add(new THREE.HemisphereLight(0x7dd8ff, 0x5aaa4a, 0.5));
    // Subtle fill from opposite side
    const fill = new THREE.DirectionalLight(0xaaddff, 0.3);
    fill.position.set(-60, 40, -60);
    state.scene.add(fill);
}

// ============================================
// CONTROLS
// ============================================

function setupRacingControls() {
    const state = window.racingState;
    if (state._keyDown) document.removeEventListener('keydown', state._keyDown);
    if (state._keyUp)   document.removeEventListener('keyup',   state._keyUp);
    state._keyDown = (e) => {
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyS','KeyA','KeyD','ShiftLeft','ShiftRight'].includes(e.code)) e.preventDefault();
        state.keys[e.code] = true;
        if (e.code === 'KeyC' || e.code === 'KeyV') {
            state.cameraMode = ((state.cameraMode || 0) + 1) % 3;
        }
    };
    state._keyUp = (e) => { state.keys[e.code] = false; };
    document.addEventListener('keydown', state._keyDown);
    document.addEventListener('keyup',   state._keyUp);
}

// ============================================
// START RACE
// ============================================

// ============================================
// AUDIO — Web Audio API (no external files)
// ============================================

let _racingAudioCtx = null;
let _engineOsc = null, _engineGain = null, _engineFilter = null;

function getRacingAudioCtx() {
    if (!_racingAudioCtx) {
        try { _racingAudioCtx = new (window.AudioContext || window['webkitAudioContext'])(); } catch(e) {}
    }
    if (_racingAudioCtx && _racingAudioCtx.state === 'suspended') {
        _racingAudioCtx.resume();
    }
    return _racingAudioCtx;
}

function startEngineSound() {
    stopEngineSound();
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    _engineOsc    = ctx.createOscillator();
    _engineFilter = ctx.createBiquadFilter();
    _engineGain   = ctx.createGain();
    _engineOsc.type = 'sawtooth';
    _engineOsc.frequency.value = 80;
    _engineFilter.type = 'lowpass';
    _engineFilter.frequency.value = 400;
    _engineFilter.Q.value = 1.5;
    _engineGain.gain.value = 0.0;
    _engineOsc.connect(_engineFilter);
    _engineFilter.connect(_engineGain);
    _engineGain.connect(ctx.destination);
    _engineOsc.start();
    _engineGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.3);
}

function updateEngineSound(speed, maxSpeed) {
    if (!_engineOsc || !_engineGain || !_engineFilter) return;
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    const ratio = Math.max(0, Math.abs(speed) / maxSpeed);
    const freq = 80 + ratio * 220;     // 80 Hz idle → 300 Hz full speed
    const filterFreq = 300 + ratio * 1800;
    const gain = 0.03 + ratio * 0.07;
    const t = ctx.currentTime;
    _engineOsc.frequency.linearRampToValueAtTime(freq, t + 0.05);
    _engineFilter.frequency.linearRampToValueAtTime(filterFreq, t + 0.05);
    _engineGain.gain.linearRampToValueAtTime(gain, t + 0.05);
}

function stopEngineSound() {
    try {
        if (_engineGain && _racingAudioCtx) {
            _engineGain.gain.linearRampToValueAtTime(0, _racingAudioCtx.currentTime + 0.3);
        }
        if (_engineOsc) { setTimeout(() => { try { _engineOsc.stop(); } catch(e){} _engineOsc = null; }, 350); }
    } catch(e) {}
    _engineFilter = null; _engineGain = null;
}

function playCollisionSound() {
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.18);
}

function playCountdownBeep(isGo) {
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    const freqs = isGo ? [523, 659, 784] : [220];
    freqs.forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.25);
    });
}

function playLapSound() {
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    [523, 659, 784, 1047].forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.11;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.28);
    });
}

function playNitroSound() {
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.35);
    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.35);
}

function playFinishSound() {
    const ctx = getRacingAudioCtx(); if (!ctx) return;
    const melody = [523, 659, 784, 1047, 1319];
    melody.forEach((f, i) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === melody.length - 1 ? 'sine' : 'triangle';
        const t = ctx.currentTime + i * 0.14;
        osc.frequency.setValueAtTime(f, t);
        gain.gain.setValueAtTime(0.13, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i === melody.length - 1 ? 0.7 : 0.3));
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(t); osc.stop(t + 0.8);
    });
}

// ============================================
// RACE START
// ============================================

function startCarRacing() {
    const state = window.racingState;
    if (!state.initialized) { initCarRacing(); return; }
    if (state.isRunning)    return;
    const startOv = document.getElementById('car-start-overlay');
    if (startOv) startOv.remove();

    // Rebuild cars with current difficulty + color
    if (state.playerCar) {
        state.scene.remove(state.playerCar); state.playerCar = null;
        state.aiCars.forEach(ai => state.scene.remove(ai.mesh)); state.aiCars = [];
    }
    buildAllCars();
    state.isRunning   = true;
    state.raceStarted = false;
    state.countdown   = 3;
    updateRacingUI();
    showRacingCountdown(3);
    playCountdownBeep(false);
    if (state.countdownTimer) clearInterval(state.countdownTimer);
    state.countdownTimer = setInterval(() => {
        state.countdown--;
        if (state.countdown <= 0) {
            clearInterval(state.countdownTimer); state.countdownTimer = null;
            state.raceStarted = true;
            state.startTime = state.lapStartTime = Date.now();
            hideRacingCountdown();
            playCountdownBeep(true);
            startEngineSound();
        } else {
            showRacingCountdown(state.countdown);
            playCountdownBeep(false);
        }
    }, 1000);
    if (state.gameLoop) cancelAnimationFrame(state.gameLoop);
    racingGameLoop();
}

// ============================================
// GAME LOOP
// ============================================

function racingGameLoop() {
    const state = window.racingState;
    if (!state.isRunning || !state.renderer) return;
    state.gameLoop = requestAnimationFrame(racingGameLoop);
    if (!state.isPaused && state.raceStarted && !state.raceFinished) {
        updatePlayerCar();
        updateAICars();
        resolveCarCollisions();
        updateRaceProgress();
        updateRacingHUD();
        updateExhaust();
        updateMinimap();
        updateEngineSound(state.playerSpeed, state.playerMaxSpeed);
    }
    updateCamera();
    state.renderer.render(state.scene, state.camera);
}

// ============================================
// PLAYER — hard barrier collision
// ============================================

function updatePlayerCar() {
    const state = window.racingState;
    const k = state.keys, tc = state.touchControls;
    const accel = k['ArrowUp']    || k['KeyW'] || tc.accel;
    const brake = k['ArrowDown']  || k['KeyS'] || tc.brake;
    const left  = k['ArrowLeft']  || k['KeyA'] || tc.left;
    const right = k['ArrowRight'] || k['KeyD'] || tc.right;

    // ── Nitro system ──
    if (!state.nitroActive) state.nitro = Math.min(1, state.nitro + 16 / state.NITRO_MAX);
    if ((k['ShiftLeft'] || k['ShiftRight'] || tc.nitro) && state.nitro >= 0.15 && !state.nitroActive) {
        state.nitroActive = true; state.nitroTimer = state.NITRO_DURATION; playNitroSound();
    }
    if (state.nitroActive) {
        state.nitroTimer -= 16;
        state.nitro = Math.max(0, state.nitro - 16 / state.NITRO_DURATION);
        if (state.nitroTimer <= 0 || state.nitro <= 0) state.nitroActive = false;
    }
    const effectiveMaxSpeed = state.nitroActive ? state.playerMaxSpeed * state.NITRO_BOOST : state.playerMaxSpeed;

    if (accel)      state.playerSpeed = Math.min(state.playerSpeed + state.playerAccel, effectiveMaxSpeed);
    else if (brake) state.playerSpeed = Math.max(state.playerSpeed - state.playerBrake, -state.playerMaxSpeed*0.4);
    else {
        if      (state.playerSpeed > 0) state.playerSpeed = Math.max(0, state.playerSpeed - state.playerFriction);
        else if (state.playerSpeed < 0) state.playerSpeed = Math.min(0, state.playerSpeed + state.playerFriction);
    }

    if (Math.abs(state.playerSpeed) > 0.005) {
        const tm = state.playerSpeed / state.playerMaxSpeed;
        if (left)  state.playerAngle += state.playerTurnSpeed * tm;
        if (right) state.playerAngle -= state.playerTurnSpeed * tm;
    }

    let nx = state.playerPos.x + Math.sin(state.playerAngle) * state.playerSpeed;
    let nz = state.playerPos.z + Math.cos(state.playerAngle) * state.playerSpeed;

    // ── Block player from entering any AI car's space ──
    for (const ai of state.aiCars) {
        const ddx = ai.mesh.position.x - nx;
        const ddz = ai.mesh.position.z - nz;
        const dd  = Math.sqrt(ddx*ddx + ddz*ddz);
        if (dd < 3.8) {
            // Can't move there — bounce back
            nx = state.playerPos.x - Math.sin(state.playerAngle) * Math.abs(state.playerSpeed) * 0.4;
            nz = state.playerPos.z - Math.cos(state.playerAngle) * Math.abs(state.playerSpeed) * 0.4;
            state.playerSpeed *= 0.25;
            playCollisionSound();
            break;
        }
    }

    const info = getTrackInfo(nx, nz);
    if (info.onTrack) {
        // Hard barrier clamp — wider car model needs more margin
        const maxPerp = state.trackWidth / 2 - 2.2; // 7.8
        if (Math.abs(info.perpDist) > maxPerp) {
            const sign = info.perpDist > 0 ? 1 : -1;
            nx = info.segX + info.perpX * maxPerp * sign;
            nz = info.segZ + info.perpZ * maxPerp * sign;
            state.playerSpeed *= 0.3;
        }
        state.playerPos.x = nx;
        state.playerPos.z = nz;
    } else {
        state.playerSpeed *= 0.4;
        const sx = state.playerPos.x + Math.sin(state.playerAngle)*state.playerSpeed;
        const sz = state.playerPos.z + Math.cos(state.playerAngle)*state.playerSpeed;
        if (getTrackInfo(sx, sz).onTrack) {
            state.playerPos.x = sx; state.playerPos.z = sz;
        }
    }

    state.playerCar.position.x = state.playerPos.x;
    state.playerCar.position.z = state.playerPos.z;
    state.playerCar.rotation.y = state.playerAngle;

    state.playerCar.children.forEach(c => { if (c.userData.isWheel) c.rotation.x += state.playerSpeed * 9; });
    if (left  && state.playerSpeed > 0.05) state.playerCar.rotation.z = Math.min(state.playerCar.rotation.z + 0.025,  0.14);
    else if (right && state.playerSpeed > 0.05) state.playerCar.rotation.z = Math.max(state.playerCar.rotation.z - 0.025, -0.14);
    else state.playerCar.rotation.z *= 0.82;
}

// ============================================
// TRACK QUERY
// ============================================

function getTrackInfo(x, z) {
    const state  = window.racingState;
    const halfW  = state.trackWidth * 0.5;
    let bestD2   = Infinity, best = null;

    for (const seg of state.trackSegments) {
        const dx    = x - seg.x, dz = z - seg.z;
        const fwdX  = Math.sin(seg.angle), fwdZ = Math.cos(seg.angle);
        const along = dx*fwdX + dz*fwdZ;
        if (along < -1 || along > seg.len + 1) continue;
        const perp = dx*seg.perpX + dz*seg.perpZ;
        const d2   = dx*dx + dz*dz;
        if (d2 < bestD2) {
            bestD2 = d2;
            best = {
                onTrack: Math.abs(perp) <= halfW,
                perpDist: perp,
                perpX: seg.perpX, perpZ: seg.perpZ,
                segX: seg.x + fwdX*along, segZ: seg.z + fwdZ*along
            };
        }
    }
    return best || { onTrack: false, perpDist: 0, perpX: 0, perpZ: 0, segX: x, segZ: z };
}

function isOnTrack(x, z) { return getTrackInfo(x, z).onTrack; }

// ============================================
// AI UPDATE — pro racing behavior
// ============================================

function updateAICars() {
    const state    = window.racingState;
    const N        = state.totalSegments;
    const HALF_TW  = state.trackWidth / 2 - 2.6;
    const FOLLOW_D = 6.5;   // following distance trigger
    const LAT_D    = 3.0;   // lateral avoidance trigger

    state.aiCars.forEach((ai, idx) => {
        const seg  = state.trackSegments[ai.segIdx];
        const next = state.trackSegments[(ai.segIdx + 1) % N];
        if (!seg) return;
        const fwdX = Math.sin(seg.angle), fwdZ = Math.cos(seg.angle);

        // ── Corner sensing: look 8 segments ahead for curvature
        let maxCurv = 0;
        for (let k = 1; k <= 8; k++) {
            const sa = state.trackSegments[(ai.segIdx + k - 1) % N];
            const sb = state.trackSegments[(ai.segIdx + k) % N];
            let diff = Math.abs(sb.angle - sa.angle);
            if (diff > Math.PI) diff = Math.PI * 2 - diff;
            if (diff > maxCurv) maxCurv = diff;
        }
        const brakeAdjust = (DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.medium).brakeEarly ? 1.5 : 1.0;
        const cornerMult = Math.max(0.80, 1 - maxCurv * 2.5 * brakeAdjust);

        // ── Following distance — slow down, never stop
        const aiX = seg.x + (next.x - seg.x) * ai.segProgress + seg.perpX * ai.currentLane;
        const aiZ = seg.z + (next.z - seg.z) * ai.segProgress + seg.perpZ * ai.currentLane;

        let followMult = 1.0;
        let pushDir    = 0;
        let blocked    = false;

        // Check vs player
        const pdx = state.playerPos.x - aiX, pdz = state.playerPos.z - aiZ;
        const pAlong   =  pdx * fwdX + pdz * fwdZ;
        const pLateral =  pdx * seg.perpX + pdz * seg.perpZ;
        if (pAlong > 0 && pAlong < FOLLOW_D) {
            if (Math.abs(pLateral) < LAT_D) {
                // Directly behind player — slow to match, try to overtake
                followMult = Math.max(0.78, (pAlong - 2.0) / (FOLLOW_D - 2.0));
                blocked = true;
                // Overtake: shift to clearer lane
                pushDir += pLateral > 0 ? -1 : 1;
            }
        }

        // Check vs other AIs
        state.aiCars.forEach((other, j) => {
            if (j === idx) return;
            const os = state.trackSegments[other.segIdx];
            const on = state.trackSegments[(other.segIdx + 1) % N];
            const ox = os.x + (on.x - os.x) * other.segProgress + os.perpX * other.currentLane;
            const oz = os.z + (on.z - os.z) * other.segProgress + os.perpZ * other.currentLane;
            const dx = ox - aiX, dz = oz - aiZ;
            const along   = dx * fwdX + dz * fwdZ;
            const lateral = dx * seg.perpX + dz * seg.perpZ;
            if (along > 0 && along < FOLLOW_D && Math.abs(lateral) < LAT_D) {
                followMult = Math.min(followMult, Math.max(0.82, (along - 2.0) / (FOLLOW_D - 2.0)));
                pushDir += lateral > 0 ? -1 : 1;
                blocked = true;
            }
        });

        // ── Advance along track
        let rbMult = 1.0;
        if ((DIFFICULTY_CONFIG[state.difficulty] || DIFFICULTY_CONFIG.medium).rubberband) {
            const playerTotal = (state.lap - 1) + state.lastProgress;
            if (playerTotal - ai.totalProgress > 0.5) rbMult = 1.15;
        }
        const effectiveSpeed = ai.speed * cornerMult * followMult * rbMult;
        ai.segProgress += effectiveSpeed / seg.len;
        if (ai.segProgress >= 1) {
            ai.segProgress = 0;
            ai.segIdx = (ai.segIdx + 1) % N;
            if (ai.segIdx === 0) ai.lap++;
        }
        ai.totalProgress = ai.lap - 1 + ai.segIdx / N + ai.segProgress / N;

        // ── Lane targeting
        if (pushDir !== 0) {
            ai.targetLane += pushDir * 0.18;
        } else if (!blocked) {
            // Drift back to racing line (home lane)
            ai.targetLane += (ai.homeLane - ai.targetLane) * 0.04;
        }
        ai.targetLane  = Math.max(-HALF_TW, Math.min(HALF_TW, ai.targetLane));

        // Smooth lane follow
        ai.currentLane += (ai.targetLane - ai.currentLane) * 0.08;
        ai.currentLane  = Math.max(-HALF_TW, Math.min(HALF_TW, ai.currentLane));

        // ── Place mesh
        const curSeg = state.trackSegments[ai.segIdx];
        const nxtSeg = state.trackSegments[(ai.segIdx + 1) % N];
        const t      = ai.segProgress;
        ai.mesh.position.set(
            curSeg.x + (nxtSeg.x - curSeg.x) * t + curSeg.perpX * ai.currentLane,
            0.35,
            curSeg.z + (nxtSeg.z - curSeg.z) * t + curSeg.perpZ * ai.currentLane
        );
        ai.mesh.rotation.y = curSeg.angle;
        ai.mesh.children.forEach(c => { if (c.userData.isWheel) c.rotation.x += effectiveSpeed * 9; });
    });
}

// ============================================
// RACE PROGRESS
// ============================================

function updateRaceProgress() {
    const state = window.racingState;
    if (state.raceFinished) return;
    const N = state.totalSegments;
    let closestIdx = 0, closestDist = Infinity;
    for (let i = 0; i < N; i++) {
        const seg = state.trackSegments[i];
        const dx = state.playerPos.x - seg.x, dz = state.playerPos.z - seg.z;
        const d = dx*dx + dz*dz;
        if (d < closestDist) { closestDist = d; closestIdx = i; }
    }
    const newProgress = closestIdx / N;

    if (state.lastProgress > 0.85 && newProgress < 0.15) {
        if (state.passedCheckpoints.size >= Math.floor(state.checkpoints.length * 0.5)) {
            const lapTime = (Date.now() - state.lapStartTime) / 1000;
            if (state.bestLap === null || lapTime < state.bestLap) {
                state.bestLap = lapTime;
                const el = document.getElementById('car-best-lap');
                if (el) el.textContent = lapTime.toFixed(1);
            }
            state.lap++;
            state.lapStartTime = Date.now();
            state.passedCheckpoints.clear();
            if (state.lap > state.totalLaps) { state.raceFinished = true; finishRace(); return; }
            playLapSound();
            const lapEl = document.getElementById('car-lap');
            if (lapEl) lapEl.textContent = Math.min(state.lap, state.totalLaps);
            if (typeof showToast === 'function') showToast(`🏁 Lap ${state.lap-1} complete!`, 'success');
        }
    }
    state.checkpoints.forEach(cp => { if (closestIdx === cp) state.passedCheckpoints.add(cp); });
    state.lastProgress = newProgress;
    state.lapTime = (Date.now() - state.lapStartTime) / 1000;

    const playerTotal = (state.lap - 1) + newProgress;
    let pos = 1;
    state.aiCars.forEach(ai => { if (ai.totalProgress > playerTotal) pos++; });
    state.position = pos;
    const posEl = document.getElementById('car-position');
    if (posEl) posEl.textContent = pos + getOrdinal(pos);
}

function getOrdinal(n) {
    if (n === 1) return 'st'; if (n === 2) return 'nd'; if (n === 3) return 'rd'; return 'th';
}

// ============================================
// CAMERA
// ============================================

// ============================================
// HARD CAR SEPARATION — prevents visual overlap
// ============================================

function resolveCarCollisions() {
    const state    = window.racingState;
    const MIN_D    = 4.0;
    const LANE_LIM = 6.5;

    // Only lateral separation — never stop or reverse AI cars
    for (let i = 0; i < state.aiCars.length; i++) {
        for (let j = i + 1; j < state.aiCars.length; j++) {
            const a = state.aiCars[i], b = state.aiCars[j];
            const dx = b.mesh.position.x - a.mesh.position.x;
            const dz = b.mesh.position.z - a.mesh.position.z;
            const d  = Math.sqrt(dx*dx + dz*dz);
            if (d >= MIN_D || d < 0.001) continue;
            const push = (MIN_D - d) * 0.7;
            const segA = state.trackSegments[a.segIdx];
            const segB = state.trackSegments[b.segIdx];
            if (segA) {
                const lat = dx * segA.perpX + dz * segA.perpZ;
                a.currentLane -= (lat >= 0 ? 1 : -1) * push;
                a.currentLane  = Math.max(-LANE_LIM, Math.min(LANE_LIM, a.currentLane));
                a.targetLane   = a.currentLane;
            }
            if (segB) {
                const lat = dx * segB.perpX + dz * segB.perpZ;
                b.currentLane += (lat >= 0 ? 1 : -1) * push;
                b.currentLane  = Math.max(-LANE_LIM, Math.min(LANE_LIM, b.currentLane));
                b.targetLane   = b.currentLane;
            }
        }
    }
}

function updateCamera() {
    const state = window.racingState;
    if (!state.playerCar || !state.camera) return;
    const mode = state.cameraMode || 0;

    if (mode === 0) {
        // Follow cam
        const speedBias = state.playerSpeed / state.playerMaxSpeed;
        const camDist = 8.5 + speedBias * 1.5;
        const camH    = 3.2 + speedBias * 0.8;
        const tx = state.playerCar.position.x - Math.sin(state.playerAngle) * camDist;
        const ty = state.playerCar.position.y + camH;
        const tz = state.playerCar.position.z - Math.cos(state.playerAngle) * camDist;
        state.camera.position.x += (tx - state.camera.position.x) * 0.12;
        state.camera.position.y += (ty - state.camera.position.y) * 0.12;
        state.camera.position.z += (tz - state.camera.position.z) * 0.12;
        const lookAheadX = state.playerCar.position.x + Math.sin(state.playerAngle) * 3;
        const lookAheadZ = state.playerCar.position.z + Math.cos(state.playerAngle) * 3;
        state.camera.lookAt(lookAheadX, state.playerCar.position.y + 0.6, lookAheadZ);
    } else if (mode === 1) {
        // Hood cam
        const hoodX = state.playerCar.position.x + Math.sin(state.playerAngle) * 1.0;
        const hoodZ = state.playerCar.position.z + Math.cos(state.playerAngle) * 1.0;
        state.camera.position.set(hoodX, state.playerCar.position.y + 1.0, hoodZ);
        const lookX = state.playerCar.position.x + Math.sin(state.playerAngle) * 20;
        const lookZ = state.playerCar.position.z + Math.cos(state.playerAngle) * 20;
        state.camera.lookAt(lookX, state.playerCar.position.y + 0.8, lookZ);
    } else {
        // TV cam — high fixed point above start, tracks player
        if (state.trackSegments.length) {
            const s0 = state.trackSegments[0];
            state.camera.position.x += (s0.x - state.camera.position.x) * 0.02;
            state.camera.position.y += (120 - state.camera.position.y) * 0.02;
            state.camera.position.z += (s0.z - state.camera.position.z) * 0.02;
        }
        state.camera.lookAt(state.playerCar.position.x, state.playerCar.position.y, state.playerCar.position.z);
    }

    const camNames = ['FOLLOW','HOOD','TV'];
    const cl = document.getElementById('cr-cam-label');
    if (cl) cl.textContent = camNames[mode] || 'FOLLOW';
}

// ============================================
// EXHAUST SMOKE
// ============================================

const _exhaustGeo = new THREE.SphereGeometry(0.18, 4, 4);
function updateExhaust() {
    const state = window.racingState;
    const now = Date.now();

    function spawnPuff(x, z, angle, speed, color) {
        if (speed < 0.04) return;
        const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55 });
        const puff = new THREE.Mesh(_exhaustGeo, mat);
        puff.position.set(
            x - Math.sin(angle) * 2.2 + (Math.random()-0.5)*0.4,
            0.28 + Math.random()*0.15,
            z - Math.cos(angle) * 2.2 + (Math.random()-0.5)*0.4
        );
        puff._born = now;
        puff._life = 420 + Math.random()*280;
        puff._vx = (Math.random()-0.5)*0.012;
        puff._vz = (Math.random()-0.5)*0.012;
        state.scene.add(puff);
        state.exhaustParticles.push(puff);
    }

    // Limit total particles
    if (state.exhaustParticles.length < 60) {
        const exhaustColor = state.nitroActive
            ? (Math.random() > 0.5 ? 0x4488FF : 0xFF6600) : 0x999999;
        spawnPuff(state.playerPos.x, state.playerPos.z, state.playerAngle, state.playerSpeed, exhaustColor);
        state.aiCars.forEach(ai => {
            const seg = state.trackSegments[ai.segIdx]; if (!seg) return;
            spawnPuff(ai.mesh.position.x, ai.mesh.position.z, seg.angle, ai.speed, 0xaaaaaa);
        });
    }

    const dead = [];
    state.exhaustParticles.forEach(p => {
        const frac = (now - p._born) / p._life;
        if (frac >= 1) { dead.push(p); return; }
        p.material.opacity = 0.55 * (1 - frac);
        p.position.y += 0.018;
        p.position.x += p._vx;
        p.position.z += p._vz;
        const sc = 1 + frac * 2.5;
        p.scale.set(sc, sc, sc);
    });
    dead.forEach(p => { state.scene.remove(p); p.material.dispose(); });
    state.exhaustParticles = state.exhaustParticles.filter(p => !dead.includes(p));
}

// ============================================
// HUD / UI
// ============================================

function updateRacingHUD() {
    const state = window.racingState;
    const el = document.getElementById('car-lap-time');
    if (el) el.textContent = state.lapTime.toFixed(1);

    // Speedometer
    const spdVal = document.getElementById('cr-spd-val');
    if (spdVal) {
        const kmh = Math.round(Math.abs(state.playerSpeed) * 846);
        spdVal.textContent = kmh;
        spdVal.style.color = kmh > 160 ? '#ff4444' : kmh > 100 ? '#FFD700' : '#ffffff';
    }

    // Nitro bar
    const fill = document.getElementById('cr-nitro-fill');
    if (fill) {
        fill.style.width = (state.nitro * 100) + '%';
        fill.className = state.nitroActive ? 'active' : '';
    }
}

function updateRacingUI() {
    const state = window.racingState;
    const set = (id,v) => { const e = document.getElementById(id); if(e) e.textContent=v; };
    set('car-lap',      state.lap);
    set('car-position', state.position + getOrdinal(state.position));
    set('car-lap-time', '0.0');
    set('car-best-lap', '--');
}

// ============================================
// COUNTDOWN
// ============================================

function showRacingCountdown(num) {
    const wrapper = document.querySelector('.car-racing-canvas-wrapper');
    if (!wrapper) return;
    wrapper.style.position = 'relative';
    let el = document.getElementById('car-countdown');
    if (!el) {
        el = document.createElement('div'); el.id = 'car-countdown';
        el.style.cssText = `position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:5rem;font-weight:900;color:#FFD700;text-shadow:0 0 30px #FF8800,3px 3px 0 #000;z-index:100;pointer-events:none;`;
        wrapper.appendChild(el);
    }
    el.textContent = num;
    el.style.animation = 'none'; el.offsetHeight;
    el.style.animation = 'carCountPulse 0.9s ease-out forwards';
}

function hideRacingCountdown() {
    const el = document.getElementById('car-countdown');
    if (!el) return;
    el.textContent = 'GO! 🏁'; el.style.color = '#00FF88';
    el.style.textShadow = '0 0 30px #00FF88, 3px 3px 0 #000';
    setTimeout(() => { if (el && el.parentNode) el.remove(); }, 900);
}

// ============================================
// FINISH
// ============================================

function finishRace() {
    const state = window.racingState;
    state.isRunning = false;
    if (state.gameLoop) { cancelAnimationFrame(state.gameLoop); state.gameLoop = null; }
    stopEngineSound();
    playFinishSound();
    const totalTime = ((Date.now()-state.startTime)/1000).toFixed(1);
    const pos = state.position;
    const score = Math.max(100, Math.floor(8000/(parseFloat(totalTime)+1)*(4-pos+1)));
    if (typeof saveScore    === 'function') saveScore('carracing', score);
    if (typeof showConfetti === 'function' && pos === 1) showConfetti();
    const medals = ['🥇','🥈','🥉','4️⃣'];
    const wrapper = document.querySelector('.car-racing-canvas-wrapper');
    if (!wrapper) return;
    let ov = document.getElementById('car-finish-overlay');
    if (!ov) {
        ov = document.createElement('div'); ov.id = 'car-finish-overlay';
        ov.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.78);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:300;color:#fff;text-align:center;`;
        wrapper.appendChild(ov);
    }
    ov.innerHTML = `
        <div style="font-size:3.5rem;margin-bottom:4px;">${medals[Math.min(pos-1,3)]}</div>
        <h2 style="font-size:1.9rem;color:#FFD700;margin:6px 0;">Race Finished!</h2>
        <p>Position: <b>${pos}${getOrdinal(pos)}</b> of 4</p>
        <p>Total Time: <b>${totalTime}s</b></p>
        <p>Best Lap: <b>${state.bestLap ? state.bestLap.toFixed(1)+'s' : '--'}</b></p>
        <p style="font-size:1.25rem;color:#FFD700;margin-top:4px;">Score: <b>${score.toLocaleString()}</b></p>
        <div style="display:flex;gap:12px;margin-top:16px;flex-wrap:wrap;justify-content:center;">
            <button onclick="restartCarRacing()" style="padding:10px 28px;background:#667eea;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;font-weight:bold;">🔄 Retry</button>
            <button onclick="closeCarFinish()"   style="padding:10px 28px;background:#444;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:1rem;">✖ Close</button>
        </div>`;
}

function restartCarRacing() {
    const ov = document.getElementById('car-finish-overlay'); if (ov) ov.remove();
    initCarRacing();
    setTimeout(() => {
        const so = document.getElementById('car-start-overlay'); if (so) so.remove();
        startCarRacing();
    }, 400);
}

function closeCarFinish() {
    const ov = document.getElementById('car-finish-overlay'); if (ov) ov.remove();
    if (typeof closeGame === 'function') closeGame();
}

// ============================================
// MINI-MAP
// ============================================

function updateMinimap() {
    const state = window.racingState;
    const mm = document.getElementById('cr-minimap'); if (!mm) return;
    const ctx = mm.getContext('2d'); if (!ctx) return;
    const W = mm.width, H = mm.height;
    const b = state._mmBounds; if (!b) return;
    const pad = 8;
    const scaleX = (W - pad*2) / (b.maxX - b.minX || 1);
    const scaleZ = (H - pad*2) / (b.maxZ - b.minZ || 1);
    const toX = wx => pad + (wx - b.minX) * scaleX;
    const toY = wz => pad + (wz - b.minZ) * scaleZ;

    ctx.clearRect(0, 0, W, H);

    // Circular clip
    ctx.save();
    ctx.beginPath(); ctx.arc(W/2, H/2, W/2 - 1, 0, Math.PI*2); ctx.clip();

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(0,0,W,H);

    // Track outline
    if (state.trackCurve.length) {
        ctx.beginPath();
        ctx.moveTo(toX(state.trackCurve[0].x), toY(state.trackCurve[0].z));
        state.trackCurve.forEach(p => ctx.lineTo(toX(p.x), toY(p.z)));
        ctx.closePath();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 4; ctx.stroke();
    }

    // AI car dots
    const aiColors = ['#4488ff','#22cc44','#ffaa00'];
    state.aiCars.forEach((ai, i) => {
        ctx.beginPath();
        ctx.arc(toX(ai.mesh.position.x), toY(ai.mesh.position.z), 4, 0, Math.PI*2);
        ctx.fillStyle = aiColors[i] || '#fff'; ctx.fill();
    });

    // Player dot
    if (state.playerPos) {
        ctx.beginPath();
        ctx.arc(toX(state.playerPos.x), toY(state.playerPos.z), 5, 0, Math.PI*2);
        ctx.fillStyle = '#ff2222'; ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke();
    }

    ctx.restore();

    // Border ring
    ctx.beginPath(); ctx.arc(W/2, H/2, W/2 - 1, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 2; ctx.stroke();
}

// ============================================
// START SCREEN
// ============================================

function drawRacingStartScreen() {
    const wrapper = document.querySelector('.car-racing-canvas-wrapper');
    if (!wrapper) return;
    wrapper.style.position = 'relative';
    let ov = document.getElementById('car-start-overlay');
    if (!ov) {
        ov = document.createElement('div'); ov.id = 'car-start-overlay';
        ov.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.65);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:200;color:#fff;text-align:center;border-radius:8px;`;
        wrapper.appendChild(ov);
    }
    const st = window.racingState;
    const diffBtns = ['easy','medium','hard'].map(d => {
        const active = st.difficulty === d;
        const labels = {easy:'😊 Easy',medium:'😤 Medium',hard:'💀 Hard'};
        return `<button onclick="setRacingDifficulty('${d}')" style="padding:7px 14px;border:2px solid ${active?'#FFD700':'rgba(255,255,255,0.3)'};background:${active?'rgba(255,215,0,0.2)':'rgba(255,255,255,0.08)'};color:${active?'#FFD700':'#fff'};border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:${active?'700':'400'};transition:all 0.2s;">${labels[d]}</button>`;
    }).join('');

    const colorCircles = CAR_COLOR_OPTIONS.map(c => {
        const sel = st.playerColor === c.hex;
        return `<div onclick="setRacingCarColor(${c.hex})" title="${c.label}" style="width:28px;height:28px;border-radius:50%;background:${c.css};cursor:pointer;border:${sel?'3px solid #fff':'2px solid rgba(255,255,255,0.3)'};box-shadow:${sel?'0 0 8px rgba(255,255,255,0.8)':'none'};transform:${sel?'scale(1.2)':'scale(1)'};transition:all 0.2s;"></div>`;
    }).join('');

    ov.innerHTML = `
        <div style="font-size:3.2rem;">🏎️</div>
        <h2 style="font-size:1.9rem;color:#FFD700;margin:8px 0;">3D Car Racing</h2>
        <p style="opacity:0.9;margin:4px 0;">Race 3 laps &bull; Beat 3 AI cars</p>
        <p style="font-size:0.82rem;opacity:0.6;margin:2px 0;">WASD / Arrows &bull; Shift=Nitro &bull; C=Camera</p>

        <div style="margin:12px 0 6px;">
            <p style="font-size:0.8rem;opacity:0.7;margin:0 0 6px;">DIFFICULTY</p>
            <div style="display:flex;gap:8px;justify-content:center;">${diffBtns}</div>
        </div>

        <div style="margin:10px 0 6px;">
            <p style="font-size:0.8rem;opacity:0.7;margin:0 0 6px;">CAR COLOR</p>
            <div style="display:flex;gap:10px;justify-content:center;align-items:center;">${colorCircles}</div>
        </div>

        <button onclick="closeCarStartAndBegin()" style="margin-top:14px;padding:13px 36px;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;border-radius:10px;font-size:1.1rem;cursor:pointer;font-weight:700;box-shadow:0 4px 20px rgba(102,126,234,0.5);">
            🏁 Start Race
        </button>`;
}

function closeCarStartAndBegin() {
    const ov = document.getElementById('car-start-overlay'); if (ov) ov.remove();
    startCarRacing();
}

function setRacingDifficulty(level) {
    window.racingState.difficulty = level;
    drawRacingStartScreen();
}

function setRacingCarColor(hexColor) {
    window.racingState.playerColor = hexColor;
    drawRacingStartScreen();
}

// ============================================
// FALLBACK
// ============================================

function showCarRacingFallback(msg) {
    const canvas = document.getElementById('car-racing-canvas'); if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.fillStyle = '#1a1a2e'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#FF5555'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(msg||'Unable to start game.', canvas.width/2, canvas.height/2-10);
    ctx.fillStyle = '#aaa'; ctx.font = '13px sans-serif';
    ctx.fillText('Try a modern browser like Chrome or Firefox.', canvas.width/2, canvas.height/2+18);
}

// ============================================
// CSS
// ============================================

function injectRacingCSS() {
    if (document.getElementById('car-racing-styles')) return;
    const s = document.createElement('style'); s.id = 'car-racing-styles';
    s.textContent = `
        @keyframes carCountPulse {
            0%   { transform:translate(-50%,-50%) scale(2.2); opacity:0; }
            35%  { transform:translate(-50%,-50%) scale(1);   opacity:1; }
            100% { transform:translate(-50%,-50%) scale(1);   opacity:1; }
        }
        @keyframes nitroPulse {
            0%,100% { box-shadow:0 0 8px #0088ff; }
            50%     { box-shadow:0 0 18px #00eeff, 0 0 32px #ff8800; }
        }
        .car-racing-canvas-wrapper {
            position:relative !important; display:flex;
            justify-content:center; align-items:center;
            background:#000; border-radius:10px; overflow:hidden; width:100%;
        }
        #car-racing-canvas { display:block; max-width:100%; }

        /* Speedometer */
        #cr-speedometer {
            position:absolute; bottom:10px; right:136px;
            background:rgba(0,0,0,0.65); border-radius:10px;
            padding:6px 10px; text-align:center; color:#fff;
            font-family:monospace; pointer-events:none;
            border:1px solid rgba(255,255,255,0.2);
        }
        #cr-spd-val { font-size:1.6rem; font-weight:700; display:block; line-height:1; }
        .cr-spd-unit { font-size:0.65rem; opacity:0.7; letter-spacing:1px; }

        /* Nitro bar */
        #cr-nitro-bar-wrap {
            position:absolute; bottom:10px; left:10px;
            width:120px; pointer-events:none;
        }
        .cr-nitro-label {
            font-size:0.7rem; color:#00ccff; font-weight:700;
            letter-spacing:1px; margin-bottom:3px; font-family:monospace;
        }
        #cr-nitro-track {
            height:8px; background:rgba(255,255,255,0.15);
            border-radius:4px; overflow:hidden;
            border:1px solid rgba(0,200,255,0.4);
        }
        #cr-nitro-fill {
            height:100%; width:0%; border-radius:4px;
            background:linear-gradient(90deg,#0055ff,#00eeff);
            transition:width 0.1s linear;
        }
        #cr-nitro-fill.active {
            background:linear-gradient(90deg,#ff6600,#ffcc00);
            animation:nitroPulse 0.3s infinite;
        }

        /* Mini-map */
        #cr-minimap {
            position:absolute; bottom:10px; right:10px;
            width:120px; height:120px; border-radius:50%;
            border:2px solid rgba(255,255,255,0.35);
            pointer-events:none;
        }

        /* Camera label */
        #cr-cam-label {
            position:absolute; top:10px; left:10px;
            background:rgba(0,0,0,0.55); color:#FFD700;
            font-size:0.7rem; font-weight:700; font-family:monospace;
            letter-spacing:2px; padding:4px 8px; border-radius:6px;
            border:1px solid rgba(255,215,0,0.3); pointer-events:none;
        }
    `;
    document.head.appendChild(s);
}