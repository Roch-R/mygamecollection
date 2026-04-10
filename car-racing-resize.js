// ============================================
// Car Racing - Resize & WebGL Recovery
// Safe version: defers canvas lookup until needed
// ============================================

(function () {
    'use strict';

    let resizeTimeout;

    window.addEventListener('resize', function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
            const state = window.racingState;
            if (!state || !state.renderer || !state.canvas || !state.initialized) return;

            const wrapper = document.querySelector('.car-racing-canvas-wrapper');
            const w = wrapper ? Math.max(wrapper.offsetWidth, 300) : 600;
            const h = Math.min(Math.max(window.innerHeight - 300, 300), 460);

            state.canvas.width = w;
            state.canvas.height = h;
            state.canvas.style.width = w + 'px';
            state.canvas.style.height = h + 'px';

            if (state.camera) {
                state.camera.aspect = w / h;
                state.camera.updateProjectionMatrix();
            }
            state.renderer.setSize(w, h);

            // Re-render one frame if paused/waiting
            if (!state.isRunning && state.scene && state.camera) {
                state.renderer.render(state.scene, state.camera);
            }
        }, 150);
    });

    // WebGL context loss recovery — attach lazily after game starts
    document.addEventListener('DOMContentLoaded', function () {
        // We don't grab the canvas here at page load since it may not be in the DOM yet
        // Instead we use a MutationObserver to attach the listener when the canvas appears
        const observer = new MutationObserver(function () {
            const canvas = document.getElementById('car-racing-canvas');
            if (canvas && !canvas._webglLossHandlerAttached) {
                canvas._webglLossHandlerAttached = true;
                canvas.addEventListener('webglcontextlost', function (e) {
                    e.preventDefault();
                    console.warn('WebGL context lost — will attempt recovery...');
                    setTimeout(function () {
                        if (typeof initCarRacing === 'function') initCarRacing();
                    }, 800);
                });
                observer.disconnect(); // stop observing once attached
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    });

})();