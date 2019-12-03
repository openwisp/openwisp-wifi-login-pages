const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HardSourceWebpackPlugin = require("hard-source-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

const CURRENT_WORKING_DIR = process.cwd();

module.exports = (env, argv) => {
  const config = {
    context: path.resolve(CURRENT_WORKING_DIR, "client"),
    entry: {
      main: "./index.js",
    },
    output: {
      filename:
        argv.mode === "development" ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: "[name].chunk.js",
      path: path.resolve(CURRENT_WORKING_DIR, "dist"),
      publicPath: "/",
      pathinfo: false,
    },

    devtool:
      argv.mode === "development" ? "cheap-module-source-map" : "source-map",

    resolve: {
      extensions: ["*", ".js", ".jsx"],
    },

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ["babel-loader"],
        },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader"],
        },
      ],
    },

    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        filename: "index.html",
        template: path.resolve(CURRENT_WORKING_DIR, "public/index.html"),
      }),
      new HardSourceWebpackPlugin(),
      new CopyPlugin([
        {
          from: path.resolve(CURRENT_WORKING_DIR, "client/assets"),
          to: path.resolve(CURRENT_WORKING_DIR, "dist/assets"),
        },
      ]),
    ],

    devServer: {
      stats: {
        colors: true,
      },
      publicPath: "/",
      compress: true,
      overlay: {
        warnings: true,
        errors: true,
      },
      disableHostCheck: true, 
      progress: true,
      stats: "errors-only",
      open: true,
      contentBase: path.join(CURRENT_WORKING_DIR, "public"),
      watchContentBase: true,
      watchOptions: {
        ignored: /node_modules/,
      },
      historyApiFallback: true,
      proxy: {
        "/api": "http://localhost:3030",
      },
      hot: true,
    },
    optimization: {
      runtimeChunk: "single",
      splitChunks: {
        chunks: "all",
        minSize: 30000,
        maxSize: 0,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: "~",
        name: true,
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
        },
      },
    },
    node: {
      fs: "empty",
    },
  };
  return config;
};
