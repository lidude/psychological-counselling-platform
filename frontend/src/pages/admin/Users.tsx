import { useEffect, useState } from "react";
import api from "../../lib/api";
import { User, UserRole } from "../../types";

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Role change modal state
  const [roleChangeUser, setRoleChangeUser] = useState<User | null>(null);
  const [targetRole, setTargetRole] = useState<UserRole>("CLIENT");
  const [updatingRole, setUpdatingRole] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const fetchUsers = async (roleFilter?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        roleFilter && roleFilter !== "ALL"
          ? `/admin/users?role=${roleFilter}`
          : "/admin/users";
      const response = await api.get(url);
      setUsers(response.data.data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Failed to load user directory"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(selectedRoleFilter);
  }, [selectedRoleFilter]);

  const handleRoleChangeSubmit = async () => {
    if (!roleChangeUser) return;
    setUpdatingRole(true);
    setSuccess(null);
    setError(null);

    try {
      await api.patch(`/admin/users/${roleChangeUser.id}/role`, {
        role: targetRole,
      });
      setSuccess(`Role updated to ${targetRole} for ${roleChangeUser.email}`);
      setRoleChangeUser(null);
      fetchUsers(selectedRoleFilter);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Failed to change user role"
      );
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    setSuccess(null);
    setError(null);
    try {
      await api.delete(`/admin/users/${userId}`);
      setSuccess("User deleted successfully");
      setDeleteConfirm(null);
      fetchUsers(selectedRoleFilter);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string; error?: string } } };
      setError(
        axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          "Failed to delete user"
      );
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.firstName} ${u.lastName} ${u.email} ${u.phone || ""}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getRoleBadge = (role: UserRole, email: string) => {
    const isBootstrapAdmin = email.toLowerCase() === "salmamustefa@gmail.com";
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Admin {isBootstrapAdmin && "(Primary)"}
          </span>
        );
      case "COUNSELOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-200">
            <svg className="w-3 h-3 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            Counselor
          </span>
        );
      case "CLIENT":
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            Client
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Directory & Access Control (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage system users, assign operational roles (Admin, Counselor, Client), and enforce privileges.
          </p>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-emerald-700 font-bold">&times;</button>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-700 font-bold">&times;</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Role Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {["ALL", "CLIENT", "COUNSELOR", "ADMIN"].map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRoleFilter(role)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                selectedRoleFilter === role
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {role === "ALL" ? "All Users" : `${role.charAt(0) + role.slice(1).toLowerCase()}s`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading user records...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500">No users found matching current filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    User Details
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Assigned Role
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Registered On
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((u) => {
                  const isBootstrapAdmin = u.email.toLowerCase() === "salmamustefa@gmail.com";
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-teal-500 to-sky-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm">
                            {u.firstName[0]}
                            {u.lastName[0]}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                              <span>{u.firstName} {u.lastName}</span>
                              {isBootstrapAdmin && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-100 text-purple-700 rounded-md">
                                  Primary Root Admin
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(u.role, u.email)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                        {u.phone || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                        <button
                          onClick={() => {
                            setRoleChangeUser(u);
                            setTargetRole(u.role);
                          }}
                          disabled={isBootstrapAdmin}
                          title={isBootstrapAdmin ? "Primary Administrator role cannot be modified" : "Change User Role"}
                          className="px-3 py-1.5 rounded-lg text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Change Role
                        </button>

                        {deleteConfirm === u.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2.5 py-1 text-xs rounded-lg bg-rose-600 text-white font-semibold hover:bg-rose-700 transition"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                            >
                              Cancel
                            </button>
                          </span>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            disabled={isBootstrapAdmin || u.role === "ADMIN"}
                            title={isBootstrapAdmin ? "Cannot delete primary administrator" : "Delete Account"}
                            className="px-3 py-1.5 rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {roleChangeUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900">Assign User Role</h3>
              <button
                onClick={() => setRoleChangeUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Modify system authorization privileges for{" "}
              <strong className="text-slate-800">{roleChangeUser.firstName} {roleChangeUser.lastName}</strong> ({roleChangeUser.email}).
            </p>

            <div className="space-y-3 mb-6">
              {[
                {
                  role: "CLIENT" as UserRole,
                  title: "Client",
                  desc: "Can book and manage counselling appointments, message assigned counselors, and access personal profile.",
                },
                {
                  role: "COUNSELOR" as UserRole,
                  title: "Counselor",
                  desc: "Can view assigned clients, update session notes, manage appointments, and configure session plans.",
                },
                {
                  role: "ADMIN" as UserRole,
                  title: "Administrator",
                  desc: "Full privileged access: view all users, assign roles, view system analytics, and manage platform configurations.",
                },
              ].map((item) => (
                <label
                  key={item.role}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                    targetRole === item.role
                      ? "border-teal-500 bg-teal-50/50 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={item.role}
                    checked={targetRole === item.role}
                    onChange={() => setTargetRole(item.role)}
                    className="mt-1 h-4 w-4 text-teal-600 border-slate-300 focus:ring-teal-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
                      {item.title}
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleChangeUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                disabled={updatingRole || targetRole === roleChangeUser.role}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 rounded-xl shadow-md shadow-teal-600/20 transition"
              >
                {updatingRole ? "Updating..." : "Save Role Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
