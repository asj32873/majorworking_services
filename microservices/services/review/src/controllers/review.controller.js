const mongoose = require("mongoose");
const Review = require("../models/Review");
const { getJson, patchJson, postJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";
const ORDER = () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";
const RAG = () => process.env.RAG_SERVICE_URL || "http://localhost:5010";
async function listForProduct(req, res) {
  const reviews = await Review.find({ productId: req.params.productId })
    .sort({ createdAt: -1 })
    .lean();
  ok(res, reviews);
}
async function recalc(productId) {
  const stats = await Review.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);
  const rating = stats.length ? Number(stats[0].averageRating.toFixed(2)) : 0;
  const count = stats.length ? stats[0].reviewCount : 0;
  const r = await patchJson(
    PRODUCT(),
    `/internal/products/${productId}/rating`,
    { rating, reviewCount: count },
  );
  if (!r.ok) throw new Error("Unable to update product rating");
}
async function notifyRag(productId) {
  try {
    await postJson(RAG(), `/internal/products/${productId}/ingest`, {});
  } catch (e) {
    console.error("RAG reindex failed:", e.message);
  }
}
async function create(req, res) {
  const userId = req.auth?.id || req.user?.id || req.user?._id?.toString();

  if (!userId) {
    return fail(res, "Authenticated user ID not found.", 401);
  }

  const product = await getJson(
    PRODUCT(),
    `/internal/products/${req.params.productId}`,
  );

  if (!product.ok) {
    return fail(res, "Product not found.", 404);
  }

  const numeric = Number(req.body.rating);

  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    return fail(res, "Rating must be an integer between 1 and 5.", 400);
  }

  if (!req.body.review || req.body.review.trim().length < 2) {
    return fail(res, "Review must contain at least 2 characters.", 400);
  }

  const elig = await getJson(
    ORDER(),
    `/internal/orders/review-eligibility/${userId}/${req.params.productId}`,
  );

  console.log("REVIEW ELIGIBILITY:", {
    userId,
    productId: req.params.productId,
    status: elig.status,
    response: elig.data,
  });

  if (!elig.ok || !elig.data?.data?.eligible) {
    return fail(
      res,
      "You can review this product only after purchasing it and receiving a delivered order.",
      403,
    );
  }

  const alreadyExists = await Review.exists({
    productId: req.params.productId,
    userId,
  });

  if (alreadyExists) {
    return fail(res, "You have already reviewed this product.", 409);
  }

  const created = await Review.create({
    productId: req.params.productId,
    userId,
    rating: numeric,
    review: req.body.review.trim(),
  });

  await recalc(created.productId);
  notifyRag(created.productId);

  ok(res, created, "Review submitted successfully.", 201);
}

// async function update(req, res) {
//   const r = await Review.findOne({ _id: req.params.id, userId: req.user.id });
//   if (!r) return fail(res, "Review not found.", 404);
//   r.rating = Number(req.body.rating);
//   r.review = req.body.review.trim();
//   if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5)
//     return fail(res, "Rating must be an integer between 1 and 5.", 400);
//   await r.save();
//   await recalc(r.productId);
//   notifyRag(r.productId);
//   ok(res, r, "Review updated successfully.");
// }


async function update(req, res) {
  const userId =
    req.auth?.id ||
    req.user?.id ||
    req.user?._id?.toString();

  if (!userId) {
    return fail(res, "Authenticated user ID not found.", 401);
  }

  const r = await Review.findOne({
    _id: req.params.id,
    userId,
  });

  if (!r) return fail(res, "Review not found.", 404);

  r.rating = Number(req.body.rating);
  r.review = req.body.review.trim();

  if (!Number.isInteger(r.rating) || r.rating < 1 || r.rating > 5) {
    return fail(res, "Rating must be an integer between 1 and 5.", 400);
  }

  await r.save();

  await recalc(r.productId);
  notifyRag(r.productId);

  ok(res, r, "Review updated successfully.");
}

// async function remove(req, res) {
//   const filter =
//     req.user.role === "ADMIN"
//       ? { _id: req.params.id }
//       : { _id: req.params.id, userId: req.user.id };
//   const r = await Review.findOneAndDelete(filter);
//   if (!r) return fail(res, "Review not found.", 404);
//   await recalc(r.productId);
//   notifyRag(r.productId);
//   ok(res, null, "Review deleted successfully.");
// }


async function remove(req, res) {
  const userId =
    req.auth?.id ||
    req.user?.id ||
    req.user?._id?.toString();

  if (!userId) {
    return fail(res, "Authenticated user ID not found.", 401);
  }

  const filter =
    req.user.role === "ADMIN"
      ? { _id: req.params.id }
      : { _id: req.params.id, userId };

  const r = await Review.findOneAndDelete(filter);

  if (!r) return fail(res, "Review not found.", 404);

  await recalc(r.productId);
  notifyRag(r.productId);

  ok(res, null, "Review deleted successfully.");
}


module.exports = { listForProduct, create, update, remove };
