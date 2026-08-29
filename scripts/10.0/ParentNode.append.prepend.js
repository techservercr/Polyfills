// https://developer.mozilla.org/en-US/docs/Web/API/Element/append
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

    define(Element.prototype, 'append', function append() {
        this.appendChild(toFragment(arguments));
    });
    define(Element.prototype, 'prepend', function prepend() {
        this.insertBefore(toFragment(arguments), this.firstChild);
    });

    if (typeof Document !== 'undefined') {
        define(Document.prototype, 'append', function append() {
            this.appendChild(toFragment(arguments));
        });
        define(Document.prototype, 'prepend', function prepend() {
            this.insertBefore(toFragment(arguments), this.firstChild);
        });
    }

    if (typeof DocumentFragment !== 'undefined') {
        define(DocumentFragment.prototype, 'append', function append() {
            this.appendChild(toFragment(arguments));
        });
        define(DocumentFragment.prototype, 'prepend', function prepend() {
            this.insertBefore(toFragment(arguments), this.firstChild);
        });
    }
})();
