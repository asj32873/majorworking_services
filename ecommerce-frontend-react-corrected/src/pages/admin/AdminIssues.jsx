import PortalLayout from "../../components/common/PortalLayout";
import { useApp } from "../../context/AppContext";

export default function AdminIssues() {
  const { issues, updateIssue, vendors } = useApp();

  return (
    <PortalLayout type="admin">
      <div className="py-4">
        <h2>Issue Management</h2>

        {issues.map((i) => (
          <div className="card mb-3" key={i._id || i.id}>
            <div className="card-body row align-items-center">
              <div className="col-lg-6">
                <h5>
                  #{i._id || i.id} — {i.subject}
                </h5>

                <p>{i.description}</p>

                <small>
                  Priority: {i.priority} · Order: {i.orderId || "N/A"}
                </small>
              </div>

              <div className="col-lg-3">
                <select
                  className="form-select"
                  value={i.assignedTo || ""}
                  onChange={(e) =>
                    updateIssue(i._id || i.id, {
                      assignedTo: e.target.value || null,
                    })
                  }
                >
                  <option value="">Unassigned</option>

                  {vendors
                    .filter((v) => v.status === "VERIFIED")
                    .map((v) => (
                      <option key={v._id || v.id} value={v.userId}>
                        {v.storeName}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-lg-3">
                <select
                  className="form-select"
                  value={i.status}
                  onChange={(e) =>
                    updateIssue(i._id || i.id, {
                      status: e.target.value,
                    })
                  }
                >
                  <option value="OPEN">OPEN</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="CLOSED">CLOSED</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PortalLayout>
  );
}
