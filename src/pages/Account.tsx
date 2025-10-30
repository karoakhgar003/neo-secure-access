import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Settings, ShieldCheck, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  product_id: string;
  products: { name: string };
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  order_items: OrderItem[];
}

const Account = () => {
  const { user } = useAuth();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        created_at,
        status,
        total_amount,
        order_items (
          product_id,
          products (name)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      setRecentOrders(data as Order[]);
      setActiveOrders(data.filter((o: Order) => o.status === 'processing' || o.status === 'completed') as Order[]);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/30">تکمیل شده</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">در انتظار</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30">در حال پردازش</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          حساب <span className="gradient-primary bg-clip-text text-transparent">کاربری</span>
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/account/orders">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">سفارشات من</h3>
                  <p className="text-sm text-muted-foreground">مشاهده تاریخچه خرید</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">داشبورد دیجیتال</h3>
                  <p className="text-sm text-muted-foreground">مدیریت اشتراک‌ها</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/account/settings">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">تنظیمات</h3>
                  <p className="text-sm text-muted-foreground">مدیریت حساب کاربری</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">آخرین سفارشات</h2>
              <Link to="/account/orders">
                <Button variant="ghost" className="text-primary">مشاهده همه</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : recentOrders.length === 0 ? (
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">هنوز سفارشی ثبت نشده</p>
                  </CardContent>
                </Card>
              ) : (
                recentOrders.map((order) => (
                  <Card key={order.id} className="glass-card border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-bold text-lg">{order.order_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('fa-IR')}
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-muted-foreground mb-2">
                        {order.order_items[0]?.products?.name || 'محصول'}
                        {order.order_items.length > 1 && ` و ${order.order_items.length - 1} مورد دیگر`}
                      </p>
                      <p className="text-primary font-bold">
                        {Number(order.total_amount).toLocaleString('fa-IR')} تومان
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Active Subscriptions */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">اشتراک‌های فعال</h2>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-primary">مشاهده داشبورد</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : activeOrders.length === 0 ? (
                <Card className="glass-card border-primary/20">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">اشتراک فعالی وجود ندارد</p>
                  </CardContent>
                </Card>
              ) : (
                activeOrders.map((order) => (
                  <Card key={order.id} className="glass-card border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold text-lg">
                          {order.order_items[0]?.products?.name || 'سرویس'}
                        </h3>
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          سفارش: {order.order_number}
                        </p>
                        {getStatusBadge(order.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
