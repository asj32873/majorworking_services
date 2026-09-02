import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useAuth0 } from "@auth0/auth0-react";

import { api, configureAccessTokenGetter } from "../api/client";

const C = createContext(null);

const normalizeProduct = (p) => ({
  ...p,
  id: p._id || p.id,
  image: p.imageUrl || p.image || "",
  vendor: p.vendor
    ? {
        ...p.vendor,
        id: p.vendor._id || p.vendor.id,
        userId: p.vendor.userId?._id || p.vendor.userId,
      }
    : null,
});

const normalizeUser = (u) => ({
  ...u,
  id: u._id || u.id,
});

const normalizeVendor = (v) => ({
  ...v,
  id: v._id || v.id,
  userId: v.userId?._id || v.userId,
});

const normalizeAddress = (a) => ({
  ...a,
  id: a._id || a.id,
});

const normalizeReview = (r) => ({
  ...r,
  id: r._id || r.id,
  productId: r.productId?._id || r.productId,
  userId: r.userId?._id || r.userId,
  user: r.userId?.name
    ? {
        id: r.userId._id,
        name: r.userId.name,
      }
    : null,
});

const normalizeOrder = (o) => ({
  ...o,
  id: o._id || o.id,
  userId: o.userId?._id || o.userId,
  addressId: o.addressId?._id || o.addressId,

  items: (o.items || []).map((i) => ({
    ...i,
    id: i._id || i.id,
    orderId: i.orderId?._id || i.orderId,
    productId: i.productId?._id || i.productId,
    vendorId: i.vendorId?._id || i.vendorId,
    tracking: i.tracking || [],
  })),
});

const normalizeIssue = (i) => ({
  ...i,
  id: i._id || i.id,
  userId: i.userId?._id || i.userId,
  assignedTo: i.assignedTo?._id || i.assignedTo || null,
  orderId: i.orderId?._id || i.orderId || null,
  productId: i.productId?._id || i.productId || null,
});

export function AppProvider({ children }) {
  const {
    isAuthenticated,
    isLoading: authLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  /*
   * This token is only for legacy ShopSphere
   * email/password accounts.
   *
   * Auth0 accounts use getAccessTokenSilently().
   */
  const [token, setToken] = useState(() =>
    localStorage.getItem("shopsphere_token"),
  );

  const [user, setUser] = useState(null);

  const [products, setProducts] = useState([]);

  const [cartItems, setCartItems] = useState([]);

  const [cartTotal, setCartTotal] = useState(0);

  const [orders, setOrders] = useState([]);

  const [issues, setIssues] = useState([]);

  const [vendors, setVendors] = useState([]);

  const [addresses, setAddresses] = useState([]);

  const [reviews, setReviews] = useState([]);

  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);

  /*
   * ---------------------------------------------------------
   * API TOKEN PROVIDER
   * ---------------------------------------------------------
   */
  useEffect(() => {
    configureAccessTokenGetter(async () => {
      /*
       * Legacy local JWT first.
       */
      if (token) {
        return token;
      }

      /*
       * Auth0 access token.
       */
      if (!isAuthenticated) {
        return null;
      }

      return getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: "openid profile email",
        },
      });
    });
  }, [token, isAuthenticated, getAccessTokenSilently]);

  /*
   * ---------------------------------------------------------
   * PRODUCTS
   * ---------------------------------------------------------
   */
  const loadProducts = useCallback(async () => {
    const data = await api.get("/products?limit=100");

    setProducts((data.items || []).map(normalizeProduct));

    return data;
  }, []);

  /*
   * ---------------------------------------------------------
   * CART
   * ---------------------------------------------------------
   */
  const loadCart = useCallback(async () => {
    if (!user || user.role !== "USER") {
      setCartItems([]);
      setCartTotal(0);
      return;
    }

    try {
      console.log("LOADING CART...");

      const data = await api.get("/cart");

      console.log("CART API RESPONSE:", data);

      const cartData = Array.isArray(data)
        ? data
        : data?.data || data?.items || [];

      const items = cartData.map((i) => ({
        ...i,
        id: i.id || i._id,
        productId: i.productId?._id || i.productId,
        product: normalizeProduct(i.product || {}),
      }));

      console.log("NORMALIZED CART ITEMS:", items);

      setCartItems(items);

      const total = items.reduce(
        (sum, item) => sum + Number(item.subtotal || 0),
        0,
      );

      setCartTotal(total);
    } catch (error) {
      console.error("FAILED TO LOAD CART:", error);

      setCartItems([]);
      setCartTotal(0);
    }
  }, [user]);

  /*
   * ---------------------------------------------------------
   * AUTHENTICATED SHOPSPHERE USER
   * ---------------------------------------------------------
   */
  const loadAuthenticatedUser = useCallback(async () => {
    if (!isAuthenticated && !token) {
      setUser(null);
      return null;
    }

    try {
      const data = await api.get("/auth/me");

      const nextUser = normalizeUser(data);

      setUser(nextUser);

      return nextUser;
    } catch (error) {
      console.error("Failed to load authenticated ShopSphere user:", error);

      if (error.status === 401 || error.status === 403) {
        localStorage.removeItem("shopsphere_token");

        setToken(null);
      }

      setUser(null);

      return null;
    }
  }, [isAuthenticated, token]);

  /*
   * ---------------------------------------------------------
   * USER-SPECIFIC DATA
   * ---------------------------------------------------------
   */
  const loadUserData = useCallback(async () => {
    if (!user) {
      return;
    }

    if (user.role === "USER") {
      const [addressResult, orderResult, issueResult] =
        await Promise.allSettled([
          api.get("/addresses"),
          api.get("/orders"),
          api.get("/issues"),
        ]);

      /*
       * ADDRESSES
       */
      if (addressResult.status === "fulfilled") {
        const addressData = addressResult.value;

        const addressList = Array.isArray(addressData)
          ? addressData
          : addressData?.data || addressData?.items || [];

        console.log("ADDRESS API RESPONSE:", addressData);
        console.log("ADDRESS LIST:", addressList);

        setAddresses(addressList.map(normalizeAddress));
      } else {
        console.error("FAILED TO LOAD ADDRESSES:", addressResult.reason);
      }

      /*
       * ORDERS
       */
      if (orderResult.status === "fulfilled") {
        const orderData = orderResult.value;

        setOrders(
          (Array.isArray(orderData) ? orderData : []).map(normalizeOrder),
        );
      } else {
        console.error("FAILED TO LOAD ORDERS:", orderResult.reason);
      }

      /*
       * ISSUES
       */
      if (issueResult.status === "fulfilled") {
        const issueData = issueResult.value;

        setIssues(
          (Array.isArray(issueData) ? issueData : []).map(normalizeIssue),
        );
      } else {
        console.error("FAILED TO LOAD ISSUES:", issueResult.reason);
      }

      /*
       * Load these independently too
       */
      await Promise.allSettled([loadCart(), loadReviews()]);
    }

    if (user.role === "VENDOR") {
      const [vendorData, orderData, issueData] = await Promise.all([
        api.get("/vendor/profile"),
        api.get("/orders/vendor/list"),
        api.get("/issues"),
      ]);

      setVendors([normalizeVendor(vendorData)]);

      setOrders((orderData || []).map(normalizeOrder));

      setIssues((issueData || []).map(normalizeIssue));
    }

    if (user.role === "ADMIN") {
      const [vendorData, userData, orderData, issueData] = await Promise.all([
        api.get("/admin/vendors"),
        api.get("/admin/users"),
        api.get("/orders/admin/list"),
        api.get("/admin/issues"),
      ]);

      setVendors((vendorData || []).map(normalizeVendor));

      setUsers((userData || []).map(normalizeUser));

      setOrders((orderData || []).map(normalizeOrder));

      setIssues((issueData || []).map(normalizeIssue));

      await loadReviews();
    }
  }, [user, loadCart]);

  /*
   * ---------------------------------------------------------
   * AUTH BOOTSTRAP
   * ---------------------------------------------------------
   */
  useEffect(() => {
    let active = true;

    if (authLoading) {
      return undefined;
    }

    (async () => {
      try {
        await loadProducts();

        const me = await loadAuthenticatedUser();

        if (active && me) {
          setUser(me);
        }
      } catch (error) {
        console.error("ShopSphere authentication bootstrap failed:", error);

        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, loadProducts, loadAuthenticatedUser]);

  useEffect(() => {
    if (!loading && user) {
      loadUserData().catch(console.error);
    }
  }, [loading, user, loadUserData]);
  useEffect(() => {
    if (!loading && user?.role === "USER") {
      loadCart().catch(console.error);
    }
  }, [loading, user, loadCart]);
  /*
   * ---------------------------------------------------------
   * LEGACY EMAIL/PASSWORD LOGIN
   * ---------------------------------------------------------
   */
  const login = async (email, password) => {
    try {
      const data = await api.post("/auth/login", {
        email,
        password,
      });

      const nextUser = normalizeUser(data.user);

      localStorage.setItem("shopsphere_token", data.token);

      setToken(data.token);

      setUser(nextUser);

      await loadProducts();

      return {
        ok: true,
        user: nextUser,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  };

  /*
   * ---------------------------------------------------------
   * AUTH0 LOGIN
   * ---------------------------------------------------------
   */
  const loginWithAuth0 = async (returnTo = "/user/home") => {
    await loginWithRedirect({
      appState: {
        returnTo,
      },
      authorizationParams: {
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        scope: "openid profile email",
      },
    });
  };

  /*
   * ---------------------------------------------------------
   * LOGOUT
   * ---------------------------------------------------------
   */
  const logout = () => {
    localStorage.removeItem("shopsphere_token");

    setToken(null);
    setUser(null);

    setCartItems([]);
    setCartTotal(0);
    setAddresses([]);
    setOrders([]);
    setIssues([]);
    setReviews([]);
    setUsers([]);
    setVendors([]);

    if (isAuthenticated) {
      auth0Logout({
        logoutParams: {
          returnTo: window.location.origin,
        },
      });
    }
  };

  /*
   * ---------------------------------------------------------
   * REGISTRATION
   * ---------------------------------------------------------
   */
  const registerUser = async (data) => {
    try {
      await api.post("/auth/register", data);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  };

  const registerVendor = async (data) => {
    try {
      await api.post("/auth/vendor/register", data);

      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        message: error.message,
      };
    }
  };

  /*
   * ---------------------------------------------------------
   * CART FUNCTIONS
   * ---------------------------------------------------------
   */
  const addToCart = async (product, quantity = 1) => {
    if (!user || user.role !== "USER" || !product?.stock) {
      return;
    }

    await api.post("/cart/items", {
      productId: product.id,
      quantity,
    });

    await loadCart();
  };

  const removeFromCart = async (id) => {
    const item = cartItems.find((x) => x.productId === id);

    if (!item) {
      return;
    }

    await api.delete(`/cart/items/${item.id}`);

    await loadCart();
  };

  const updateCartQty = async (id, quantity) => {
    const item = cartItems.find((x) => x.productId === id);

    if (!item) {
      return;
    }

    if (quantity <= 0) {
      await removeFromCart(id);

      return;
    }

    await api.patch(`/cart/items/${item.id}`, {
      quantity,
    });

    await loadCart();
  };

  /*
   * ---------------------------------------------------------
   * ORDERS
   * ---------------------------------------------------------
   */
  const placeOrder = async (addressId) => {
    const data = await api.post("/orders", {
      addressId,
    });

    const order = normalizeOrder(data);

    await Promise.all([loadCart(), loadProducts()]);

    setOrders((prev) => [order, ...prev.filter((o) => o.id !== order.id)]);

    return order;
  };

  const loadOrder = async (id) => {
    const data = await api.get(`/orders/${id}`);

    return normalizeOrder(data);
  };

  const updateVendorOrderStatus = async (orderId, itemId, status) => {
    const data = await api.patch(
      `/orders/vendor/${orderId}/items/${itemId}/status`,
      {
        status,
      },
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              items: o.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      ...data,
                      id: itemId,
                      vendorStatus: status,
                    }
                  : i,
              ),
            },
      ),
    );

    const refreshed = await api.get("/orders/vendor/list");

    setOrders((refreshed || []).map(normalizeOrder));
  };

  const updateAdminOrderStatus = async (orderId, itemId, status) => {
    const data = await api.patch(
      `/orders/admin/${orderId}/items/${itemId}/status`,
      {
        status,
      },
    );

    setOrders((prev) =>
      prev.map((o) =>
        o.id !== orderId
          ? o
          : {
              ...o,
              items: o.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      ...data,
                      id: itemId,
                      vendorStatus: status,
                    }
                  : i,
              ),
            },
      ),
    );

    const refreshed = await api.get("/orders/admin/list");

    setOrders((refreshed || []).map(normalizeOrder));
  };

  /*
   * ---------------------------------------------------------
   * ISSUES
   * ---------------------------------------------------------
   */
  const addIssue = async (data) => {
    const created = await api.post("/issues", data);

    const issue = normalizeIssue(created);

    setIssues((prev) => [issue, ...prev]);

    return issue;
  };

  const updateIssue = async (id, data) => {
    const updated = await api.patch(`/issues/${id}`, data);

    const issue = normalizeIssue(updated);

    setIssues((prev) => prev.map((x) => (x.id === id ? issue : x)));

    return issue;
  };

  /*
   * ---------------------------------------------------------
   * PRODUCTS
   * ---------------------------------------------------------
   */
  const addProduct = async (data) => {
    const created = await api.post("/products", {
      ...data,
      imageUrl: data.image || data.imageUrl || "",
    });

    const product = normalizeProduct(created);

    setProducts((prev) => [product, ...prev]);

    return product;
  };

  const updateProduct = async (id, data) => {
    const updated = await api.put(`/products/${id}`, {
      ...data,
      imageUrl: data.image || data.imageUrl || "",
    });

    const product = normalizeProduct(updated);

    setProducts((prev) => prev.map((p) => (p.id === id ? product : p)));

    return product;
  };

  const deleteProduct = async (id) => {
    await api.delete(`/products/${id}`);

    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  /*
   * ---------------------------------------------------------
   * ADDRESSES
   * ---------------------------------------------------------
   */
  const addAddress = async (data) => {
    const created = await api.post("/addresses", data);

    setAddresses((prev) => [normalizeAddress(created), ...prev]);
  };

  const updateAddress = async (id, data) => {
    const updated = await api.put(`/addresses/${id}`, data);

    const address = normalizeAddress(updated);

    setAddresses((prev) => prev.map((a) => (a.id === id ? address : a)));
  };

  const deleteAddress = async (id) => {
    await api.delete(`/addresses/${id}`);

    await loadUserData();
  };

  const setDefaultAddress = async (id) => {
    const updated = await api.patch(`/addresses/${id}/default`, {});

    const address = normalizeAddress(updated);

    setAddresses((prev) =>
      prev.map((a) =>
        a.userId === user.id
          ? {
              ...a,
              isDefault: a.id === address.id,
            }
          : a,
      ),
    );
  };

  /*
   * ---------------------------------------------------------
   * REVIEWS
   * ---------------------------------------------------------
   */
  const addReview = async (productId, rating, review) => {
    const created = await api.post(`/reviews/product/${productId}`, {
      rating: Number(rating),
      review: review.trim(),
    });

    const normalized = normalizeReview(created);

    setReviews((prev) => [
      normalized,
      ...prev.filter(
        (r) =>
          !(
            String(r.productId) === String(productId) &&
            String(r.userId) === String(user.id)
          ),
      ),
    ]);

    await loadProducts();

    return normalized;
  };

  const updateReview = async (id, data) => {
    const updated = await api.put(`/reviews/${id}`, data);

    const review = normalizeReview(updated);

    setReviews((prev) =>
      prev.map((r) => (String(r.id) === String(id) ? review : r)),
    );

    await loadProducts();

    return review;
  };

  const loadProductReviews = useCallback(async (productId) => {
    const data = await api.get(`/reviews/product/${productId}`);

    const normalized = (data || []).map(normalizeReview);

    setReviews((prev) => [
      ...prev.filter((r) => String(r.productId) !== String(productId)),
      ...normalized,
    ]);

    return normalized;
  }, []);

  const deleteReview = async (id) => {
    await api.delete(`/reviews/${id}`);

    setReviews((prev) => prev.filter((r) => String(r.id) !== String(id)));

    await loadProducts();
  };

  /*
   * ---------------------------------------------------------
   * ADMIN
   * ---------------------------------------------------------
   */
  const approveVendor = async (id) => {
    const updated = await api.patch(`/admin/vendors/${id}/approve`, {});

    const vendor = normalizeVendor(updated);

    setVendors((prev) => prev.map((v) => (v.id === id ? vendor : v)));
  };

  const rejectVendor = async (id) => {
    const updated = await api.patch(`/admin/vendors/${id}/reject`, {});

    const vendor = normalizeVendor(updated);

    setVendors((prev) => prev.map((v) => (v.id === id ? vendor : v)));
  };

  const deleteVendor = async (id) => {
    await api.delete(`/admin/vendors/${id}`);

    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const updateUserStatus = async (id, status) => {
    const updated = await api.patch(`/admin/users/${id}/status`, {
      status,
    });

    const next = normalizeUser(updated);

    setUsers((prev) => prev.map((u) => (u.id === id ? next : u)));
  };

  const loadReviews = useCallback(async () => {
    if (!products.length) {
      return;
    }

    const results = await Promise.all(
      products.map((p) => api.get(`/reviews/product/${p.id}`).catch(() => [])),
    );

    const allReviews = results.flat();

    setReviews(allReviews.map(normalizeReview));
  }, [products]);

  /*
   * ---------------------------------------------------------
   * STRIPE
   * ---------------------------------------------------------
   */
  const createCheckoutSession = async (addressId) => {
    const data = await api.post("/payments/create-checkout-session", {
      addressId,
    });

    return data;
  };

  /*
   * ---------------------------------------------------------
   * CONTEXT VALUE
   * ---------------------------------------------------------
   */
  const value = useMemo(
    () => ({
      user,
      token,
      loading: loading || authLoading,

      users,

      login,
      loginWithAuth0,
      logout,

      registerUser,
      registerVendor,

      cartItems,
      cartTotal,

      loadCart,
      addToCart,
      removeFromCart,
      updateCartQty,

      orders,
      placeOrder,
      loadOrder,
      updateVendorOrderStatus,
      updateAdminOrderStatus,

      products,
      addProduct,
      updateProduct,
      deleteProduct,

      issues,
      addIssue,
      updateIssue,

      vendors,
      approveVendor,
      rejectVendor,
      deleteVendor,

      updateUserStatus,

      addresses,
      addAddress,
      updateAddress,
      deleteAddress,
      setDefaultAddress,

      reviews,
      addReview,
      updateReview,
      deleteReview,
      loadProductReviews,

      createCheckoutSession,
    }),
    [
      user,
      token,
      loading,
      authLoading,
      users,
      cartItems,
      cartTotal,
      orders,
      products,
      issues,
      vendors,
      updateUserStatus,
      addresses,
      reviews,
    ],
  );

  return <C.Provider value={value}>{children}</C.Provider>;
}

export const useApp = () => useContext(C);
