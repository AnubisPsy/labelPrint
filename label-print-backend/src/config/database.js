const sql = require("mssql");
require("dotenv").config();

const configPrincipal = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const configRoatan = {
  user: process.env.DB_ROA_USER,
  password: process.env.DB_ROA_PASSWORD,
  server: `${process.env.DB_ROA_HOST}\\${process.env.DB_ROA_INSTANCE}`,
  database: process.env.DB_ROA_DATABASE,
  port: parseInt(process.env.DB_ROA_PORT),
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true,
    instanceName: process.env.DB_ROA_INSTANCE,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPrincipal;
let poolRoatan;

async function connectPrincipal() {
  try {
    if (!poolPrincipal) {
      poolPrincipal = await sql.connect(configPrincipal);
      console.log("Conectado a SBOMADEYSO");
    }
    return poolPrincipal;
  } catch (error) {
    console.error("Error conectando a base de datos principal:", error.message);
    throw error;
  }
}

async function connectRoatan() {
  try {
    if (!poolRoatan) {
      poolRoatan = await new sql.ConnectionPool(configRoatan).connect();
      console.log("Conectado a Retail One");
    }
    return poolRoatan;
  } catch (error) {
    console.error("Error conectando a base de datos Roatán:", error.message);
    throw error;
  }
}

async function getPoolPrincipal() {
  if (!poolPrincipal) await connectPrincipal();
  return poolPrincipal;
}

async function getPoolRoatan() {
  if (!poolRoatan) await connectRoatan();
  return poolRoatan;
}

async function closeAllConnections() {
  try {
    if (poolPrincipal) {
      await poolPrincipal.close();
      poolPrincipal = null;
      console.log("Conexión principal cerrada");
    }
    if (poolRoatan) {
      await poolRoatan.close();
      poolRoatan = null;
      console.log("Conexión Roatán cerrada");
    }
  } catch (error) {
    console.error("Error cerrando conexiones:", error.message);
  }
}

module.exports = {
  connectPrincipal,
  connectRoatan,
  getPoolPrincipal,
  getPoolRoatan,
  closeAllConnections,
  sql,
};
