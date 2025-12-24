const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/webview/index.tsx', // Entry point for the React app
    output: {
        path: path.resolve(__dirname, 'dist-web'),
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.css'],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/webview/index.html', // Use our mocked HTML
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, 'dist-web'),
        },
        compress: true,
        port: 3000,
        hot: true,
        open: false, // Don't auto-open, we'll tell the user. Or maybe we can try to open it?
    },
};
