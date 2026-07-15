'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  EmptyState,
  PageHeader,
} from '@castaminofen/ui';
import {
  Activity,
  Bell,
  Bot,
  Boxes,
  BriefcaseBusiness,
  ChevronRight,
  Command,
  Compass,
  Database,
  FileText,
  Flag,
  FolderPlus,
  Gauge,
  HardDrive,
  LayoutGrid,
  ListFilter,
  Lock,
  LogOut,
  Mic,
  MonitorPlay,
  Moon,
  PanelLeftClose,
  PlayCircle,
  RadioTower,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UploadCloud,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { dashboardActivity, dashboardChartData, dashboardMetrics } from '../lib/admin-data';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/analytics', label: 'Analytics', icon: Gauge },
  { href: '/users', label: 'Users', icon: Users },
  { href: '/channels', label: 'Channels', icon: MonitorPlay },
  { href: '/podcasts', label: 'Podcasts', icon: Mic },
  { href: '/episodes', label: 'Episodes', icon: PlayCircle },
  { href: '/categories', label: 'Categories', icon: FolderPlus },
  { href: '/tags', label: 'Tags', icon: Sparkles },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/media-library', label: 'Media Library', icon: Database },
  { href: '/uploads', label: 'Uploads', icon: UploadCloud },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/moderation-queue', label: 'Moderation Queue', icon: ShieldCheck },
  { href: '/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/roles', label: 'Roles', icon: BriefcaseBusiness },
  { href: '/permissions', label: 'Permissions', icon: Lock },
  { href: '/settings', label: 'Settings', icon: Settings },
  { href: '/feature-flags', label: 'Feature Flags', icon: Flag },
  { href: '/system-health', label: 'System Health', icon: Activity },
  { href: '/queues', label: 'Queues', icon: Boxes },
  { href: '/workers', label: 'Workers', icon: Bot },
  { href: '/storage', label: 'Storage', icon: HardDrive },
  { href: '/search-index', label: 'Search Index', icon: Search },
  { href: '/realtime-status', label: 'Realtime Status', icon: RadioTower },
];

const sections = [
  {
    title: 'Operations',
    items: navigation.slice(0, 8),
  },
  {
    title: 'Governance',
    items: navigation.slice(8, 16),
  },
  {
    title: 'Infrastructure',
    items: navigation.slice(16),
  },
];

function ModuleCard({
  href,
  label,
  icon: Icon,
  description,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-2xl border p-4 transition ${
        active
          ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-600 dark:bg-sky-950/50 dark:text-sky-200'
          : 'border-slate-200 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-800'
      }`}
    >
      <div className="rounded-xl bg-slate-900/5 p-2.5 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-medium">{label}</div>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      <ChevronRight className="ml-auto mt-1 h-4 w-4 opacity-60 transition group-hover:translate-x-0.5" />
    </Link>
  );
}

function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Enterprise Operations Center"
        description="Monitor platform health, content operations, and governance workflows from one secure command surface."
        eyebrow="Admin Dashboard"
        actions={
          <div className="flex gap-2">
            <Button variant="outline">Export report</Button>
            <Button>New workflow</Button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Live platform health</CardTitle>
                <CardDescription>Operational pulse over the last six months.</CardDescription>
              </div>
              <Badge variant="success">Stable</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {dashboardMetrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
                >
                  <p className="text-sm text-slate-500">{metric.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    {metric.value}
                  </p>
                  <p
                    className={`mt-1 text-sm ${metric.positive ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {metric.delta}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 flex h-48 items-end gap-3">
              {dashboardChartData.map((point) => (
                <div key={point.label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end rounded-2xl bg-slate-100 p-2 dark:bg-slate-800">
                    <div
                      className="w-full rounded-xl bg-gradient-to-t from-sky-600 to-cyan-400"
                      style={{ height: `${Math.max(point.value, 28)}px` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-500">{point.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>High-impact updates requiring attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardActivity.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/50"
              >
                <p className="font-medium text-slate-900 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{item.detail}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-500">
                  {item.timestamp}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick access modules</CardTitle>
          <CardDescription>Jump into your most-used control surfaces.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {navigation.slice(0, 9).map((item) => (
            <ModuleCard
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              description={`${item.label} workspace for operations and reporting.`}
            />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function GenericPage({
  title,
  description,
  badgeText,
}: {
  title: string;
  description: string;
  badgeText: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        eyebrow="Operations Module"
        actions={<Badge variant="secondary">{badgeText}</Badge>}
      />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Work queue</CardTitle>
              <CardDescription>
                Filters, sorting, bulk actions, and review flows are available for this section.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
              <ListFilter className="h-4 w-4" />
              Filters
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
              <Compass className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">
              Production-ready module shell
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              This section is wired for data tables, dialogs, empty states, pagination, and
              confirmation flows while preserving the existing business logic surface.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button variant="outline">Open filters</Button>
              <Button>Review queue</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <EmptyState
        title="No items yet"
        description="New records will appear here once your workflows begin producing activity for this module."
        actionLabel="Create record"
        actionHref="/dashboard"
      />
    </div>
  );
}

export function NewAdminDashboardShell() {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchValue, setSearchValue] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('admin-theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme ?? 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem('admin-theme') as 'light' | 'dark' | null;
    const initialTheme = storedTheme ?? 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    window.localStorage.setItem('admin-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setShowCommandPalette(true);
      }
      if (event.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const currentPath = pathname?.split('/').filter(Boolean).pop() ?? 'dashboard';
  const pageTitle = useMemo(() => {
    const entry = navigation.find((item) => item.href === pathname);
    return entry?.label ?? 'Overview';
  }, [pathname]);

  const content = (() => {
    if (pathname?.includes('/dashboard') || pathname === '/') return <OverviewPage />;
    if (pathname?.includes('/analytics'))
      return (
        <GenericPage
          title="Analytics"
          description="Track revenue, retention, and platform performance with decision-ready insights."
          badgeText="Live analytics"
        />
      );
    if (pathname?.includes('/users'))
      return (
        <GenericPage
          title="Users"
          description="Review account health, RBAC assignments, and activation signals."
          badgeText="Identity"
        />
      );
    if (pathname?.includes('/channels'))
      return (
        <GenericPage
          title="Channels"
          description="Coordinate publishing lines and distribution policies."
          badgeText="Broadcast"
        />
      );
    if (pathname?.includes('/podcasts'))
      return (
        <GenericPage
          title="Podcasts"
          description="Manage series launches, editorial calendars, and release sequencing."
          badgeText="Content"
        />
      );
    if (pathname?.includes('/episodes'))
      return (
        <GenericPage
          title="Episodes"
          description="Inspect content readiness, publishing status, and review checkpoints."
          badgeText="Workflow"
        />
      );
    if (pathname?.includes('/categories'))
      return (
        <GenericPage
          title="Categories"
          description="Tune discoverability and governance across taxonomy groups."
          badgeText="Taxonomy"
        />
      );
    if (pathname?.includes('/tags'))
      return (
        <GenericPage
          title="Tags"
          description="Curate tags, trending topics, and search metadata."
          badgeText="Discovery"
        />
      );
    if (pathname?.includes('/reports'))
      return (
        <GenericPage
          title="Reports"
          description="Share executive-facing summaries and anomalies."
          badgeText="Insights"
        />
      );
    if (pathname?.includes('/media-library'))
      return (
        <GenericPage
          title="Media Library"
          description="Browse assets, usage rights, and delivery readiness."
          badgeText="Assets"
        />
      );
    if (pathname?.includes('/uploads'))
      return (
        <GenericPage
          title="Uploads"
          description="Track batches, retries, and processing state in real time."
          badgeText="Ops"
        />
      );
    if (pathname?.includes('/notifications'))
      return (
        <GenericPage
          title="Notifications"
          description="Configure push, email, and in-app alert delivery."
          badgeText="Comm"
        />
      );
    if (pathname?.includes('/moderation-queue'))
      return (
        <GenericPage
          title="Moderation Queue"
          description="Review flagged content with policy and escalation context."
          badgeText="Safety"
        />
      );
    if (pathname?.includes('/audit-logs'))
      return (
        <GenericPage
          title="Audit Logs"
          description="Investigate every operational event with compliance detail."
          badgeText="Compliance"
        />
      );
    if (pathname?.includes('/roles'))
      return (
        <GenericPage
          title="Roles"
          description="Align administrative coverage with organizational structure."
          badgeText="RBAC"
        />
      );
    if (pathname?.includes('/permissions'))
      return (
        <GenericPage
          title="Permissions"
          description="Define least-privilege access policies and approvals."
          badgeText="Governance"
        />
      );
    if (pathname?.includes('/settings'))
      return (
        <GenericPage
          title="Settings"
          description="Manage platform preferences and defaults elegantly."
          badgeText="Config"
        />
      );
    if (pathname?.includes('/feature-flags'))
      return (
        <GenericPage
          title="Feature Flags"
          description="Roll features safely with staged exposure controls."
          badgeText="Release"
        />
      );
    if (pathname?.includes('/system-health'))
      return (
        <GenericPage
          title="System Health"
          description="Surface runtime health, incidents, and dependencies."
          badgeText="SRE"
        />
      );
    if (pathname?.includes('/queues'))
      return (
        <GenericPage
          title="Queues"
          description="Track background jobs and process throughput."
          badgeText="Workers"
        />
      );
    if (pathname?.includes('/workers'))
      return (
        <GenericPage
          title="Workers"
          description="Inspect workers, concurrency, and runtime saturation."
          badgeText="Execution"
        />
      );
    if (pathname?.includes('/storage'))
      return (
        <GenericPage
          title="Storage"
          description="Monitor capacity plans and retention policies."
          badgeText="Infrastructure"
        />
      );
    if (pathname?.includes('/search-index'))
      return (
        <GenericPage
          title="Search Index"
          description="Watch indexing health and retrieval quality."
          badgeText="Discovery"
        />
      );
    if (pathname?.includes('/realtime-status'))
      return (
        <GenericPage
          title="Realtime Status"
          description="Observe connection health and event propagation."
          badgeText="Realtime"
        />
      );
    return <OverviewPage />;
  })();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,_#f8fbff_0%,_#f4f7fb_100%)] text-slate-900 transition-colors dark:bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_28%),linear-gradient(135deg,_#020617_0%,_#0f172a_100%)] dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-7xl gap-4 px-3 py-3 lg:px-5">
        <aside
          className={`hidden shrink-0 flex-col rounded-[28px] border border-slate-200/80 bg-white/70 p-3 shadow-sm backdrop-blur lg:flex ${sidebarOpen ? 'w-72' : 'w-24'}`}
        >
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-600 p-2.5 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              {sidebarOpen ? (
                <div>
                  <p className="text-sm font-semibold">Castaminofen</p>
                  <p className="text-xs text-slate-500">Admin Console</p>
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen((value) => !value)}
              className="h-8 w-8 p-0"
              aria-label="Toggle sidebar"
            >
              <PanelLeftClose className={`h-4 w-4 transition ${sidebarOpen ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          <div className="mt-4 flex-1 space-y-4 overflow-auto">
            {sections.map((section) => (
              <div key={section.title}>
                {sidebarOpen ? (
                  <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                    {section.title}
                  </p>
                ) : null}
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
                          active
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {sidebarOpen ? <span>{item.label}</span> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col gap-4">
          <header className="rounded-[28px] border border-slate-200/80 bg-white/70 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0 lg:hidden"
                  onClick={() => setSidebarOpen((value) => !value)}
                  aria-label="Toggle navigation"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {pageTitle}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span>Operations</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {currentPath}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-end gap-2">
                <label className="flex min-w-[220px] items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                  <Search className="h-4 w-4" />
                  <input
                    id="global-search"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder="Search workspace"
                    className="w-full bg-transparent outline-none"
                  />
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setShowCommandPalette(true)}
                  aria-label="Open command palette"
                >
                  <Command className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setShowNotifications((value) => !value)}
                  aria-label="Open notifications"
                >
                  <Bell className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-950"
                    >
                      <div className="rounded-full bg-sky-600 px-2.5 py-1 text-sm font-semibold text-white">
                        SR
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-sm font-medium">Sarah Rahimi</p>
                        <p className="text-xs text-slate-500">Admin</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Account settings
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <main className="flex-1 rounded-[32px] border border-slate-200/80 bg-white/60 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/60 lg:p-6">
            {content}
          </main>

          {showNotifications ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-4 top-24 z-20 w-[360px] rounded-[24px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Notifications</p>
                  <p className="text-sm text-slate-500">3 urgent updates</p>
                </div>
                <Badge variant="warning">Live</Badge>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  {
                    title: 'Moderation queue',
                    detail: '6 new items require review.',
                    time: '2 min ago',
                  },
                  {
                    title: 'Storage warning',
                    detail: 'Usage reached 82% of allocated capacity.',
                    time: '12 min ago',
                  },
                  {
                    title: 'Release approved',
                    detail: 'Staged rollout is ready for deployment.',
                    time: '45 min ago',
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.3em] text-slate-400">
                      {item.time}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          {showCommandPalette ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-30 flex items-start justify-center bg-slate-950/60 px-4 py-24"
            >
              <div className="w-full max-w-2xl rounded-[28px] border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-800 dark:bg-slate-950">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    autoFocus
                    className="w-full bg-transparent outline-none"
                    placeholder="Type a command or page"
                  />
                </div>
                <div className="mt-4 grid gap-2 md:grid-cols-2">
                  {navigation.slice(0, 8).map((item) => (
                    <button
                      key={item.href}
                      type="button"
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm dark:border-slate-800 dark:bg-slate-950"
                      onClick={() => setShowCommandPalette(false)}
                    >
                      <span>{item.label}</span>
                      <Command className="h-4 w-4 text-slate-400" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
