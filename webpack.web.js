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
        open: false,
        proxy: [
            {
                context: ['/proxy/groq'],
                target: 'https://api.groq.com',
                pathRewrite: { '^/proxy/groq': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/openai'],
                target: 'https://api.openai.com',
                pathRewrite: { '^/proxy/openai': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/google'],
                target: 'https://generativelanguage.googleapis.com',
                pathRewrite: { '^/proxy/google': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/cerebras'],
                target: 'https://api.cerebras.ai',
                pathRewrite: { '^/proxy/cerebras': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/sambanova'],
                target: 'https://api.sambanova.ai',
                pathRewrite: { '^/proxy/sambanova': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/anthropic'],
                target: 'https://api.anthropic.com',
                pathRewrite: { '^/proxy/anthropic': '' },
                secure: false
            },
            {
                context: ['/proxy/xai'],
                target: 'https://api.x.ai',
                pathRewrite: { '^/proxy/xai': '' },
                secure: false
            },
            {
                context: ['/proxy/novita'],
                target: 'https://api.novita.ai',
                pathRewrite: { '^/proxy/novita': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/bytez'],
                target: 'https://api.bytez.com',
                pathRewrite: { '^/proxy/bytez': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/aimlapi'],
                target: 'https://api.aimlapi.com',
                pathRewrite: { '^/proxy/aimlapi': '' },
                changeOrigin: true,
                secure: false
            },
            {
                context: ['/proxy/openrouter'],
                target: 'https://openrouter.ai',
                pathRewrite: { '^/proxy/openrouter': '' },
                changeOrigin: true,
                secure: false
            }
        ]
    },
};
