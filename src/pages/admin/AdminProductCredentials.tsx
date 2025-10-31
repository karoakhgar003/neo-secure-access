import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
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
  products: { name: string };
}

export default function AdminProductCredentials() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    username: '',
    password: '',
    additional_info: ''
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

  const handleAdd = async () => {
    if (!formData.product_id || !formData.username || !formData.password) {
      toast({ title: 'خطا', description: 'لطفا همه فیلدها را پر کنید', variant: 'destructive' });
      return;
    }

    const { error } = await supabase.from('product_credentials').insert({
      product_id: formData.product_id,
      username: formData.username,
      password: formData.password,
      additional_info: formData.additional_info ? JSON.parse(formData.additional_info) : {}
    });

    if (error) {
      toast({ title: 'خطا', description: 'افزودن انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: 'اعتبارنامه اضافه شد' });
      setDialogOpen(false);
      setFormData({ product_id: '', username: '', password: '', additional_info: '' });
      loadData();
    }
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
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
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
                <TableHeader>
                  <TableRow>
                    <TableHead>محصول</TableHead>
                    <TableHead>نام کاربری</TableHead>
                    <TableHead>رمز عبور</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>تاریخ اختصاص</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((cred) => (
                    <TableRow key={cred.id}>
                      <TableCell className="font-medium">{cred.products.name}</TableCell>
                      <TableCell>{cred.username}</TableCell>
                      <TableCell>••••••••</TableCell>
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
                        {!cred.is_assigned && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cred.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>افزودن اعتبارنامه جدید</DialogTitle>
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
              <Button onClick={handleAdd} className="w-full">
                افزودن
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
