// https://github.com/ungap/essential-replace-children
// ParentNode.replaceChildren: clear existing children, then append the new ones.
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

    function replaceChildren() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
        if (arguments.length) {
            this.appendChild(toFragment(arguments));
        }
    }

    define(Element.prototype, 'replaceChildren', replaceChildren);

    if (typeof Document !== 'undefined') {
        define(Document.prototype, 'replaceChildren', replaceChildren);
    }

    if (typeof DocumentFragment !== 'undefined') {
        define(DocumentFragment.prototype, 'replaceChildren', replaceChildren);
    }
})();
