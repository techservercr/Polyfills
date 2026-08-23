// https://github.com/ungap/global-this
// Avoid `typeof globalThis`: Babel injects a _typeof helper that names Symbol
// before scripts/9.0/Object.getOwnPropertySymbols.js has installed it.
(function () {
    if (window.globalThis !== window) {
        window.globalThis = window;
    }
})();
