const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const webpack = require("webpack");
const CompressionPlugin = require("compression-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");
const setup = require("./setup");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const dotenv = require("dotenv");
const CURRENT_WORKING_DIR = process.cwd();
const DEFAULT_PORT = 8080;

const DEFAULT_SERVER_URL = "http://localhost:3030";
let minimizers = [
  new TerserPlugin(), // Minify JavaScript
  new CssMinimizerPlugin(), // Minify CSS
];

const env = dotenv.config({
  path: path.resolve(CURRENT_WORKING_DIR, ".env"),
}).parsed;

const envKeys = Object.keys(env).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = (env, argv) => {
  // Use user-specified port; if none was given, fall back to the default
  // If the default port is already in use, webpack will automatically use
  // the next available port
  let clientP = process.env.CLIENT;

  let allowedHosts = process.env.REACT_APP_ALLOWED_HOSTS.split(" ");

  let plugins = [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin(envKeys),
    new HtmlWebpackPlugin({
      filename: "index.html",
      custom: setup.getExtraJsScripts(),
      template: path.resolve(CURRENT_WORKING_DIR, "public/index.html"),
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(CURRENT_WORKING_DIR, "client/assets"),
          to: path.resolve(CURRENT_WORKING_DIR, "dist/assets"),
        },
        {
          from: path.resolve(CURRENT_WORKING_DIR, "organizations/js/*.js"),
          to: path.resolve(CURRENT_WORKING_DIR, "dist/[name].[ext]"),
          noErrorOnMissing: true,
        },

      ],
    }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      test: /\.(js|css|html|svg|json)$/,
      minRatio: 0.9,
    }),
  ];

  let cssLoaders = ["style-loader", "css-loader"];

  if (process.env.STATS)
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: "disabled",
        generateStatsFile: true,
      }),
    );

  if (argv.mode === "production") {
    cssLoaders = [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"];
    minimizers = [
      new CssMinimizerPlugin(),
      new TerserPlugin(),
    ];
    // setup.removeDefaultConfig();

    plugins.push(
      new MiniCssExtractPlugin({
        filename: "[name].[contentHash].css",
        ignoreOrder: true,
      }),
    );
    plugins.push(
      new CompressionPlugin({
        filename: "[path].br[query]",
        test: /\.(js|css|html|svg|json)$/,
        minRatio: 0.7,
      }),
    );
  }

  // The url the server is running on; if none was given, fall back to the default
  let serverUrl;
  if (process.env.SERVER !== undefined) {
    serverUrl = `http://localhost:${process.env.SERVER}`;
  } else {
    console.warn(
      `No server url specified. Expecting server to run on ${DEFAULT_SERVER_URL}`,
    );
    serverUrl = DEFAULT_SERVER_URL;
  }

  return {
    context: path.resolve(CURRENT_WORKING_DIR, "client"),
    entry: {
      main: "./index.js",
    },
    output: {
      filename:
        argv.mode === "development" ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: "[name].[contenthash].chunk.js",
      path: path.resolve(CURRENT_WORKING_DIR, "dist"),
      sourceMapFilename: "[file].map",
      publicPath: "/",
      // clean: true,
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
          use: cssLoaders,
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          use: ["file-loader"],
        },
        {
          test: /\.(svg|png|jpg|jpeg|gif|webp)$/,
          type: "asset/resource",
        },
        {
          test: /\.json$/,
          type: "json",
        },


      ],
    },
    plugins: plugins,
    devServer: {
      port: clientP,
      static: {
        publicPath: "/",
        directory: path.join(CURRENT_WORKING_DIR, "public"),
        watch: true,
      },
      compress: true,
      allowedHosts: allowedHosts,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      open: false,
      historyApiFallback: true,
      proxy: {
        "/api": serverUrl,
      },
      hot: true,
    },
    optimization: {
      runtimeChunk: "single",
      minimizer: minimizers,
      minimize: true,
      usedExports: true,
      splitChunks: {
        chunks: "all",
        minSize: 30000,
        maxSize: 40000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: "~",
        name: false,
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
    // node: {
    //   fs: "empty",
    // },
  };
};
