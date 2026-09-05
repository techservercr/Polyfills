(function () {
if (typeof crypto !== "undefined" && !crypto.subtle && crypto.webkitSubtle) {
    crypto.subtle = crypto.webkitSubtle;
}
})();
