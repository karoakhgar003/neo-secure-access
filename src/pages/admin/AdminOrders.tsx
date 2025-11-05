import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  contact_email: string;
  created_at: string;
  admin_notes?: string | null;
  profiles: { full_name: string | null };
  order_items?: {
    product_id: string;
    quantity: number;
    price: number;
    products: { name: string; image_url: string };
  }[];
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, contact_email, created_at, user_id, admin_notes')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      setLoading(false);
      return;
    }

    const ordersWithProfiles = await Promise.all(
      (data || []).map(async (order) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', order.user_id)
          .single();

        return {
          ...order,
          profiles: { full_name: profile?.full_name || null }
        };
      })
    );

    setOrders(ordersWithProfiles as Order[]);
    setLoading(false);
  };

  const handleViewDetails = async (order: Order) => {
    const { data } = await supabase
      .from('order_items')
      .select('product_id, quantity, price, products(name, image_url)')
      .eq('order_id', order.id);
    
    setSelectedOrder({ ...order, order_items: data as any });
    setAdminNotes(order.admin_notes || '');
    setDialogOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({ title: 'خطا', description: 'تغییر وضعیت انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: 'وضعیت سفارش تغییر کرد' });
      loadOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;

    const { error } = await supabase
      .from('orders')
      .update({ admin_notes: adminNotes })
      .eq('id', selectedOrder.id);

    if (error) {
      toast({ title: 'خطا', description: 'ذخیره یادداشت انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: 'یادداشت ذخیره شد' });
      loadOrders();
      setSelectedOrder({ ...selectedOrder, admin_notes: adminNotes });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "در انتظار" },
      processing: { variant: "outline", label: "در حال پردازش" },
      completed: { variant: "default", label: "تکمیل شده" },
      cancelled: { variant: "destructive", label: "لغو شده" }
    };

    const statusInfo = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            مدیریت <span className="gradient-primary bg-clip-text text-transparent">سفارشات</span>
          </h1>
          <Link to="/admin">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              بازگشت به پنل
            </Button>
          </Link>
        </div>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader dir="rtl">
                  <TableRow>
                    <TableHead>شماره سفارش</TableHead>
                    <TableHead>مشتری</TableHead>
                    <TableHead>ایمیل</TableHead>
                    <TableHead>مبلغ</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.order_number}</TableCell>
                      <TableCell>{order.profiles.full_name || 'نامشخص'}</TableCell>
                      <TableCell>{order.contact_email}</TableCell>
                      <TableCell>{Number(order.total_amount).toLocaleString('fa-IR')} تومان</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        {new Date(order.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleViewDetails(order)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>جزئیات سفارش {selectedOrder?.order_number}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">مشتری</p>
                    <p className="font-medium">{selectedOrder.profiles.full_name || 'نامشخص'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ایمیل</p>
                    <p className="font-medium">{selectedOrder.contact_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">مبلغ کل</p>
                    <p className="font-medium">{Number(selectedOrder.total_amount).toLocaleString('fa-IR')} تومان</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاریخ</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleDateString('fa-IR')}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">وضعیت سفارش</p>
                  <Select value={selectedOrder.status} onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">در انتظار</SelectItem>
                      <SelectItem value="processing">در حال پردازش</SelectItem>
                      <SelectItem value="completed">تکمیل شده</SelectItem>
                      <SelectItem value="cancelled">لغو شده</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="admin-notes">یادداشت مدیر (اطلاعات تحویل، اعتبارنامه، راهنمایی)</Label>
                  <Textarea
                    id="admin-notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="اطلاعات تحویل، اعتبارنامه یا راهنمایی برای کاربر را وارد کنید..."
                    className="mt-2 min-h-[100px]"
                  />
                  <Button variant="hero" onClick={handleSaveNotes} className="mt-3 w-full">
                    ذخیره یادداشت
                  </Button>
                </div>

                <div>
                  <h3 className="font-bold mb-4">محصولات سفارش</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex gap-4 p-3 rounded-lg glass-card border border-primary/20">
                        <img
                          src={item.products.image_url || '/placeholder.svg'}
                          alt={item.products.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.products.name}</p>
                          <p className="text-sm text-muted-foreground">تعداد: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-primary">
                          {Number(item.price).toLocaleString('fa-IR')} تومان
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
