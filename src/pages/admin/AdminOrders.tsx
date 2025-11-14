import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { Eye, Link2 } from 'lucide-react';
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
    id: string;
    product_id: string;
    quantity: number;
    price: number;
    credentials: any;
    credential_data: any;
    products: { name: string; image_url: string };
  }[];
}

interface Credential {
  id: string;
  username: string;
  max_seats: number;
  current_seats: number;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<string | null>(null);
  const [availableCredentials, setAvailableCredentials] = useState<Credential[]>([]);
  const [selectedCredential, setSelectedCredential] = useState<string>('');
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
      .select('id, product_id, quantity, price, credentials, credential_data, products(name, image_url)')
      .eq('order_id', order.id);
    
    setSelectedOrder({ ...order, order_items: data as any });
    setAdminNotes(order.admin_notes || '');
    setDialogOpen(true);
  };

  const handleOpenAssignDialog = async (orderItemId: string, productId: string) => {
    // First, get the order item's plan_id
    const { data: orderItem, error: orderItemError } = await supabase
      .from('order_items')
      .select('plan_id')
      .eq('id', orderItemId)
      .single();

    if (orderItemError || !orderItem) {
      toast({ title: 'خطا', description: 'خطا در یافتن سفارش', variant: 'destructive' });
      return;
    }

    // Get available credentials for this product AND plan
    let query = supabase
      .from('product_credentials')
      .select('id, username, max_seats, plan_id')
      .eq('product_id', productId);
    
    // Handle NULL vs specific UUID for plan_id
    if (orderItem.plan_id === null) {
      query = query.is('plan_id', null);
    } else {
      query = query.eq('plan_id', orderItem.plan_id);
    }
    
    const { data: credentials } = await query;

    if (!credentials || credentials.length === 0) {
      toast({ 
        title: 'خطا', 
        description: 'اعتبارنامه‌ای برای این پلن موجود نیست. لطفاً ابتدا اعتبارنامه با پلن مناسب اضافه کنید.',
        variant: 'destructive' 
      });
      return;
    }

    // Get seat counts for each credential
    const credentialsWithSeats = await Promise.all(
      credentials.map(async (cred) => {
        const { count } = await supabase
          .from('account_seats')
          .select('*', { count: 'exact', head: true })
          .eq('credential_id', cred.id);
        
        return {
          ...cred,
          current_seats: count || 0
        };
      })
    );

    // Filter to only show credentials with available seats
    const available = credentialsWithSeats.filter(c => c.current_seats < c.max_seats);

    if (available.length === 0) {
      toast({ title: 'خطا', description: 'همه اعتبارنامه‌های این پلن پر هستند', variant: 'destructive' });
      return;
    }

    setAvailableCredentials(available);
    setSelectedOrderItem(orderItemId);
    setSelectedCredential('');
    setAssignDialogOpen(true);
  };

  const handleAssignCredential = async () => {
    if (!selectedCredential || !selectedOrderItem) return;

    // Get credential details
    const { data: credential } = await supabase
      .from('product_credentials')
      .select('username, password, additional_info, totp_secret')
      .eq('id', selectedCredential)
      .single();

    if (!credential) {
      toast({ title: 'خطا', description: 'اعتبارنامه یافت نشد', variant: 'destructive' });
      return;
    }

    // Get order item and order details
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('order_id, product_id')
      .eq('id', selectedOrderItem)
      .single();

    if (!orderItem) {
      toast({ title: 'خطا', description: 'آیتم سفارش یافت نشد', variant: 'destructive' });
      return;
    }

    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('id', orderItem.order_id)
      .single();

    if (!order) {
      toast({ title: 'خطا', description: 'سفارش یافت نشد', variant: 'destructive' });
      return;
    }

    // Check if seat already exists
    const { data: existingSeat } = await supabase
      .from('account_seats')
      .select('id')
      .eq('order_item_id', selectedOrderItem)
      .maybeSingle();

    if (!existingSeat) {
      // Create seat only if it doesn't exist
      const { error: seatError } = await supabase
        .from('account_seats')
        .insert({
          credential_id: selectedCredential,
          order_item_id: selectedOrderItem,
          user_id: order.user_id,
          status: credential.totp_secret ? 'unclaimed' : 'success'
        });

      if (seatError) {
        console.error('Seat creation error:', seatError);
        toast({ title: 'خطا', description: 'ایجاد صندلی انجام نشد: ' + seatError.message, variant: 'destructive' });
        return;
      }
    }

    // Update order item with credentials
    const credentialsData = {
      username: credential.username,
      password: credential.password,
      additional_info: credential.additional_info,
      requires_totp: credential.totp_secret !== null
    };

    console.log('Updating order item with credentials:', {
      orderItemId: selectedOrderItem,
      credentials: credentialsData
    });

    const { error: updateError } = await supabase
      .from('order_items')
      .update({
        credentials: credentialsData
      })
      .eq('id', selectedOrderItem);

    if (updateError) {
      console.error('Credentials update error:', updateError);
      toast({ title: 'خطا', description: 'به‌روزرسانی اعتبارنامه انجام نشد: ' + updateError.message, variant: 'destructive' });
      return;
    }

    console.log('Credentials updated successfully');

    // Check if all seats are filled and ALL are successful before marking as assigned
    const { count } = await supabase
      .from('account_seats')
      .select('*', { count: 'exact', head: true })
      .eq('credential_id', selectedCredential);

    const cred = availableCredentials.find(c => c.id === selectedCredential);
    if (cred && count && count >= cred.max_seats) {
      // Check if all seats have status = 'success'
      const { count: successCount } = await supabase
        .from('account_seats')
        .select('*', { count: 'exact', head: true })
        .eq('credential_id', selectedCredential)
        .eq('status', 'success');
      
      // Only mark as assigned if all seats are successful
      if (successCount === count) {
        await supabase
          .from('product_credentials')
          .update({ is_assigned: true, assigned_at: new Date().toISOString() })
          .eq('id', selectedCredential);
      }
    }

    // Update order status to completed
    await supabase
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderItem.order_id);

    // Log success for non-TOTP credentials
    if (!credential.totp_secret) {
      const { data: seat } = await supabase
        .from('account_seats')
        .select('id')
        .eq('order_item_id', selectedOrderItem)
        .single();
      
      if (seat) {
        await supabase
          .from('totp_issuance_log')
          .insert({
            seat_id: seat.id,
            user_id: order.user_id,
            attempt_number: 1,
            outcome: 'success'
          });
      }
    }

    toast({ title: 'موفق', description: 'اعتبارنامه با موفقیت اختصاص داده شد' });
    setAssignDialogOpen(false);
    loadOrders();
    if (selectedOrder) {
      handleViewDetails(selectedOrder);
    }
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

  const handleDetachCredential = async (orderItemId: string) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این اعتبارنامه را از سفارش جدا کنید؟')) {
      return;
    }

    try {
      // Get the seat for this order item
      const { data: seat, error: seatError } = await supabase
        .from('account_seats')
        .select('id, credential_id')
        .eq('order_item_id', orderItemId)
        .maybeSingle();

      if (seatError) {
        console.error('Error fetching seat:', seatError);
        toast({ title: 'خطا', description: 'خطا در یافتن صندلی', variant: 'destructive' });
        return;
      }

      if (seat) {
        // Delete the seat (this will cascade delete TOTP logs)
        const { error: deleteSeatError } = await supabase
          .from('account_seats')
          .delete()
          .eq('id', seat.id);

        if (deleteSeatError) {
          console.error('Error deleting seat:', deleteSeatError);
          toast({ title: 'خطا', description: 'خطا در حذف صندلی', variant: 'destructive' });
          return;
        }

        // Check if credential should be marked as unassigned
        const { count } = await supabase
          .from('account_seats')
          .select('*', { count: 'exact', head: true })
          .eq('credential_id', seat.credential_id);

        const { data: credential } = await supabase
          .from('product_credentials')
          .select('max_seats')
          .eq('id', seat.credential_id)
          .single();

        // If seats are now below max, mark credential as unassigned
        if (credential && count !== null && count < credential.max_seats) {
          await supabase
            .from('product_credentials')
            .update({ is_assigned: false, assigned_at: null })
            .eq('id', seat.credential_id);
        }
      }

      // Clear credentials from order item (both old and new columns) and reset status
      const { error: updateError } = await supabase
        .from('order_items')
        .update({ 
          credentials: null,
          credential_data: null,
          status: 'pending'
        })
        .eq('id', orderItemId);

      if (updateError) {
        console.error('Error clearing credentials:', updateError);
        toast({ title: 'خطا', description: 'خطا در پاک کردن اعتبارنامه', variant: 'destructive' });
        return;
      }

      // Update order status back to pending
      const { data: orderItem } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('id', orderItemId)
        .single();

      if (orderItem) {
        await supabase
          .from('orders')
          .update({ status: 'pending' })
          .eq('id', orderItem.order_id);
      }

      toast({ title: 'موفق', description: 'اعتبارنامه با موفقیت جدا شد' });
      loadOrders();
      if (selectedOrder) {
        handleViewDetails(selectedOrder);
      }
    } catch (err) {
      console.error('Error detaching credential:', err);
      toast({ title: 'خطا', description: 'خطا در جدا کردن اعتبارنامه', variant: 'destructive' });
    }
  };

  const handleProcessPendingOrders = async () => {
    try {
      const { data, error } = await supabase.rpc('assign_credentials_to_pending_orders');
      
      if (error) {
        console.error('Error processing pending orders:', error);
        toast({ 
          title: 'خطا', 
          description: 'مشکلی در پردازش سفارشات پیش آمد', 
          variant: 'destructive' 
        });
        return;
      }

      const results = (data as any[]) || [];
      const successCount = results.filter((r: any) => r.success).length;
      const failureCount = results.filter((r: any) => !r.success).length;

      if (successCount > 0) {
        toast({ 
          title: 'موفق', 
          description: `${successCount} سفارش با موفقیت پردازش شد${failureCount > 0 ? ` و ${failureCount} سفارش ناموفق بود` : ''}` 
        });
        loadOrders();
      } else if (failureCount > 0) {
        toast({ 
          title: 'توجه', 
          description: 'هیچ سفارشی پردازش نشد. ممکن است اعتبارنامه کافی موجود نباشد.' 
        });
      } else {
        toast({ 
          title: 'اطلاع', 
          description: 'هیچ سفارش در انتظاری یافت نشد' 
        });
      }
    } catch (err) {
      console.error('Error:', err);
      toast({ 
        title: 'خطا', 
        description: 'مشکلی در پردازش سفارشات پیش آمد', 
        variant: 'destructive' 
      });
    }
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        
        <main className="mr-64 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold">
                  مدیریت <span className="gradient-primary bg-clip-text text-transparent">سفارشات</span>
                </h1>
                <p className="text-muted-foreground">مشاهده و مدیریت سفارشات مشتریان</p>
              </div>
              <Button variant="hero" onClick={handleProcessPendingOrders} className="gap-2">
                <Link2 className="h-4 w-4" />
                پردازش سفارشات در انتظار
            </Button>
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
                    <TableHead className="text-right">شماره سفارش</TableHead>
                    <TableHead className="text-right">مشتری</TableHead>
                    <TableHead className="text-right">ایمیل</TableHead>
                    <TableHead className="text-right">مبلغ</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
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
              <DialogDescription>مشاهده و مدیریت جزئیات سفارش</DialogDescription>
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
                          {(item.credentials || item.credential_data) ? (
                            <div className="flex gap-2 items-center mt-2">
                              <Badge variant="default">اعتبارنامه اختصاص داده شده</Badge>
                              <Link to={`/admin/credentials/${item.id}`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Eye className="h-3 w-3" />
                                  مشاهده اعتبارنامه
                                </Button>
                              </Link>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="gap-2"
                                onClick={() => handleDetachCredential(item.id)}
                              >
                                <Link2 className="h-3 w-3" />
                                جدا کردن
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 gap-2"
                              onClick={() => handleOpenAssignDialog(item.id, item.product_id)}
                            >
                              <Link2 className="h-4 w-4" />
                              اختصاص اعتبارنامه
                            </Button>
                          )}
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

        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>اختصاص اعتبارنامه به سفارش</DialogTitle>
              <DialogDescription>یک اعتبارنامه در دسترس را انتخاب کنید</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>اعتبارنامه</Label>
                <Select value={selectedCredential} onValueChange={setSelectedCredential}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب اعتبارنامه" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCredentials.map((cred) => (
                      <SelectItem key={cred.id} value={cred.id}>
                        {cred.username} ({cred.current_seats}/{cred.max_seats} پر شده)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAssignCredential} className="w-full" disabled={!selectedCredential}>
                اختصاص اعتبارنامه
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </main>
    </div>
    </>
  );
}