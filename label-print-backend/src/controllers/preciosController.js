const { getPoolPrincipal, sql } = require("../config/database");

async function getPreciosLaCeiba(req, res) {
  try {
    const { code } = req.params;
    const pool = await getPoolPrincipal();

    const result = await pool.request().input("code", sql.NVarChar, code)
      .query(`
        SELECT TOP 1 ItemCode, CodeBars, ItemName, Familia, Precio
        FROM dbo.PreciosLCB
        WHERE ItemCode = @code OR CodeBars = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    const row = result.recordset[0];
    res.json({
      code: row.ItemCode,
      barcode: row.CodeBars,
      description: row.ItemName,
      category: row.Familia,
      price: parseFloat(row.Precio),
      currency: "L.",
      unit: "UND",
    });
  } catch (error) {
    console.error("Error getPreciosLaCeiba:", error.message);
    res.status(500).json({ message: "Error al consultar la base de datos" });
  }
}

async function getPreciosTocoa(req, res) {
  try {
    const { code } = req.params;
    const pool = await getPoolPrincipal();

    const result = await pool.request().input("code", sql.NVarChar, code)
      .query(`
        SELECT TOP 1 ItemCode, CodeBars, ItemName, Familia, Precio
        FROM dbo.PreciosToc
        WHERE ItemCode = @code OR CodeBars = @code
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    const row = result.recordset[0];
    res.json({
      code: row.ItemCode,
      barcode: row.CodeBars,
      description: row.ItemName,
      category: row.Familia,
      price: parseFloat(row.Precio),
      currency: "L.",
      unit: "UND",
    });
  } catch (error) {
    console.error("Error getPreciosTocoa:", error.message);
    res.status(500).json({ message: "Error al consultar la base de datos" });
  }
}

async function getPreciosRoatan(req, res) {
  try {
    const { code } = req.params;
    const pool = await getPoolPrincipal();

    const result = await pool.request().input("code", sql.NVarChar, code)
      .query(`
        SELECT TOP 1
          O.ItemCode,
          O.CodeBars,
          O.ItemName,
          T2.ItmsGrpNam AS Familia,
          CASE
            WHEN O.VATLiable = 'Y' THEN ROUND(T1.Price * 1.15, 2)
            WHEN O.VATLiable = 'N' THEN ROUND(T1.Price, 2)
          END AS Precio
        FROM [192.168.3.20\\R1INSULAR].[Retail One].[dbo].[OITM] AS O
        INNER JOIN [192.168.3.20\\R1INSULAR].[Retail One].[dbo].[ITM1] AS T1
          ON O.ItemCode = T1.ItemCode
        INNER JOIN [192.168.3.20\\R1INSULAR].[Retail One].[dbo].[OITB] AS T2
          ON O.ItmsGrpCod = T2.ItmsGrpCod
        WHERE T1.PriceList = 2
          AND O.SellItem = 'Y'
          AND (O.ItemCode = @code OR O.CodeBars = @code)
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Artículo no encontrado" });
    }

    const row = result.recordset[0];
    res.json({
      code: row.ItemCode,
      barcode: row.CodeBars,
      description: row.ItemName,
      category: row.Familia,
      price: parseFloat(row.Precio),
      currency: "L.",
      unit: "UND",
    });
  } catch (error) {
    console.error("Error getPreciosRoatan:", error.message);
    res.status(500).json({ message: "Error al consultar la base de datos" });
  }
}

module.exports = {
  getPreciosLaCeiba,
  getPreciosTocoa,
  getPreciosRoatan,
};
