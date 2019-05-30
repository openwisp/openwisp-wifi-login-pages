const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const HardSourceWebpackPlugin = require('hard-source-webpack-plugin')

const CURRENT_WORKING_DIR = process.cwd()

module.exports = (env, argv) => {
    const config = {
        context: path.resolve(CURRENT_WORKING_DIR, 'client'),
        entry: {
            main: './index.js'
        },
        output: {
            filename: '[name].bundle.js',
            chunkFilename: '[name].chunk.js',
            path: path.resolve(CURRENT_WORKING_DIR, 'dist'),
            publicPath: '/',
            pathinfo: false
        },

        devtool:
            argv.mode === 'development' ? 'cheap-module-source-map' : 'source-map',

        resolve: {
            extensions: ['*', '.js', '.jsx']
        },

        module: {
            rules: [
                {
                    test: /\.(js|jsx)$/,
                    exclude: /node_modules/,
                    use: ['babel-loader']
                },
                {
                    test: /\.css$/,
                    use: ['style-loader', 'css-loader']
                }
            ]
        },

        plugins: [
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: path.resolve(CURRENT_WORKING_DIR, 'public/index.html')
            })
        ],

        devServer: {
            stats: {
                colors: true
            },
            publicPath: '/',
            compress: true,
            overlay: {
                warnings: true,
                errors: true
            },
            progress: true,
            stats: 'errors-only',
            open: true,
            contentBase: path.join(CURRENT_WORKING_DIR, 'public'),
            watchContentBase: true,
            watchOptions: {
                ignored: /node_modules/
            },
            historyApiFallback: true
        },
    }
    return config
}