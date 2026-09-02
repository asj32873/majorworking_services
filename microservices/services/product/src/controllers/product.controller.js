const Product = require('../models/Product');
const { ok, fail } = require('../utils/apiResponse');
const {
  pagination,
  buildProductFilter,
  productSort,
} = require('../services/query.service');

const {
  getVendorByUserId,
  getAllVendors,
} = require('../services/vendor.service');


async function list(req, res) {
  const { page, limit, skip } = pagination(req);
  const filter = buildProductFilter(req.query);

  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort(productSort(req.query.sort))
      .skip(skip)
      .limit(limit)
      .lean(),

    Product.countDocuments(filter),
  ]);

  /*
   * Product.vendorId contains the authenticated user's ID.
   *
   * Vendor.userId contains the same ID.
   *
   * Fetch all vendors once instead of making one HTTP
   * request for every product.
   */
  const vendors = await getAllVendors();

  const vendorMap = new Map(
    vendors.map((vendor) => [
      String(vendor.userId),
      vendor,
    ]),
  );

  const productsWithVendor = items.map((product) => ({
    ...product,
    vendor:
      vendorMap.get(String(product.vendorId)) || null,
  }));

  return ok(res, {
    items: productsWithVendor,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}


async function getById(req, res) {
  const product = await Product
    .findById(req.params.id)
    .lean();

  if (!product) {
    return fail(
      res,
      'Product not found.',
      404,
    );
  }

  /*
   * For a single product, directly resolve its vendor
   * through the Vendor Service using the Product.vendorId,
   * which is the user's ID.
   */
  const vendor = await getVendorByUserId(
    product.vendorId,
  );

  return ok(res, {
    ...product,
    vendor,
  });
}


async function create(req, res) {
  const product = await Product.create({
    ...req.body,
    vendorId: req.user._id,
  });

  return ok(
    res,
    product,
    'Product created.',
    201,
  );
}


async function update(req, res) {
  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      vendorId: req.user._id,
    },
    req.body,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return fail(
      res,
      'Product not found or not owned by you.',
      404,
    );
  }

  return ok(
    res,
    product,
    'Product updated.',
  );
}


async function remove(req, res) {
  const product = await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user._id,
  });

  if (!product) {
    return fail(
      res,
      'Product not found or not owned by you.',
      404,
    );
  }

  return ok(
    res,
    null,
    'Product deleted.',
  );
}


async function updateStock(req, res) {
  const stock = Number(req.body.stock);

  if (
    !Number.isInteger(stock) ||
    stock < 0
  ) {
    return fail(
      res,
      'Stock must be a non-negative integer.',
    );
  }

  const product = await Product.findOneAndUpdate(
    {
      _id: req.params.id,
      vendorId: req.user._id,
    },
    {
      stock,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  if (!product) {
    return fail(
      res,
      'Product not found or not owned by you.',
      404,
    );
  }

  return ok(
    res,
    product,
    'Stock updated.',
  );
}


async function internalGet(req, res) {
  const product = await Product
    .findById(req.params.id)
    .lean();

  if (!product) {
    return fail(
      res,
      'Product not found.',
      404,
    );
  }

  return ok(res, product);
}


async function internalReserve(req, res) {
  const { items } = req.body;

  if (
    !Array.isArray(items) ||
    !items.length
  ) {
    return fail(
      res,
      'items are required.',
    );
  }

  const session = await Product.startSession();

  try {
    const result = [];

    await session.withTransaction(async () => {
      for (const item of items) {
        const product =
          await Product.findOneAndUpdate(
            {
              _id: item.productId,
              stock: {
                $gte: item.quantity,
              },
            },
            {
              $inc: {
                stock: -item.quantity,
              },
            },
            {
              new: true,
              session,
            },
          );

        if (!product) {
          const error = new Error(
            `Insufficient stock for product ${item.productId}`,
          );

          error.status = 409;

          throw error;
        }

        result.push(product);
      }
    });

    return ok(
      res,
      result,
      'Stock reserved.',
    );
  } finally {
    await session.endSession();
  }
}


async function internalRelease(req, res) {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return fail(
      res,
      'items are required.',
    );
  }

  await Product.bulkWrite(
    items.map((item) => ({
      updateOne: {
        filter: {
          _id: item.productId,
        },
        update: {
          $inc: {
            stock: item.quantity,
          },
        },
      },
    })),
  );

  return ok(
    res,
    null,
    'Stock released.',
  );
}


async function internalRating(req, res) {
  const {
    rating,
    reviewCount,
  } = req.body;

  const product =
    await Product.findByIdAndUpdate(
      req.params.id,
      {
        rating: Number(rating) || 0,
        reviewCount: Number(reviewCount) || 0,
      },
      {
        new: true,
        runValidators: true,
      },
    );

  if (!product) {
    return fail(
      res,
      'Product not found.',
      404,
    );
  }

  return ok(res, product);
}


module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  updateStock,
  internalGet,
  internalReserve,
  internalRelease,
  internalRating,
};