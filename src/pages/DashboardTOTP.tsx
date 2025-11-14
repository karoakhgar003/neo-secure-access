import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Info, Shield, Clock, Key } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DashboardTOTP = () => {
  const telegramBotLink = "https://t.me/neoaccount_bot";
  const { user } = useAuth();
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTOTPOrderItems();
    }
  }, [user]);

  const loadTOTPOrderItems = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        order_items!left(
          id,
          credential_data,
          product_name,
          plan_name,
          products!left(requires_totp)
        )
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    // Filter to only items that have credentials and require TOTP
    const totpItems = data?.flatMap(order => 
      order.order_items
        ?.filter((item: any) => 
          item.credential_data && 
          item.products?.requires_totp &&
          item.credential_data.requires_totp
        )
        .map((item: any) => ({
          ...item,
          order_number: order.order_number
        }))
    ) || [];

    setOrderItems(totpItems);
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          دریافت کد <span className="gradient-primary bg-clip-text text-transparent">TOTP</span>
        </h1>

        <div className="max-w-2xl mx-auto space-y-6">
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription>
              این سرویس نیاز به دریافت کد تأیید دو مرحله‌ای (TOTP) از طریق ربات تلگرام دارد.
            </AlertDescription>
          </Alert>

          {/* List of order items that need TOTP */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : orderItems.length > 0 ? (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">سفارشات شما که نیاز به TOTP دارند:</h2>
              {orderItems.map((item, idx) => (
                <Card key={item.id} className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold">{item.product_name || 'محصول'}</h3>
                        {item.plan_name && (
                          <p className="text-sm text-muted-foreground">پلن: {item.plan_name}</p>
                        )}
                        <p className="text-sm text-muted-foreground">سفارش: {item.order_number}</p>
                      </div>
                      <Link to={`/dashboard/credentials/${item.id}`}>
                        <Button variant="hero" className="gap-2">
                          <Key className="h-4 w-4" />
                          مشاهده و دریافت کد
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">شما سفارشی که نیاز به TOTP داشته باشد ندارید.</p>
              </CardContent>
            </Card>
          )}

          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-glow">
                <Send className="h-12 w-12 text-primary" />
              </div>

              <h2 className="text-3xl font-bold mb-4">
                دریافت کد از تلگرام
              </h2>

              <p className="text-muted-foreground mb-8 leading-relaxed">
                برای استفاده از این سرویس، نیاز است کد TOTP را از ربات تلگرام ما دریافت کنید.
                <br />
                با کلیک روی دکمه زیر، به ربات تلگرام متصل شوید و کد خود را دریافت کنید.
              </p>

              <a
                href={telegramBotLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="hero" size="lg" className="text-lg px-8 py-6 mb-4">
                  <Send className="ml-2 h-5 w-5" />
                  اتصال به ربات تلگرام
                </Button>
              </a>

              <p className="text-sm text-muted-foreground">
                پس از دریافت کد، می‌توانید به اکانت خود دسترسی پیدا کنید
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <h3 className="font-bold">امنیت بالا</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  کدهای TOTP با استانداردهای امنیتی بالا تولید می‌شوند
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <h3 className="font-bold">دریافت سریع</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  کد شما در کمتر از ۱۰ ثانیه در تلگرام ارسال می‌شود
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">راهنمای استفاده</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    ۱
                  </span>
                  <span>روی دکمه "اتصال به ربات تلگرام" کلیک کنید</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    ۲
                  </span>
                  <span>در تلگرام، دستور /start را به ربات ارسال کنید</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    ۳
                  </span>
                  <span>شماره سفارش خود را برای ربات ارسال کنید</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs">
                    ۴
                  </span>
                  <span>کد TOTP را دریافت کرده و از آن برای ورود استفاده کنید</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardTOTP;
