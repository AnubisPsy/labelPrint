const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectPrincipal, closeAllConnections } = require("./config/database");
const preciosRoutes = require("./routes/precios");
const printersRoutes = require("./routes/printers");

const app = express();
const PORT = process.env.PORT || 5454;
const HOST = process.env.HOST || "0.0.0.0";

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

app.use("/api/precios", preciosRoutes);
app.use("/api/printers", printersRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "label-print-backend funcionando" });
});

app.use((err, req, res, next) => {
  console.error("Error no manejado:", err);
  res.status(500).json({ message: "Error interno del servidor" });
});

async function startServer() {
  try {
    await connectPrincipal();
    app.listen(PORT, HOST, () => {
      console.log(`Servidor corriendo en http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}

process.on("SIGINT", async () => {
  await closeAllConnections();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await closeAllConnections();
  process.exit(0);
});

startServer();
