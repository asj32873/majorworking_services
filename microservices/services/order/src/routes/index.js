const router = require("express").Router();
const c = require("../controllers/order.controller");
const validate = require("../middleware/validate");
const { authenticate, authorize } = require("../middleware/auth");
const internal = require("../middleware/internal");
const { createOrderSchema, statusSchema } = require("../validators/order");
router.post(
  "/api/orders",
  authenticate,
  authorize("USER"),
  validate(createOrderSchema),
  c.createOrder,
);
router.get("/api/orders", authenticate, authorize("USER"), c.listMyOrders);
router.get(
  "/api/orders/vendor/list",
  authenticate,
  authorize("VENDOR"),
  c.vendorList,
);
router.patch(
  "/api/orders/vendor/:orderId/items/:itemId/status",
  authenticate,
  authorize("VENDOR"),
  validate(statusSchema),
  c.vendorUpdateStatus,
);
router.get(
  "/api/orders/admin/list",
  authenticate,
  authorize("ADMIN"),
  c.adminList,
);
router.patch(
  "/api/orders/admin/:orderId/items/:itemId/status",
  authenticate,
  authorize("ADMIN"),
  validate(statusSchema),
  c.adminUpdateStatus,
);
router.get(
  "/api/orders/:id",
  authenticate,
  authorize("USER", "VENDOR", "ADMIN"),
  c.getById,
);
router.get(
  "/api/orders/:id/tracking",
  authenticate,
  authorize("USER", "VENDOR", "ADMIN"),
  c.tracking,
);
router.post("/internal/orders/paid", internal, c.internalCreatePaid);
router.get(
  "/internal/orders/review-eligibility/:userId/:productId",
  internal,
  c.internalReviewEligibility,
);
router.get(
  "/internal/orders/vendor/:vendorId/order-ids",
  internal,
  c.internalVendorOrders,
);
router.get(
  "/internal/orders/vendor/:vendorId/items",
  internal,
  c.internalVendorItems,
);
module.exports = router;
