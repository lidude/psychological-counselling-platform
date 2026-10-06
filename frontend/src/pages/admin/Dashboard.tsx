import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  createdAt: string;
}

function Dashboard() {
  const [clients, setClients] = useState<User[]>([]);
  const [counselors, setCounselors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, counselorsRes] = await Promise.all([
          api.get("/admin/users?role=CLIENT"),
          api.get("/admin/users?role=COUNSELOR"),
        ]);
        setClients(clientsRes.data.data);
        setCounselors(counselorsRes.data.data);
      } catch {
        // Error handled by interceptor
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clients card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
            <Link
              to="/admin/clients"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          <p className="text-3xl font-bold text-gray-900">{clients.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total registered clients</p>
          <Link
            to="/admin/clients/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Client
          </Link>
        </div>

        {/* Counselors card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Counselors</h2>
            <Link
              to="/admin/counselors"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          <p className="text-3xl font-bold text-gray-900">{counselors.length}</p>
          <p className="text-sm text-gray-500 mt-1">Total registered counselors</p>
          <Link
            to="/admin/counselors/new"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Counselor
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
