const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 2000,
    },
  },
  { timestamps: true },
);
schema.index({ productId: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("Review", schema);
