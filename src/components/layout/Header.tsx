import { Link } from "react-router-dom";
import { ShoppingCart, Menu, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useAdmin } from "@/hooks/useAdmin";
import logo from "@/assets/neo-logo.png";

const Header = () => {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { isAdmin } = useAdmin();

  return (
    <header className="sticky top-0 z-50 w-full glass-card border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="NEO ACCOUNT" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-primary transition-colors font-medium">خانه</Link>
            <Link to="/categories" className="text-foreground hover:text-primary transition-colors font-medium">محصولات</Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors font-medium">وبلاگ</Link>
            <Link to="/support" className="text-foreground hover:text-primary transition-colors font-medium">پشتیبانی</Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors font-medium">درباره ما</Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors font-medium">تماس با ما</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/10">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <Link to="/admin">
                    <Button variant="outline" className="gap-2 glass-card hover:bg-primary/10 border-primary/30">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">پنل مدیریت</span>
                    </Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button variant="outline" className="gap-2 glass-card hover:bg-primary/10 border-primary/30">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">حساب کاربری</span>
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="hero" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">ورود / ثبت‌نام</span>
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
