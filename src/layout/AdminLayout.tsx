import { Navigate, NavLink, Outlet } from "react-router-dom";
import { Diamond } from "lucide-react";
import clsx from "clsx";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { useNavigate } from "react-router-dom";

const TABS = [
  { to: "/admin", label: "Overview", end: true },
  { to: "/admin/organizations", label: "Organizations", end: false },
  { to: "/admin/users", label: "Users", end: false },
  { to: "/admin/plans", label: "Plans", end: false },
  { to: "/admin/coupons", label: "Coupons", end: false },
  { to: "/admin/payments", label: "Payments", end: false },
];

export function AdminLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSuperadmin = useAuthStore((s) => s.profile?.isSuperadmin);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isSuperadmin) return <Navigate to="/orgs" replace />;

  return (
    <div className="h-screen overflow-y-auto px-4 sm:px-8 pt-6 pb-8 bg-canvas">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] flex-none rounded-full bg-accent2-200 text-accent2-700 flex items-center justify-center">
            <Diamond size={16} />
          </div>
          <h2 className="font-heading text-[26px] sm:text-[32px] leading-tight">
            Platform admin
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {/* <Button variant="secondary" size="sm" onClick={() => navigate('/orgs')}>← Back to organizations</Button> */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
      <p className="text-neutral-600 mb-6 max-w-2xl">
        Every tenant on manage-me, outside any single organization's scope.
        Ordinary org data stays invisible to org admins from here on down.
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6 bg-neutral-100 rounded-full p-1.5 w-fit max-w-full overflow-x-auto">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              clsx(
                "px-4 py-2 rounded-full text-[13.5px] font-semibold whitespace-nowrap no-underline text-ink transition-colors",
                isActive ? "bg-accent text-canvas" : "hover:bg-ink/7",
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
