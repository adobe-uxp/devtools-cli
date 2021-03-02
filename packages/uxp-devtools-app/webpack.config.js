// webpack v4
const path = require("path");
const { spawn } =  require("child_process");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const WebpackMd5Hash = require("webpack-md5-hash");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const StyleLintPlugin = require("stylelint-webpack-plugin");
const nodeExternals = require("webpack-node-externals");

// UXP Plugin templates needs to be handled in a special way - We read the contents of the template directory -
// based on the path of mentioned in the template module - to resolve the dirname specified in the path -
// we need to avoid running these modules via webpack and these modules needs to stay-as-is in their raw form -
// instead of being bundled into single file by webpack.
function externalizeUxpPluginTemplates(context, request, callback) {
    if (/^@adobe\/uxp-template-/.test(request)) {
    // this is a uxp plugin template - so externalize this one.
        return callback(null, "commonjs " + request);
    }

    callback();
}

module.exports = {

    target: "electron-renderer",

    entry: { main: "./src/index.js" },

    externals: [ nodeExternals(), externalizeUxpPluginTemplates ] ,

    node: {
        __dirname: false,
        __filename: false,
    },

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].[hash].js"
    },

    devtool: "inline-source-map",

    resolve: {
        extensions: [ ".js", ".jsx" ]
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            },
            {
                test: /node_modules[\/\\](iconv-lite)[\/\\].+/,
                resolve: {
                    aliasFields: [ "main" ]
                }
            },
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            plugins: [
                                require("autoprefixer")
                            ]
                        }
                    }
                ]
            },
            {
                test: /\.(sa|sc)ss$/,
                use: [
                    "style-loader",
                    MiniCssExtractPlugin.loader,
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            plugins: [
                                require("autoprefixer")
                            ]
                        }
                    },
                    "sass-loader"
                ]
            },
            {
                test: /\.(woff(2)?|ttf|otf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                        },
                    },
                ],
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                loader: "file-loader",
                query: {
                    name: "[name].[ext]?[hash]"
                }
            },
            {
                test: /\.node$/,
                loader: "node-loader",
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin({
            cleanAfterEveryBuildPatterns: [ "!*.otf" ]
        }),
        new MiniCssExtractPlugin({
            filename: "[name].[contenthash].css"
        }),
        new HtmlWebpackPlugin({
            hash: true,
            cache: false,
            template: "./src/index.html",
            filename: "index.html"
        }),
        new WebpackMd5Hash(),
        new StyleLintPlugin({
            configFile: "./configs/stylelint.config.js",
            files: "./src/scss/*.scss",
            syntax: "scss"
        })
    ],
    devServer: {
        writeToDisk: true,
        port: 14008,
        contentBase: "./dist",
        open: false,
        watchOptions: {
            aggregateTimeout: 300,
            ignored: /node_modules/,
            poll: 100,
        },
        before() {
            if (process.env.START_MAIN) {
                console.log("Starting Main Process...");
                const mainprocess = spawn("npm", [ "run", "start-main-dev" ], {
                    shell: true,
                    env: process.env,
                }).on("close", (code) => process.exit(code))
                    .on("error", (spawnError) => console.error(spawnError));

                mainprocess.stdout.on("data", (data) => {
                    console.log("Main:: " + data);
                });
                mainprocess.stderr.on("data", (data) => {
                    console.log("Main Error:: " + data);
                });
            }
        },
    },
};
