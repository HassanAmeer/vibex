const path = require('path');

//@ts-check
/** @typedef {import('webpack').Configuration} Configuration */

/** @type {Configuration} */
const extensionConfig = {
    name: 'extension',
    target: 'node',
    mode: 'none',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs',
        devtoolModuleFilenameTemplate: '../[resource-path]'
    },
    externals: {
        'vscode': 'commonjs vscode',
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            }
        ]
    },
    devtool: 'nosources-source-map',
    infrastructureLogging: {
        level: "log",
    },
};

/** @type {Configuration} */
const webviewConfig = {
    name: 'webview',
    target: 'web',
    mode: 'none',
    entry: './src/webview/index.tsx',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'webview.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    devtool: 'nosources-source-map',
};

module.exports = [extensionConfig, webviewConfig];
