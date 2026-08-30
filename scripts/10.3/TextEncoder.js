/**
 * TextEncoder / TextDecoder UTF-8 polyfill
 * Adapted from samthor/fast-text-encoding
 * https://github.com/samthor/fast-text-encoding
 * Copyright 2017 Sam Thorogood. Apache License 2.0
 *
 * Browser-only: no Node Buffer, no sync XHR. UTF-8 only (same as native
 * TextEncoder; native TextDecoder also accepts other labels).
 */
(function (scope) {
    var APPLY_CHUNK = 4096;
    var UTF_LABELS = { 'utf-8': 1, utf8: 1, 'unicode-1-1-utf-8': 1 };

    function failedOption(operation, fieldName) {
        throw new Error("Failed to " + operation + ": the '" + fieldName + "' option is unsupported.");
    }

    function decodeUtf8(bytes) {
        var inputIndex = 0;
        var pendingSize = Math.min(APPLY_CHUNK, bytes.length + 1);
        var pending = new Uint16Array(pendingSize);
        var chunks = [];
        var pendingIndex = 0;

        for (;;) {
            var more = inputIndex < bytes.length;
            if (!more || pendingIndex >= pendingSize - 1) {
                chunks.push(
                    String.fromCharCode.apply(null, Array.prototype.slice.call(pending, 0, pendingIndex))
                );
                if (!more) return chunks.join('');
                bytes = bytes.subarray(inputIndex);
                inputIndex = 0;
                pendingIndex = 0;
            }

            var byte1 = bytes[inputIndex++];
            if ((byte1 & 0x80) === 0) {
                pending[pendingIndex++] = byte1;
            } else if ((byte1 & 0xe0) === 0xc0) {
                pending[pendingIndex++] = ((byte1 & 0x1f) << 6) | (bytes[inputIndex++] & 0x3f);
            } else if ((byte1 & 0xf0) === 0xe0) {
                var b2 = bytes[inputIndex++] & 0x3f;
                var b3 = bytes[inputIndex++] & 0x3f;
                pending[pendingIndex++] = ((byte1 & 0x1f) << 12) | (b2 << 6) | b3;
            } else if ((byte1 & 0xf8) === 0xf0) {
                var c2 = bytes[inputIndex++] & 0x3f;
                var c3 = bytes[inputIndex++] & 0x3f;
                var c4 = bytes[inputIndex++] & 0x3f;
                var codepoint = ((byte1 & 0x07) << 18) | (c2 << 12) | (c3 << 6) | c4;
                if (codepoint > 0xffff) {
                    codepoint -= 0x10000;
                    pending[pendingIndex++] = ((codepoint >>> 10) & 0x3ff) | 0xd800;
                    codepoint = 0xdc00 | (codepoint & 0x3ff);
                }
                pending[pendingIndex++] = codepoint;
            } else {
                pending[pendingIndex++] = 0xfffd;
            }
        }
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

    function encodeUtf8(string) {
        var pos = 0;
        var len = string.length;
        var at = 0;
        var tlen = Math.max(32, len + (len >>> 1) + 7);
        var target = new Uint8Array((tlen >>> 3) << 3);

        while (pos < len) {
            var step = nextCodePoint(string, pos, len);
            pos = step.next;
            if (step.skip) continue;
            var value = step.value;
            if (at + 4 > target.length) {
                tlen += 8;
                tlen *= 1 + (pos / string.length) * 2;
                tlen = (tlen >>> 3) << 3;
                var update = new Uint8Array(tlen);
                update.set(target);
                target = update;
            }
            at += writeCodePoint(target, at, value);
        }

        return target.slice ? target.slice(0, at) : target.subarray(0, at);
    }

    function encodeInto(string, dest) {
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
    }

    function asUint8Array(buffer) {
        if (buffer == null) return new Uint8Array(0);
        if (buffer instanceof Uint8Array) return buffer;
        if (typeof ArrayBuffer !== 'undefined' && buffer instanceof ArrayBuffer) {
            return new Uint8Array(buffer);
        }
        if (buffer.buffer instanceof ArrayBuffer) {
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        }
        return new Uint8Array(buffer);
    }

    function TextEncoder() {
        if (!(this instanceof TextEncoder)) {
            throw new TypeError("Failed to construct 'TextEncoder': Please use the 'new' operator");
        }
        this.encoding = 'utf-8';
    }

    TextEncoder.prototype.encode = function (string, options) {
        if (options && options.stream) failedOption('encode', 'stream');
        return encodeUtf8(string === undefined ? '' : String(string));
    };

    TextEncoder.prototype.encodeInto = function (string, dest) {
        return encodeInto(string, dest);
    };

    function TextDecoder(utfLabel, options) {
        if (!(this instanceof TextDecoder)) {
            throw new TypeError("Failed to construct 'TextDecoder': Please use the 'new' operator");
        }
        if (options && options.fatal) failedOption("construct 'TextDecoder'", 'fatal');
        utfLabel = utfLabel || 'utf-8';
        if (!UTF_LABELS[String(utfLabel).toLowerCase()]) {
            throw new RangeError(
                "Failed to construct 'TextDecoder': the encoding label provided ('" + utfLabel + "') is invalid."
            );
        }
        this.encoding = 'utf-8';
        this.fatal = false;
        this.ignoreBOM = false;
    }

    TextDecoder.prototype.decode = function (buffer, options) {
        if (options && options.stream) failedOption('decode', 'stream');
        return decodeUtf8(asUint8Array(buffer));
    };

    if (!scope.TextEncoder) scope.TextEncoder = TextEncoder;
    if (!scope.TextDecoder) scope.TextDecoder = TextDecoder;
})(typeof window !== 'undefined' ? window : self);
