const { getJson, patchJson } = require("../utils/serviceClient");
const { ok, fail } = require("../utils/apiResponse");
const AUTH = () => process.env.AUTH_SERVICE_URL || "http://localhost:5002";
const VENDOR = () => process.env.VENDOR_SERVICE_URL || "http://localhost:5012";
const PRODUCT = () =>
  process.env.PRODUCT_SERVICE_URL || "http://localhost:5003";
const ORDER = () => process.env.ORDER_SERVICE_URL || "http://localhost:5005";
const SUPPORT = () =>
  process.env.SUPPORT_SERVICE_URL || "http://localhost:5011";
async function dashboard(req, res) {
  const [u, v, p, o] = await Promise.all([
    getJson(AUTH(), "/internal/admin/users"),
    getJson(VENDOR(), "/internal/vendors"),
    getJson(PRODUCT(), "/api/products?limit=1"),
    getJson(ORDER(), "/api/orders/admin/list", {
      authorization: req.headers.authorization || "",
    }),
  ]);
  ok(res, {
    users: u.data?.data?.length || 0,
    vendors: v.data?.data?.length || 0,
    products: p.data?.data?.total || 0,
    orders: o.data?.data?.length || 0,
  });
}
async function vendors(req, res) {
  const r = await getJson(VENDOR(), "/internal/vendors");
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data);
}
async function approveVendor(req, res) {
  const r = await patchJson(VENDOR(), `/internal/vendors/${req.params.id}`, {
    status: "VERIFIED",
    verifiedAt: new Date(),
  });
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data, "Vendor approved.");
}
async function rejectVendor(req, res) {
  const r = await patchJson(VENDOR(), `/internal/vendors/${req.params.id}`, {
    status: "REJECTED",
    verifiedAt: null,
  });
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data, "Vendor rejected.");
}
async function deleteVendor(req, res) {
  const vr = await getJson(VENDOR(), "/internal/vendors");
  const v = (vr.data?.data || []).find(
    (x) => String(x._id) === String(req.params.id),
  );
  if (!v) return fail(res, "Vendor not found.", 404);
  await patchJson(AUTH(), `/internal/users/${v.userId}`, {
    status: "DISABLED",
  });
  const r = await fetch(`${VENDOR()}/internal/vendors/${req.params.id}`, {
    method: "DELETE",
    headers: {
      "x-internal-service-token": process.env.INTERNAL_SERVICE_TOKEN || "",
    },
  });
  const d = await r.json();
  if (!r.ok) return res.status(r.status).json(d);
  ok(res, null, "Vendor deleted.");
}
async function users(req, res) {
  const r = await getJson(AUTH(), "/internal/admin/users");
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data);
}
async function updateUserStatus(req, res) {
  if (req.params.id === req.user.id)
    return fail(res, "You cannot disable your own admin account.", 400);
  if (!["ACTIVE", "DISABLED"].includes(req.body.status))
    return fail(res, "Invalid user status.");
  const r = await patchJson(AUTH(), `/internal/users/${req.params.id}`, {
    status: req.body.status,
  });
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data, "User status updated.");
}
async function issues(req, res) {
  const r = await getJson(SUPPORT(), "/api/issues", {
    authorization: req.headers.authorization || "",
  });
  if (!r.ok) return res.status(r.status).json(r.data);
  ok(res, r.data.data);
}
async function orders(req, res) {
  const r = await getJson(ORDER(), "/api/orders/admin/list", {
    authorization: req.headers.authorization || "",
  });
  console.log("ORDER SERVICE RESPONSE:", JSON.stringify(r.data, null, 2));

  if (!r.ok) {
    return res.status(r.status).json(r.data);
  }

  return ok(res, r.data.data);
}
async function assignVendor(req, res) {
  const { vendorId } = req.body;

  if (!vendorId) {
    return fail(res, "Vendor ID is required.", 400);
  }

  const r = await patchJson(
    SUPPORT(),
    `/api/issues/${req.params.id}/assign`,
    { vendorId },
    {
      authorization: req.headers.authorization || "",
    },
  );

  if (!r.ok) {
    return res.status(r.status).json(r.data);
  }

  return ok(res, r.data.data, "Vendor assigned successfully.");
}
module.exports = {
  dashboard,
  vendors,
  approveVendor,
  rejectVendor,
  deleteVendor,
  users,
  updateUserStatus,
  issues,
  orders,
  assignVendor,
};
