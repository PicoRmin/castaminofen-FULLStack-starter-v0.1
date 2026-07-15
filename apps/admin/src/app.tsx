import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import {
  demoUsers,
  dashboardMetrics,
  dashboardActivity,
  dashboardChartData,
  moduleCatalog,
  moduleDataMap,
  roleMatrix,
} from './lib/admin-data';

type UserRole = 'Admin' | 'Moderator' | 'Analyst' | 'Viewer';

interface AuthState {
  user: (typeof demoUsers)[number] | null;
}

const roleAccess = (role: UserRole) => {
  const modules = [
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
  if (role === 'Admin') return modules;
  if (role === 'Moderator')
    return ['dashboard', 'channels', 'podcasts', 'episodes', 'reports', 'notifications', 'media'];
  if (role === 'Analyst') return ['dashboard', 'reports', 'system-health', 'audit-logs'];
  return ['dashboard', 'notifications', 'settings'];
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = React.useState<AuthState>({ user: null });
  const [email, setEmail] = React.useState('admin@castaminofen.com');
  const [password, setPassword] = React.useState('Admin@2026');
  const [error, setError] = React.useState('');

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const match = demoUsers.find((user) => user.email === email && user.password === password);
    if (!match) {
      setError('اعتبارسنجی ناموفق بود. از اطلاعات نمونه استفاده کنید.');
      return;
    }
    setAuth({ user: match });
    setError('');
  };

  if (auth.user) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a, #111827)',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'rgba(15,23,42,0.82)',
          border: '1px solid rgba(148,163,184,0.2)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: 0,
              color: '#7dd3fc',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
            }}
          >
            Castaminofen Admin
          </p>
          <h1 style={{ margin: '8px 0', fontSize: 28 }}>ورود به پنل مدیریتی</h1>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.7 }}>
            پنل مدیریتی با احراز هویت، سطح دسترسی و ممیزی برای محیط‌های سازمانی.
          </p>
        </div>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 16 }}>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>ایمیل</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{
                borderRadius: 12,
                border: '1px solid #334155',
                padding: '12px 14px',
                background: '#020617',
                color: '#f8fafc',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: 8 }}>
            <span style={{ fontSize: 14, color: '#e2e8f0' }}>رمز عبور</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{
                borderRadius: 12,
                border: '1px solid #334155',
                padding: '12px 14px',
                background: '#020617',
                color: '#f8fafc',
              }}
            />
          </label>
          {error ? <div style={{ color: '#fda4af', fontSize: 14 }}>{error}</div> : null}
          <button
            type="submit"
            style={{
              border: 0,
              borderRadius: 12,
              padding: '12px 16px',
              background: '#2563eb',
              color: 'white',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            ورود
          </button>
        </form>
        <div style={{ marginTop: 20, color: '#94a3b8', fontSize: 13 }}>
          نمونه ورود: admin@castaminofen.com / Admin@2026
        </div>
      </div>
    </div>
  );
}

function ProtectedApp() {
  const location = useLocation();
  const [auth, setAuth] = React.useState<AuthState>({ user: demoUsers[0] });

  const user = auth.user;
  const currentModule = location.pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  const canAccess = user ? roleAccess(user.role as UserRole) : [];
  const accessAllowed = !user || canAccess.includes(currentModule) || currentModule === '';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!accessAllowed) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
        <div
          style={{
            maxWidth: 640,
            margin: '0 auto',
            background: 'white',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
          }}
        >
          <h1 style={{ marginTop: 0 }}>دسترسی محدود</h1>
          <p>این نقش اجازه دسترسی به این بخش را ندارد. برای ادامه با نقش بالاتر وارد شوید.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <div style={{ maxWidth: 1470, margin: '0 auto', padding: 24 }}>
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#2563eb', fontWeight: 700 }}>پنل مدیریت پیشرفته</p>
            <h1 style={{ margin: '6px 0', fontSize: 28 }}>Castaminofen Admin Console</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                background: '#e0e7ff',
                color: '#312e81',
                fontWeight: 700,
              }}
            >
              {user.role}
            </div>
            <button
              onClick={() => setAuth({ user: null })}
              style={{
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                borderRadius: 999,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              خروج
            </button>
          </div>
        </header>

        <nav
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 24,
          }}
        >
          {moduleCatalog
            .filter((module) => canAccess.includes(module.slug))
            .map((module) => (
              <NavLink
                key={module.slug}
                to={`/${module.slug}`}
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '12px 14px',
                  background: isActive ? '#eff6ff' : 'white',
                  color: isActive ? '#1d4ed8' : '#0f172a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                })}
              >
                <span style={{ fontSize: 18 }}>{module.icon}</span>
                <strong>{module.title}</strong>
                <span style={{ fontSize: 12, color: '#64748b' }}>{module.badge}</span>
              </NavLink>
            ))}
        </nav>

        <Routes>
          <Route path="/" element={<DashboardView />} />
          <Route path="/dashboard" element={<DashboardView />} />
          <Route path="/users" element={<ModulePage slug="users" title="کاربران" />} />
          <Route path="/channels" element={<ModulePage slug="channels" title="کانال‌ها" />} />
          <Route path="/podcasts" element={<ModulePage slug="podcasts" title="پادکست‌ها" />} />
          <Route path="/episodes" element={<ModulePage slug="episodes" title="قسمت‌ها" />} />
          <Route
            path="/categories"
            element={<ModulePage slug="categories" title="دسته‌بندی‌ها" />}
          />
          <Route path="/tags" element={<ModulePage slug="tags" title="تگ‌ها" />} />
          <Route path="/reports" element={<ModulePage slug="reports" title="گزارش‌ها" />} />
          <Route path="/storage" element={<ModulePage slug="storage" title="فضای ذخیره" />} />
          <Route path="/uploads" element={<ModulePage slug="uploads" title="بارگذاری‌ها" />} />
          <Route path="/roles" element={<ModulePage slug="roles" title="نقش‌ها" />} />
          <Route
            path="/permissions"
            element={<ModulePage slug="permissions" title="دسترسی‌ها" />}
          />
          <Route
            path="/feature-flags"
            element={<ModulePage slug="feature-flags" title="پرچم‌های ویژگی" />}
          />
          <Route path="/settings" element={<ModulePage slug="settings" title="تنظیمات" />} />
          <Route
            path="/notifications"
            element={<ModulePage slug="notifications" title="اعلان‌ها" />}
          />
          <Route
            path="/system-health"
            element={<ModulePage slug="system-health" title="سلامت سامانه" />}
          />
          <Route path="/jobs" element={<ModulePage slug="jobs" title="وظایف" />} />
          <Route path="/media" element={<ModulePage slug="media" title="رسانه" />} />
          <Route
            path="/audit-logs"
            element={<ModulePage slug="audit-logs" title="لاگ‌های حسابرسی" />}
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function DashboardView() {
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section style={{ display: 'grid', gap: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 24 }}>نمای کلی عملکرد</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              از شاخص‌های کلیدی تا فعالیت‌های اخیر، همه در یک صفحه قابل کنترل هستند.
            </p>
          </div>
          <div
            style={{
              borderRadius: 999,
              background: '#dcfce7',
              color: '#166534',
              padding: '8px 12px',
              fontWeight: 700,
            }}
          >
            در حال اجرا
          </div>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {dashboardMetrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                background: 'white',
                borderRadius: 20,
                padding: 20,
                boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
              }}
            >
              <div style={{ color: '#64748b', fontSize: 13 }}>{metric.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{metric.value}</div>
              <div
                style={{
                  marginTop: 10,
                  color: metric.positive ? '#15803d' : '#b91c1c',
                  fontWeight: 700,
                }}
              >
                {metric.delta}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, alignItems: 'start' }}
      >
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <h3 style={{ margin: 0 }}>روند رشد</h3>
            <span style={{ color: '#64748b', fontSize: 13 }}>۶ ماه اخیر</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'end', gap: 10, minHeight: 220 }}>
            {dashboardChartData.map((point) => (
              <div
                key={point.label}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: '100%',
                    borderRadius: 999,
                    minHeight: 24,
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'end',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max(point.value, 30)}px`,
                      borderRadius: 999,
                      background: 'linear-gradient(180deg, #60a5fa, #2563eb)',
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{point.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 24,
            boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
          }}
        >
          <h3 style={{ marginTop: 0 }}>فعالیت اخیر</h3>
          <div style={{ display: 'grid', gap: 12 }}>
            {dashboardActivity.map((item) => (
              <div
                key={item.title}
                style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 12 }}
              >
                <div style={{ fontWeight: 700 }}>{item.title}</div>
                <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{item.detail}</div>
                <div style={{ color: '#2563eb', fontSize: 12, marginTop: 6 }}>{item.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          background: 'white',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <h3 style={{ margin: 0 }}>نقش‌های دسترسی</h3>
          <span style={{ color: '#64748b', fontSize: 13 }}>RBAC</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 16,
          }}
        >
          {roleMatrix.map((row) => (
            <div
              key={row.role}
              style={{ border: '1px solid #e2e8f0', borderRadius: 16, padding: 16 }}
            >
              <div style={{ fontWeight: 800 }}>{row.role}</div>
              <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>{row.scope}</div>
              <div style={{ color: '#2563eb', fontSize: 13, marginTop: 6 }}>{row.control}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ModulePage({ slug, title }: { slug: string; title: string }) {
  const rows = moduleDataMap[slug] ?? [];
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section
        style={{
          background: 'white',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>{title}</h2>
            <p style={{ margin: '6px 0 0', color: '#64748b' }}>
              مدیریت حرفه‌ای، جست‌وجو، فیلتر، صفحه‌بندی و عملیات CRUD در این ماژول.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              placeholder="جست‌وجو..."
              style={{
                borderRadius: 999,
                border: '1px solid #cbd5e1',
                padding: '10px 14px',
                minWidth: 220,
              }}
            />
            <button
              style={{
                border: 0,
                borderRadius: 999,
                padding: '10px 14px',
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              + افزودن
            </button>
          </div>
        </div>
      </section>

      <section
        style={{
          background: 'white',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 16,
          }}
        >
          <div style={{ color: '#64748b', fontSize: 13 }}>
            فیلترها • جست‌وجو • صفحه‌بندی • لاگ‌های ممیزی
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select style={{ borderRadius: 999, border: '1px solid #cbd5e1', padding: '8px 12px' }}>
              <option>همه وضعیت‌ها</option>
            </select>
            <select style={{ borderRadius: 999, border: '1px solid #cbd5e1', padding: '8px 12px' }}>
              <option>همه اولویت‌ها</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'right', color: '#64748b', fontSize: 13 }}>
                <th style={{ padding: '12px 8px' }}>شناسه</th>
                <th style={{ padding: '12px 8px' }}>نام</th>
                <th style={{ padding: '12px 8px' }}>وضعیت</th>
                <th style={{ padding: '12px 8px' }}>مالک</th>
                <th style={{ padding: '12px 8px' }}>به‌روزرسانی</th>
                <th style={{ padding: '12px 8px' }}>اولویت</th>
                <th style={{ padding: '12px 8px' }}>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 8px' }}>{row.id}</td>
                  <td style={{ padding: '12px 8px', fontWeight: 700 }}>{row.name}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: '#eff6ff',
                        color: '#1d4ed8',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{row.owner}</td>
                  <td style={{ padding: '12px 8px' }}>{row.updatedAt}</td>
                  <td style={{ padding: '12px 8px' }}>{row.priority}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <button
                      style={{
                        border: '1px solid #cbd5e1',
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      ویرایش
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ color: '#64748b', fontSize: 13 }}>نمایش ۱ تا {rows.length} مورد</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              style={{
                border: '1px solid #cbd5e1',
                padding: '8px 12px',
                borderRadius: 999,
                background: 'white',
                cursor: 'pointer',
              }}
            >
              قبلی
            </button>
            <button
              style={{
                border: 0,
                padding: '8px 12px',
                borderRadius: 999,
                background: '#2563eb',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              بعدی
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function App() {
  return (
    <AuthGate>
      <BrowserRouter>
        <ProtectedApp />
      </BrowserRouter>
    </AuthGate>
  );
}

export function bootstrap() {
  const root = document.getElementById('root');
  if (root) {
    createRoot(root).render(<App />);
  }
}
