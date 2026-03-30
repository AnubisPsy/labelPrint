const fs = require("fs");
const path = require("path");

const CONFIG_FILE = path.join(__dirname, "../../printer-config.json");

function getConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch {
    // si el archivo está corrupto, retorna vacío
  }
  return { defaultPrinter: null };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getDefaultPrinter() {
  return getConfig().defaultPrinter;
}

function setDefaultPrinter(printer) {
  const config = getConfig();
  config.defaultPrinter = printer;
  saveConfig(config);
}

module.exports = {
  getDefaultPrinter,
  setDefaultPrinter,
};
