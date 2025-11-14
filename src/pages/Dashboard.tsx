import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Key, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        total_amount,
        status,
        created_at,
        order_items!left(
          id,
          quantity,
          price,
          credentials,
          credential_data,
          expires_at,
          product_name,
          plan_name,
          products!left(name, requires_totp)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setOrders(data || []);
    setLoading(false);
  };

  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const completedOrders = orders.filter(o => o.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          داشبورد <span className="gradient-primary bg-clip-text text-transparent">دیجیتال</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">سفارشات فعال</span>
              </div>
              <p className="text-3xl font-bold">{activeOrders.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">سفارشات تکمیل شده</span>
              </div>
              <p className="text-3xl font-bold">{completedOrders.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Key className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">کل سفارشات</span>
              </div>
              <p className="text-3xl font-bold">{orders.length}</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6">سفارشات شما</h2>

        {orders.length === 0 ? (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="glass-card border-primary/20">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">سفارش #{order.order_number}</h3>
                      <p className="text-muted-foreground">
                        {order.order_items?.map((item: any) => 
                          item.products?.name || item.product_name || 'محصول حذف شده'
                        ).join(', ')}
                        {order.order_items?.some((item: any) => item.plan_name) && (
                          <span className="text-xs mr-2">
                            ({order.order_items.map((item: any) => item.plan_name).filter(Boolean).join(', ')})
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge className={
                      order.status === 'completed' ? 'bg-green-500/20 text-green-500 border-green-500/30' :
                      order.status === 'processing' ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' :
                      order.status === 'cancelled' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                      'bg-yellow-500/20 text-yellow-500 border-yellow-500/30'
                    }>
                      {order.status === 'completed' ? 'تکمیل شده' :
                       order.status === 'processing' ? 'در حال پردازش' :
                       order.status === 'cancelled' ? 'لغو شده' : 'در انتظار'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">تاریخ سفارش</p>
                        <p className="font-bold">{new Date(order.created_at).toLocaleDateString('fa-IR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">مبلغ کل</p>
                        <p className="font-bold text-primary">{Number(order.total_amount).toLocaleString('fa-IR')} تومان</p>
                      </div>
                    </div>
                    {order.order_items?.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">انقضا</p>
                          {order.order_items[0].expires_at ? (
                            <>
                              <p className="font-bold">
                                {new Date(order.order_items[0].expires_at).toLocaleDateString('fa-IR')}
                              </p>
                              {new Date(order.order_items[0].expires_at) < new Date() && (
                                <Badge variant="destructive" className="text-xs mt-1">منقضی شده</Badge>
                              )}
                            </>
                          ) : (
                            <p className="font-bold text-green-500">دائمی</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {/* Show a button for EACH order_item with credentials */}
                    {order.order_items?.map((item: any, idx: number) => (
                      item.credentials || item.credential_data ? (
                        <div key={item.id}>
                          {item.expires_at && new Date(item.expires_at) < new Date() ? (
                            <Button variant="outline" disabled className="gap-2 opacity-50">
                              <Key className="h-4 w-4" />
                              اشتراک {idx + 1} منقضی شده
                            </Button>
                          ) : (
                            <Link to={`/dashboard/credentials/${item.id}`}>
                              <Button variant="hero" className="gap-2">
                                <Key className="h-4 w-4" />
                                مشاهده اطلاعات ورود {order.order_items.length > 1 ? `#${idx + 1}` : ''}
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : null
                    ))}
                    
                    {/* Show TOTP button for EACH order_item that requires TOTP */}
                    {order.order_items?.map((item: any, idx: number) => (
                      item.products?.requires_totp ? (
                        <div key={`totp-${item.id}`}>
                          {item.expires_at && new Date(item.expires_at) < new Date() ? (
                            <Button variant="outline" disabled className="gap-2 opacity-50">
                              <Send className="h-4 w-4" />
                              اشتراک {idx + 1} منقضی شده
                            </Button>
                          ) : (
                            <Link to={`/dashboard/totp?orderItemId=${item.id}`}>
                              <Button variant="outline" className="glass-card border-primary/30 gap-2">
                                <Send className="h-4 w-4" />
                                دریافت کد {order.order_items.length > 1 ? `#${idx + 1}` : ''}
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : null
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
