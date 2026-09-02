const router = require("express").Router();
const c = require("../controllers/product.controller");
const qa = require("../controllers/qa.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const internal = require("../middleware/internal");
const { productSchema } = require("../validators/product");
router.get("/api/products", c.list);
router.get("/api/products/:id", c.getById);
router.post("/api/products/:id/qa", qa.ask);
router.post(
  "/api/products",
  authenticate,
  authorize("VENDOR"),
  validate(productSchema),
  c.create,
);
router.put(
  "/api/products/:id",
  authenticate,
  authorize("VENDOR"),
  validate(productSchema.partial()),
  c.update,
);
router.delete("/api/products/:id", authenticate, authorize("VENDOR"), c.remove);
router.patch(
  "/api/products/:id/stock",
  authenticate,
  authorize("VENDOR"),
  c.updateStock,
);
router.get("/internal/products/:id", internal, c.internalGet);
router.post("/internal/products/reserve", internal, c.internalReserve);
router.post("/internal/products/release", internal, c.internalRelease);
router.patch("/internal/products/:id/rating", internal, c.internalRating);
module.exports = router;
