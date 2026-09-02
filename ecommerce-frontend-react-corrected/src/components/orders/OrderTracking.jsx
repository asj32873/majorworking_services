const labels = {
  PLACED: "Order Placed",
  CONFIRMED: "Confirmed",
  PACKED: "Packed",
  DISPATCHED: "Dispatched",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
};

export default function OrderTracking({ order }) {
  const events = (order?.items || [])
    .flatMap((item) => item.tracking || [])
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="timeline">
      {events.map((e, i) => (
        <div className="timeline-item active" key={i}>
          <div className="fw-semibold">
            {labels[e.status] || e.status}
          </div>

          <div className="small text-muted">
            {e.date
              ? new Date(e.date).toLocaleString("en-IN")
              : ""}
          </div>

          {e.remarks && (
            <div className="small">
              {e.remarks}
            </div>
          )}
        </div>
      ))}

      {!events.length && (
        <div className="text-muted small mt-3">
          No tracking updates yet.
        </div>
      )}
    </div>
  );
}


// const labels = {
//   PLACED: "Order Placed",
//   CONFIRMED: "Confirmed",
//   PACKED: "Packed",
//   DISPATCHED: "Dispatched",
//   OUT_FOR_DELIVERY: "Out for Delivery",
//   DELIVERED: "Delivered",
//   CANCELLED: "Cancelled",
//   RETURNED: "Returned",
// };
// export default function OrderTracking({ item }) {
//   return (
//     <div className="timeline">
//       {(item?.tracking || []).map((e, i) => (
//         <div className="timeline-item active" key={i}>
//           <div className="fw-semibold">{labels[e.status] || e.status}</div>
//           <div className="small text-muted">{e.date}</div>
//           <div className="small">{e.remarks}</div>
//         </div>
//       ))}
//     </div>
//   );
// }
