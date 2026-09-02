import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";
export default function AdminDashboard() {
  const { users, vendors, products, orders, issues } = useApp();
  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Admin Dashboard</h2>
        <div className="row g-3">
          {[
            ["Users", users.length],
            [
              "Vendors",
              vendors.length -
                vendors.filter((v) => v.status === "APPLIED").length,
            ],
            [
              "Pending Vendors",
              vendors.filter((v) => v.status === "APPLIED").length,
            ],
            ["Products", products.length],
            [
              "Open Issues",
              issues.filter((i) => !["RESOLVED", "CLOSED"].includes(i.status))
                .length,
            ],
            ["Orders", orders.length],
          ].map(([a, b]) => (
            <div className="col-sm-6 col-xl-4" key={a}>
              <div className="card stat-card">
                <div className="card-body">
                  <small>{a}</small>
                  <div className="fs-2 fw-bold">{b}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
