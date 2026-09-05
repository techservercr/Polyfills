(function () {
// https://gist.github.com/developit/e96097d9b657f2a2f3e588ffde433437
if (!('description' in Symbol.prototype)) {
    Object.defineProperty(Symbol.prototype, 'description', {
        get() { return /\((.+)\)/.exec(this)[1] }
    });
}
})();
