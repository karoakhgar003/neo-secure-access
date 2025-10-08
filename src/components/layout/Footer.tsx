import { Link } from "react-router-dom";
import { Send, Shield, Clock, HeadphonesIcon } from "lucide-react";
import logo from "@/assets/neo-logo.png";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <img src={logo} alt="NEO ACCOUNT" className="h-10 w-auto mb-4" />
            <p className="text-muted-foreground text-sm leading-relaxed">
              دسترسی ایمن و سریع به اکانت‌های معتبر دیجیتال با بهترین قیمت و پشتیبانی ۲۴ ساعته
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-foreground mb-4">دسترسی سریع</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-primary transition-colors">
                  صفحه اصلی
                </Link>
              </li>
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-primary transition-colors">
                  محصولات
                </Link>
              </li>
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-primary transition-colors">
                  وبلاگ
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-muted-foreground hover:text-primary transition-colors">
                  حساب کاربری
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-bold text-foreground mb-4">پشتیبانی</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/support" className="text-muted-foreground hover:text-primary transition-colors">
                  تماس با پشتیبانی
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="text-muted-foreground hover:text-primary transition-colors">
                  قوانین و مقررات
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                  حریم خصوصی
                </Link>
              </li>
              <li>
                <Link to="/legal/refund" className="text-muted-foreground hover:text-primary transition-colors">
                  شرایط بازگشت
                </Link>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-bold text-foreground mb-4">مزایای ما</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Shield className="h-4 w-4 text-primary" />
                <span>امنیت بالا</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>تحویل سریع</span>
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <HeadphonesIcon className="h-4 w-4 text-primary" />
                <span>پشتیبانی ۲۴/۷</span>
              </li>
              <li>
                <a
                  href="https://t.me/neoaccount"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-primary hover:text-accent transition-colors"
                >
                  <Send className="h-4 w-4" />
                  <span>پشتیبانی تلگرام</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            © ۲۰۲۵ NEO ACCOUNT — تمام حقوق محفوظ است
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
