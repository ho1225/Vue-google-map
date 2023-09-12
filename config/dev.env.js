'use strict'
const merge = require('webpack-merge')
const prodEnv = require('./prod.env')
const webpack = require('webpack')

module.exports = {
    plugins: 
      new webpack.DefinePlugin({
        GOOGLE_API_KEY: '""', //add your google api key here

      })
}
