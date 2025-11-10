import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
}

interface Credential {
  id: string;
  product_id: string;
  username: string;
  password: string;
  additional_info: any;
  is_assigned: boolean;
  assigned_at: string | null;
  max_seats: number;
  totp_secret: string | null;
  products: { name: string };
}

interface Seat {
  id: string;
  user_id: string;
  order_item_id: string;
  status: string;
  credential_id: string;
  profiles: { full_name: string | null; email: string | null };
  order_items: { order_id: string; orders: { order_number: string } };
  product_credentials: { totp_secret: string | null };
  totp_logs: { outcome: string; attempt_number: number }[];
}

export default function AdminProductCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [seatsDialogOpen, setSeatsDialogOpen] = useState(false);
  const [selectedCredentialSeats, setSelectedCredentialSeats] = useState<Seat[]>([]);
  const [formData, setFormData] = useState({
    product_id: '',
    username: '',
    password: '',
    additional_info: '',
    max_seats: '1',
    totp_secret: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [credentialsRes, productsRes] = await Promise.all([
      supabase
        .from('product_credentials')
        .select('*, products(name)')
        .order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').order('name')
    ]);

    if (credentialsRes.data) setCredentials(credentialsRes.data as any);
    if (productsRes.data) setProducts(productsRes.data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.product_id || !formData.username || !formData.password) {
      toast({ title: 'خطا', description: 'لطفا همه فیلدها را پر کنید', variant: 'destructive' });
      return;
    }

    const payload = {
      product_id: formData.product_id,
      username: formData.username,
      password: formData.password,
      additional_info: formData.additional_info ? JSON.parse(formData.additional_info) : {},
      max_seats: parseInt(formData.max_seats) || 1,
      totp_secret: formData.totp_secret || null
    };

    let error;
    if (editingCredential) {
      ({ error } = await supabase.from('product_credentials').update(payload).eq('id', editingCredential.id));
    } else {
      ({ error } = await supabase.from('product_credentials').insert(payload));
    }

    if (error) {
      toast({ title: 'خطا', description: 'عملیات انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: editingCredential ? 'به‌روزرسانی شد' : 'اعتبارنامه اضافه شد' });
      setDialogOpen(false);
      setEditingCredential(null);
      setFormData({ product_id: '', username: '', password: '', additional_info: '', max_seats: '1', totp_secret: '' });
      loadData();
    }
  };

  const handleEdit = (cred: Credential) => {
    setEditingCredential(cred);
    setFormData({
      product_id: cred.product_id,
      username: cred.username,
      password: cred.password,
      additional_info: JSON.stringify(cred.additional_info || {}, null, 2),
      max_seats: (cred.max_seats || 1).toString(),
      totp_secret: cred.totp_secret || ''
    });
    setDialogOpen(true);
  };

  const handleViewSeats = async (credentialId: string) => {
    // First get the seats
    const { data: seatsData, error: seatsError } = await supabase
      .from('account_seats')
      .select(`
        id, 
        user_id, 
        order_item_id, 
        status, 
        credential_id,
        profiles(full_name, email), 
        order_items(order_id, orders(order_number)),
        product_credentials(totp_secret)
      `)
      .eq('credential_id', credentialId)
      .order('created_at', { ascending: false });
    
    if (seatsError) {
      toast({ title: 'خطا در بارگذاری صندلی‌ها', description: seatsError.message, variant: 'destructive' });
      setSelectedCredentialSeats([]);
      setSeatsDialogOpen(true);
      return;
    }

    // Get TOTP logs for each seat
    const seatsWithLogs = await Promise.all(
      (seatsData || []).map(async (seat: any) => {
        const { data: logs } = await supabase
          .from('totp_issuance_log')
          .select('outcome, attempt_number')
          .eq('seat_id', seat.id)
          .order('attempt_number', { ascending: true });
        
        return {
          ...seat,
          totp_logs: logs || []
        };
      })
    );
    
    setSelectedCredentialSeats(seatsWithLogs as any);
    setSeatsDialogOpen(true);
  };

  const getTotpStatusBadge = (seat: Seat) => {
    const hasTotp = seat.product_credentials?.totp_secret;
    const logs = seat.totp_logs || [];
    
    if (!hasTotp) {
      return <Badge variant="default">موفق (بدون TOTP)</Badge>;
    }
    
    const successLog = logs.find(log => log.outcome === 'success');
    if (successLog) {
      return <Badge variant="default">موفق</Badge>;
    }
    
    const failedLogs = logs.filter(log => log.outcome === 'failure');
    if (failedLogs.length === 2 || seat.status === 'locked') {
      return <Badge variant="destructive">ناموفق 2/2</Badge>;
    }
    if (failedLogs.length === 1) {
      return <Badge variant="secondary">ناموفق 1/2</Badge>;
    }
    
    return <Badge variant="outline">تایید نشده</Badge>;
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('product_credentials').delete().eq('id', id);

    if (error) {
      toast({ title: 'خطا', description: 'حذف انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: 'اعتبارنامه حذف شد' });
      loadData();
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            مدیریت <span className="gradient-primary bg-clip-text text-transparent">اعتبارنامه‌ها</span>
          </h1>
          <div className="flex gap-3">
            <Button onClick={() => { setEditingCredential(null); setDialogOpen(true); }} className="gap-2">
              <Plus className="h-4 w-4" />
              افزودن اعتبارنامه
            </Button>
            <Link to="/admin">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                بازگشت به پنل
              </Button>
            </Link>
          </div>
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
                    <TableHead className="text-right">محصول</TableHead>
                    <TableHead className="text-right">نام کاربری</TableHead>
                    <TableHead className="text-right">رمز عبور</TableHead>
                    <TableHead className="text-right">تعداد صندلی</TableHead>
                    <TableHead className="text-right">TOTP</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ اختصاص</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">{cred.products.name}</TableCell>
                      <TableCell>{cred.username}</TableCell>
                      <TableCell>••••••••</TableCell>
                      <TableCell>{cred.max_seats || 1}</TableCell>
                      <TableCell>
                        {cred.totp_secret ? (
                          <Badge variant="default">فعال</Badge>
                        ) : (
                          <Badge variant="secondary">غیرفعال</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cred.is_assigned ? (
                          <Badge variant="secondary">اختصاص داده شده</Badge>
                        ) : (
                          <Badge variant="default">آماده تحویل</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {cred.assigned_at
                          ? new Date(cred.assigned_at).toLocaleDateString('fa-IR')
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewSeats(cred.id)}>
                            مشاهده صندلی‌ها
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cred)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!cred.is_assigned && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(cred.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingCredential(null); setFormData({ product_id: '', username: '', password: '', additional_info: '', max_seats: '1', totp_secret: '' }); }}}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCredential ? 'ویرایش اعتبارنامه' : 'افزودن اعتبارنامه جدید'}</DialogTitle>
              <DialogDescription>لطفا اطلاعات لازم برای اعتبارنامه محصول را وارد کنید.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>محصول</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData({ ...formData, product_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="انتخاب محصول" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>نام کاربری</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="نام کاربری"
                />
              </div>
              <div>
                <Label>رمز عبور</Label>
                <Input
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="رمز عبور"
                />
              </div>
              <div>
                <Label>اطلاعات اضافی (JSON - اختیاری)</Label>
                <Textarea
                  value={formData.additional_info}
                  onChange={(e) => setFormData({ ...formData, additional_info: e.target.value })}
                  placeholder='{"note": "توضیحات"}'
                />
              </div>
              <div>
                <Label>تعداد صندلی (کاربران مجاز)</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.max_seats}
                  onChange={(e) => setFormData({ ...formData, max_seats: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div>
                <Label>رمز TOTP (اختیاری)</Label>
                <Input
                  value={formData.totp_secret}
                  onChange={(e) => setFormData({ ...formData, totp_secret: e.target.value })}
                  placeholder="JBSWY3DPEHPK3PXP"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  رمز مخفی TOTP برای احراز هویت دو مرحله‌ای
                </p>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingCredential ? 'به‌روزرسانی' : 'افزودن'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={seatsDialogOpen} onOpenChange={setSeatsDialogOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>صندلی‌های اختصاص داده شده</DialogTitle>
              <DialogDescription>فهرست صندلی‌های اختصاص داده‌شده به این اعتبارنامه.</DialogDescription>
            </DialogHeader>
            <Table>
              <TableHeader dir="rtl">
                <TableRow>
                  <TableHead className="text-right">نام کاربر</TableHead>
                  <TableHead className="text-right">ایمیل</TableHead>
                  <TableHead className="text-right">شماره سفارش</TableHead>
                  <TableHead className="text-right">وضعیت TOTP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedCredentialSeats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      هنوز صندلی‌ای اختصاص داده نشده
                    </TableCell>
                  </TableRow>
                ) : (
                  selectedCredentialSeats.map((seat) => (
                    <TableRow key={seat.id}>
                      <TableCell>{seat.profiles?.full_name || 'نامشخص'}</TableCell>
                      <TableCell>{seat.profiles?.email || '-'}</TableCell>
                      <TableCell>{seat.order_items?.orders?.order_number || '-'}</TableCell>
                      <TableCell>{getTotpStatusBadge(seat)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
