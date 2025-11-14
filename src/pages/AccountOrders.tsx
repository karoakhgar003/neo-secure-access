import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Eye, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  status: string;
  total_amount: number;
  admin_notes?: string | null;
  order_items: {
    id: string;
    product_id: string | null;
    quantity: number;
    price: number;
    has_credentials?: boolean;
    products?: {
      name: string;
      image_url: string;
    } | null;
  }[];
}

const AccountOrders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
    } else {
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
      
      setOrders(ordersWithSeats as any);
    }
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case 'pending':
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case 'processing':
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'تکمیل شده';
      case 'pending': return 'در انتظار';
      case 'processing': return 'در حال پردازش';
      default: return status;
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const handleDownload = (order: Order) => {
    const orderData = {
      order_number: order.order_number,
      date: new Date(order.created_at).toLocaleDateString('fa-IR'),
      total: order.total_amount,
      status: getStatusText(order.status),
      items: order.order_items.map(item => ({
        product: item.products?.name || 'محصول حذف شده',
        plan: null,
        quantity: item.quantity,
        price: item.price
      }))
    };

    const blob = new Blob([JSON.stringify(orderData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order-${order.order_number}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'موفق',
      description: 'اطلاعات سفارش دانلود شد'
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          سفارشات <span className="gradient-primary bg-clip-text text-transparent">من</span>
        </h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : orders.length === 0 ? (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">هنوز سفارشی ثبت نکرده‌اید</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="glass-card border-primary/20">
                <CardContent className="p-6">
                  {order.order_items.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">این سفارش هیچ محصولی ندارد (احتمالاً حذف شده)</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        شماره سفارش: {order.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        تاریخ: {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </p>
                      <p className="text-primary font-bold mt-2">
                        {order.total_amount.toLocaleString('fa-IR')} تومان
                      </p>
                    </div>
                  ) : (
                    <>
                      {order.order_items.map((item, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-6 mb-6 last:mb-0">
                          <img
                            src={item.products?.image_url || '/placeholder.svg'}
                            alt={item.products?.name || 'محصول'}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          
                          <div className="flex-1">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                              <div>
                                <h3 className="font-bold text-xl mb-2">
                                  {item.products?.name || 'محصول حذف شده'}
                                </h3>
                                <p className="text-muted-foreground text-sm">
                                  شماره سفارش: {order.order_number}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  تاریخ: {new Date(order.created_at).toLocaleDateString('fa-IR')}
                                </p>
                                <p className="text-muted-foreground text-sm">
                                  تعداد: {item.quantity}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge className={getStatusBadge(order.status)}>
                                  {getStatusText(order.status)}
                                </Badge>
                                <p className="text-primary font-bold text-xl">
                                  {order.total_amount.toLocaleString('fa-IR')} تومان
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Show buttons once per order, not per item */}
                      <div className="flex gap-3 mt-4 pt-4 border-t border-primary/20">
                        <Button variant="hero" size="sm" className="gap-2" onClick={() => handleDownload(order)}>
                          <Download className="h-4 w-4" />
                          دانلود اطلاعات
                        </Button>
                        <Button variant="outline" size="sm" className="glass-card border-primary/30 gap-2" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4" />
                          جزئیات سفارش
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

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
                    <Badge className={getStatusBadge(selectedOrder.status)}>
                      {getStatusText(selectedOrder.status)}
                    </Badge>
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

export default AccountOrders;
