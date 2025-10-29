import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Shield, Edit, Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  full_name: string | null;
  phone: string | null;
  telegram_username: string | null;
  created_at: string;
  user_roles: { role: string; id: string }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', telegram_username: '', role: 'user' });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, telegram_username, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading users:', error);
      setLoading(false);
      return;
    }

    // Fetch roles separately
    const usersWithRoles = await Promise.all(
      (data || []).map(async (user) => {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role, id')
          .eq('user_id', user.id);

        return {
          ...user,
          user_roles: roles || []
        };
      })
    );

    setUsers(usersWithRoles as UserProfile[]);
    setLoading(false);
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      full_name: user.full_name || '',
      phone: user.phone || '',
      telegram_username: user.telegram_username || '',
      role: user.user_roles.length > 0 ? user.user_roles[0].role : 'user'
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: editForm.full_name,
        phone: editForm.phone,
        telegram_username: editForm.telegram_username
      })
      .eq('id', selectedUser.id);

    if (profileError) {
      toast({ title: 'خطا', description: 'ذخیره‌سازی انجام نشد', variant: 'destructive' });
      return;
    }

    // Update role
    if (selectedUser.user_roles.length > 0) {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.id);
    }

    if (editForm.role === 'admin') {
      await supabase
        .from('user_roles')
        .insert({ user_id: selectedUser.id, role: 'admin' });
    }

    toast({ title: 'موفق', description: 'تغییرات ذخیره شد' });
    setDialogOpen(false);
    loadUsers();
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('آیا مطمئن هستید؟ این عملیات قابل بازگشت نیست.')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      toast({ title: 'خطا', description: 'حذف انجام نشد', variant: 'destructive' });
    } else {
      toast({ title: 'موفق', description: 'کاربر حذف شد' });
      loadUsers();
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            مدیریت <span className="gradient-primary bg-clip-text text-transparent">کاربران</span>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>نام کامل</TableHead>
                    <TableHead>تلفن</TableHead>
                    <TableHead>تلگرام</TableHead>
                    <TableHead>نقش</TableHead>
                    <TableHead>تاریخ ثبت‌نام</TableHead>
                    <TableHead>عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.full_name || 'نامشخص'}
                      </TableCell>
                      <TableCell>{user.phone || '-'}</TableCell>
                      <TableCell>{user.telegram_username || '-'}</TableCell>
                      <TableCell>
                        {user.user_roles && user.user_roles.length > 0 ? (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            {user.user_roles[0].role === 'admin' ? 'مدیر' : 'کاربر'}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">کاربر</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString('fa-IR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(user)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
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

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>ویرایش کاربر</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>نام کامل</Label>
                <Input
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>تلفن</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>نام کاربری تلگرام</Label>
                <Input
                  value={editForm.telegram_username}
                  onChange={(e) => setEditForm({ ...editForm, telegram_username: e.target.value })}
                />
              </div>
              <div>
                <Label>نقش</Label>
                <Select value={editForm.role} onValueChange={(value) => setEditForm({ ...editForm, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">کاربر</SelectItem>
                    <SelectItem value="admin">مدیر</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="hero" onClick={handleSave} className="w-full">
                ذخیره تغییرات
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
}
