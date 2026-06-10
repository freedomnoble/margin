import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import { BusinessProvider, useBusiness } from "@/context/BusinessContext";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutGrid,
  Package,
  Coins,
  Map,
  ChevronsUpDown,
  Plus,
  LogOut,
  Check,
  Building2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutGrid, end: true, testId: "nav-dashboard" },
  { to: "/offers", label: "Your Offers", icon: Package, testId: "nav-offers" },
  { to: "/models", label: "Money Models", icon: Coins, testId: "nav-models" },
  { to: "/journey", label: "Journey", icon: Map, testId: "nav-journey" },
];

function CreateBusinessDialog({ open, onOpenChange }) {
  const { createBusiness } = useBusiness();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createBusiness(name.trim());
      toast.success(`"${name.trim()}" created`);
      setName("");
      onOpenChange(false);
    } catch {
      toast.error("Couldn't create the business. Try again.");
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Add a business</DialogTitle>
          <DialogDescription>
            Each business keeps its own offers, money model and journey. Switch anytime.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Input
            data-testid="new-business-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Coffee Cart"
            autoFocus
            className="h-11 focus-visible:ring-black"
          />
          <Button
            type="submit"
            data-testid="new-business-submit"
            disabled={saving || !name.trim()}
            className="w-full bg-black text-white hover:bg-black/80"
          >
            {saving ? "Creating..." : "Create business"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BusinessSwitcher() {
  const { businesses, current, selectBusiness } = useBusiness();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            data-testid="business-switcher"
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors duration-200 text-sm font-medium max-w-[180px] sm:max-w-[240px]"
          >
            <Building2 size={15} className="shrink-0 text-neutral-500" />
            <span className="truncate">{current?.name || "Select"}</span>
            <ChevronsUpDown size={14} className="shrink-0 text-neutral-400" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-60">
          <DropdownMenuLabel className="text-xs uppercase tracking-widest text-neutral-400">
            Your businesses
          </DropdownMenuLabel>
          {(businesses || []).map((b) => (
            <DropdownMenuItem
              key={b.id}
              data-testid={`business-option-${b.id}`}
              onClick={() => selectBusiness(b.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">{b.name}</span>
              {current?.id === b.id && <Check size={14} />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="add-business-button"
            onClick={() => setDialogOpen(true)}
            className="cursor-pointer font-medium"
          >
            <Plus size={14} className="mr-2" /> Add a business
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateBusinessDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}

function FirstBusinessScreen() {
  const { createBusiness } = useBusiness();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await createBusiness(name.trim());
      toast.success("Let's figure out your numbers!");
    } catch {
      toast.error("Couldn't create the business. Try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md text-center fade-up">
        <span className="font-heading font-extrabold text-2xl tracking-tight">margin.</span>
        <h1 className="mt-10 font-heading font-extrabold text-3xl sm:text-4xl tracking-tight">
          What's your business called?
        </h1>
        <p className="mt-3 text-neutral-500 text-sm leading-relaxed">
          Don't overthink it — you can add more businesses later and switch between them, like
          channels in a chat app.
        </p>
        <form onSubmit={submit} className="mt-8 space-y-3">
          <Input
            data-testid="first-business-name-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Coffee Cart"
            autoFocus
            className="h-12 text-center text-base focus-visible:ring-black"
          />
          <Button
            type="submit"
            data-testid="first-business-submit"
            disabled={saving || !name.trim()}
            className="w-full h-12 bg-black text-white hover:bg-black/80 active:scale-[0.98] transition-all duration-200"
          >
            {saving ? "Setting up..." : "Let's go →"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Shell() {
  const { businesses } = useBusiness();
  const { user, logout } = useAuth();

  if (businesses === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (businesses.length === 0) return <FirstBusinessScreen />;

  const initials = (user?.name || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-16 flex items-center gap-4">
          <span className="font-heading font-extrabold text-lg tracking-tight hidden sm:block">
            margin.
          </span>
          <BusinessSwitcher />
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                data-testid={item.testId}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive ? "bg-black text-white" : "text-neutral-500 hover:text-black hover:bg-neutral-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  data-testid="user-menu-button"
                  className="w-9 h-9 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center hover:bg-black/80 transition-colors duration-200"
                >
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-neutral-400 truncate">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  data-testid="logout-button"
                  onClick={logout}
                  className="cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" /> Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 sm:py-12 pb-28 md:pb-16">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-md border-t border-neutral-200 flex">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              data-testid={`${item.testId}-mobile`}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors duration-200 ${
                  isActive ? "text-black" : "text-neutral-400"
                }`
              }
            >
              <Icon size={20} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function Layout() {
  return (
    <BusinessProvider>
      <Shell />
    </BusinessProvider>
  );
}
