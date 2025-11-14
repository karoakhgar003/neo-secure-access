import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Copy, AlertTriangle, Shield, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TotpModal from "@/components/totp/TotpModal";

const DashboardCredentials = () => {
  const { orderItemId } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<any>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [totpModalOpen, setTotpModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCredentials();
  }, [orderItemId]);

  const loadCredentials = async () => {
    if (!orderItemId) return;

    // First get order item info
    const { data: orderItem, error: orderError } = await supabase
      .from('order_items')
      .select('id, expires_at, products(name, requires_totp), orders!inner(status)')
      .eq('id', orderItemId)
      .single();

    if (orderError) {
      console.error('Error loading order item:', orderError);
      toast({
        title: 'خطا',
        description: 'اطلاعات یافت نشد',
        variant: 'destructive'
      });
      navigate('/dashboard');
      return;
    }

    // Check if order is still pending
    const orderData = orderItem as any;
    if (orderData?.orders?.status === 'pending') {
      toast({
        title: 'در انتظار تحویل',
        description: 'اطلاعات ورود شما هنوز آماده نشده است. لطفاً کمی صبر کنید یا با پشتیبانی تماس بگیرید.',
        variant: 'default'
      });
      navigate('/account/orders');
      return;
    }

    // Get the user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: 'خطا',
        description: 'لطفا ابتدا وارد شوید',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    // Get the account seat with credentials
    const { data: seat, error: seatError } = await supabase
      .from('account_seats')
      .select(`
        id,
        status,
        product_credentials(
          username,
          password,
          additional_info,
          totp_secret
        )
      `)
      .eq('order_item_id', orderItemId)
      .eq('user_id', user.id)
      .single();

    if (seatError || !seat) {
      console.error('Error loading seat:', seatError);
      toast({
        title: 'خطا',
        description: 'اطلاعات ورود یافت نشد',
        variant: 'destructive'
      });
      navigate('/account/orders');
      return;
    }

    // Check if expired
    if (orderData?.expires_at && new Date(orderData.expires_at) < new Date()) {
      toast({
        title: 'اشتراک منقضی شده',
        description: 'این اشتراک منقضی شده است. لطفا برای تمدید با پشتیبانی تماس بگیرید.',
        variant: 'destructive'
      });
      navigate('/account/orders');
      return;
    }

    // Format credentials data
    const seatData = seat as any;
    const hasTotpSecret = !!seatData.product_credentials?.totp_secret;
    
    const credData = {
      username: seatData.product_credentials?.username,
      password: seatData.product_credentials?.password,
      additional_info: seatData.product_credentials?.additional_info,
      requires_totp: hasTotpSecret, // Show TOTP section if secret exists
      totp_secret: seatData.product_credentials?.totp_secret
    };

    console.log('Credentials loaded:', {
      username: credData.username,
      has_totp_secret: hasTotpSecret,
      product_requires_totp: orderData.products?.requires_totp,
      final_requires_totp: credData.requires_totp,
      seat_id: seatData.id
    });

    setCredentials(credData);
    setOrderData(orderData);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!credentials) {
    return null;
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "کپی شد",
      description: `${label} با موفقیت کپی شد`,
    });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          اطلاعات <span className="gradient-primary bg-clip-text text-transparent">ورود</span>
        </h1>

        <div className="max-w-2xl mx-auto space-y-6">
          <Alert className="border-yellow-500/30 bg-yellow-500/5">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <AlertDescription>
              این اطلاعات تنها یک بار نمایش داده می‌شود. لطفاً آن‌ها را در جای امنی ذخیره کنید.
            </AlertDescription>
          </Alert>

          {/* Expiration Info */}
          {orderData && (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Key className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">وضعیت اشتراک</p>
                      {orderData.expires_at ? (
                        <>
                          <p className="font-bold">
                            منقضی می‌شود: {new Date(orderData.expires_at).toLocaleDateString('fa-IR')}
                          </p>
                          {new Date(orderData.expires_at) < new Date() && (
                            <p className="text-sm text-red-500">این اشتراک منقضی شده است</p>
                          )}
                        </>
                      ) : (
                        <p className="font-bold text-green-500">اشتراک دائمی (بدون محدودیت زمانی)</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {!revealed ? (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold mb-4">اطلاعات محرمانه</h2>
                <p className="text-muted-foreground mb-8">
                  برای مشاهده اطلاعات ورود، روی دکمه زیر کلیک کنید.
                  <br />
                  توجه: این اطلاعات فقط یک بار قابل مشاهده است.
                </p>
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => setRevealed(true)}
                >
                  نمایش اطلاعات ورود
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className="glass-card border-primary/20">
                <CardContent className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">نام کاربری / ایمیل</label>
                    <div className="flex gap-2">
                      <Input
                        value={credentials.username}
                        readOnly
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.username, "نام کاربری")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">رمز عبور</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={credentials.password}
                          readOnly
                          className="pr-10"
                        />
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.password, "رمز عبور")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass-card border-primary/20">
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg mb-4">نکات امنیتی</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>این اطلاعات را با هیچ کس به اشتراک نگذارید</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>رمز عبور را تغییر ندهید، در غیر این صورت اکانت غیرفعال می‌شود</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span>از اکانت برای اهداف قانونی استفاده کنید</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                   <span>در صورت بروز مشکل، با پشتیبانی تماس بگیرید</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {credentials.requires_totp && (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">احراز هویت دو مرحله‌ای</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  این اکانت نیاز به کد TOTP برای ورود دارد. برای دریافت کد روی دکمه زیر کلیک کنید.
                </p>
                <Button onClick={() => setTotpModalOpen(true)} className="gap-2">
                  <Shield className="h-4 w-4" />
                  دریافت کد TOTP
                </Button>
              </CardContent>
            </Card>
          )}
            </>
          )}
        </div>

        {orderItemId && (
          <TotpModal
            open={totpModalOpen}
            onOpenChange={setTotpModalOpen}
            orderItemId={orderItemId}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default DashboardCredentials;
