import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category { id: string; name: string; slug: string; description: string | null; }

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name, slug, description').order('name');
    if (error) console.error(error); else setCategories(data as Category[]);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-') };
    let error;
    if (editing) {
      ({ error } = await supabase.from('categories').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('categories').insert([payload]));
    }
    if (error) {
      toast({ title: 'خطا', description: 'ذخیره‌سازی انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: editing ? 'به‌روزرسانی شد' : 'افزوده شد' });
      setDialogOpen(false); setEditing(null); setFormData({ name: '', slug: '', description: '' }); loadCategories();
    }
  };

  const handleEdit = (c: Category) => {
    setEditing(c); setFormData({ name: c.name, slug: c.slug, description: c.description || '' }); setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) toast({ title: 'خطا', description: 'حذف انجام نشد', variant: 'destructive' }); else { toast({ title: 'موفق', description: 'حذف شد' }); loadCategories(); }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">مدیریت <span className="gradient-primary bg-clip-text text-transparent">دسته‌بندی‌ها</span></h1>
          <div className="flex gap-3">
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditing(null); setFormData({ name: '', slug: '', description: '' }); } }}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2"><Plus className="h-4 w-4" /> افزودن دسته‌بندی</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editing ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div><Label>نام</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                  <div><Label>اسلاگ</Label><Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} /></div>
                  <div><Label>توضیحات</Label><Textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} /></div>
                  <Button type="submit" variant="hero" className="w-full">{editing ? 'به‌روزرسانی' : 'افزودن'}</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Link to="/admin"><Button variant="outline" className="gap-2"><ArrowLeft className="h-4 w-4" /> بازگشت</Button></Link>
          </div>
        </div>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div></div>
            ) : (
              <Table>
                <TableHeader dir="rtl">
                  <TableRow>
                    <TableHead>نام</TableHead>
                    <TableHead>اسلاگ</TableHead>
                    <TableHead>توضیحات</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.slug}</TableCell>
                      <TableCell className="max-w-md truncate">{c.description}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(c)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
