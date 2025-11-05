import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";

const ChangePassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast({
        title: 'خطا',
        description: 'رمز عبور جدید و تکرار آن مطابقت ندارند',
        variant: 'destructive'
      });
      return;
    }

    if (passwords.newPassword.length < 6) {
      toast({
        title: 'خطا',
        description: 'رمز عبور باید حداقل ۶ کاراکتر باشد',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: passwords.newPassword
    });

    if (error) {
      toast({
        title: 'خطا',
        description: 'تغییر رمز عبور انجام نشد',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'موفق',
        description: 'رمز عبور با موفقیت تغییر کرد'
      });
      navigate('/account/settings');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-4xl font-bold">
              تغییر <span className="gradient-primary bg-clip-text text-transparent">رمز عبور</span>
            </h1>
            <Link to="/account/settings">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                بازگشت
              </Button>
            </Link>
          </div>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="new-password">رمز عبور جدید</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    className="mt-2"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>
                <div>
                  <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    className="mt-2"
                    placeholder="تکرار رمز عبور"
                  />
                </div>
                <Button 
                  variant="hero" 
                  onClick={handleChangePassword} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
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

export default ChangePassword;
