import "./globals.css";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "IEEE ANU",
    template: "%s | IEEE ANU"
  },
  description: "الموقع الرسمي لفرع IEEE ANU الطلابي: فعاليات، محتوى تقني، تقديمات، وقوانين الفريق.",
  applicationName: "IEEE ANU",
  keywords: ["IEEE", "ANU", "Ajloun National University", "Student Branch", "Technology"],
  authors: [{ name: "IEEE ANU Student Branch" }],
  icons: {
    icon: "/icon.png",
    apple: "/icon.png"
  },
  openGraph: {
    title: "IEEE ANU",
    description: "فرع IEEE ANU الطلابي للمحتوى التقني والفعاليات والتقديمات.",
    siteName: "IEEE ANU",
    locale: "ar_JO",
    type: "website",
    images: ["/opengraph-image.png"]
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        {children}
      </body>
    </html>
  );
}
