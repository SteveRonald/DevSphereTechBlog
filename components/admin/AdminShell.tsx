"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  BookOpen,
  CreditCard,
  FileCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  BarChart3,
  Settings,
  Users,
  FileText,
  FolderOpen,
  Briefcase,
  GraduationCap,
  Star,
} from "lucide-react";

interface AdminShellProps {
  title: string;
  subtitle?: string;
  userEmail?: string | null;
  userName?: string | null;
  onSignOut: () => Promise<void> | void;
  children: ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

export function AdminShell({
  title,
  subtitle,
  userEmail,
  userName,
  onSignOut,
  children,
}: AdminShellProps) {
  const pathname = usePathname();

  const groups: NavGroup[] = [
    {
      title: "Dashboard",
      items: [
        {
          label: "Overview",
          href: "/admin-courses-management",
          icon: <LayoutDashboard className="h-4 w-4" />,
        },
        {
          label: "Analytics",
          href: "/admin-analytics",
          icon: <BarChart3 className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Content",
      items: [
        {
          label: "Blog Posts",
          href: "/admin-blog-management",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          label: "Careers",
          href: "/admin-career-management",
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          label: "Reviews",
          href: "/admin-review-management",
          icon: <Star className="h-4 w-4" />,
        },
        {
          label: "Authors",
          href: "/admin-author-management",
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Categories",
          href: "/admin-category-management",
          icon: <FolderOpen className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Courses",
      items: [
        {
          label: "Courses",
          href: "/admin-courses-management",
          icon: <GraduationCap className="h-4 w-4" />,
        },
        {
          label: "Quiz Reviews",
          href: "/admin-quiz-reviews",
          icon: <FileCheck className="h-4 w-4" />,
        },
        {
          label: "Project Reviews",
          href: "/admin-project-reviews",
          icon: <FileCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Users",
      items: [
        {
          label: "Users",
          href: "/admin-users",
          icon: <Users className="h-4 w-4" />,
        },
        {
          label: "Subscribers",
          href: "/admin-subscribers",
          icon: <CreditCard className="h-4 w-4" />,
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          label: "Settings",
          href: "/admin-settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
  ];

  const initials = (userName || userEmail || "A")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "A";

  const Sidebar = ({ className }: { className?: string }) => (
    <aside
      className={cn(
        "flex h-full w-full flex-col",
        "bg-card/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate font-google-sans">Admin</p>
            <p className="text-xs text-muted-foreground truncate font-google-sans">CodeCraft Academy</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 text-xs font-medium text-muted-foreground mb-2 font-google-sans">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-muted/60"
                    )}
                  >
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Separator />

      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{userName || "Admin"}</p>
            <p className="text-xs text-muted-foreground truncate">{userEmail || ""}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full mt-3 gap-2"
          onClick={() => void onSignOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex h-full">
        <div className="hidden lg:block w-72 border-r border-border">
          <Sidebar className="h-full" />
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="sticky top-0 z-40 border-b border-border bg-card/50 backdrop-blur-sm">
            <div className="px-4 md:px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-80">
                    <Sidebar className="h-full" />
                  </SheetContent>
                </Sheet>

                <div className="min-w-0">
                  <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
                  {subtitle ? (
                    <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
                  ) : null}
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/">View Site</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/studio">CMS Studio</Link>
                </Button>
              </div>
            </div>
          </div>

          <main className="flex-1 overflow-y-auto px-4 md:px-6 py-8 md:py-12">{children}</main>
        </div>
      </div>
    </div>
  );
}
