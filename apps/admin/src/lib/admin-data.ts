export type UserRole = 'Admin' | 'Moderator' | 'Analyst' | 'Viewer';

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  team: string;
  lastSeen: string;
}

export interface ModuleConfig {
  slug: string;
  title: string;
  description: string;
  badge: string;
  icon: string;
  accent: string;
}

export interface ModuleRecord {
  id: string;
  name: string;
  status: 'Healthy' | 'Needs Attention' | 'Scheduled' | 'Draft' | 'In Review';
  owner: string;
  updatedAt: string;
  priority: 'High' | 'Medium' | 'Low';
  region?: string;
  score?: number;
}

export interface MetricCard {
  label: string;
  value: string;
  delta: string;
  positive: boolean;
}

export interface ActivityItem {
  title: string;
  detail: string;
  timestamp: string;
}

export const demoUsers: DemoUser[] = [
  {
    id: 'u-admin',
    name: 'سارا رضایی',
    email: 'admin@castaminofen.com',
    password: 'Admin@2026',
    role: 'Admin',
    team: 'Operations',
    lastSeen: 'همین الان',
  },
  {
    id: 'u-mod',
    name: 'میلاد احمدی',
    email: 'moderator@castaminofen.com',
    password: 'Mod@2026',
    role: 'Moderator',
    team: 'Publishing',
    lastSeen: '۱۰ دقیقه قبل',
  },
  {
    id: 'u-analyst',
    name: 'نرگس کریمی',
    email: 'analyst@castaminofen.com',
    password: 'Analyst@2026',
    role: 'Analyst',
    team: 'Insights',
    lastSeen: '۱ ساعت قبل',
  },
  {
    id: 'u-viewer',
    name: 'آرمان نوروزی',
    email: 'viewer@castaminofen.com',
    password: 'Viewer@2026',
    role: 'Viewer',
    team: 'Support',
    lastSeen: '۳ ساعت قبل',
  },
];

export const moduleCatalog: ModuleConfig[] = [
  {
    slug: 'dashboard',
    title: 'نمای کلی',
    description: 'بررسی شاخص‌های کلیدی، عملکرد و رویدادهای اخیر در یک نگاه.',
    badge: 'مرکز کنترل',
    icon: '◉',
    accent: '#2563eb',
  },
  {
    slug: 'users',
    title: 'کاربران',
    description: 'مدیریت حساب‌ها، وضعیت دسترسی و فعالیت‌های اخیر کاربران.',
    badge: 'IAM',
    icon: '👤',
    accent: '#7c3aed',
  },
  {
    slug: 'channels',
    title: 'کانال‌ها',
    description: 'سازمان‌دهی کانال‌های زنده و برخط با کنترل نسخه و سطح دسترسی.',
    badge: 'Publishing',
    icon: '📺',
    accent: '#0f766e',
  },
  {
    slug: 'podcasts',
    title: 'پادکست‌ها',
    description: 'مدیریت سری‌ها، انتشار، و برنامه‌ریزی پادکست‌های برند.',
    badge: 'Content',
    icon: '🎙️',
    accent: '#ea580c',
  },
  {
    slug: 'episodes',
    title: 'قسمت‌ها',
    description: 'نظارت بر نسخه‌ها، کارهای ویرایشی و زمان‌بندی انتشار.',
    badge: 'Workflow',
    icon: '🧾',
    accent: '#be185d',
  },
  {
    slug: 'categories',
    title: 'دسته‌بندی‌ها',
    description: 'کنترل ساختار محتوایی، طبقه‌بندی و دسترسی جست و جو.',
    badge: 'Taxonomy',
    icon: '🗂️',
    accent: '#0369a1',
  },
  {
    slug: 'tags',
    title: 'تگ‌ها',
    description: 'بهینه‌سازی کشف محتوا با تگ‌های مدیریتی و پیشنهادی.',
    badge: 'Discovery',
    icon: '🏷️',
    accent: '#4338ca',
  },
  {
    slug: 'reports',
    title: 'گزارش‌ها',
    description: 'تحلیل عملکرد، نرخ بازگشت و شاخص‌های رشد کسب‌وکار.',
    badge: 'Analytics',
    icon: '📈',
    accent: '#15803d',
  },
  {
    slug: 'storage',
    title: 'فضای ذخیره',
    description: 'پایش مصرف، ظرفیت، و وضعیت نگهداری فایل‌ها.',
    badge: 'Infrastructure',
    icon: '🗄️',
    accent: '#b45309',
  },
  {
    slug: 'uploads',
    title: 'بارگذاری‌ها',
    description: 'نظارت بر فایل‌های در حال پردازش و خطاهای انتقال.',
    badge: 'Media Ops',
    icon: '⬆️',
    accent: '#4d7c0f',
  },
  {
    slug: 'roles',
    title: 'نقش‌ها',
    description: 'مدیریت سطوح دسترسی و ترکیب‌های احراز هویت سازمانی.',
    badge: 'RBAC',
    icon: '🛡️',
    accent: '#7f1d1d',
  },
  {
    slug: 'permissions',
    title: 'دسترسی‌ها',
    description: 'تعریف و بازبینی مجوزهای دقیق بر اساس واحدهای کاری.',
    badge: 'Governance',
    icon: '🔐',
    accent: '#1d4ed8',
  },
  {
    slug: 'feature-flags',
    title: 'پرچم‌های ویژگی',
    description: 'راه‌اندازی تدریجی امکانات و کنترل انتشار با ریسک پایین.',
    badge: 'Release',
    icon: '🚩',
    accent: '#92400e',
  },
  {
    slug: 'settings',
    title: 'تنظیمات',
    description: 'پیکربندی سراسری برند، شبکه و سیاست‌های داخلی.',
    badge: 'Config',
    icon: '⚙️',
    accent: '#334155',
  },
  {
    slug: 'notifications',
    title: 'اعلان‌ها',
    description: 'ارسال و پایش اعلان‌های داخلی و مشتری‌محور.',
    badge: 'Comm',
    icon: '🔔',
    accent: '#0f172a',
  },
  {
    slug: 'system-health',
    title: 'سلامت سامانه',
    description: 'ردیابی وضعیت سرویس‌ها، API و عملکرد زیرساخت.',
    badge: 'SRE',
    icon: '🧠',
    accent: '#0f766e',
  },
  {
    slug: 'jobs',
    title: 'وظایف',
    description: 'برنامه‌ریزی و نظارت بر کارهای پس‌زمینه و پردازش.',
    badge: 'Ops',
    icon: '⚡',
    accent: '#c2410c',
  },
  {
    slug: 'media',
    title: 'رسانه',
    description: 'مدیریت فایل‌های تصویری، صوتی و ویدئویی با کنترل کیفیت.',
    badge: 'Assets',
    icon: '🎞️',
    accent: '#155e75',
  },
  {
    slug: 'audit-logs',
    title: 'لاگ‌های حسابرسی',
    description: 'ثبت و جست‌وجوی تمام رویدادهای حساس برای ممیزی.',
    badge: 'Compliance',
    icon: '🧾',
    accent: '#991b1b',
  },
];

export const dashboardMetrics: MetricCard[] = [
  { label: 'کاربران فعال', value: '24.8K', delta: '+12.4%', positive: true },
  { label: 'هزینه ذخیره‌سازی', value: '$84.2K', delta: '-4.1%', positive: true },
  { label: 'درصد تکمیل انتشار', value: '96.8%', delta: '+2.3%', positive: true },
  { label: 'رویدادهای حساس', value: '18', delta: '-6%', positive: true },
];

export const dashboardChartData = [
  { label: 'فروردین', value: 62 },
  { label: 'اردیبهشت', value: 74 },
  { label: 'خرداد', value: 69 },
  { label: 'تیر', value: 88 },
  { label: 'مرداد', value: 95 },
  { label: 'شهریور', value: 104 },
];

export const dashboardActivity: ActivityItem[] = [
  {
    title: 'پادکست جدید منتشر شد',
    detail: 'سری «بازتاب برند» در ساعت 09:30 به‌روزرسانی شد.',
    timestamp: '۵ دقیقه قبل',
  },
  {
    title: 'اعتبار بارگذاری به‌روز شد',
    detail: 'یک فایل 4K با موفقیت به فضای ذخیره منتقل شد.',
    timestamp: '۲۱ دقیقه قبل',
  },
  {
    title: 'یک رویداد حساس ثبت شد',
    detail: 'دسترسی نقش Manager برای کانال مالی بازبینی شد.',
    timestamp: '۴۵ دقیقه قبل',
  },
];

export const moduleDataMap: Record<string, ModuleRecord[]> = {
  users: [
    {
      id: 'U-101',
      name: 'سارا رضایی',
      status: 'Healthy',
      owner: 'Ops',
      updatedAt: '۲ ساعت قبل',
      priority: 'High',
      region: 'تهران',
      score: 94,
    },
    {
      id: 'U-102',
      name: 'میلاد احمدی',
      status: 'In Review',
      owner: 'Publishing',
      updatedAt: '۴ ساعت قبل',
      priority: 'Medium',
      region: 'اصفهان',
      score: 88,
    },
    {
      id: 'U-103',
      name: 'نرگس کریمی',
      status: 'Healthy',
      owner: 'Insights',
      updatedAt: 'امروز',
      priority: 'High',
      region: 'مشهد',
      score: 97,
    },
    {
      id: 'U-104',
      name: 'آرمان نوروزی',
      status: 'Scheduled',
      owner: 'Support',
      updatedAt: 'دیروز',
      priority: 'Low',
      region: 'شیراز',
      score: 81,
    },
  ],
  channels: [
    {
      id: 'C-201',
      name: 'کانال اصلی',
      status: 'Healthy',
      owner: 'Broadcast',
      updatedAt: '۱ ساعت قبل',
      priority: 'High',
      region: 'Global',
      score: 96,
    },
    {
      id: 'C-202',
      name: 'کانال رویداد',
      status: 'Scheduled',
      owner: 'Events',
      updatedAt: '۳ ساعت قبل',
      priority: 'Medium',
      region: 'Europe',
      score: 84,
    },
    {
      id: 'C-203',
      name: 'کانال راهبردی',
      status: 'Needs Attention',
      owner: 'Strategy',
      updatedAt: 'امروز',
      priority: 'High',
      region: 'Asia',
      score: 78,
    },
  ],
  podcasts: [
    {
      id: 'P-301',
      name: 'بازتاب برند',
      status: 'Healthy',
      owner: 'Editorial',
      updatedAt: '۲ ساعت قبل',
      priority: 'High',
      region: 'Global',
      score: 93,
    },
    {
      id: 'P-302',
      name: 'فناوری در عمل',
      status: 'In Review',
      owner: 'Product',
      updatedAt: 'امروز',
      priority: 'Medium',
      region: 'NA',
      score: 87,
    },
    {
      id: 'P-303',
      name: 'صداهای مشتری',
      status: 'Scheduled',
      owner: 'Research',
      updatedAt: '۳ روز قبل',
      priority: 'Low',
      region: 'EMEA',
      score: 80,
    },
  ],
  episodes: [
    {
      id: 'E-401',
      name: 'قسمت ۱۲: مسیر رشد',
      status: 'Healthy',
      owner: 'Production',
      updatedAt: '۳۰ دقیقه قبل',
      priority: 'High',
      score: 95,
    },
    {
      id: 'E-402',
      name: 'قسمت ۱۳: استراتژی محتوا',
      status: 'Draft',
      owner: 'Writing',
      updatedAt: '۱ ساعت قبل',
      priority: 'Medium',
      score: 82,
    },
    {
      id: 'E-403',
      name: 'قسمت ۱۴: بازخورد مشتری',
      status: 'Scheduled',
      owner: 'Ops',
      updatedAt: 'امروز',
      priority: 'Low',
      score: 79,
    },
  ],
  categories: [
    {
      id: 'G-501',
      name: 'استراتژی',
      status: 'Healthy',
      owner: 'Content',
      updatedAt: '۲ روز قبل',
      priority: 'Medium',
      score: 91,
    },
    {
      id: 'G-502',
      name: 'پلتفرم',
      status: 'Healthy',
      owner: 'Platform',
      updatedAt: 'امروز',
      priority: 'High',
      score: 94,
    },
    {
      id: 'G-503',
      name: 'رویدادها',
      status: 'Needs Attention',
      owner: 'Marketing',
      updatedAt: '۳ ساعت قبل',
      priority: 'Low',
      score: 74,
    },
  ],
  tags: [
    {
      id: 'T-601',
      name: 'AI',
      status: 'Healthy',
      owner: 'Insights',
      updatedAt: '۶ ساعت قبل',
      priority: 'High',
      score: 96,
    },
    {
      id: 'T-602',
      name: 'تحلیل داده',
      status: 'In Review',
      owner: 'Data',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 86,
    },
    {
      id: 'T-603',
      name: 'مارکتینگ',
      status: 'Healthy',
      owner: 'Growth',
      updatedAt: 'دیروز',
      priority: 'Low',
      score: 90,
    },
  ],
  reports: [
    {
      id: 'R-701',
      name: 'گزارش رشد ۳۰ روزه',
      status: 'Healthy',
      owner: 'Analytics',
      updatedAt: '۲ ساعت قبل',
      priority: 'High',
      score: 98,
    },
    {
      id: 'R-702',
      name: 'گزارش بازگشت بازدید',
      status: 'Scheduled',
      owner: 'BI',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 84,
    },
    {
      id: 'R-703',
      name: 'گزارش پادکست',
      status: 'Needs Attention',
      owner: 'Editorial',
      updatedAt: '۲ روز قبل',
      priority: 'Low',
      score: 77,
    },
  ],
  storage: [
    {
      id: 'S-801',
      name: 'بایگانی ویدیو',
      status: 'Healthy',
      owner: 'Media Ops',
      updatedAt: '۲۰ دقیقه قبل',
      priority: 'High',
      score: 95,
    },
    {
      id: 'S-802',
      name: 'فایل‌های صوتی',
      status: 'In Review',
      owner: 'Archive',
      updatedAt: '۱ ساعت قبل',
      priority: 'Medium',
      score: 88,
    },
    {
      id: 'S-803',
      name: 'پشتیبان پاییز',
      status: 'Scheduled',
      owner: 'DevOps',
      updatedAt: 'امروز',
      priority: 'Low',
      score: 82,
    },
  ],
  uploads: [
    {
      id: 'L-901',
      name: 'آپلود ویدیو ۱',
      status: 'Healthy',
      owner: 'Studio',
      updatedAt: '۵ دقیقه قبل',
      priority: 'High',
      score: 97,
    },
    {
      id: 'L-902',
      name: 'آپلود گزارش',
      status: 'Needs Attention',
      owner: 'Ops',
      updatedAt: '۱ ساعت قبل',
      priority: 'Medium',
      score: 72,
    },
    {
      id: 'L-903',
      name: 'آپلود پادکست',
      status: 'Scheduled',
      owner: 'Media',
      updatedAt: 'امروز',
      priority: 'Low',
      score: 83,
    },
  ],
  roles: [
    {
      id: 'O-1001',
      name: 'مدیرعامل',
      status: 'Healthy',
      owner: 'HR',
      updatedAt: '۳ روز قبل',
      priority: 'High',
      score: 96,
    },
    {
      id: 'O-1002',
      name: 'ناظر محتوا',
      status: 'In Review',
      owner: 'Publishing',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 85,
    },
    {
      id: 'O-1003',
      name: 'بازرس داده',
      status: 'Healthy',
      owner: 'Analytics',
      updatedAt: '۲ ساعت قبل',
      priority: 'Low',
      score: 90,
    },
  ],
  permissions: [
    {
      id: 'P-1101',
      name: 'دسترسی انتشار',
      status: 'Healthy',
      owner: 'Governance',
      updatedAt: '۱ روز قبل',
      priority: 'High',
      score: 95,
    },
    {
      id: 'P-1102',
      name: 'دسترسی ممیزی',
      status: 'Healthy',
      owner: 'Compliance',
      updatedAt: '۳ ساعت قبل',
      priority: 'Medium',
      score: 91,
    },
    {
      id: 'P-1103',
      name: 'دسترسی رسانه',
      status: 'Needs Attention',
      owner: 'Media Ops',
      updatedAt: 'امروز',
      priority: 'Low',
      score: 77,
    },
  ],
  'feature-flags': [
    {
      id: 'F-1201',
      name: 'پیش‌نمایش ویرایش',
      status: 'Healthy',
      owner: 'Product',
      updatedAt: '۲ ساعت قبل',
      priority: 'High',
      score: 93,
    },
    {
      id: 'F-1202',
      name: 'اعلان هوشمند',
      status: 'Scheduled',
      owner: 'Growth',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 82,
    },
    {
      id: 'F-1203',
      name: 'بخش جدید پادکست',
      status: 'Draft',
      owner: 'Engineering',
      updatedAt: 'دیروز',
      priority: 'Low',
      score: 79,
    },
  ],
  settings: [
    {
      id: 'S-1301',
      name: 'تنظیمات برند',
      status: 'Healthy',
      owner: 'Brand',
      updatedAt: '۱ ساعت قبل',
      priority: 'High',
      score: 95,
    },
    {
      id: 'S-1302',
      name: 'تنظیمات شبکه',
      status: 'In Review',
      owner: 'Infra',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 88,
    },
    {
      id: 'S-1303',
      name: 'سیاست‌های دسترسی',
      status: 'Healthy',
      owner: 'Security',
      updatedAt: '۳ روز قبل',
      priority: 'Low',
      score: 91,
    },
  ],
  notifications: [
    {
      id: 'N-1401',
      name: 'اعلان داخلی',
      status: 'Healthy',
      owner: 'Comms',
      updatedAt: '۲۵ دقیقه قبل',
      priority: 'High',
      score: 94,
    },
    {
      id: 'N-1402',
      name: 'اعلان مشتری',
      status: 'Scheduled',
      owner: 'Support',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 86,
    },
    {
      id: 'N-1403',
      name: 'اعلان ریسک',
      status: 'Needs Attention',
      owner: 'Security',
      updatedAt: '۳ ساعت قبل',
      priority: 'Low',
      score: 76,
    },
  ],
  'system-health': [
    {
      id: 'H-1501',
      name: 'API Gateway',
      status: 'Healthy',
      owner: 'SRE',
      updatedAt: '۵ دقیقه قبل',
      priority: 'High',
      score: 97,
    },
    {
      id: 'H-1502',
      name: 'CDN Edge',
      status: 'Needs Attention',
      owner: 'Infra',
      updatedAt: '۲۵ دقیقه قبل',
      priority: 'Medium',
      score: 81,
    },
    {
      id: 'H-1503',
      name: 'Queue Workers',
      status: 'Healthy',
      owner: 'Ops',
      updatedAt: 'امروز',
      priority: 'Low',
      score: 90,
    },
  ],
  jobs: [
    {
      id: 'J-1601',
      name: 'پردازش فایل‌های تصویری',
      status: 'Healthy',
      owner: 'Media Ops',
      updatedAt: '۱ ساعت قبل',
      priority: 'High',
      score: 95,
    },
    {
      id: 'J-1602',
      name: 'انتشار برنامه‌ریزی‌شده',
      status: 'Scheduled',
      owner: 'Release',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 88,
    },
    {
      id: 'J-1603',
      name: 'تکمیل پشتیبان',
      status: 'In Review',
      owner: 'DevOps',
      updatedAt: '۳ ساعت قبل',
      priority: 'Low',
      score: 80,
    },
  ],
  media: [
    {
      id: 'M-1701',
      name: 'آلبوم ویدئو',
      status: 'Healthy',
      owner: 'Studio',
      updatedAt: '۴۵ دقیقه قبل',
      priority: 'High',
      score: 96,
    },
    {
      id: 'M-1702',
      name: 'بایگانی صوت',
      status: 'Draft',
      owner: 'Archive',
      updatedAt: 'امروز',
      priority: 'Medium',
      score: 84,
    },
    {
      id: 'M-1703',
      name: 'کالبدشکافی انتشار',
      status: 'Scheduled',
      owner: 'Marketing',
      updatedAt: '۲ روز قبل',
      priority: 'Low',
      score: 79,
    },
  ],
  'audit-logs': [
    {
      id: 'A-1801',
      name: 'بازبینی نقش Admin',
      status: 'Healthy',
      owner: 'Security',
      updatedAt: '۱۰ دقیقه قبل',
      priority: 'High',
      score: 98,
    },
    {
      id: 'A-1802',
      name: 'تغییر تنظیمات کانال',
      status: 'Healthy',
      owner: 'Operations',
      updatedAt: '۴۵ دقیقه قبل',
      priority: 'Medium',
      score: 91,
    },
    {
      id: 'A-1803',
      name: 'حذف تگ قدیمی',
      status: 'Needs Attention',
      owner: 'Content',
      updatedAt: '۳ ساعت قبل',
      priority: 'Low',
      score: 79,
    },
  ],
};

export const roleMatrix = [
  { role: 'Admin', scope: 'تمام ماژول‌ها', control: 'سطح مدیریت' },
  { role: 'Moderator', scope: 'پادکست، کانال، انتشار', control: 'سطح ویرایش' },
  { role: 'Analyst', scope: 'گزارش‌ها و سلامت سامانه', control: 'سطح مشاهده' },
  { role: 'Viewer', scope: 'داشبورد و اعلان‌ها', control: 'سطح محدود' },
];
