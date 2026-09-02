import { Link, useParams } from "react-router-dom";
import { useApp } from "../context/AppContext";
import OrderTracking from "../components/orders/OrderTracking";

export default function OrderDetails() {
  const { id } = useParams();

  const { orders, addresses, user } = useApp();

  const o = orders.find(
    (x) => String(x._id || x.id) === String(id)
  );

  const userId = user?._id || user?.id;

  if (!o || String(o.userId) !== String(userId)) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">
          Order not found.
        </div>
      </div>
    );
  }

  const a = addresses.find(
    (x) => String(x._id || x.id) === String(o.addressId)
  );

  return (
    <div className="container py-4">
      <Link to="/orders">← Orders</Link>

      <div className="row g-4 mt-1">
        {/* ORDER DETAILS */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-body">
              <h3>Order #{o._id || o.id}</h3>

              <p>
                <strong>Status:</strong>{" "}
                <span className="badge text-bg-primary">
                  {o.status}
                </span>
              </p>

              <p>
                <strong>Payment:</strong> {o.paymentStatus}
              </p>

              {/* ORDER ITEMS */}
              <div className="mt-4">
                <h5>Items</h5>

                {(o.items || []).map((item) => (
                  <div
                    className="border rounded p-3 mb-2"
                    key={item.id || item._id}
                  >
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{item.name}</strong>

                        <div className="text-muted">
                          Qty: {item.quantity}
                        </div>

                        <div className="small text-muted">
                          Vendor Status: {item.vendorStatus}
                        </div>
                      </div>

                      <strong>
                        ₹
                        {(
                          Number(item.unitPrice || 0) *
                          Number(item.quantity || 0)
                        ).toLocaleString("en-IN")}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>

              {/* TOTAL */}
              <div className="d-flex justify-content-between fs-5 mt-4">
                <strong>Total</strong>

                <strong>
                  ₹{o.totalAmount?.toLocaleString("en-IN")}
                </strong>
              </div>

              {/* ADDRESS */}
              {a && (
                <div className="alert alert-light mt-3">
                  {a.addressLine}, {a.city}, {a.state} - {a.pincode}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TRACKING */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-body">
              <h5>Order Tracking</h5>

              <OrderTracking order={o} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// import { Link, useParams } from "react-router-dom";
// import { useApp } from "../context/AppContext";
// import OrderTracking from "../components/orders/OrderTracking";

// export default function OrderDetails() {
//   const { id } = useParams();

//   const { orders, addresses, user } = useApp();

//   const o = orders.find((x) => String(x._id) === String(id));

//   const userId = user?._id || user?.id;

//   if (!o || String(o.userId) !== String(userId)) {
//     return (
//       <div className="container py-5">
//         <div className="alert alert-danger">Order not found.</div>
//       </div>
//     );
//   }

//   const a = addresses.find(
//     (x) => String(x._id || x.id) === String(o.addressId),
//   );

//   return (
//     <div className="container py-4">
//       <Link to="/orders">← Orders</Link>

//       <div className="row g-4 mt-1">
//         <div className="col-lg-7">
//           <div className="card">
//             <div className="card-body">
//               <h3>Order #{o._id}</h3>

//               <p>
//                 <strong>Status:</strong>{" "}
//                 <span className="badge text-bg-primary">{o.status}</span>
//               </p>

//               <p>
//                 <strong>Payment:</strong> {o.paymentStatus}
//               </p>

//               <div className="d-flex justify-content-between fs-5 mt-3">
//                 <strong>Total</strong>

//                 <strong>₹{o.totalAmount?.toLocaleString("en-IN")}</strong>
//               </div>

//               {a && (
//                 <div className="alert alert-light mt-3">
//                   {a.addressLine}, {a.city}, {a.state} - {a.pincode}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         <div className="col-lg-5">
//           <div className="card">
//             <div className="card-body">
//               <h5>Order Tracking</h5>

//               <OrderTracking order={o} />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
