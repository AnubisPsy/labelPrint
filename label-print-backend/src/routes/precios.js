const express = require("express");
const router = express.Router();
const {
  getPreciosLaCeiba,
  getPreciosTocoa,
  getPreciosRoatan,
} = require("../controllers/preciosController");

router.get("/la-ceiba/:code", getPreciosLaCeiba);
router.get("/tocoa/:code", getPreciosTocoa);
router.get("/roatan/:code", getPreciosRoatan);

module.exports = router;
