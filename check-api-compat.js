'use strict';

/**
 * Fail if source JS calls web APIs that iOS Safari (see .browserslistrc) does
 * not implement, unless this repo already injects a polyfill first.
 *
 *   node check-api-compat.js
 */

var fs = require('fs');
var path = require('path');
var acorn = require('acorn');
var browserslist = require('browserslist');
var bcd = require('@mdn/browser-compat-data');

var ROOT = __dirname;
var ROOTS = [
    { dir: 'scripts-priority', phase: 0 },
    { dir: 'scripts', phase: 1 },
    { dir: 'scripts-post', phase: 2 }
];

var STATIC_HOSTS = {
    Array: true,
    Object: true,
    Promise: true,
    String: true,
    Number: true,
    Math: true,
    Reflect: true,
    Symbol: true,
    Date: true,
    JSON: true,
    Intl: true,
    Error: true,
    URL: true,
    URLSearchParams: true,
    WeakMap: true,
    WeakSet: true,
    Map: true,
    Set: true,
    Proxy: true
};

var COLLECTION_METHODS = {
    querySelectorAll: true,
    getElementsByTagName: true,
    getElementsByClassName: true,
    getElementsByName: true,
    getElementsByTagNameNS: true
};

var ES5_ARRAY_ITERATORS = {
    forEach: true,
    map: true,
    filter: true,
    reduce: true,
    reduceRight: true,
    some: true,
    every: true,
    indexOf: true,
    lastIndexOf: true
};

var SKIP_FILE = /(\.min\.js$)|(^A_pako\.js$)|(^inert\.min\.js$)/;

// Vendor/bundled sources: still register as polyfills, but do not AST-scan.
var SKIP_SCAN = /^(A_webp-hero|A_pako|RWTStream|Temporal)\.js$/;
var MAX_SCAN_BYTES = 80 * 1024;

// Names that exist on String/Array/legacy Document; BCD would mis-attribute them.
var AMBIGUOUS_INSTANCE = {
    replace: true,
    match: true,
    search: true,
    split: true,
    concat: true,
    slice: true,
    substring: true,
    substr: true,
    trim: true,
    keys: true,
    values: true,
    entries: true,
    get: true,
    set: true,
    has: true,
    add: true,
    append: true,
    item: true,
    open: true,
    close: true,
    write: true,
    writeln: true,
    clear: true,
    toString: true,
    valueOf: true
};

var RELATED_CTORS = {
    IntersectionObserver: ['IntersectionObserverEntry'],
    ResizeObserver: ['ResizeObserverEntry'],
    AbortController: ['AbortSignal'],
    TextEncoder: ['TextDecoder']
};

var STEM_COVERS = {
    'Object.getOwnPropertySymbols': ['Symbol'],
    'Element.SmoothScroll': ['Element.scroll', 'Element.scrollTo', 'Element.scrollBy'],
    RWTStream: ['ReadableStream', 'WritableStream', 'TransformStream'],
    'screen.orientation': ['ScreenOrientation'],
    A_URLSearchParams: ['URLSearchParams'],
    fetch: ['Headers', 'Request', 'Response'],
    'Element.replaceChildren': ['Document.replaceChildren', 'DocumentFragment.replaceChildren'],
    'Map.getOrInsert': ['WeakMap.getOrInsert', 'WeakMap.getOrInsertComputed']
};

function parseFolderVersion(folder) {
    if (folder === 'base') return [0, 0];
    var m = /^(\d+)\.(\d+)$/.exec(folder);
    if (!m) return null;
    return [+m[1], +m[2]];
}

function cmpVer(a, b) {
    if (a[0] !== b[0]) return a[0] - b[0];
    return (a[1] || 0) - (b[1] || 0);
}

function parseAdded(versionAdded) {
    if (versionAdded === true) return [0, 0];
    if (versionAdded === false || versionAdded == null) return null;
    var s = String(versionAdded).replace(/^[≤<]/, '');
    var m = /(\d+)(?:\.(\d+))?/.exec(s);
    if (!m) return null;
    return [+m[1], +(m[2] || 0)];
}

function safariIOSAdded(compat) {
    if (!compat || !compat.support) return null;
    var s = compat.support.safari_ios;
    if (!s) return null;
    if (Array.isArray(s)) s = s[0];
    return parseAdded(s.version_added);
}

function minIOSTarget() {
    var list = browserslist();
    var min = null;
    list.forEach(function (entry) {
        var m = /^ios_saf\s+(\d+)(?:\.(\d+))?/.exec(entry);
        if (!m) return;
        var ver = [+m[1], +(m[2] || 0)];
        if (!min || cmpVer(ver, min) < 0) min = ver;
    });
    if (!min) {
        throw new Error('browserslist did not resolve any ios_saf targets (check .browserslistrc)');
    }
    return min;
}

function nativeOn(added, minIos) {
    return added && cmpVer(added, minIos) <= 0;
}

function describeVer(v) {
    return v[0] + '.' + (v[1] || 0);
}

function visit(node, parent, fn) {
    fn(node, parent);
    Object.keys(node).forEach(function (k) {
        if (k === 'start' || k === 'end' || k === 'loc') return;
        var val = node[k];
        if (!val || typeof val !== 'object') return;
        if (Array.isArray(val)) {
            val.forEach(function (child) {
                if (child && child.type) visit(child, node, fn);
            });
        } else if (val.type) {
            visit(val, node, fn);
        }
    });
}

function memberName(node) {
    if (!node || node.type !== 'MemberExpression') return null;
    if (node.computed) {
        if (node.property.type === 'Literal') return String(node.property.value);
        return null;
    }
    return node.property.name || null;
}

function identName(node) {
    return node && node.type === 'Identifier' ? node.name : null;
}

function isPrototypeAssign(node, parent) {
    if (!parent || parent.type !== 'AssignmentExpression' || parent.left !== node) {
        return false;
    }
    var obj = node.object;
    return obj && obj.type === 'MemberExpression' && memberName(obj) === 'prototype';
}

function isFeatureDetect(node, parent) {
    if (!parent) return false;
    if (parent.type === 'UnaryExpression' && parent.operator === 'typeof') return true;
    if (parent.type === 'BinaryExpression' && parent.operator === 'in') return true;
    return false;
}

function parseSource(file, code) {
    var opts = { ecmaVersion: 2022, locations: true, allowReturnOutsideFunction: true };
    try {
        return acorn.parse(code, Object.assign({ sourceType: 'script' }, opts));
    } catch (e1) {
        try {
            return acorn.parse(code, Object.assign({ sourceType: 'module' }, opts));
        } catch (e2) {
            throw new Error(file + ': ' + e1.message);
        }
    }
}

function collectPolyfillFiles() {
    var files = [];
    ROOTS.forEach(function (root) {
        var base = path.join(ROOT, root.dir);
        if (!fs.existsSync(base)) return;
        fs.readdirSync(base, { withFileTypes: true }).forEach(function (ent) {
            if (!ent.isDirectory()) return;
            var ver = parseFolderVersion(ent.name);
            if (!ver) return;
            var folder = path.join(base, ent.name);
            fs.readdirSync(folder).forEach(function (name) {
                if (name.slice(-3) !== '.js' || SKIP_FILE.test(name)) return;
                files.push({
                    phase: root.phase,
                    version: ver,
                    name: name,
                    rel: path.join(root.dir, ent.name, name),
                    abs: path.join(folder, name),
                    stem: name.replace(/\.js$/, '')
                });
            });
        });
        var baseDir = path.join(base, 'base');
        if (fs.existsSync(baseDir)) {
            fs.readdirSync(baseDir).forEach(function (name) {
                if (name.slice(-3) !== '.js' || SKIP_FILE.test(name)) return;
                files.push({
                    phase: root.phase,
                    version: [0, 0],
                    name: name,
                    rel: path.join(root.dir, 'base', name),
                    abs: path.join(baseDir, name),
                    stem: name.replace(/\.js$/, '')
                });
            });
        }
    });
    return files;
}

function polyfillKeys(stem) {
    var parts = stem.split('.');
    var keys = [];
    var extra = STEM_COVERS[stem];
    if (extra) extra.forEach(function (k) { keys.push(k); });
    if (parts.length === 1) {
        keys.push(parts[0]);
        var related = RELATED_CTORS[parts[0]];
        if (related) related.forEach(function (k) { keys.push(k); });
        return keys;
    }
    var host = parts[0];
    for (var i = 1; i < parts.length; i++) {
        keys.push(host + '.' + parts[i]);
        keys.push(host + '.prototype.' + parts[i]);
    }
    return keys;
}

function availablePolyfills(consumer, all) {
    var set = Object.create(null);
    all.forEach(function (p) {
        if (p.abs === consumer.abs) return;
        var earlierPhase = p.phase < consumer.phase;
        var samePhaseEarlier =
            p.phase === consumer.phase &&
            (cmpVer(p.version, consumer.version) < 0 ||
                (cmpVer(p.version, consumer.version) === 0 && p.name < consumer.name));
        if (!earlierPhase && !samePhaseEarlier) return;
        polyfillKeys(p.stem).forEach(function (k) {
            set[k] = p.rel;
        });
    });
    return set;
}

function lookupCompat(apiPath) {
    var cur = bcd;
    for (var i = 0; i < apiPath.length; i++) {
        if (!cur) return null;
        cur = cur[apiPath[i]];
    }
    return cur && cur.__compat ? cur.__compat : null;
}

function addedForApi(apiId) {
    var parts = apiId.split('.');
    var host = parts[0];
    var rest = parts.slice(1);
    var paths = [];
    if (bcd.api && bcd.api[host]) {
        paths.push(['api', host].concat(rest));
    }
    if (bcd.javascript && bcd.javascript.builtins && bcd.javascript.builtins[host]) {
        paths.push(['javascript', 'builtins', host].concat(rest));
    }
    var best = null;
    paths.forEach(function (p) {
        var compat = lookupCompat(p);
        var added = safariIOSAdded(compat);
        if (!added) return;
        if (!best || cmpVer(added, best) > 0) best = added;
    });
    return best;
}

function isPolyfilled(apiId, polyfills) {
    if (polyfills[apiId]) return true;
    var host = apiId.split('.')[0];
    if (polyfills[host]) return true;
    var proto = apiId.replace(/^([A-Za-z0-9$]+)\./, '$1.prototype.');
    if (proto !== apiId && polyfills[proto]) return true;
    return false;
}

function collectionForEachApi(callee) {
    if (!callee || callee.type !== 'MemberExpression') return null;
    if (memberName(callee) !== 'forEach') return null;
    var obj = callee.object;
    if (obj.type !== 'CallExpression') return null;
    var inner = obj.callee;
    var name = memberName(inner) || identName(inner);
    if (!name || !COLLECTION_METHODS[name]) return null;
    return 'NodeList.forEach';
}

function staticApi(callee) {
    if (!callee || callee.type !== 'MemberExpression') return null;
    var host = identName(callee.object);
    var prop = memberName(callee);
    if (!host || !prop || !STATIC_HOSTS[host]) return null;
    return host + '.' + prop;
}

function instanceApi(callee) {
    if (!callee || callee.type !== 'MemberExpression') return null;
    var prop = memberName(callee);
    if (!prop) return null;
    if (ES5_ARRAY_ITERATORS[prop] || AMBIGUOUS_INSTANCE[prop]) return null;
    if (identName(callee.object) && STATIC_HOSTS[identName(callee.object)]) return null;
    var interfaces = [
        'Element',
        'NodeList',
        'HTMLCollection',
        'Document',
        'Window',
        'HTMLElement',
        'ParentNode',
        'ChildNode',
        'DOMTokenList',
        'Node'
    ];
    var best = null;
    var bestId = null;
    interfaces.forEach(function (iface) {
        if (!bcd.api[iface] || !bcd.api[iface][prop] || !bcd.api[iface][prop].__compat) return;
        var added = safariIOSAdded(bcd.api[iface][prop].__compat);
        if (!added) return;
        var id = iface + '.' + prop;
        if (!best || cmpVer(added, best) > 0) {
            best = added;
            bestId = id;
        }
    });
    return bestId;
}

function ctorApi(callee) {
    var name = identName(callee);
    if (!name || name[0] !== name[0].toUpperCase()) return null;
    // Optional host types used only when serializing values that iOS 8 never produces.
    if (name === 'BigInt') return null;
    if (bcd.api && bcd.api[name]) return name;
    if (bcd.javascript && bcd.javascript.builtins && bcd.javascript.builtins[name]) return name;
    return null;
}

function isTestPosition(node, parent) {
    if (!parent) return false;
    if (parent.type === 'IfStatement' && parent.test === node) return true;
    if (parent.type === 'ConditionalExpression' && parent.test === node) return true;
    if (parent.type === 'UnaryExpression' && parent.operator === '!') return true;
    if (parent.type === 'LogicalExpression') return true;
    return false;
}

function collectDetectedGlobals(ast) {
    var names = Object.create(null);
    visit(ast, null, function (node, parent) {
        if (
            node.type === 'Identifier' &&
            parent &&
            parent.type === 'UnaryExpression' &&
            parent.operator === 'typeof'
        ) {
            names[node.name] = true;
        }
        if (
            node.type === 'Literal' &&
            parent &&
            parent.type === 'BinaryExpression' &&
            parent.operator === 'in' &&
            parent.left === node
        ) {
            names[String(node.value)] = true;
        }
        if (node.type === 'MemberExpression' && isTestPosition(node, parent)) {
            var host = identName(node.object);
            var prop = memberName(node);
            if (host && prop) {
                names[prop] = true;
                names[host + '.' + prop] = true;
            }
        }
    });
    return names;
}

function checkFile(consumer, all, minIos, findings) {
    if (SKIP_FILE.test(path.basename(consumer.abs))) return;
    if (SKIP_SCAN.test(path.basename(consumer.abs))) return;
    var code = fs.readFileSync(consumer.abs, 'utf8');
    if (Buffer.byteLength(code, 'utf8') > MAX_SCAN_BYTES) return;
    var ast;
    try {
        ast = parseSource(consumer.rel, code);
    } catch (err) {
        findings.push({ file: consumer.rel, loc: '?', api: '(parse error)', detail: err.message });
        return;
    }
    var polyfills = availablePolyfills(consumer, all);
    polyfillKeys(consumer.stem).forEach(function (k) {
        polyfills[k] = consumer.rel;
    });
    var detected = collectDetectedGlobals(ast);

    visit(ast, null, function (node, parent) {
        if (isPrototypeAssign(node, parent) || isFeatureDetect(node, parent)) return;

        var apiId = null;
        if (node.type === 'NewExpression') {
            apiId = ctorApi(node.callee);
        } else if (node.type === 'CallExpression') {
            apiId =
                collectionForEachApi(node.callee) ||
                staticApi(node.callee) ||
                instanceApi(node.callee) ||
                ctorApi(node.callee);
        }
        if (!apiId) return;

        var host = apiId.split('.')[0];
        var prop = apiId.split('.').pop();
        if (detected[host] || detected[prop] || detected[apiId]) return;
        if (isPolyfilled(apiId, polyfills)) return;
        var added = addedForApi(apiId);
        if (!added || nativeOn(added, minIos)) return;

        var loc = node.loc && node.loc.start;
        findings.push({
            file: consumer.rel,
            loc: loc ? loc.line + ':' + loc.column : '?',
            api: apiId,
            detail: 'needs iOS ' + describeVer(added) + '+ (target is iOS ' + describeVer(minIos) + '+)'
        });
    });
}

function main() {
    var minIos = minIOSTarget();
    var all = collectPolyfillFiles();
    var findings = [];
    all.forEach(function (file) {
        checkFile(file, all, minIos, findings);
    });

    if (!findings.length) {
        console.log(
            'API compat OK (browserslist ios_saf >= ' + describeVer(minIos) + ', ' + all.length + ' files)'
        );
        return;
    }

    console.error(
        'API compat FAILED (' +
            findings.length +
            ' use(s) not native on iOS ' +
            describeVer(minIos) +
            ' and not polyfilled yet):\n'
    );
    findings.forEach(function (f) {
        console.error('  ✗ ' + f.file + ':' + f.loc + '  ' + f.api + '  — ' + f.detail);
    });
    console.error('\nAdd a polyfill under scripts/<version>/ (version = first iOS that shipped the API),');
    console.error('or avoid the call (see NodeList.forEach + StaticNodeList on iOS 8).');
    process.exit(1);
}

main();
