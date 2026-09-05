(function () {
// https://github.com/VitorLuizC/object-descriptors
const getKeys = (object) => {
    if (typeof Reflect === 'object' && typeof Reflect.ownKeys === 'function')
        return Reflect.ownKeys(object);

    const keys = [];

    return keys.concat(
        Object.getOwnPropertyNames(object),
        Object.getOwnPropertySymbols(object),
    );
};

const getDescriptors = (object) => {
    if (object === null || object === undefined)
        throw new TypeError('Cannot convert undefined or null to object');

    return getKeys(object).reduce(
        (descriptors, key) => {
            const descriptor = Object.getOwnPropertyDescriptor(object, key);
            if (descriptor) descriptors[key] = descriptor;
            return descriptors;
        },
        {},
    );
};

if (typeof Object.getOwnPropertyDescriptors !== 'function') {
    Object.defineProperty(Object, 'getOwnPropertyDescriptors', {
        value: getDescriptors,
        writable: true,
        configurable: true,
    });
}
})();
