// https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder/encodeInto
// Native TextEncoder is iOS 10.3; encodeInto is Safari 14.1 / iOS 14.5.
(function () {
    if (typeof TextEncoder === 'undefined' || typeof TextEncoder.prototype.encodeInto === 'function') {
        return;
    }

    function nextCodePoint(string, i, len) {
        var value = string.charCodeAt(i);
        var next = i + 1;
        if (value >= 0xd800 && value <= 0xdbff && i + 1 < len) {
            var extra = string.charCodeAt(i + 1);
            if ((extra & 0xfc00) === 0xdc00) {
                next = i + 2;
                value = ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000;
            }
        }
        if (value >= 0xd800 && value <= 0xdbff) {
            return { next: next, skip: true };
        }
        return { next: next, value: value };
    }

    function codePointSize(value) {
        if (value <= 0x7f) return 1;
        if (value <= 0x7ff) return 2;
        if (value <= 0xffff) return 3;
        return 4;
    }

    function writeCodePoint(target, at, value) {
        if (value <= 0x7f) {
            target[at] = value;
            return 1;
        }
        if (value <= 0x7ff) {
            target[at] = ((value >>> 6) & 0x1f) | 0xc0;
            target[at + 1] = (value & 0x3f) | 0x80;
            return 2;
        }
        if (value <= 0xffff) {
            target[at] = ((value >>> 12) & 0x0f) | 0xe0;
            target[at + 1] = ((value >>> 6) & 0x3f) | 0x80;
            target[at + 2] = (value & 0x3f) | 0x80;
            return 3;
        }
        target[at] = ((value >>> 18) & 0x07) | 0xf0;
        target[at + 1] = ((value >>> 12) & 0x3f) | 0x80;
        target[at + 2] = ((value >>> 6) & 0x3f) | 0x80;
        target[at + 3] = (value & 0x3f) | 0x80;
        return 4;
    }

    TextEncoder.prototype.encodeInto = function (string, dest) {
        string = string === undefined ? '' : String(string);
        var read = 0;
        var written = 0;
        var i = 0;
        var len = string.length;
        while (i < len) {
            var step = nextCodePoint(string, i, len);
            if (step.skip) {
                i = step.next;
                continue;
            }
            var need = codePointSize(step.value);
            if (written + need > dest.length) break;
            writeCodePoint(dest, written, step.value);
            written += need;
            i = step.next;
            read = i;
        }
        return { read: read, written: written };
    };
})();
