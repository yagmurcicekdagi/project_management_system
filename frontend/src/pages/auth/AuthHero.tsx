const LOGO = (
  <svg
    width="40"
    height="40"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="28" height="28" rx="7" fill="#6366f1" />
    <rect x="7" y="7" width="5" height="5" rx="1.5" fill="white" />
    <rect
      x="16"
      y="7"
      width="5"
      height="5"
      rx="1.5"
      fill="white"
      fillOpacity="0.6"
    />
    <rect
      x="7"
      y="16"
      width="5"
      height="5"
      rx="1.5"
      fill="white"
      fillOpacity="0.6"
    />
    <rect x="16" y="16" width="5" height="5" rx="1.5" fill="white" />
  </svg>
);

const TABLE_ROWS = [
  {
    name: "Dashboard Redesign",
    status: "In Progress",
    color: "bg-amber-100 text-amber-700",
  },
  {
    name: "API Integration",
    status: "Completed",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "User Research",
    status: "In Progress",
    color: "bg-amber-100 text-amber-700",
  },
  { name: "Release v2.0", status: "New", color: "bg-blue-100 text-blue-700" },
  {
    name: "QA Testing",
    status: "Completed",
    color: "bg-emerald-100 text-emerald-700",
  },
];

function SidebarMock() {
  return (
    <div
      className="absolute bg-white rounded-2xl shadow-2xl p-3 w-28"
      style={{ transform: "rotate(-7deg)", left: "8%", top: "28%" }}
    >
      {/* App icon */}
      <div className="w-8 h-8 rounded-lg bg-indigo-500 mb-3" />
      {/* Blue CTA */}
      <div className="w-full h-7 rounded-lg bg-blue-500 mb-4" />
      {/* Nav items */}
      {[0.7, 0.9, 0.6, 0.8].map((w, i) => (
        <div key={w} className="flex items-center gap-1.5 mb-2.5">
          <div className="w-3 h-3 rounded bg-gray-200 shrink-0" />
          <div
            className="h-2 rounded bg-gray-200"
            style={{ width: `${w * 100}%` }}
          />
        </div>
      ))}
      {/* Logout button at bottom */}
      <div className="mt-6 w-full h-6 rounded-lg bg-red-100" />
    </div>
  );
}

function DashboardMock() {
  return (
    <div
      className="absolute bg-white rounded-2xl shadow-2xl p-4 w-64"
      style={{ transform: "rotate(4deg)", left: "28%", top: "18%" }}
    >
      {/* Search bar */}
      <div className="w-full h-6 rounded-lg bg-gray-100 mb-4" />

      {/* Stats row */}
      <div className="flex gap-2 mb-4">
        {[
          { val: "12", label: "Projects" },
          { val: "3", label: "Completed" },
          { val: "8", label: "Active" },
        ].map((s) => (
          <div key={s.label} className="flex-1 bg-gray-50 rounded-xl p-2">
            <div className="text-base font-bold text-gray-800 leading-none">
              {s.val}
            </div>
            <div className="h-1.5 w-10 rounded bg-gray-200 mt-1.5" />
          </div>
        ))}
      </div>

      {/* Table header */}
      <div className="flex gap-2 mb-2 px-1">
        <div className="flex-1 h-2 rounded bg-gray-300" />
        <div className="w-16 h-2 rounded bg-gray-300" />
      </div>

      {/* Table rows */}
      {TABLE_ROWS.map((row) => (
        <div
          key={row.name}
          className="flex items-center gap-2 py-1.5 border-t border-gray-100"
        >
          <div className="flex-1 h-2 rounded bg-gray-200" />
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${row.color}`}
          >
            {row.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AuthHero() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[#1a1c2e] flex-col px-12 py-10 relative overflow-hidden">
      {/* Logo */}
      <div className="relative z-10 flex items-center gap-3 animate-fade-up [animation-delay:0ms]">
        {LOGO}
        <span className="text-white font-semibold text-lg">
          Project Manager
        </span>
      </div>

      {/* Floating mock UI */}
      <div className="flex-1 relative animate-fade-up [animation-delay:100ms]">
        <SidebarMock />
        <DashboardMock />
      </div>

      {/* Marketing text */}
      <div className="relative z-10 animate-fade-up [animation-delay:200ms]">
        <h1 className="text-white text-4xl font-bold leading-tight mb-3">
          Plan, track &amp; deliver
          <br />
          work together
        </h1>
        <p className="text-slate-400 text-base leading-relaxed">
          Organize your team's projects, track progress in real-time, and hit
          every deadline — all in one place.
        </p>
      </div>
    </div>
  );
}
