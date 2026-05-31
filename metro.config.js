const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const config = getDefaultConfig(__dirname);

const excludedFolders = [".npm-cache", ".local-home", ".expo"].map((folder) =>
  path.resolve(__dirname, folder).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
);

config.resolver.blockList = excludedFolders.map((folder) => new RegExp(`${folder}/.*`));

module.exports = config;
