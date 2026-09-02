const { z } = require("zod");
const productSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  brand: z.string().min(1),
  category: z.enum([
    "ELECTRONICS",
    "MOBILE",
    "LAPTOP",
    "AUDIO",
    "TV",
    "HOME_APPLIANCES",
    "ACCESSORIES",
    "OTHER",
  ]),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative().optional(),
  imageUrl: z.string().optional(),
});
module.exports = { productSchema };
