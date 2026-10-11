import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

interface ClientRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  emergencyContact: string | null;
  gender: string | null;
  appointmentCount: number;
  lastAppointment: string;
}

interface AppointmentRecord {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  notes: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface SessionRecord {
  id: number;
  status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  createdAt: string;
  client?: {
    id: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  appointment?: {
    date: string;
    startTime: string;
    type: string;
  };
}

export default function CounselorDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"clients" | "appointments" | "sessions">("clients");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [stats, setStats] = useState<{
    totalClients: number;
    totalAppointments: number;
    totalSessions: number;
    completedSessions: number;
    specialization?: string;
  }>({
    totalClients: 0,
    totalAppointments: 0,
    totalSessions: 0,
    completedSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  // Selected session for updating notes
  const [editingSession, setEditingSession] = useState<SessionRecord | null>(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [sessionStatus, setSessionStatus] = useState<string>("SCHEDULED");
  const [savingNotes, setSavingNotes] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, clientsRes, apptsRes, sessRes] = await Promise.all([
        api.get("/counselor/dashboard-stats"),
        api.get("/counselor/clients"),
        api.get("/counselor/appointments"),
        api.get("/counselor/sessions"),
      ]);
      setStats(statsRes.data.data);
      setClients(clientsRes.data.data);
      setAppointments(apptsRes.data.data);
      setSessions(sessRes.data.data);
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveNotes = async () => {
    if (!editingSession) return;
    setSavingNotes(true);
    try {
      await api.put(`/counselor/sessions/${editingSession.id}/notes`, {
        notes: sessionNotes,
      });
      if (sessionStatus !== editingSession.status) {
        await api.put(`/counselor/sessions/${editingSession.id}/status`, {
          status: sessionStatus,
        });
      }
      setFeedbackMessage("Session notes and status successfully saved.");
      setTimeout(() => setFeedbackMessage(null), 3000);
      setEditingSession(null);
      fetchData();
    } catch {
      setFeedbackMessage("Failed to save notes. Please try again.");
    } finally {
      setSavingNotes(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Completed</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">In Progress</span>;
      case "CANCELLED":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800">Scheduled</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg leading-tight block">
                  MindBridge <span className="text-teal-600 text-sm font-semibold">Counselor Workspace</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Licensed Clinical Portal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[11px] text-teal-700 font-semibold">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {feedbackMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex justify-between items-center animate-fadeIn">
            <span>{feedbackMessage}</span>
            <button onClick={() => setFeedbackMessage(null)} className="font-bold">&times;</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Assigned Clients</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalClients}</p>
            <p className="text-[11px] text-teal-600 font-semibold mt-1">Active caseload</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Appointments</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalAppointments}</p>
            <p className="text-[11px] text-sky-600 font-semibold mt-1">Scheduled & completed</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Clinical Sessions</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalSessions}</p>
            <p className="text-[11px] text-indigo-600 font-semibold mt-1">Logged sessions</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Completed Sessions</span>
            <p className="text-2xl font-black text-slate-900 mt-2">{stats.completedSessions}</p>
            <p className="text-[11px] text-emerald-600 font-semibold mt-1">With clinical notes</p>
          </div>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("clients")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "clients"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Assigned Clients ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "appointments"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "sessions"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Clinical Notes & Sessions ({sessions.length})
          </button>
        </div>

        {/* Tab 1: Assigned Clients */}
        {activeTab === "clients" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Assigned Clients</h3>
                <p className="text-xs text-slate-500">Clients who have appointments or sessions booked with you.</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading clients...</div>
            ) : clients.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No clients currently assigned. When a client books an appointment, they will appear here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-6 text-left">Client Name</th>
                      <th className="py-3 px-6 text-left">Email</th>
                      <th className="py-3 px-6 text-left">Phone</th>
                      <th className="py-3 px-6 text-left">Emergency Contact</th>
                      <th className="py-3 px-6 text-left">Appointments</th>
                      <th className="py-3 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {clients.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          {c.firstName} {c.lastName}
                        </td>
                        <td className="py-3.5 px-6 text-slate-500">{c.email}</td>
                        <td className="py-3.5 px-6 text-slate-600">{c.phone || "—"}</td>
                        <td className="py-3.5 px-6 text-slate-500">{c.emergencyContact || "—"}</td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 font-bold border border-teal-200">
                            {c.appointmentCount} booked
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button
                            onClick={() => setActiveTab("sessions")}
                            className="text-teal-600 hover:text-teal-800 font-bold"
                          >
                            View Notes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Counseling Appointments</h3>
              <p className="text-xs text-slate-500">Upcoming and scheduled consultations.</p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No appointments currently scheduled.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100 text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-6 text-left">Client</th>
                      <th className="py-3 px-6 text-left">Date</th>
                      <th className="py-3 px-6 text-left">Time Window</th>
                      <th className="py-3 px-6 text-left">Type</th>
                      <th className="py-3 px-6 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt) => (
                      <tr key={appt.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-6 font-bold text-slate-900">
                          {appt.user ? `${appt.user.firstName} ${appt.user.lastName}` : "Client"}
                          <span className="block text-[11px] font-normal text-slate-400">{appt.user?.email}</span>
                        </td>
                        <td className="py-3.5 px-6 font-medium text-slate-800">
                          {new Date(appt.date).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-6 text-slate-600 font-semibold">
                          {appt.startTime} - {appt.endTime}
                        </td>
                        <td className="py-3.5 px-6">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                            {appt.type}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-slate-500 italic">
                          {appt.notes || "None provided"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Session Notes */}
        {activeTab === "sessions" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Session Notes & Clinical Records</h3>
              <p className="text-xs text-slate-500">Record confidential session notes, observations, and progress reports.</p>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-sm">
                No session logs available.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900 text-sm">
                          Session #{sess.id} &bull; Client: {sess.client?.user ? `${sess.client.user.firstName} ${sess.client.user.lastName}` : "Assigned Client"}
                        </span>
                        {getStatusBadge(sess.status)}
                      </div>
                      <p className="text-xs text-slate-500">
                        Date: {sess.appointment ? new Date(sess.appointment.date).toLocaleDateString() : new Date(sess.createdAt).toLocaleDateString()}{" "}
                        {sess.appointment?.startTime && `(${sess.appointment.startTime})`}
                      </p>
                      <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200/60 text-xs text-slate-700">
                        <span className="font-bold text-slate-800 block mb-1">Clinical Notes:</span>
                        {sess.notes ? (
                          <p className="whitespace-pre-wrap">{sess.notes}</p>
                        ) : (
                          <p className="italic text-slate-400">No notes written for this session yet.</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start">
                      <button
                        onClick={() => {
                          setEditingSession(sess);
                          setSessionNotes(sess.notes || "");
                          setSessionStatus(sess.status);
                        }}
                        className="px-3.5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition"
                      >
                        Edit Notes & Status
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal: Edit Session Notes */}
        {editingSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  Update Session Notes #{editingSession.id}
                </h3>
                <button
                  onClick={() => setEditingSession(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Session Status
                  </label>
                  <select
                    value={sessionStatus}
                    onChange={(e) => setSessionStatus(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="SCHEDULED">SCHEDULED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Clinical Notes & Observations
                  </label>
                  <textarea
                    rows={6}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="Enter confidential notes regarding client progress, mental wellbeing assessment, action plans, etc."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingNotes}
                  onClick={handleSaveNotes}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md shadow-teal-600/20 transition"
                >
                  {savingNotes ? "Saving..." : "Save Session Records"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
