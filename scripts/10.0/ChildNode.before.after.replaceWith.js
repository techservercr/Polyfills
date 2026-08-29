// https://developer.mozilla.org/en-US/docs/Web/API/Element/before
(function () {
    function toFragment(args) {
        var frag = document.createDocumentFragment();
        var i;
        var item;
        for (i = 0; i < args.length; i++) {
            item = args[i];
            frag.appendChild(item instanceof Node ? item : document.createTextNode(String(item)));
        }
        return frag;
    }

    function define(proto, name, fn) {
        if (!proto || typeof proto[name] === 'function') return;
        try {
            Object.defineProperty(proto, name, {
                configurable: true,
                enumerable: true,
                writable: true,
                value: fn
            });
        } catch (_) {
            proto[name] = fn;
        }
    }

    function before() {
        if (!this.parentNode) return;
        this.parentNode.insertBefore(toFragment(arguments), this);
    }

    function after() {
        if (!this.parentNode) return;
        this.parentNode.insertBefore(toFragment(arguments), this.nextSibling);
    }

    function replaceWith() {
        var parent = this.parentNode;
        if (!parent) return;
        parent.replaceChild(toFragment(arguments), this);
    }

    define(Element.prototype, 'before', before);
    define(Element.prototype, 'after', after);
    define(Element.prototype, 'replaceWith', replaceWith);

    if (typeof CharacterData !== 'undefined') {
        define(CharacterData.prototype, 'before', before);
        define(CharacterData.prototype, 'after', after);
        define(CharacterData.prototype, 'replaceWith', replaceWith);
    }

    if (typeof DocumentType !== 'undefined') {
        define(DocumentType.prototype, 'before', before);
        define(DocumentType.prototype, 'after', after);
        define(DocumentType.prototype, 'replaceWith', replaceWith);
    }
})();
