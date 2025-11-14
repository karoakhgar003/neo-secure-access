import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Package, 
  FileText, 
  ShoppingCart, 
  FolderTree, 
  Key
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/admin', icon: Home, label: 'خانه', exact: true },
    { path: '/admin/users', icon: Users, label: 'مدیریت کاربران' },
    { path: '/admin/products', icon: Package, label: 'مدیریت محصولات' },
    { path: '/admin/blog', icon: FileText, label: 'مدیریت مقالات' },
    { path: '/admin/orders', icon: ShoppingCart, label: 'مدیریت سفارشات' },
    { path: '/admin/categories', icon: FolderTree, label: 'مدیریت دسته‌بندی‌ها' },
    { path: '/admin/product-credentials', icon: Key, label: 'اعتبارنامه‌های آماده' },
  ];

  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 h-screen fixed right-0 top-0 bg-gradient-to-b from-background to-muted border-l border-primary/20 flex flex-col pt-16">
      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            
            return (
              <Link key={item.path} to={item.path}>
                <Button
                  variant={active ? "default" : "ghost"}
                  className={`w-full justify-start gap-3 ${
                    active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-primary/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdminSidebar;
