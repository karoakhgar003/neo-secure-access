import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Send, LogOut, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const AccountSettings = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    phone: '',
    telegram_username: ''
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, phone, telegram_username')
      .eq('id', user?.id)
      .maybeSingle();

    if (data) {
      setProfile({
        full_name: data.full_name || '',
        phone: data.phone || '',
        telegram_username: data.telegram_username || ''
      });
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user?.id);

    if (error) {
      toast({
        title: 'خطا',
        description: 'ذخیره‌سازی انجام نشد',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'موفق',
        description: 'تغییرات ذخیره شد'
      });
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          تنظیمات <span className="gradient-primary bg-clip-text text-transparent">حساب</span>
        </h1>

        <div className="max-w-2xl space-y-6">
          {/* Profile Information */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">اطلاعات پروفایل</h2>
                  <p className="text-muted-foreground text-sm">مدیریت اطلاعات حساب کاربری</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">نام و نام خانوادگی</Label>
                  <Input
                    id="name"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="email">ایمیل</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="mt-2 opacity-60"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">شماره تماس</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="telegram">نام کاربری تلگرام</Label>
                  <Input
                    id="telegram"
                    value={profile.telegram_username}
                    onChange={(e) => setProfile({ ...profile, telegram_username: e.target.value })}
                    className="mt-2"
                    placeholder="@username"
                  />
                </div>
                <Button variant="hero" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Telegram Connection */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                  <Send className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">اتصال به تلگرام</h2>
                  <p className="text-muted-foreground text-sm">برای دریافت کدهای TOTP</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="glass-card border border-primary/20 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-3">
                    برای استفاده از سرویس‌های خاص، باید حساب تلگرام خود را متصل کنید
                  </p>
                  <Button variant="hero" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    اتصال به ربات تلگرام
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6">تغییر رمز عبور</h2>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="current-password">رمز عبور فعلی</Label>
                  <Input
                    id="current-password"
                    type="password"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="new-password">رمز عبور جدید</Label>
                  <Input
                    id="new-password"
                    type="password"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    className="mt-2"
                  />
                </div>
                <Button variant="hero">
                  تغییر رمز عبور
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="glass-card border-destructive/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg">خروج از حساب کاربری</h3>
                  <p className="text-sm text-muted-foreground">
                    از تمام دستگاه‌ها خارج شوید
                  </p>
                </div>
                <Button variant="destructive" className="gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  خروج
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSettings;
