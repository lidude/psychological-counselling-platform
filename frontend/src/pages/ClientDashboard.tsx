import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";

interface AvailableCounselor {
  id: number;
  userId: number;
  specialization: string;
  hourlyRate: string | number;
  bio: string | null;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

interface AppointmentItem {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  notes: string | null;
  counselor?: {
    id: number;
    specialization: string;
    user?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

interface SessionItem {
  id: number;
  status: string;
  notes: string | null;
  createdAt: string;
  counselor?: {
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function ClientDashboard() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"appointments" | "book" | "profile" | "history">("appointments");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [counselors, setCounselors] = useState<AvailableCounselor[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Form State
  const [selectedCounselorId, setSelectedCounselorId] = useState<number | "">("");
  const [bookingDate, setBookingDate] = useState("");
  const [bookingStartTime, setBookingStartTime] = useState("10:00");
  const [bookingEndTime, setBookingEndTime] = useState("11:00");
  const [bookingType, setBookingType] = useState("Online Counselling");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Notifications
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchClientData = async () => {
    setLoading(true);
    try {
      const [apptsRes, counselorsRes, sessionsRes, profileRes] = await Promise.all([
        api.get("/client/appointments"),
        api.get("/client/counselors"),
        api.get("/client/sessions"),
        api.get("/client/profile"),
      ]);

      setAppointments(apptsRes.data.data || []);
      const counselorList = counselorsRes.data.data?.counselors || [];
      setCounselors(counselorList);
      if (counselorList.length > 0 && selectedCounselorId === "") {
        setSelectedCounselorId(counselorList[0].id);
      }
      setSessions(sessionsRes.data.data || []);

      if (profileRes.data.data) {
        const p = profileRes.data.data;
        setFirstName(p.firstName || "");
        setLastName(p.lastName || "");
        setPhone(p.phone || "");
        if (p.client) {
          setEmergencyContact(p.client.emergencyContact || "");
          setGender(p.client.gender || "");
        }
      }
    } catch {
      // Handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientData();
    // Default booking date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setBookingDate(tomorrow.toISOString().split("T")[0]);
  }, []);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCounselorId || !bookingDate) {
      setAlertMessage({ type: "error", text: "Please select a counselor and date." });
      return;
    }

    setBookingInProgress(true);
    setAlertMessage(null);

    try {
      await api.post("/client/appointments", {
        counselorId: Number(selectedCounselorId),
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        type: bookingType,
        notes: bookingNotes,
      });

      setAlertMessage({ type: "success", text: "Appointment successfully booked with your counselor!" });
      setActiveTab("appointments");
      fetchClientData();
      setBookingNotes("");
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setAlertMessage({
        type: "error",
        text: axiosError.response?.data?.message || "Failed to book appointment. Please check availability.",
      });
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleCancelAppointment = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled appointment?")) return;
    try {
      await api.delete(`/client/appointments/${id}`);
      setAlertMessage({ type: "success", text: "Appointment cancelled successfully." });
      fetchClientData();
    } catch {
      setAlertMessage({ type: "error", text: "Failed to cancel appointment." });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setAlertMessage(null);
    try {
      await api.put("/client/profile", {
        firstName,
        lastName,
        phone,
        emergencyContact,
        gender,
      });
      setAlertMessage({ type: "success", text: "Profile details updated successfully." });
    } catch {
      setAlertMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Client Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <span className="font-extrabold text-slate-900 text-lg leading-tight block">
                  MindBridge <span className="text-teal-600 text-sm font-semibold">Client Portal</span>
                </span>
                <span className="text-[11px] font-medium text-slate-500">
                  Confidential Psychological Support
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-teal-900/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-sm mb-3">
              Client Safe Space &bull; End-to-End Confidential
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-1 max-w-xl">
              Take the next step in your mental health journey. Schedule confidential sessions with certified psychologists and track your progress.
            </p>
          </div>
          <button
            onClick={() => setActiveTab("book")}
            className="px-5 py-3 rounded-2xl bg-white text-teal-800 font-bold text-xs shadow-lg shadow-black/10 hover:bg-teal-50 transition transform hover:-translate-y-0.5"
          >
            + Book New Appointment
          </button>
        </div>

        {/* Alert Notifications */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex justify-between items-center ${
              alertMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}
          >
            <span>{alertMessage.text}</span>
            <button onClick={() => setAlertMessage(null)} className="font-bold text-base ml-2">
              &times;
            </button>
          </div>
        )}

        {/* Workspace Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            onClick={() => setActiveTab("appointments")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "appointments"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            My Appointments ({appointments.length})
          </button>
          <button
            onClick={() => setActiveTab("book")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "book"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Book a Counselor
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "history"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Past Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-4 text-xs font-bold tracking-wide uppercase transition border-b-2 ${
              activeTab === "profile"
                ? "border-teal-600 text-teal-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Profile & Emergency Details
          </button>
        </div>

        {/* Tab 1: My Appointments */}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Your Scheduled Appointments</h3>
                <p className="text-xs text-slate-500">Upcoming mental health consultations.</p>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-xs text-slate-500">Loading your appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <p className="text-sm text-slate-500">You do not have any appointments scheduled currently.</p>
                <button
                  onClick={() => setActiveTab("book")}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
                >
                  Book Your First Session
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <div key={appt.id} className="p-5 hover:bg-slate-50/70 transition flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-slate-900 text-sm">
                          Counselor: {appt.counselor?.user ? `${appt.counselor.user.firstName} ${appt.counselor.user.lastName}` : "Certified Counselor"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
                          {appt.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold">
                        Date: {new Date(appt.date).toLocaleDateString()} &bull; Time: {appt.startTime} - {appt.endTime}
                      </p>
                      {appt.notes && (
                        <p className="text-xs text-slate-400 italic">Notes: {appt.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition"
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Book an Appointment */}
        {activeTab === "book" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Book a Counselling Session</h3>
            <p className="text-xs text-slate-500 mb-6">
              Select your certified counselor, date, and preferred time slot.
            </p>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Counselor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCounselorId}
                  onChange={(e) => setSelectedCounselorId(Number(e.target.value))}
                  required
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {counselors.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.user.firstName} {c.user.lastName} — {c.specialization} (${Number(c.hourlyRate)}/hr)
                    </option>
                  ))}
                  {counselors.length === 0 && (
                    <option value="">No counselors currently available</option>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Appointment Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingStartTime}
                    onChange={(e) => setBookingStartTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={bookingEndTime}
                    onChange={(e) => setBookingEndTime(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Session Type
                </label>
                <select
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="Online Video Counselling">Online Video Counselling</option>
                  <option value="Audio Tele-health Session">Audio Tele-health Session</option>
                  <option value="In-Person Clinical Consultation">In-Person Clinical Consultation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Initial Notes or Reason for Visit <span className="text-slate-400 font-normal lowercase">(confidential)</span>
                </label>
                <textarea
                  rows={3}
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Share any topics, symptoms, or objectives you'd like to discuss..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                type="submit"
                disabled={bookingInProgress || counselors.length === 0}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 shadow-md shadow-teal-600/20 transition disabled:opacity-50"
              >
                {bookingInProgress ? "Confirming Booking..." : "Confirm & Book Appointment"}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Past Sessions */}
        {activeTab === "history" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-slate-900 mb-1">Session History & Clinical Logs</h3>
            <p className="text-xs text-slate-500 mb-6">Archive of past sessions and progress records.</p>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No past sessions logged yet.
              </div>
            ) : (
              <div className="space-y-4">
                {sessions.map((sess) => (
                  <div key={sess.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-xs">
                          Session #{sess.id} &bull; Counselor: {sess.counselor?.user ? `${sess.counselor.user.firstName} ${sess.counselor.user.lastName}` : "Counselor"}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 uppercase">
                          {sess.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Logged on: {new Date(sess.createdAt).toLocaleDateString()}
                      </p>
                      {sess.notes && (
                        <div className="mt-2 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100">
                          <span className="font-semibold text-slate-800 block text-[11px] mb-1">Counselor Summary:</span>
                          <p>{sess.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Profile & Emergency Details */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-xl mx-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Client Profile & Emergency Information</h3>
            <p className="text-xs text-slate-500 mb-6">
              Keep your contact and emergency details up to date for your counselors.
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email (Account Identifier)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 234 5678"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Emergency Contact (Name & Phone)
                </label>
                <input
                  type="text"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="e.g. Spouse / Parent / Relative (+251 91 ...)"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Prefer not to say</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 px-4 rounded-2xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition disabled:opacity-50 mt-2"
              >
                {savingProfile ? "Saving Profile..." : "Update Profile Information"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
