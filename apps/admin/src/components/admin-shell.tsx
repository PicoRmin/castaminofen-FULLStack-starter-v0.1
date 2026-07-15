'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  dashboardActivity,
  dashboardChartData,
  dashboardMetrics,
  demoUsers,
  moduleCatalog,
  moduleDataMap,
  roleMatrix,
} from '../lib/admin-data';

type UserRole = 'Admin' | 'Moderator' | 'Analyst' | 'Viewer';

type ModuleRow = {
  id: string;
  name: string;
  status: string;
  owner: string;
  updatedAt: string;
  priority: string;
  score?: number;
  region?: string;
};

interface AuthState {
  user: (typeof demoUsers)[number] | null;
}

const roleAccess = (role: UserRole) => {
  const all = [
    'dashboard',
    'users',
    'channels',
    'podcasts',
    'episodes',
    'categories',
    'tags',
    'reports',
    'storage',
    'uploads',
    'roles',
    'permissions',
    'feature-flags',
    'settings',
    'notifications',
    'system-health',
    'jobs',
    'media',
    'audit-logs',
  ];
  if (role === 'Admin') return all;
  if (role === 'Moderator')
    return ['dashboard', 'channels', 'podcasts', 'episodes', 'reports', 'notifications', 'media'];
  if (role === 'Analyst') return ['dashboard', 'reports', 'system-health', 'audit-logs'];
  return ['dashboard', 'notifications', 'settings'];
};

const statusPalette: Record<string, string> = {
  Healthy: 'status-healthy',
  'Needs Attention': 'status-attention',
  Scheduled: 'status-scheduled',
  Draft: 'status-draft',
  'In Review': 'status-review',
};

function getModuleSummary(slug: string) {
  switch (slug) {
    case 'users':
      return {
        title: 'مدیریت حساب‌های سازمانی',
        description: 'حذف/افزودن کاربر، بازبینی سطح دسترسی و پیگیری فعالیت‌ها.',
      };
    case 'channels':
      return {
        title: 'کنترل کانال‌های انتشار',
        description: 'تعیین سطح دسترسی، برنامه زمان‌بندی و سلامت پخش.',
      };
    case 'podcasts':
      return {
        title: 'برنامه‌ریزی سری‌های صوتی',
        description: 'سازمان‌دهی پادکست‌ها و کنترل چرخه انتشار.',
      };
    case 'episodes':
      return {
        title: 'مدیریت قسمت‌ها',
        description: 'پیگیری نسخه‌ها، ویرایش و آماده‌سازی برای انتشار.',
      };
    case 'categories':
      return {
        title: 'طبقه‌بندی محتوایی',
        description: 'بهینه‌سازی دسترسی و کشف محتوا بر اساس دسته‌بندی.',
      };
    case 'tags':
      return {
        title: 'تگ‌های مؤثر',
        description: 'مدیریت تگ‌های پیشنهادی و دسته‌بندی‌های سئوی محتوایی.',
      };
    case 'reports':
      return { title: 'تحلیل و گزارش', description: 'مقایسه شاخص‌های رشد و بازدهی محتوا.' };
    case 'storage':
      return { title: 'فضای ذخیره', description: 'پایش ظرفیت، نگهداری و هزینه‌های بایگانی.' };
    case 'uploads':
      return { title: 'بارگذاری‌های رسانه', description: 'ردیابی پردازش، خطا و زمان پایان.' };
    case 'roles':
      return { title: 'نقش‌های سازمانی', description: 'مدیریت سلسله‌مراتب و سطح کنترل کاربران.' };
    case 'permissions':
      return { title: 'مجوزهای دقیق', description: 'پیکربندی دسترسی بر اساس واحدها و وظایف.' };
    case 'feature-flags':
      return { title: 'پرچم‌های ویژگی', description: 'انتشار تدریجی و کنترل ریسک.' };
    case 'settings':
      return { title: 'تنظیمات سراسری', description: 'پیکربندی برند، شبکه و سیاست‌های داخلی.' };
    case 'notifications':
      return { title: 'سیستم اعلان', description: 'ارسال، زمان‌بندی و نظارت روی اعلان‌ها.' };
    case 'system-health':
      return { title: 'سلامت زیرساخت', description: 'نظارت روی API، Queue و سرویس‌های حیاتی.' };
    case 'jobs':
      return {
        title: 'کارهای پس‌زمینه',
        description: 'برنامه‌ریزی، زمان‌بندی و مانیتورینگ وظایف.',
      };
    case 'media':
      return { title: 'مدیریت رسانه', description: 'کنترل فایل‌های ویدیویی، صوتی و تصویری.' };
    case 'audit-logs':
      return {
        title: 'لاگ‌های ممیزی',
        description: 'ثبت و جست‌وجوی رویدادهای حساس و قابل پیگیری.',
      };
    default:
      return {
        title: 'ماژول مدیریتی',
        description: 'ابزارهای اجرایی و نظارتی برای تیم‌های عملیاتی.',
      };
  }
}

function DashboardView() {
  return (
    <div className="dashboard-shell">
      <section className="panel panel-hero">
        <div className="hero-top">
          <div>
            <p className="eyebrow">پنل مدیریتی سازمانی</p>
            <h2>نمای کلی عملکرد و کنترل عملیات</h2>
            <p>
              در این بخش شاخص‌های اصلی، رویدادهای اخیر و نقش‌های دسترسی در یک نماگزار حرفه‌ای دیده
              می‌شوند.
            </p>
          </div>
          <div className="pill success">فعال و پایدار</div>
        </div>
        <div className="metrics-grid">
          {dashboardMetrics.map((metric) => (
            <div key={metric.label} className="metric-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <em className={metric.positive ? 'positive' : 'negative'}>{metric.delta}</em>
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel chart-panel">
          <div className="section-title-row">
            <h3>روند رشد</h3>
            <span>۶ ماه اخیر</span>
          </div>
          <div className="chart-bars">
            {dashboardChartData.map((point) => (
              <div key={point.label} className="bar-column">
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${Math.max(point.value, 28)}px` }} />
                </div>
                <label>{point.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="section-title-row">
            <h3>فعالیت اخیر</h3>
            <span>مانیتورینگ لحظه‌ای</span>
          </div>
          <div className="activity-list">
            {dashboardActivity.map((item) => (
              <article key={item.title} className="activity-item">
                <div className="activity-title">{item.title}</div>
                <div className="activity-detail">{item.detail}</div>
                <div className="activity-time">{item.timestamp}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-title-row">
          <h3>نقش‌ها و سطح دسترسی</h3>
          <span>RBAC • احراز هویت</span>
        </div>
        <div className="role-grid">
          {roleMatrix.map((row) => (
            <div key={row.role} className="role-card">
              <strong>{row.role}</strong>
              <p>{row.scope}</p>
              <span>{row.control}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulePage({ slug, title }: { slug: string; title: string }) {
  const initialRows = (moduleDataMap[slug] ?? []) as ModuleRow[];
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ModuleRow[]>(initialRows);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', owner: '', status: 'Healthy', priority: 'High' });

  useEffect(() => {
    setRows(initialRows);
    setPage(1);
  }, [slug]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesSearch = `${row.name} ${row.owner} ${row.id}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesStatus = status === 'all' || row.status === status;
      const matchesPriority = priority === 'all' || row.priority === priority;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [rows, search, status, priority]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / 5));
  const pagedRows = filteredRows.slice((page - 1) * 5, page * 5);

  useEffect(() => {
    setPage(1);
  }, [search, status, priority]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: '', owner: '', status: 'Healthy', priority: 'High' });
    setModalOpen(true);
  };

  const openEdit = (row: ModuleRow) => {
    setEditingId(row.id);
    setForm({ name: row.name, owner: row.owner, status: row.status, priority: row.priority });
    setModalOpen(true);
  };

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const newRow: ModuleRow = {
      id: editingId ?? `NEW-${rows.length + 1}`,
      name: form.name,
      owner: form.owner || 'Ops',
      status: form.status as ModuleRow['status'],
      updatedAt: 'همین الان',
      priority: form.priority as ModuleRow['priority'],
      score: 90,
    };
    if (editingId) {
      setRows((current) =>
        current.map((row) => (row.id === editingId ? { ...row, ...newRow } : row)),
      );
    } else {
      setRows((current) => [newRow, ...current]);
    }
    setModalOpen(false);
  };

  const summary = getModuleSummary(slug);

  return (
    <div className="module-layout">
      <section className="panel panel-summary">
        <div>
          <p className="eyebrow">{title}</p>
          <h2>{summary.title}</h2>
          <p>{summary.description}</p>
        </div>
        <div className="toolbar">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="جست‌وجو در این ماژول..."
          />
          <button className="button-primary" onClick={openCreate}>
            + افزودن مورد جدید
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="table-toolbar">
          <div className="pill neutral">فیلترها · جست‌وجو · صفحه‌بندی</div>
          <div className="filter-group">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="all">همه وضعیت‌ها</option>
              <option value="Healthy">Healthy</option>
              <option value="Needs Attention">Needs Attention</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Draft">Draft</option>
              <option value="In Review">In Review</option>
            </select>
            <select value={priority} onChange={(event) => setPriority(event.target.value)}>
              <option value="all">همه اولویت‌ها</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>شناسه</th>
                <th>نام</th>
                <th>وضعیت</th>
                <th>مالک</th>
                <th>آخرین بروزرسانی</th>
                <th>اولویت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.id}</td>
                  <td>{row.name}</td>
                  <td>
                    <span
                      className={`status-badge ${statusPalette[row.status] ?? 'status-default'}`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>{row.owner}</td>
                  <td>{row.updatedAt}</td>
                  <td>{row.priority}</td>
                  <td>
                    <button className="button-secondary" onClick={() => openEdit(row)}>
                      ویرایش
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>
            نمایش{' '}
            {filteredRows.length
              ? `${(page - 1) * 5 + 1}-${Math.min(page * 5, filteredRows.length)}`
              : '0'}{' '}
            از {filteredRows.length} مورد
          </span>
          <div className="pagination-actions">
            <button
              className="button-secondary"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              قبلی
            </button>
            <button
              className="button-primary"
              disabled={page >= pageCount}
              onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            >
              بعدی
            </button>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingId ? 'ویرایش رکورد' : 'افزودن رکورد جدید'}</h3>
              <button className="button-secondary" onClick={() => setModalOpen(false)}>
                بستن
              </button>
            </div>
            <form className="modal-form" onSubmit={submitForm}>
              <label>
                <span>نام</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  placeholder="نام مورد را وارد کنید"
                />
              </label>
              <label>
                <span>مالک</span>
                <input
                  value={form.owner}
                  onChange={(event) => setForm({ ...form, owner: event.target.value })}
                  placeholder="نام تیم یا مسئول"
                />
              </label>
              <label>
                <span>وضعیت</span>
                <select
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Needs Attention">Needs Attention</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Draft">Draft</option>
                  <option value="In Review">In Review</option>
                </select>
              </label>
              <label>
                <span>اولویت</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm({ ...form, priority: event.target.value })}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <div className="modal-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  لغو
                </button>
                <button type="submit" className="button-primary">
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminDashboardShell() {
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthState>({ user: null });
  const [email, setEmail] = useState('admin@castaminofen.com');
  const [password, setPassword] = useState('Admin@2026');
  const [error, setError] = useState('');

  useEffect(() => {
    const raw = window.localStorage.getItem('admin-session');
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        if (parsed.user) {
          setAuth(parsed);
        }
      } catch {
        window.localStorage.removeItem('admin-session');
      }
    }
  }, []);

  useEffect(() => {
    if (auth.user) {
      window.localStorage.setItem('admin-session', JSON.stringify(auth));
    }
  }, [auth]);

  const slug = pathname?.split('/').filter(Boolean)[0] ?? 'dashboard';
  const currentModule = moduleCatalog.find((module) => module.slug === slug) ?? moduleCatalog[0];
  const user = auth.user;

  const accessList = user ? roleAccess(user.role as UserRole) : [];
  const canAccess = !user || accessList.includes(slug) || slug === 'dashboard';

  const submitAuth = (event: React.FormEvent) => {
    event.preventDefault();
    const match = demoUsers.find(
      (demoUser) => demoUser.email === email && demoUser.password === password,
    );
    if (!match) {
      setError('اعتبارسنجی ناموفق بود. لطفاً از اطلاعات نمونه استفاده کنید.');
      return;
    }
    setAuth({ user: match });
    setError('');
  };

  if (!user) {
    return (
      <div className="auth-screen">
        <div className="auth-card">
          <p className="eyebrow">Castaminofen Admin</p>
          <h1>ورود به پنل مدیریتی</h1>
          <p>
            این پنل با احراز هویت، کنترل دسترسی و رویدادهای ممیزی برای تیم‌های سازمانی ارائه شده
            است.
          </p>
          <form className="auth-form" onSubmit={submitAuth}>
            <label>
              <span>ایمیل</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label>
              <span>رمز عبور</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <div className="auth-error">{error}</div> : null}
            <button className="button-primary" type="submit">
              ورود به داشبورد
            </button>
          </form>
          <div className="helper-text">نمونه ورود: admin@castaminofen.com / Admin@2026</div>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="access-denied">
        <div className="panel">
          <h2>دسترسی محدود</h2>
          <p>این نقش برای دسترسی به این ماژول مجوز ندارد. با نقش بالاتر وارد شوید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-badge">CA</div>
          <div>
            <h1>Castaminofen</h1>
            <p>Admin Console</p>
          </div>
        </div>

        <nav className="nav-list">
          {moduleCatalog
            .filter((module) => roleAccess(user.role as UserRole).includes(module.slug))
            .map((module) => (
              <Link
                key={module.slug}
                href={`/${module.slug}`}
                className={`nav-item ${slug === module.slug ? 'active' : ''}`}
              >
                <span className="nav-icon">{module.icon}</span>
                <span>
                  <strong>{module.title}</strong>
                  <small>{module.badge}</small>
                </span>
              </Link>
            ))}
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <strong>{user.name}</strong>
            <p>{user.role}</p>
            <span>{user.email}</span>
          </div>
          <button
            className="button-secondary"
            onClick={() => {
              setAuth({ user: null });
              window.localStorage.removeItem('admin-session');
            }}
          >
            خروج
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">{currentModule?.badge ?? 'Operations'}</p>
            <h2>{currentModule?.title ?? 'پنل مدیریت'}</h2>
          </div>
          <div className="topbar-actions">
            <div className="pill neutral">سطح دسترسی: {user.role}</div>
            <div className="pill success">سامانه سالم</div>
          </div>
        </header>

        {slug === 'dashboard' ? (
          <DashboardView />
        ) : (
          <ModulePage slug={slug} title={currentModule?.title ?? 'ماژول'} />
        )}
      </main>
    </div>
  );
}
