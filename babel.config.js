module.exports = function (api) {
    const isPrebuilt = api.env('prebuilt');

    // Transforms that often inject Babel helpers; we avoid them for prebuilt UMDs
    const helperHeavyExcludes = [
        '@babel/plugin-transform-classes',
        '@babel/plugin-transform-async-to-generator',
        '@babel/plugin-transform-regenerator',
        '@babel/plugin-transform-async-generator-functions',
        '@babel/plugin-transform-for-of',
        '@babel/plugin-transform-destructuring',
        '@babel/plugin-transform-spread',
        '@babel/plugin-transform-object-super',
        '@babel/plugin-transform-parameters',
        '@babel/plugin-transform-object-rest-spread'
    ];

    return {
        presets: [
            [
                '@babel/preset-env',
                Object.assign(
                    {
                        // targets: .browserslistrc
                        bugfixes: true,
                    },
                    isPrebuilt ? { exclude: helperHeavyExcludes } : {}
                )
            ]
        ]
    };
};
