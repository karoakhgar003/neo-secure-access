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

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  published: boolean;
  created_at: string;
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    summary: '',
    content: '',
    image_url: '',
    published: true
  });

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, published, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading posts:', error);
    } else {
      setPosts(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const postData = {
      ...formData,
      slug: formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-')
    };

    let error;
    if (editingPost) {
      ({ error } = await supabase
        .from('blog_posts')
        .update(postData)
        .eq('id', editingPost.id));
    } else {
      ({ error } = await supabase
        .from('blog_posts')
        .insert([postData]));
    }

    if (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در ذخیره مقاله پیش آمد',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'موفق',
        description: editingPost ? 'مقاله به‌روزرسانی شد' : 'مقاله اضافه شد'
      });
      setDialogOpen(false);
      resetForm();
      loadPosts();
    }
  };

  const handleEdit = async (post: BlogPost) => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', post.id)
      .single();
    
    if (data) {
      setEditingPost(post);
      setFormData({
        title: data.title,
        slug: data.slug,
        summary: data.summary || '',
        content: data.content,
        image_url: data.image_url || '',
        published: data.published
      });
      setDialogOpen(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;

    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف مقاله پیش آمد',
        variant: 'destructive'
      });
    } else {
      toast({ title: 'موفق', description: 'مقاله حذف شد' });
      loadPosts();
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      summary: '',
      content: '',
      image_url: '',
      published: true
    });
    setEditingPost(null);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            مدیریت <span className="gradient-primary bg-clip-text text-transparent">مقالات</span>
          </h1>
          <div className="flex gap-3">
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن مقاله
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPost ? 'ویرایش مقاله' : 'افزودن مقاله جدید'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>عنوان مقاله</Label>
                    <Input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>خلاصه</Label>
                    <Textarea
                      value={formData.summary}
                      onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>محتوا</Label>
                    <Textarea
                      required
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label>آدرس تصویر (URL)</Label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    />
                  </div>
                  <Button type="submit" variant="hero" className="w-full">
                    {editingPost ? 'به‌روزرسانی' : 'افزودن'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Link to="/admin">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                بازگشت
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
                    <TableHead className="text-right">عنوان</TableHead>
                    <TableHead className="text-right">خلاصه</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">تاریخ</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.title}</TableCell>
                      <TableCell className="max-w-xs truncate">{post.summary}</TableCell>
                      <TableCell>{post.published ? 'منتشر شده' : 'پیش‌نویس'}</TableCell>
                      <TableCell>
                        {new Date(post.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(post)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
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
