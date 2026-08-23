// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/codePointAt
if (!String.prototype.codePointAt) {
    String.prototype.codePointAt = function (position) {
        if (this == null) {
            throw TypeError('String.prototype.codePointAt called on null or undefined');
        }
        var string = String(this);
        var size = string.length;
        var index = position ? Number(position) : 0;
        if (index != index) {
            index = 0;
        }
        if (index < 0 || index >= size) {
            return undefined;
        }
        var first = string.charCodeAt(index);
        if (first >= 0xD800 && first <= 0xDBFF && size > index + 1) {
            var second = string.charCodeAt(index + 1);
            if (second >= 0xDC00 && second <= 0xDFFF) {
                return (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
            }
        }
        return first;
    };
}
