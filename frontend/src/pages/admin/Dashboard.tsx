import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../lib/api";
import { SystemAnalytics, SystemConfig } from "../../types";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<SystemAnalytics | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [configModal, setConfigModal] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [analyticsRes, configRes] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/config"),
      ]);
      setAnalytics(analyticsRes.data.data);
      setConfig(configRes.data.data);
    } catch {
      // Handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleRegistration = async () => {
    if (!config) return;
    setSavingConfig(true);
    try {
      const updated = await api.put("/admin/config", {
        allowClientRegistration: !config.allowClientRegistration,
      });
      setConfig(updated.data.data);
      setConfigSuccess("Configuration updated successfully.");
      setTimeout(() => setConfigSuccess(null), 3000);
    } catch {
      // Handled
    } finally {
      setSavingConfig(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Loading System Analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              System Administration & Analytics
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-200 uppercase">
              RBAC Live
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time platform overview, user distribution, session metrics, and security controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setConfigModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System Configurations
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white text-xs font-semibold rounded-xl shadow-md shadow-teal-600/20 hover:from-teal-700 hover:to-teal-600 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            Manage Users & Roles
          </Link>
        </div>
      </div>

      {configSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          {configSuccess}
        </div>
      )}

      {/* Primary Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Users */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <div className="w-9 h-9 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{analytics?.users.total ?? 0}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 font-medium">
            <span className="text-teal-600 font-bold">{analytics?.users.clients ?? 0}</span> clients &bull;{" "}
            <span className="text-teal-600 font-bold">{analytics?.users.counselors ?? 0}</span> counselors
          </div>
        </div>

        {/* Clients KPI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Registered Clients
            </span>
            <div className="w-9 h-9 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{analytics?.users.clients ?? 0}</p>
          <div className="mt-2 text-xs text-slate-500">Default self-registration role</div>
        </div>

        {/* Counselors KPI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Counselors
            </span>
            <div className="w-9 h-9 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{analytics?.users.counselors ?? 0}</p>
          <div className="mt-2 text-xs text-teal-600 font-semibold">
            {analytics?.counselorVerifications.approved ?? 0} approved &bull; {analytics?.counselorVerifications.pending ?? 0} pending
          </div>
        </div>

        {/* Administrators KPI */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              System Admins
            </span>
            <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-3">{analytics?.users.admins ?? 0}</p>
          <div className="mt-2 text-xs text-purple-700 font-bold truncate">
            Root: salmamustefa@gmail.com
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions & Appointments Analytics */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Clinical Sessions Breakdown</h2>
            <span className="text-xs font-semibold text-slate-400">Total: {analytics?.sessions.total ?? 0}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase">Scheduled</span>
              <p className="text-xl font-bold text-slate-800 mt-1">{analytics?.sessions.scheduled ?? 0}</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-3 border border-amber-100 text-center">
              <span className="text-[11px] font-semibold text-amber-600 uppercase">In Progress</span>
              <p className="text-xl font-bold text-amber-800 mt-1">{analytics?.sessions.inProgress ?? 0}</p>
            </div>
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100 text-center">
              <span className="text-[11px] font-semibold text-emerald-600 uppercase">Completed</span>
              <p className="text-xl font-bold text-emerald-800 mt-1">{analytics?.sessions.completed ?? 0}</p>
            </div>
            <div className="bg-rose-50 rounded-2xl p-3 border border-rose-100 text-center">
              <span className="text-[11px] font-semibold text-rose-600 uppercase">Cancelled</span>
              <p className="text-xl font-bold text-rose-800 mt-1">{analytics?.sessions.cancelled ?? 0}</p>
            </div>
          </div>

          {/* Quick link cards */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need to inspect appointments or assign clients?</span>
            <Link to="/admin/clients" className="font-semibold text-teal-600 hover:text-teal-700">
              View Clients Directory &rarr;
            </Link>
          </div>
        </div>

        {/* Counselor Verification & Governance */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Counselor Credential Verifications</h2>
            <Link to="/admin/counselors" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
              Manage &rarr;
            </Link>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50 border border-amber-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                <span className="text-xs font-semibold text-amber-900">Pending Review & Education Certificates</span>
              </div>
              <span className="text-xs font-bold text-amber-900">{analytics?.counselorVerifications.pending ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-xs font-semibold text-emerald-900">Approved & Active Counselors</span>
              </div>
              <span className="text-xs font-bold text-emerald-900">{analytics?.counselorVerifications.approved ?? 0}</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-50 border border-rose-200/60">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                <span className="text-xs font-semibold text-rose-900">Rejected Applications</span>
              </div>
              <span className="text-xs font-bold text-rose-900">{analytics?.counselorVerifications.rejected ?? 0}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Verification status controls client appointment availability.</span>
            <Link to="/admin/counselors" className="font-semibold text-teal-600 hover:text-teal-700">
              Review Applications &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Registrations Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Recent User Registrations</h2>
          <Link to="/admin/users" className="text-xs font-semibold text-teal-600 hover:text-teal-700">
            View All Users &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-xs">
            <thead>
              <tr className="text-left font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-2.5">User</th>
                <th className="py-2.5">Email</th>
                <th className="py-2.5">Role</th>
                <th className="py-2.5">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics?.recentUsers.map((ru) => (
                <tr key={ru.id} className="hover:bg-slate-50">
                  <td className="py-3 font-semibold text-slate-800">
                    {ru.firstName} {ru.lastName}
                  </td>
                  <td className="py-3 text-slate-500">{ru.email}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                      {ru.role}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(ru.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Configuration Modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Core Configurations</h3>
              <button
                onClick={() => setConfigModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 mb-6 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Allow Public Client Registration</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Permit new users to register as Clients from the frontend portal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleRegistration}
                  disabled={savingConfig}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    config?.allowClientRegistration
                      ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                  }`}
                >
                  {config?.allowClientRegistration ? "Enabled" : "Disabled"}
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800">Primary Bootstrap Administrator</p>
                <p className="text-teal-700 font-semibold mt-1">{config?.bootstrapAdmin}</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Hardcoded root administrator with permanent system rights.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800">Default Self-Signup Role</p>
                <p className="text-slate-700 font-semibold mt-1">CLIENT</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enforces least-privilege security principle across all public registrations.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setConfigModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
