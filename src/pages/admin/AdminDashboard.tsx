import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Package, FileText, ShoppingCart, FolderTree, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    blogPosts: 0,
    orders: 0,
    categories: 0,
    totalEarnings: 0
  });

  useEffect(() => {
    const loadStats = async () => {
      const [usersRes, productsRes, postsRes, ordersRes, categoriesRes, earningsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('categories').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount').eq('status', 'completed')
      ]);

      const totalEarnings = (earningsRes.data || []).reduce((sum, order) => sum + Number(order.total_amount), 0);

      setStats({
        users: usersRes.count || 0,
        products: productsRes.count || 0,
        blogPosts: postsRes.count || 0,
        orders: ordersRes.count || 0,
        categories: categoriesRes.count || 0,
        totalEarnings
      });
    };

    loadStats();
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          پنل <span className="gradient-primary bg-clip-text text-transparent">مدیریت</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          <Link to="/admin/users">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">کاربران</p>
                    <p className="text-3xl font-bold">{stats.users}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/products">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">محصولات</p>
                    <p className="text-3xl font-bold">{stats.products}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/blog">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">مقالات</p>
                    <p className="text-3xl font-bold">{stats.blogPosts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-all cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <ShoppingCart className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">سفارشات</p>
                    <p className="text-3xl font-bold">{stats.orders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCart className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">درآمد کل</p>
                  <p className="text-2xl font-bold">{stats.totalEarnings.toLocaleString('fa-IR')} تومان</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/admin/users">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <Users className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">مدیریت کاربران</h2>
                <p className="text-muted-foreground">مشاهده و مدیریت کاربران</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/products">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <Package className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">مدیریت محصولات</h2>
                <p className="text-muted-foreground">افزودن و ویرایش محصولات</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/blog">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <FileText className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">مدیریت مقالات</h2>
                <p className="text-muted-foreground">افزودن و ویرایش مقالات</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/orders">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <ShoppingCart className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">مدیریت سفارشات</h2>
                <p className="text-muted-foreground">مشاهده و مدیریت سفارشات</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/categories">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <FolderTree className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">مدیریت دسته‌بندی‌ها</h2>
                <p className="text-muted-foreground">افزودن و ویرایش دسته‌بندی‌ها</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/admin/product-credentials">
            <Card className="glass-card border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="p-6">
                <Key className="h-12 w-12 text-primary mb-4" />
                <h2 className="text-2xl font-bold mb-2">اعتبارنامه‌های آماده</h2>
                <p className="text-muted-foreground">مدیریت اعتبارنامه‌های تحویل فوری</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
