import Link from "next/link";
import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>IEEE ANU</h3>
          <p>مجتمع طلابي تقني يربط التعلم العملي بالابتكار والعمل الجماعي.</p>
          <div className="social-links">
            <a href="https://www.instagram.com/ieee_anu/" target="_blank" aria-label="Instagram">
              <Instagram />
            </a>
            <a href="https://www.linkedin.com/company/ieee-anu-sb/" target="_blank" aria-label="LinkedIn">
              <Linkedin />
            </a>
            <a href="https://www.youtube.com/@IEEEANUStudentBranch" target="_blank" aria-label="YouTube">
              <Youtube />
            </a>
          </div>
        </div>
        <div className="footer-section">
          <h4>روابط سريعة</h4>
          <ul>
            <li><Link href="/">الرئيسية</Link></li>
            <li><Link href="/laws">القوانين</Link></li>
            <li><Link href="/creators">صناع المحتوى</Link></li>
            <li><Link href="/applications">التقديمات</Link></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>تواصل معنا</h4>
          <ul>
            <li><a href="mailto:support@ieeeanu.com"><Mail size={16} /> support@ieeeanu.com</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 IEEE ANU - جميع الحقوق محفوظة</p>
        <p className="developers-credit">
          Developed by{" "}
          <a href="https://mohamme-cmd.github.io/aboutme/" target="_blank" rel="noreferrer">Mohammed</a>
          {" "}&{" "}
          <a href="https://ayham-portfolio.com" target="_blank" rel="noreferrer">Ayham</a>
        </p>
      </div>
    </footer>
  );
}
