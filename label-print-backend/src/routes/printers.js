const express = require("express");
const router = express.Router();
const {
  scanPrinters,
  saveDefaultPrinter,
  getDefault,
  printLabel,
} = require("../controllers/printerController");

router.get("/scan", scanPrinters);
router.get("/default", getDefault);
router.post("/default", saveDefaultPrinter);
router.post("/print", printLabel);

module.exports = router;
