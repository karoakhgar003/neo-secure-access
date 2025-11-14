import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Package, Settings, ShieldCheck, Calendar, KeyRound, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  has_credentials?: boolean;
  products: { 
    name: string;
    image_url?: string;
  } | null;
}

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  admin_notes?: string | null;
  order_items: OrderItem[];
}

const Account = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
        admin_notes,
        order_items!left (
          id,
          product_id,
          quantity,
          price,
          products!left (
            name,
            image_url
          )
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (!error && data) {
      // For each order item, check if it has an account_seat (credentials assigned)
      const ordersWithSeats = await Promise.all(
        (data || []).map(async (order) => {
          const itemsWithSeats = await Promise.all(
            (order.order_items || []).map(async (item) => {
              const { data: seat } = await supabase
                .from('account_seats')
                .select('id')
                .eq('order_item_id', item.id)
                .eq('user_id', user?.id)
                .single();
              
              return {
                ...item,
                has_credentials: !!seat
              };
            })
          );
          
          return {
            ...order,
            order_items: itemsWithSeats
          };
        })
      );
      
      setRecentOrders(ordersWithSeats as Order[]);
      setActiveOrders(ordersWithSeats.filter((o: Order) => o.status === 'processing' || o.status === 'completed') as Order[]);
    }
    setLoading(false);
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
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
                      <div className="flex justify-between items-center">
                        <p className="text-primary font-bold">
                          {Number(order.total_amount).toLocaleString('fa-IR')} تومان
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2"
                          onClick={() => handleViewOrderDetails(order)}
                        >
                          <Eye className="h-4 w-4" />
                          جزئیات سفارش
                        </Button>
                      </div>
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
                        <div>
                          <h3 className="font-bold text-lg">
                            {order.order_items[0]?.products?.name || 'سرویس'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            سفارش: {order.order_number}
                          </p>
                        </div>
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex justify-between items-center">
                        {getStatusBadge(order.status)}
                        {order.status === 'completed' && order.order_items.length > 0 && order.order_items[0].has_credentials ? (
                          <Button 
                            variant="hero" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => navigate(`/dashboard/credentials/${order.order_items[0].id}`)}
                          >
                            <KeyRound className="h-4 w-4" />
                            مشاهده اطلاعات ورود
                          </Button>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Order Details Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات سفارش {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">شماره سفارش</p>
                    <p className="font-medium">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">وضعیت</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مبلغ کل</p>
                    <p className="font-medium text-primary">{selectedOrder.total_amount.toLocaleString('fa-IR')} تومان</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-4">محصولات سفارش</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-lg glass-card border border-primary/20">
                        <img
                          src={item.products?.image_url || '/placeholder.svg'}
                          alt={item.products?.name || 'محصول'}
                          className="w-20 h-20 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-lg">
                            {item.products?.name || 'محصول حذف شده'}
                          </p>
                          <p className="text-sm text-muted-foreground">تعداد: {item.quantity}</p>
                          <p className="text-sm text-muted-foreground">
                            قیمت واحد: {Number(item.price).toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="font-bold text-primary text-lg">
                            {(Number(item.price) * item.quantity).toLocaleString('fa-IR')} تومان
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedOrder.admin_notes && (
                  <div className="glass-card border border-primary/30 p-4 rounded-lg bg-primary/5">
                    <h3 className="font-bold mb-2 flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      اطلاعات تحویل از طرف مدیر
                    </h3>
                    <p className="text-sm whitespace-pre-wrap">{selectedOrder.admin_notes}</p>
                  </div>
                )}

                {/* Show credential button for each order item */}
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item, idx) => {
                    const hasCredentials = item.has_credentials;
                    const itemLabel = selectedOrder.order_items.length > 1 ? ` #${idx + 1}` : '';
                    
                    return (
                      <div key={item.id}>
                        {selectedOrder.status === 'completed' && hasCredentials ? (
                          <Button 
                            variant="hero" 
                            size="lg" 
                            className="w-full gap-2"
                            onClick={() => {
                              navigate(`/dashboard/credentials/${item.id}`);
                              setDialogOpen(false);
                            }}
                          >
                            <KeyRound className="h-5 w-5" />
                            مشاهده اطلاعات دسترسی{itemLabel}
                          </Button>
                        ) : selectedOrder.status === 'pending' && idx === 0 ? (
                          <div className="glass-card border border-yellow-500/30 p-4 rounded-lg bg-yellow-500/5">
                            <p className="text-sm text-center text-yellow-600">
                              سفارش شما در حال پردازش است. اطلاعات دسترسی به زودی آماده خواهد شد.
                            </p>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
