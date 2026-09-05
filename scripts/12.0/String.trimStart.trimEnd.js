(function () {
// https://gist.github.com/developit/e96097d9b657f2a2f3e588ffde433437
if (!('trimStart' in String.prototype)) String.prototype.trimStart = String.prototype.trimLeft;
if (!('trimEnd' in String.prototype)) String.prototype.trimEnd = String.prototype.trimRight;
})();
