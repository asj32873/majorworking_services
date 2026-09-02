const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    orderItemId: { type: mongoose.Schema.Types.ObjectId },
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
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
    timestamp: { type: Date, default: Date.now },
    remarks: String,
  },
  { timestamps: false },
);
schema.index({ orderItemId: 1, timestamp: 1 });
module.exports = mongoose.model("OrderStatusHistory", schema);
