// Unprefixed flexbox is Safari 9 / iOS 9. iOS 8 only understands -webkit-flex.
(function () {
    if (window.__pfWebkitFlexApplied) return;
    var probe = document.createElement('div');
    probe.style.display = 'flex';
    if (probe.style.display === 'flex') return;
    window.__pfWebkitFlexApplied = true;

    var FLEX_PROPS = [
        'flex-direction', 'flex-wrap', 'flex-flow', 'flex-grow', 'flex-shrink',
        'flex-basis', 'justify-content', 'align-items', 'align-self',
        'align-content', 'order', 'flex'
    ];
    var FLEX_QUICK = /(?:^|[;{])\s*(?:-webkit-)?(?:flex(?:-(?:direction|wrap|flow|grow|shrink|basis))?|justify-content|align-items|align-self|align-content|order)\s*:|(?:^|[;{])\s*display\s*:\s*(?:inline-)?flex\b/m;

    function escapeRe(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    var propDecl = new RegExp(
        '(^|;|{)\\s*(' + FLEX_PROPS.map(escapeRe).join('|') + ')\\s*:\\s*([^;}]*)',
        'gi'
    );

    var createPatcher = window.__pfCreateWebkitPropertyPatcher;
    var patcher = createPatcher
        ? createPatcher({
            properties: FLEX_PROPS,
            detectProperty: 'flex-direction',
            detectValue: 'row',
            quickTest: FLEX_QUICK,
            webkitOnly: false
        })
        : null;

    function prefixDisplayValue(val) {
        if (val == null) return val;
        var s = String(val).trim();
        if (s === 'flex' || s === 'inline-flex') return '-webkit-' + s;
        return val;
    }

    function prefixDisplayInCss(css) {
        return css.replace(/(^|[;{])(\s*)display\s*:\s*([^;}]*)/gi, function (m, lead, space, val) {
            if (/-webkit-(?:inline-)?flex/i.test(val)) return m;
            var prefixed = val.replace(/(^|[\s])((?:inline-)?flex)(?=$|[\s!])/gi, '$1-webkit-$2');
            if (prefixed === val) return m;
            return lead + space + 'display: ' + val + '; display: ' + prefixed;
        });
    }

    function prefixFlexInCss(css) {
        if (!css || !FLEX_QUICK.test(css)) return css;
        var out = css;
        if (patcher && patcher.patchText) {
            out = patcher.patchText(out);
        } else {
            out = out.replace(propDecl, function (m, lead, prop, val) {
                if (prop.indexOf('-webkit-') === 0) return m;
                return lead + ' ' + prop + ': ' + val + '; -webkit-' + prop + ': ' + val;
            });
        }
        return prefixDisplayInCss(out);
    }

    function isFlexProperty(prop) {
        if (!prop) return false;
        var p = String(prop).toLowerCase();
        if (p.indexOf('-webkit-') === 0) return false;
        var i;
        for (i = 0; i < FLEX_PROPS.length; i++) {
            if (p === FLEX_PROPS[i]) return true;
        }
        return false;
    }

    function prefixedDeclsFromBlock(block) {
        var patched = prefixFlexInCss(block);
        var decls = [];
        var seen = {};
        function add(decl) {
            decl = decl.replace(/\s+/g, ' ').trim();
            if (!decl || seen[decl]) return;
            seen[decl] = true;
            decls.push(decl);
        }
        patched.replace(/(?:^|;)\s*(-webkit-[^:;]+)\s*:\s*([^;]+)/gi, function (_, prop, val) {
            add(prop + ':' + val);
            return _;
        });
        patched.replace(/(?:^|;)\s*display\s*:\s*([^;]*-webkit-(?:inline-)?flex[^;]*)/gi, function (_, val) {
            add('display:' + val);
            return _;
        });
        return decls.join(';');
    }

    if (window.__pfInstallCssSheetRewriter) {
        window.__pfInstallCssSheetRewriter({
            marker: 'data-webkit-flex-polyfill',
            extract: function (css) {
                if (!css || !FLEX_QUICK.test(css)) return '';
                return window.__pfExtractCssRuleSubset(css, function (_, block) {
                    if (!FLEX_QUICK.test(block)) return '';
                    return prefixedDeclsFromBlock(block);
                });
            },
            patchInline: function (raw) {
                if (!raw || !FLEX_QUICK.test('{' + raw)) return raw;
                return prefixFlexInCss(raw);
            }
        });
    }

    function hookSetProperty(orig, prop, val, priority) {
        if (prop === 'display') orig.call(this, prop, prefixDisplayValue(val), priority);
        else if (isFlexProperty(prop)) orig.call(this, '-webkit-' + prop, val, priority);
        return orig.call(this, prop, val, priority);
    }

    if (window.__pfHookPrototype) {
        window.__pfHookPrototype(CSSStyleDeclaration.prototype, 'setProperty', hookSetProperty);
    } else {
        var origSetProperty = CSSStyleDeclaration.prototype.setProperty;
        CSSStyleDeclaration.prototype.setProperty = function (prop, val, priority) {
            return hookSetProperty.call(this, origSetProperty, prop, val, priority);
        };
    }

    try {
        var proto = CSSStyleDeclaration.prototype;
        var displayDesc = Object.getOwnPropertyDescriptor(proto, 'display');
        if (displayDesc && displayDesc.set) {
            Object.defineProperty(proto, 'display', {
                get: displayDesc.get,
                set: function (v) { displayDesc.set.call(this, prefixDisplayValue(v)); },
                configurable: true,
                enumerable: displayDesc.enumerable
            });
        }
    } catch (_) {}
})();
