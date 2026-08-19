<div align="center">

# 🎓 IEEE ANU — Official Platform

### منصة الفرع الطلابي لـ IEEE في جامعة عجلون الوطنية

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com/)
[![Render](https://img.shields.io/badge/API_on-Render-46E3B7?style=flat-square&logo=render)](https://render.com/)
[![Neon](https://img.shields.io/badge/Database-Neon.tech-00E599?style=flat-square&logo=postgresql)](https://neon.tech/)

**🔗 [ieeeanu.app](https://ieeeanu.app)**

</div>

---

## 📖 نظرة عامة

**IEEE ANU** هي المنصة الرسمية للفرع الطلابي لـ IEEE في **جامعة عجلون الوطنية (ANU)**، صُممت وطُوّرت لتكون الواجهة الرقمية المتكاملة للفرع — من إدارة الفعاليات والأعضاء، إلى التواصل والتوعية عبر البريد الإلكتروني، وصولًا إلى تجربة مستخدم عصرية وسريعة.

المشروع مبني بمعمارية **Full-Stack منفصلة (Decoupled Architecture)**: فرونت اند مستقل يتواصل مع باك اند عبر REST API، مع نشر كل طبقة على منصة مخصصة لها لضمان أفضل أداء وموثوقية.

---

## 🏗️ البنية التقنية (Architecture)

```
┌─────────────────────┐         ┌──────────────────────┐         ┌─────────────────────┐
│   Frontend (Client)  │ ──────▶ │   Backend (API)       │ ──────▶ │   Database            │
│   Next.js + React    │  REST   │   Node.js + Express   │  ORM/SQL│   PostgreSQL (Neon)   │
│   Hosted: Vercel      │◀────── │   Hosted: Render       │◀──────  │   Serverless Postgres │
└─────────────────────┘         └──────────────────────┘         └─────────────────────┘
```

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

### Frontend
| التقنية | الاستخدام |
|---|---|
| **Next.js** | إطار عمل React للـ SSR/SSG وتحسين الأداء وSEO |
| **React** | بناء واجهات المستخدم بشكل تفاعلي ومكوّناتي |
| **TypeScript** | Type Safety وتقليل الأخطاء البرمجية |
| **Vercel** | الاستضافة والنشر التلقائي (CI/CD) |

### Backend
| التقنية | الاستخدام |
|---|---|
| **Node.js** | بيئة تشغيل الخادم |
| **Express.js** | بناء REST API بشكل منظم وقابل للتوسع |
| **Render** | استضافة الباك اند مع Auto-Deploy |

### Database & Infrastructure
| التقنية | الاستخدام |
|---|---|
| **PostgreSQL** | قاعدة بيانات علائقية قوية وموثوقة |
| **Neon.tech** | Serverless Postgres مع Branching وScaling تلقائي |

### الخدمات والأدوات المساندة
| الأداة | الاستخدام |
|---|---|
| **Resend** | إرسال إيميلات معاملاتية (ترحيب، OTP، إشعارات جماعية) |
| **Name.com (DNS)** | التحقق من النطاق (SPF/DKIM) لضمان وصول الإيميلات |
| **k6** | اختبار الحمل (Load Testing) وتحليل الأداء تحت الضغط |
| **Together AI** | دمج قدرات الذكاء الاصطناعي عبر API مخصص |

---

## ✨ أبرز الميزات (Key Features)

- ⚡ **أداء عالٍ** بفضل Server-Side Rendering و Static Generation عبر Next.js
- 🔐 **نظام مصادقة آمن** مع دعم OTP عبر البريد الإلكتروني
- 📧 **نظام إشعارات وإيميلات احترافي** (قوالب HTML مخصصة بهوية IEEE)
- 🌍 **حل مشاكل CORS** بشكل جذري لضمان تواصل آمن بين الفرونت والباك اند
- 📊 **بنية قابلة للتوسع** جاهزة لاستقبال نمو عدد المستخدمين والفعاليات
- 🚀 **نشر مستمر (CI/CD)** تلقائي عبر Vercel و Render

---

## 📈 الأداء وضمان الجودة

تم إخضاع الـ API لاختبارات حمل شاملة باستخدام **k6**، حيث تم:

- محاكاة سيناريوهات مستخدمين متزامنين (Concurrent Users)
- تحديد **Rate Limiter** كأكبر عنق زجاجة (Bottleneck) تحت الضغط العالي
- تحسين إعدادات الحماية للحفاظ على التوازن بين الأمان والأداء

---

## 📂 هيكلية المشروع (مثال عام)

```
ieeeanu/
├── frontend/                # Next.js Application
│   ├── app/                 # App Router
│   ├── components/          # مكوّنات React قابلة لإعادة الاستخدام
│   ├── lib/                 # دوال مساعدة وإعدادات API
│   └── public/               # الأصول الثابتة
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── routes/            # مسارات الـ API
│   │   ├── controllers/       # منطق التحكم
│   │   ├── middleware/        # CORS, Rate Limiting, Auth
│   │   └── services/          # Resend, Together AI, DB
│   └── prisma/ (أو schema DB) # نموذج قاعدة البيانات
│
└── README.md
```

---

## 🚀 النشر (Deployment)

| الطبقة | المنصة | ملاحظات |
|---|---|---|
| Frontend | **Vercel** | نشر تلقائي عند كل Push على الفرع الرئيسي |
| Backend | **Render** | Web Service مع Environment Variables مُدارة |
| Database | **Neon.tech** | Serverless PostgreSQL مع اتصال آمن عبر SSL |

---

## 👨‍💻 التطوير

طُوّر ونُشر بالكامل من قبل **محمد المومني**، ضمن نشاطه التقني مع **IEEE ANU Student Branch**.

🔗 الموقع الشخصي: [mohammedalmomani.me](https://mohammedalmomani.me)
🔗 GitHub: [@mohmmedalmomani3](https://github.com/mohmmedalmomani3)

---

<div align="center">

**Made with ⚡ for IEEE ANU Student Branch**

</div>
