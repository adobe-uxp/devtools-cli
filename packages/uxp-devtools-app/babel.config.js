module.exports = {
    sourceType: "unambiguous",
    presets: [
        [ "@babel/preset-env" ],
        "@babel/react",
    ],
    plugins: [
        [ "@babel/plugin-proposal-decorators", { legacy: true } ],
        [ "@babel/plugin-proposal-class-properties", { loose: true } ],
        [ "@babel/transform-runtime" ]
    ]
};
