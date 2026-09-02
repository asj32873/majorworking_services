const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    addressId: { type: mongoose.Schema.Types.ObjectId, required: true },
    status: {
      type: String,
      enum: [
        "PLACED",
        "CONFIRMED",
        "PACKED",
        "DISPATCHED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      default: "PLACED",
      index: true,
    },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PAID",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["STRIPE_TEST"],
      default: "STRIPE_TEST",
    },
    stripeSessionId: { type: String, unique: true, sparse: true, index: true },
    stripePaymentIntentId: { type: String, default: null },
    orderedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
module.exports = mongoose.model("Order", schema);
