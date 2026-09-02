const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, required: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      enum: [
        "ELECTRONICS",
        "MOBILE",
        "LAPTOP",
        "AUDIO",
        "TV",
        "HOME_APPLIANCES",
        "ACCESSORIES",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    imageUrl: String,
    rating: { type: Number, min: 0, max: 5, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);
schema.index({ name: "text", brand: "text", description: "text" });
schema.index({ category: 1, price: 1, rating: -1 });
module.exports = mongoose.model("Product", schema);
