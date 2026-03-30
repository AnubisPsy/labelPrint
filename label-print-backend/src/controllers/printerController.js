const net = require("net");
const { getDefaultPrinter, setDefaultPrinter } = require("../config/printers");

const PRINTER_PORT = 9100;
const SCAN_TIMEOUT = 1000;

// Verifica si una IP tiene el puerto 9100 abierto
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

// Obtiene el rango de IPs de la red local
function getNetworkRange() {
  const os = require("os");
  const interfaces = os.networkInterfaces();

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        const parts = iface.address.split(".");
        const base = `${parts[0]}.${parts[1]}.${parts[2]}`;
        return base;
      }
    }
  }
  return "192.168.0";
}

// Escanea la red buscando impresoras
async function scanPrinters(req, res) {
  try {
    const base = getNetworkRange();
    const promises = [];

    for (let i = 1; i <= 254; i++) {
      promises.push(checkPrinter(`${base}.${i}`));
    }

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

// Guarda la impresora predeterminada
async function saveDefaultPrinter(req, res) {
  try {
    const { printer } = req.body;
    if (!printer || !printer.ip) {
      return res.status(400).json({ message: "Datos de impresora inválidos" });
    }
    setDefaultPrinter(printer);
    res.json({ message: "Impresora predeterminada guardada", printer });
  } catch (error) {
    console.error("Error guardando impresora:", error.message);
    res.status(500).json({ message: "Error al guardar la impresora" });
  }
}

// Obtiene la impresora predeterminada
async function getDefault(req, res) {
  try {
    const printer = getDefaultPrinter();
    res.json({ printer });
  } catch (error) {
    res.status(500).json({ message: "Error al obtener la impresora" });
  }
}

// Envía el comando TSPL a la impresora
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

// Genera el comando TSPL para la etiqueta
function generateTSPL(article, copies) {
  const width = 50; // 2 pulgadas en mm
  const height = 25; // 1 pulgada en mm
  const gap = 2;

  const barcodeValue = article.barcode || article.code;
  const price = `L.${parseFloat(article.price).toFixed(2)}`;

  // Truncar descripción a 24 caracteres para que entre en la etiqueta
  const desc =
    article.description.length > 24
      ? article.description.substring(0, 24)
      : article.description;

  return [
    `SIZE ${width} mm, ${height} mm`,
    `GAP ${gap} mm, 0 mm`,
    `DIRECTION 0`,
    `REFERENCE 0,0`,
    `CLS`,
    // Código de barras arriba, ancho completo
    `BARCODE 10,0,"128",35,1,0,2,2,"${barcodeValue}"`,
    // Precio grande
    `TEXT 10,38,"4",0,1,1,"${price}"`,
    // Código del artículo pequeño
    `TEXT 10,78,"2",0,1,1,"${article.code}"`,
    // Descripción
    `TEXT 10,93,"2",0,1,1,"${desc}"`,
    `PRINT ${copies},1`,
    ``,
  ].join("\r\n");
}

// Imprime la etiqueta
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

module.exports = {
  scanPrinters,
  saveDefaultPrinter,
  getDefault,
  printLabel,
};
