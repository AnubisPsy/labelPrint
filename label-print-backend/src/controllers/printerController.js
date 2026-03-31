const net = require("net");
const { getDefaultPrinter, setDefaultPrinter } = require("../config/printers");

const PRINTER_PORT = 9100;
const SCAN_TIMEOUT = 1000;

function checkPrinter(ip) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(SCAN_TIMEOUT);
    socket.on("connect", () => {
      socket.destroy();
      resolve({ ip, port: PRINTER_PORT, online: true });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve(null);
    });
    socket.on("error", () => {
      socket.destroy();
      resolve(null);
    });
    socket.connect(PRINTER_PORT, ip);
  });
}

function getNetworkRange() {
  const os = require("os");
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        const parts = iface.address.split(".");
        return `${parts[0]}.${parts[1]}.${parts[2]}`;
      }
    }
  }
  return "192.168.0";
}

function formatPrice(amount) {
  const num = parseFloat(amount);
  const parts = num.toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `L.${parts[0]}.${parts[1]}`;
}

function centerX(text, charWidth, areaWidth = 386) {
  const textWidth = text.length * charWidth;
  return Math.max(0, Math.floor((areaWidth - textWidth) / 2));
}

function barcodeWidth(text, module = 3) {
  return (11 * text.length + 35) * module;
}

function barcodeCenterX(text, module = 3, areaWidth = 386) {
  const width = barcodeWidth(text, module);
  return Math.max(0, Math.floor((areaWidth - width) / 2));
}

async function scanPrinters(req, res) {
  try {
    const base = getNetworkRange();
    const promises = [];
    for (let i = 1; i <= 254; i++) promises.push(checkPrinter(`${base}.${i}`));
    const results = await Promise.all(promises);
    const printers = results.filter(Boolean).map((p, index) => ({
      id: `printer-${index + 1}`,
      name: `TSC TE210 (${p.ip})`,
      ip: p.ip,
      port: p.port,
      isOnline: true,
    }));
    const defaultPrinter = getDefaultPrinter();
    res.json({ printers, defaultPrinter });
  } catch (error) {
    console.error("Error escaneando impresoras:", error.message);
    res.status(500).json({ message: "Error al escanear la red" });
  }
}

async function saveDefaultPrinter(req, res) {
  try {
    const { printer } = req.body;
    if (!printer || !printer.ip)
      return res.status(400).json({ message: "Datos de impresora inválidos" });
    setDefaultPrinter(printer);
    res.json({ message: "Impresora predeterminada guardada", printer });
  } catch (error) {
    console.error("Error guardando impresora:", error.message);
    res.status(500).json({ message: "Error al guardar la impresora" });
  }
}

async function getDefault(req, res) {
  try {
    const printer = getDefaultPrinter();
    res.json({ printer });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la impresora" });
  }
}

function sendToPrinter(ip, port, data) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    socket.setTimeout(5000);
    socket.on("connect", () => {
      socket.write(data, () => {
        socket.end();
        resolve();
      });
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Timeout al conectar con la impresora"));
    });
    socket.on("error", (err) => {
      reject(new Error(`Error de conexión: ${err.message}`));
    });
    socket.connect(port, ip);
  });
}

// ─── CALIBRACIÓN ────────────────────────────────────────────────────────────
// Imprime 3 precios de distinto largo para medir el ancho real de CAL_LG.
// Activá esto temporalmente cambiando CALIBRATE a true, imprimí, medí con
// regla cuántos mm ocupa cada precio, y mandame los valores.
// Luego lo desactivamos y usamos los dots reales.
const CALIBRATE = false;

function generateCalibration() {
  return [
    `SIZE 50.8 mm, 25.4 mm`,
    `GAP 2 mm, 0 mm`,
    `DIRECTION 0`,
    `REFERENCE 10,0`,
    `CLS`,
    // Línea de referencia: ancho total del área (386 dots = 48.2mm)
    `BAR 0,0,386,2`,
    // Precio corto (7 chars)
    `TEXT 0,5,"CAL_LG",0,1,1,"L.99.99"`,
    // Precio mediano (9 chars)
    `TEXT 0,35,"CAL_LG",0,1,1,"L.9,999.99"`,
    // Precio largo (11 chars)
    `TEXT 0,65,"CAL_LG",0,1,1,"L.99,999.99"`,
    `PRINT 1,1`,
    ``,
  ].join("\r\n");
}
// ────────────────────────────────────────────────────────────────────────────

function generateTSPL(article, copies) {
  if (CALIBRATE) return generateCalibration();

  // Ancho real por carácter de CAL_LG — ajustar después de calibrar
  // Valor actual: 22 dots (estimado conservador, funciona mejor que 35)
  const CAL_LG_CHAR_WIDTH = 28;

  const barcodeValue = article.barcode || article.code;
  const price = formatPrice(article.price);
  const barcodeX = barcodeCenterX(barcodeValue, 3);

  const desc =
    article.description.length > 26
      ? article.description.substring(0, 26)
      : article.description;

  return [
    `SIZE 50.8 mm, 25.4 mm`,
    `GAP 2 mm, 0 mm`,
    `DIRECTION 0`,
    `REFERENCE 10,0`,
    `CLS`,

    `BARCODE ${barcodeX},0,"128",50,0,0,3,3,"${barcodeValue}"`,

    `TEXT ${centerX(barcodeValue, 12)},52,"CAL_SM",0,1,1,"${barcodeValue}"`,

    // Imprime el texto dos veces desplazado 1 dot para simular negrita más gruesa
    `TEXT ${centerX(price, CAL_LG_CHAR_WIDTH)},66,"CAL_LG",0,1,1,"${price}"`,
    `TEXT ${centerX(price, CAL_LG_CHAR_WIDTH) + 1},66,"CAL_LG",0,1,1,"${price}"`,
    `TEXT ${centerX(price, CAL_LG_CHAR_WIDTH) + 2},66,"CAL_LG",0,1,1,"${price}"`,

    `TEXT 0,132,"CAL_SM",0,1,1,"${article.code}"`,

    `TEXT 0,155,"CAL_SM",0,1,1,"${desc}"`,

    `PRINT ${copies},1`,
    ``,
  ].join("\r\n");
}

async function printLabel(req, res) {
  try {
    const { article, printer, copies = 1 } = req.body;
    if (!article || !printer || !printer.ip) {
      return res
        .status(400)
        .json({ message: "Datos incompletos para imprimir" });
    }
    const tspl = generateTSPL(article, copies);
    await sendToPrinter(printer.ip, printer.port || PRINTER_PORT, tspl);
    res.json({ message: `${copies} etiqueta(s) enviadas a ${printer.ip}` });
  } catch (error) {
    console.error("Error imprimiendo:", error.message);
    res.status(500).json({ message: error.message });
  }
}

module.exports = { scanPrinters, saveDefaultPrinter, getDefault, printLabel };
