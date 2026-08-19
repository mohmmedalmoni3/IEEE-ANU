<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00629B,100:00A3E0&height=220&section=header&text=IEEE%20ANU%20Platform&fontSize=48&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Official%20Digital%20Platform%20for%20IEEE%20ANU%20Student%20Branch&descAlignY=58&descSize=18" width="100%"/>

<br/>

<img src="https://readme-typing-svg.demolab.com?font=Cairo&size=22&pause=1000&color=00629B&center=true&vCenter=true&width=600&lines=Full-Stack+Platform+for+IEEE+ANU+Student+Branch;Built+with+Next.js+%7C+Express+%7C+PostgreSQL;Designed+for+Scale%2C+Speed+%26+Reliability" alt="Typing SVG" />

<br/><br/>

[![Website](https://img.shields.io/badge/🌐_Live_Site-ieeeanu.app-00629B?style=for-the-badge&labelColor=002B45)](https://ieeeanu.app)
[![Status](https://img.shields.io/badge/Status-Active-2ECC71?style=for-the-badge&labelColor=002B45)](https://ieeeanu.app)
[![License](https://img.shields.io/badge/IEEE-ANU_Branch-FFB81C?style=for-the-badge&labelColor=002B45)](https://ieeeanu.app)

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:00629B,100:00A3E0&height=3&section=header" width="100%"/>

<br/>

## 📖 نظرة عامة

<table>
<tr>
<td>

**IEEE ANU** هي المنصة الرقمية الرسمية للفرع الطلابي لـ **IEEE** في **جامعة عجلون الوطنية**. صُممت بمعمارية Full-Stack منفصلة (Decoupled) توفّر تجربة سريعة، آمنة، وقابلة للتوسع — من إدارة الفعاليات والأعضاء إلى التواصل الآلي عبر البريد الإلكتروني.

</td>
</tr>
</table>

<br/>

## 🧰 التقنيات المستخدمة

<div align="center">

### 🎨 Frontend

<img src="https://skillicons.dev/icons?i=nextjs,react,typescript,vercel&theme=dark" height="70"/>

| التقنية | الدور |
|:---:|:---|
| ![Next.js](https://img.shields.io/badge/-Next.js-000000?style=flat-square&logo=next.js&logoColor=white) | إطار العمل الأساسي — SSR / SSG وتحسين الأداء وSEO |
| ![React](https://img.shields.io/badge/-React-61DAFB?style=flat-square&logo=react&logoColor=black) | بناء واجهات المستخدم بشكل مكوّناتي وتفاعلي |
| ![TypeScript](https://img.shields.io/badge/-TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white) | Type Safety وتقليل الأخطاء البرمجية |
| ![Vercel](https://img.shields.io/badge/-Vercel-000000?style=flat-square&logo=vercel&logoColor=white) | الاستضافة والنشر التلقائي CI/CD |

<br/>

### ⚙️ Backend

<img src="https://skillicons.dev/icons?i=nodejs,express,postgres&theme=dark" height="70"/>

| التقنية | الدور |
|:---:|:---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?style=flat-square&logo=node.js&logoColor=white) | بيئة تشغيل الخادم |
| ![Express](https://img.shields.io/badge/-Express.js-000000?style=flat-square&logo=express&logoColor=white) | بناء REST API منظم وقابل للتوسع |
| ![Render](https://img.shields.io/badge/-Render-46E3B7?style=flat-square&logo=render&logoColor=white) | استضافة الباك اند مع Auto-Deploy |

<br/>

### 🗄️ Database & Infra

<img src="https://skillicons.dev/icons?i=postgres&theme=dark" height="70"/>

| التقنية | الدور |
|:---:|:---|
| ![PostgreSQL](https://img.shields.io/badge/-PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white) | قاعدة بيانات علائقية موثوقة |
| ![Neon](https://img.shields.io/badge/-Neon.tech-00E599?style=flat-square&logo=postgresql&logoColor=white) | Serverless Postgres مع Branching تلقائي |

<br/>

### 🛠️ أدوات وخدمات مساندة

| الأداة | الاستخدام |
|:---:|:---|
| ![Resend](https://img.shields.io/badge/-Resend-000000?style=flat-square&logo=maildotru&logoColor=white) | إرسال إيميلات معاملاتية (ترحيب، OTP، إشعارات) |
| ![DNS](https://img.shields.io/badge/-Name.com_DNS-00A4EF?style=flat-square&logo=internetcomputer&logoColor=white) | التحقق من النطاق SPF / DKIM |
| ![k6](https://img.shields.io/badge/-k6-7D64FF?style=flat-square&logo=k6&logoColor=white) | اختبار الحمل وتحليل الأداء تحت الضغط |
| ![Together AI](https://img.shields.io/badge/-Together_AI-6C63FF?style=flat-square&logo=OpenAI&logoColor=white) | دمج قدرات الذكاء الاصطناعي عبر API |

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:00629B,100:00A3E0&height=3&section=header" width="100%"/>

<br/>

## 🏗️ البنية التقنية (Architecture)

<div align="center">

```mermaid
flowchart LR
    A["🖥️ Frontend<br/>Next.js + React<br/>Vercel"] -- "REST API" --> B["⚙️ Backend<br/>Node.js + Express<br/>Render"]
    B -- "SQL / SSL" --> C["🗄️ Database<br/>PostgreSQL<br/>Neon.tech"]
    B -- "Emails" --> D["📧 Resend"]
    B -- "AI Requests" --> E["🤖 Together AI"]

    style A fill:#00629B,stroke:#003152,color:#fff
    style B fill:#00A3E0,stroke:#003152,color:#fff
    style C fill:#4169E1,stroke:#001233,color:#fff
    style D fill:#FFB81C,stroke:#7a5600,color:#000
    style E fill:#6C63FF,stroke:#2d2966,color:#fff
```

</div>

<br/>

## ✨ أبرز الميزات

<table>
<tr>
<td width="50%">

### ⚡ الأداء
- Server-Side Rendering مع Next.js
- Static Generation للصفحات القابلة للتخزين المؤقت
- بنية Serverless سريعة الاستجابة

</td>
<td width="50%">

### 🔐 الأمان
- نظام مصادقة مع OTP عبر البريد
- حل جذري لمشاكل CORS
- Rate Limiting محسّن للحماية من الضغط

</td>
</tr>
<tr>
<td width="50%">

### 📧 التواصل
- قوالب HTML مخصصة بهوية IEEE
- إشعارات جماعية وترحيبية آلية
- تحقق DNS كامل (SPF / DKIM)

</td>
<td width="50%">

### 🚀 النشر
- CI/CD تلقائي على Vercel و Render
- فصل كامل بين الطبقات (Decoupled)
- قابلية توسع عالية

</td>
</tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:00629B,100:00A3E0&height=3&section=header" width="100%"/>

<br/>

## 📈 الأداء وضمان الجودة

<div align="center">

![k6](https://img.shields.io/badge/Load_Testing-k6-7D64FF?style=for-the-badge&logo=k6&logoColor=white)

</div>

تم اختبار الـ API تحت الضغط باستخدام **k6** عبر محاكاة مستخدمين متزامنين، وتبيّن أن **الـ Rate Limiter** هو أكبر عنق زجاجة (Bottleneck) عند الحمل العالي — وتم ضبط إعداداته لتحقيق التوازن الأمثل بين الأمان والأداء.

<br/>

## 📂 هيكلية المشروع

```
ieeeanu/
├── 🖥️ frontend/                 Next.js Application
│   ├── app/                     App Router
│   ├── components/              مكوّنات React قابلة لإعادة الاستخدام
│   ├── lib/                     دوال مساعدة وإعدادات API
│   └── public/                  الأصول الثابتة
│
├── ⚙️ backend/                   Express API
│   ├── src/routes/               مسارات الـ API
│   ├── src/controllers/          منطق التحكم
│   ├── src/middleware/           CORS, Rate Limiting, Auth
│   └── src/services/             Resend, Together AI, DB
│
└── 📄 README.md
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=0:00629B,100:00A3E0&height=3&section=header" width="100%"/>

<br/>

## 🚀 النشر

<div align="center">

| الطبقة | المنصة | التفاصيل |
|:---:|:---:|:---|
| 🖥️ Frontend | **Vercel** | نشر تلقائي عند كل Push للفرع الرئيسي |
| ⚙️ Backend | **Render** | Web Service مع Environment Variables مُدارة |
| 🗄️ Database | **Neon.tech** | PostgreSQL Serverless مع اتصال SSL آمن |

</div>

<br/>

## 👨‍💻 التطوير

<div align="center">

طُوّر ونُشر بالكامل من قبل **محمد المومني**، ضمن نشاطه التقني مع **IEEE ANU Student Branch**

[![Portfolio](https://img.shields.io/badge/🌐_Portfolio-mohammedalmomani.me-00629B?style=for-the-badge&labelColor=002B45)](https://mohammedalmomani.me)
[![GitHub](https://img.shields.io/badge/GitHub-mohmmedalmomani3-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/mohmmedalmomani3)

</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:00629B,100:00A3E0&height=120&section=footer" width="100%"/>

<div align="center">
<sub>Made with ⚡ for IEEE ANU Student Branch</sub>
</div>
