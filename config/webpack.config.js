const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require("brotli-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const fs = require("fs");
const TerserPlugin = require("terser-webpack-plugin");
const setup = require("./setup");
const browserTargets = require("./babel-browsers");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const CURRENT_WORKING_DIR = process.cwd();
const DEFAULT_PORT = 8080;
const DEFAULT_SERVER_URL = "http://localhost:3030";

/**
 * Recursively collect all file paths under a directory.
 */
const getAllFiles = (dirPath, results = []) => {
  if (!fs.existsSync(dirPath)) return results;
  fs.readdirSync(dirPath).forEach((entry) => {
    const fullPath = path.join(dirPath, entry);
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        getAllFiles(fullPath, results);
      } else {
        results.push(fullPath);
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }
  });
  return results;
};

/**
 * Webpack plugin that watches every file inside the `organizations/` directory.
 * When any of those files change, it re-runs setup (copying configs/assets)
 * so the bundle always reflects the latest org configuration without a manual
 * server restart.
 */
class OrganizationsWatchPlugin {
  apply(compiler) {
    const organizationsDir = path.resolve(CURRENT_WORKING_DIR, "organizations");

    // After each compilation, register all org files as dependencies so webpack
    // watches them even though they are outside the normal module graph.
    compiler.hooks.afterCompile.tap(
      "OrganizationsWatchPlugin",
      (compilation) => {
        // Watch the directory itself (catches new files / deleted files)
        compilation.contextDependencies.add(organizationsDir);
        // Watch every individual file (catches content changes)
        getAllFiles(organizationsDir).forEach((filePath) => {
          compilation.fileDependencies.add(filePath);
        });
      },
    );

    // Before each re-compilation triggered by a watch event, re-run setup so
    // that the copied configs/assets are up-to-date before the bundle is built.
    compiler.hooks.watchRun.tapAsync(
      "OrganizationsWatchPlugin",
      (comp, callback) => {
        const changedFiles = comp.modifiedFiles || new Set();
        const removedFiles = comp.removedFiles || new Set();
        const anyOrgFileChanged = [...changedFiles, ...removedFiles].some(
          (f) => {
            const rel = path.relative(organizationsDir, f);
            return rel && !rel.startsWith("..") && !path.isAbsolute(rel);
          },
        );
        if (anyOrgFileChanged) {
          console.log(
            "[OrganizationsWatchPlugin] Change detected in organizations/. Re-running setup…",
          );
          try {
            setup.writeConfigurations();
            console.log("[OrganizationsWatchPlugin] Setup completed.");
            return callback();
          } catch (err) {
            console.error("[OrganizationsWatchPlugin] Setup error:", err);
            return callback(err);
          }
        }
        return callback();
      },
    );
  }
}

let minimizers = [];

module.exports = (env, argv) => {
  // Use user-specified port; if none was given, fall back to the default
  // If the default port is already in use, webpack will automatically use
  // the next available port
  let clientP = process.env.CLIENT;
  let plugins = [
    new CleanWebpackPlugin(),
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
          to: path.resolve(CURRENT_WORKING_DIR, "dist/[name][ext]"),
          context: path.resolve(CURRENT_WORKING_DIR, "organizations/js"),
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

  // In development (watch) mode, automatically re-run setup when any file
  // inside organizations/ changes so developers edit source files, not copies.
  if (argv.mode === "development") {
    plugins.push(new OrganizationsWatchPlugin());
  }

  let cssLoaders = ["style-loader", "css-loader"];

  if (process.env.STATS)
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: "disabled",
        generateStatsFile: true,
      }),
    );

  if (argv.mode === "production") {
    cssLoaders = [MiniCssExtractPlugin.loader, "css-loader"];
    minimizers = [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          ecma: 5,
          compress: {
            ecma: 5,
          },
          format: {
            ecma: 5,
          },
        },
      }),
    ];
    setup.removeDefaultConfig();
    plugins.push(
      new MiniCssExtractPlugin({
        filename: "[name].[contenthash].css",
        ignoreOrder: true,
      }),
    );
    plugins.push(
      new BrotliPlugin({
        asset: "[path].br[query]",
        test: /\.(js|css|html|svg|json)$/,
        minRatio: 0.7,
      }),
    );
  }

  // The url the server is running on; if none was given, fall back to the default
  let serverUrl;
  if (process.env.SERVER != undefined) {
    serverUrl = `http://localhost:${process.env.SERVER}`;
  } else {
    console.warn(
      `No server url specified. Expecting server to run on ${DEFAULT_SERVER_URL}`,
    );
    serverUrl = DEFAULT_SERVER_URL;
  }

  return {
    target: ["web", "es5"],
    cache: {
      type: "filesystem",
    },
    context: path.resolve(CURRENT_WORKING_DIR, "client"),
    entry: {
      main: "./index.js",
    },
    output: {
      filename:
        argv.mode === "development" ? "[name].js" : "[name].[contenthash].js",
      chunkFilename: "[name].[contenthash].chunk.js",
      path: path.resolve(CURRENT_WORKING_DIR, "dist"),
      publicPath: "/",
      pathinfo: false,
      environment: {
        arrowFunction: false,
        const: false,
        destructuring: false,
        forOf: false,
        module: false,
      },
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
          test: /\.m?jsx?$/,
          include: /node_modules/,
          use: [
            {
              loader: "babel-loader",
              options: {
                configFile: false,
                presets: [
                  [
                    "@babel/preset-env",
                    {targets: browserTargets, modules: false},
                  ],
                ],
              },
            },
          ],
        },
        {
          test: /\.css$/,
          use: cssLoaders,
        },
        {
          test: /\.(eot|svg|ttf|woff|woff2)$/,
          type: "asset",
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
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        progress: true,
      },
      open: false,
      historyApiFallback: true,
      proxy: [{context: ["/api"], target: serverUrl}],
      hot: true,
    },
    optimization: {
      runtimeChunk: "single",
      minimizer: minimizers,
      minimize: true,
      splitChunks: {
        chunks: "all",
        minSize: 30000,
        minChunks: 1,
        maxAsyncRequests: 5,
        maxInitialRequests: 3,
        automaticNameDelimiter: "~",
        name: false,
        cacheGroups: {
          defaultVendors: {
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
    resolve: {
      fallback: {
        fs: false,
      },
    },
  };
};
