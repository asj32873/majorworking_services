const router = require("express").Router();
const c = require("../controllers/rag.controller");
const internal = require("../middleware/internal");
router.post("/internal/products/:id/qa", internal, c.qa);
router.post("/internal/products/:id/ingest", internal, c.ingest);
module.exports = router;
