// Unprefixed transform is Safari 9 / iOS 9. iOS 8 only understands -webkit-transform.
(function () {
    if (window.__pfWebkitTransformApplied) return;

    var TRANSFORM_PROPS = [
        'transform-origin',
        'transform-style',
        'perspective-origin',
        'backface-visibility',
        'perspective',
        'transform'
    ];
    var TRANSFORM_QUICK = /(?:^|[;{])\s*(?:-webkit-)?(?:transform(?:-origin|-style)?|perspective(?:-origin)?|backface-visibility)\s*:|(?:^|[;{])\s*(?:transition(?:-property)?|will-change)\s*:[^;}]*\btransform\b/m;

    function escapeRe(s) {
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    var propDecl = new RegExp(
        '(^|;|{)\\s*(' + TRANSFORM_PROPS.map(escapeRe).join('|') + ')\\s*:\\s*([^;}]*)',
        'gi'
    );

    var createPatcher = window.__pfCreateWebkitPropertyPatcher;
    var patcher = createPatcher
        ? createPatcher({
            properties: TRANSFORM_PROPS,
            detectProperty: 'transform',
            detectValue: 'none',
            quickTest: TRANSFORM_QUICK,
            webkitOnly: false
        })
        : null;

    if (patcher) {
        if (!patcher.needsPolyfill()) return;
    } else {
        var probe = document.createElement('div');
        probe.style.setProperty('transform', 'none');
        if (probe.style.getPropertyValue('transform') !== '') return;
    }
    window.__pfWebkitTransformApplied = true;

    function prefixTransformToken(val) {
        if (val == null) return val;
        return String(val).replace(/(^|[\s,])(-webkit-)?transform(?=$|[\s,])/g, '$1-webkit-transform');
    }

    function prefixTransitionInCss(css) {
        return css.replace(
            /(^|[;{])(\s*)(transition(?:-property)?|will-change)\s*:\s*([^;}]*)/gi,
            function (m, lead, space, prop, val) {
                var prefixedVal = prefixTransformToken(val);
                if (prefixedVal === val) return m;
                var out = lead + space + prop + ': ' + val + '; ' + prop + ': ' + prefixedVal;
                if (prop.toLowerCase() !== 'will-change') {
                    out += '; -webkit-' + prop + ': ' + prefixedVal;
                }
                return out;
            }
        );
    }

    function prefixTransformInCss(css) {
        if (!css || !TRANSFORM_QUICK.test(css)) return css;
        var out = css;
        if (patcher && patcher.patchText) {
            out = patcher.patchText(out);
        } else {
            out = out.replace(propDecl, function (m, lead, prop, val) {
                if (prop.indexOf('-webkit-') === 0) return m;
                return lead + ' ' + prop + ': ' + val + '; -webkit-' + prop + ': ' + val;
            });
        }
        return prefixTransitionInCss(out);
    }

    function isTransformProperty(prop) {
        if (!prop) return false;
        var p = String(prop).toLowerCase();
        if (p.indexOf('-webkit-') === 0) return false;
        var i;
        for (i = 0; i < TRANSFORM_PROPS.length; i++) {
            if (p === TRANSFORM_PROPS[i]) return true;
        }
        return false;
    }

    function isTransitionLike(prop) {
        var p = String(prop || '').toLowerCase();
        return p === 'transition' || p === 'transition-property' || p === 'will-change';
    }

    function kebabToCamel(name) {
        return name.replace(/-([a-z])/g, function (_, c) { return c.toUpperCase(); });
    }

    function prefixedDeclsFromBlock(block) {
        var patched = prefixTransformInCss(block);
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
        patched.replace(
            /(?:^|;)\s*(transition(?:-property)?|will-change)\s*:\s*([^;]*-webkit-transform[^;]*)/gi,
            function (_, prop, val) {
                add(prop + ':' + val);
                return _;
            }
        );
        return decls.join(';');
    }

    if (window.__pfInstallCssSheetRewriter) {
        window.__pfInstallCssSheetRewriter({
            marker: 'data-webkit-transform-polyfill',
            extract: function (css) {
                if (!css || !TRANSFORM_QUICK.test(css)) return '';
                return window.__pfExtractCssRuleSubset(css, function (_, block) {
                    if (!TRANSFORM_QUICK.test(block)) return '';
                    return prefixedDeclsFromBlock(block);
                });
            },
            patchInline: function (raw) {
                if (!raw || !TRANSFORM_QUICK.test('{' + raw)) return raw;
                return prefixTransformInCss(raw);
            }
        });
    }

    function hookSetProperty(orig, prop, val, priority) {
        var name = String(prop || '').toLowerCase();
        if (isTransformProperty(name)) {
            orig.call(this, '-webkit-' + name, val, priority);
        } else if (isTransitionLike(name)) {
            var prefixedVal = prefixTransformToken(val);
            if (name !== 'will-change') orig.call(this, '-webkit-' + name, prefixedVal, priority);
            return orig.call(this, prop, prefixedVal, priority);
        }
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
        var pi;
        for (pi = 0; pi < TRANSFORM_PROPS.length; pi++) {
            (function (kebab) {
                var camel = kebabToCamel(kebab);
                var webkitKebab = '-webkit-' + kebab;
                var desc = Object.getOwnPropertyDescriptor(proto, camel);
                Object.defineProperty(proto, camel, {
                    get: desc && desc.get
                        ? desc.get
                        : function () {
                            return this.getPropertyValue(webkitKebab) || this.getPropertyValue(kebab);
                        },
                    set: function (v) {
                        if (desc && desc.set) desc.set.call(this, v);
                        this.setProperty(webkitKebab, v);
                        if (!(desc && desc.set)) this.setProperty(kebab, v);
                    },
                    configurable: true,
                    enumerable: desc ? desc.enumerable : true
                });
            })(TRANSFORM_PROPS[pi]);
        }
    } catch (_) {}
})();
