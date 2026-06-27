"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "@/lib/auth-client";
import { 
  Mic2, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  History, 
  BookOpen, 
  Shield,
  Home,
  Users,
  Lightbulb
} from "lucide-react";

export function Navbar() {
  const { data: session, isPending } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const router = useRouter();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        }
      }
    });
  };

  // Get user initials for avatar
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // Define navigation links based on auth state
  const authLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/practice", label: "Practice", icon: BookOpen },
    { href: "/history", label: "History", icon: History },
    { href: "/examiners", label: "AI Examiners", icon: Users },
    { href: "/tips", label: "IELTS Tips", icon: Lightbulb }
  ];

  const guestLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/examiners", label: "AI Examiners", icon: Users },
    { href: "/tips", label: "IELTS Tips", icon: Lightbulb }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--line)] bg-[#fbfaf7]/85 backdrop-blur-md transition-all duration-200">
      <div className="lab-shell flex h-16 items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="group flex items-center gap-2.5 font-bold text-[var(--navy)] text-lg transition-transform active:scale-95">
          <span className="relative flex size-9 items-center justify-center rounded-xl overflow-hidden shadow-md">
            <Image
              src="/logo.png"
              alt="SpeakIELTS AI"
              width={36}
              height={36}
              className="object-cover"
            />
          </span>
          <span className="tracking-tight hover:text-[var(--magenta)] transition-colors">SpeakIELTS AI</span>
        </Link>

        {/* Desktop Links (Center) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {user ? (
            authLinks.map((link) => {
              const active = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    active 
                      ? "text-[var(--magenta)] bg-pink-500/5" 
                      : "text-slate-600 hover:text-[var(--navy)] hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-[var(--magenta)] rounded-full" />
                  )}
                </Link>
              );
            })
          ) : (
            guestLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                    active 
                      ? "text-[var(--magenta)] bg-pink-500/5" 
                      : "text-slate-600 hover:text-[var(--navy)] hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute bottom-1.5 left-4 right-4 h-0.5 bg-[var(--magenta)] rounded-full" />
                  )}
                </Link>
              );
            })
          )}
        </nav>

        {/* Desktop Controls (Right) */}
        <div className="hidden md:flex items-center gap-3">
          {isPending ? (
            <div className="size-9 rounded-xl bg-slate-100 animate-pulse" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100 transition-colors focus:outline-none"
                aria-label="User menu"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    width={36}
                    height={36}
                    unoptimized
                    className="size-9 rounded-xl object-cover shadow-inner"
                  />
                ) : (
                  <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] text-sm font-bold text-white shadow-sm">
                    {getInitials(user.name)}
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-700 max-w-[120px] truncate">{user.name.split(" ")[0]}</span>
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl border border-[var(--line)] bg-white p-2 shadow-xl shadow-slate-900/5 focus:outline-none animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    {user.role === "ADMIN" && (
                      <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        <Shield size={10} /> Admin
                      </span>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <LayoutDashboard size={16} className="text-slate-400" />
                    Dashboard
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={16} className="text-slate-400" />
                    Settings
                  </Link>

                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[var(--magenta)] hover:bg-pink-50 transition-colors"
                    >
                      <Shield size={16} />
                      Admin Control
                    </Link>
                  )}

                  <hr className="my-1 border-slate-100" />

                  <button
                    onClick={() => void handleSignOut()}
                    className="flex items-center gap-2.5 w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50/50 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link 
                href="/sign-in" 
                className="text-sm font-semibold text-slate-600 hover:text-[var(--navy)] transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link 
                href="/sign-up" 
                className="focus-ring text-sm font-semibold text-white bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] hover:brightness-105 active:scale-95 transition-all shadow-md shadow-pink-500/10 px-4 py-2.5 rounded-xl"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex md:hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-[var(--navy)] transition-colors focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[#fbfaf7] py-4 shadow-inner px-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col gap-1">
            {user ? (
              authLinks.map((link) => {
                const active = pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      active 
                        ? "text-[var(--magenta)] bg-pink-500/5" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <link.icon size={16} className={active ? "text-[var(--magenta)]" : "text-slate-400"} />
                    {link.label}
                  </Link>
                );
              })
            ) : (
              guestLinks.map((link) => {
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                      active 
                        ? "text-[var(--magenta)] bg-pink-500/5" 
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <link.icon size={16} className={active ? "text-[var(--magenta)]" : "text-slate-400"} />
                    {link.label}
                  </Link>
                );
              })
            )}
          </div>

          <hr className="border-[var(--line)]" />

          {/* Mobile Auth Button controls */}
          <div className="px-2 pb-2">
            {isPending ? (
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 py-1">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={40}
                      height={40}
                      unoptimized
                      className="size-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--violet)] to-[var(--magenta)] text-sm font-bold text-white">
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Link
                    href="/settings"
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <Settings size={14} />
                    Settings
                  </Link>
                  {user.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2.5 text-center text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                    >
                      <Shield size={14} />
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => void handleSignOut()}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/50 px-3 py-2.5 text-center text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors ${
                      user.role === "ADMIN" ? "col-span-2" : "col-span-1"
                    }`}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link 
                  href="/sign-in" 
                  className="flex w-full items-center justify-center rounded-xl border border-[var(--line)] bg-white py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Sign in
                </Link>
                <Link 
                  href="/sign-up" 
                  className="flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-[var(--magenta)] to-[var(--violet)] py-3 text-center text-sm font-semibold text-white hover:brightness-105 active:scale-98 transition-all"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
