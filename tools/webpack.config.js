'use strict';

require('dotenv').config();

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const AssetsPlugin = require('assets-webpack-plugin');
const pkg = require('../package.json');

// Development
const __DEV__ = !process.argv.includes('--env.production');

// Files extensions
const reTypeScript = /\.(ts|tsx)$/;
const reScript = /\.(js|jsx|mjs)$/;
const reStyle = /\.(css|less|styl|scss|sass|sss)$/;
const reImage = /\.(bmp|gif|jpg|jpeg|png|svg)$/;
const reFont = /\.(eot|otf|ttf|woff|woff2)$/;
const staticAssetName = '[name].[ext]';

const config = {
  context: path.resolve(__dirname, '../src/client'),

  name: 'client',

  target: 'web',

  mode: __DEV__ ? 'development' : 'production',

  entry: {
    client: ['babel-polyfill', './app.tsx']
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js'],

    modules: ['node_modules', './src/client']
  },

  output: {
    path: path.resolve(__dirname, '../build/static'),
    publicPath: '/static/',
    filename: __DEV__ ? 'js/[name].js' : 'js/[name].[hash:8].js',
    chunkFilename: __DEV__ ? 'js/[name].js' : 'js/[name].[hash:8].js'
  },

  optimization: {
    minimize: !__DEV__,

    splitChunks: {
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          chunks: 'all'
        }
      }
    }
  },

  plugins: [
    // Extract all CSS files and compile it on a single file
    new MiniCssExtractPlugin({
      filename: __DEV__ ? '[name].css' : '[name].[contenthash:base64:8].css',
      publicPath: '/static/css',
      allChunks: true
    }),

    // Define free variables
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': __DEV__ ? '"development"' : '"production"',
      'process.env.BROWSER': true
    }),

    // Emit a file with assets paths
    new AssetsPlugin({
      path: path.resolve(__dirname, '../build'),
      filename: 'assets.json',
      prettyPrint: true
    }),

    ...(__DEV__
      ? [
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin()
      ]
      : [
        // Decrease script evaluation time
        new webpack.optimize.ModuleConcatenationPlugin(),
      ])
  ],
  module: {
    // Make missing exports an error instead of warning
    strictExportPresence: true,
    rules: [
      // Rules for TyprScript
      {
        test: reTypeScript,
        exclude: '/node_modules',
        use: 'ts-loader'
      },

      // Rules for JS / JSX
      {
        test: reScript,
        include: [
          path.resolve(__dirname, '../src/client'),
          path.resolve(__dirname, '../tools')
        ],
        loader: 'babel-loader',
        options: {
          cacheDirectory: __DEV__,
          babelrc: false,
          presets: [
            [
              'env',
              {
                targets: {
                  browsers: pkg.browserslist,
                  forceAllTransforms: !__DEV__
                },
                modules: false,
                useBuiltIns: false,
                debug: false
              }
            ],
            'stage-0',
            'flow',
            'react'
          ],
          plugins: [
            'transform-decorators-legacy',
            ...(__DEV__ ? ['transform-react-jsx-source'] : []),
            ...(__DEV__ ? ['transform-react-jsx-self'] : [])
          ]
        }
      },
      // Rules for Style Sheets
      {
        test: /\.css/,
        rules: [
          // Process internal/project styles (from client folder)
          {
            include: [path.resolve(__dirname, '../src/client')],
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 1,
                  sourceMap: __DEV__,
                  camelCase: 'dashes',
                  modules: true,
                  localIdentName: __DEV__
                    ? '[name]-[local]-[hash:base64:5]'
                    : '[hash:base64:5]',
                  minimize: !__DEV__,
                  discardComments: { removeAll: true }
                }
              },
              // Apply PostCSS plugins including autoprefixer
              {
                loader: 'postcss-loader',
                options: {
                  config: {
                    path: './tools/postcss/postcss.config.js'
                  }
                }
              }
            ]
          }
        ]
      },
      // Rules for images
      {
        test: reImage,
        oneOf: [
          // Or return public URL to image resource
          {
            loader: 'file-loader',
            options: {
              outputPath: 'images/',
              name: staticAssetName
            }
          }
        ]
      },
      // Rules for fonts
      {
        test: reFont,
        loader: 'file-loader',
        options: {
          outputPath: 'fonts/',
          name: staticAssetName
        }
      },
      // Convert plain text into JS module
      {
        test: /\.txt$/,
        loader: 'raw-loader'
      },
      // Return public URL for all assets unless explicitly excluded
      // DO NOT FORGET to update `exclude` list when you adding a new loader
      {
        exclude: [reScript, reStyle, reImage, reFont, /\.json$/, /\.txt$/, /\.md$/],
        loader: 'file-loader',
        options: {
          name: staticAssetName
        }
      }

    ]
  },

  // Don't attempt to continue if there are any errors.
  bail: !__DEV__,
  cache: __DEV__,

  // Choose a developer tool to enhance debugging
  devtool: __DEV__ ? 'cheap-module-inline-source-map' : 'source-map',

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },

  // Specify what bundle information gets displayed
  stats: {
    cached: false,
    cachedAssets: false,
    chunks: false,
    chunkModules: false,
    colors: true,
    hash: false,
    modules: false,
    reasons: __DEV__,
    timings: true,
    version: false
  }
};

module.exports = config;
