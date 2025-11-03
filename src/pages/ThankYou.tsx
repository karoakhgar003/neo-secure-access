import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Package, Send, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orderData, setOrderData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId && user) {
      loadOrderData(orderId);
    } else {
      setLoading(false);
    }
  }, [searchParams, user]);

  const loadOrderData = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          created_at,
          order_items (
            id,
            product_id,
            products (
              name
            )
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (!error && data) {
        setOrderData(data);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCredentials = () => {
    if (orderData?.order_items?.[0]?.id) {
      navigate(`/dashboard/credentials/${orderData.order_items[0].id}`);
    }
  };
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-primary/20 text-center">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              
              <h1 className="text-4xl font-bold mb-4">
                پرداخت <span className="gradient-primary bg-clip-text text-transparent">موفق</span>!
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8">
                سفارش شما با موفقیت ثبت شد
              </p>

              <div className="glass-card border border-primary/20 p-6 rounded-lg mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">شماره سفارش</span>
                  <span className="font-bold text-lg">#NEO-۱۲۳۴۵۶</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">تاریخ</span>
                  <span className="font-medium">۱۵ دی ۱۴۰۳</span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-4 text-right p-4 glass-card border border-primary/20 rounded-lg">
                  <Package className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">اطلاعات محصول ارسال شد</h3>
                    <p className="text-sm text-muted-foreground">
                      اطلاعات دسترسی به اکانت به ایمیل شما ارسال شده است
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 text-right p-4 glass-card border border-primary/20 rounded-lg">
                  <Send className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold mb-1">پشتیبانی در تلگرام</h3>
                    <p className="text-sm text-muted-foreground">
                      در صورت نیاز به راهنمایی، با پشتیبانی تلگرام ما در تماس باشید
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {orderData?.status === 'completed' && orderData?.order_items?.length > 0 && (
                  <Button 
                    variant="hero" 
                    size="lg" 
                    onClick={handleViewCredentials}
                    className="gap-2"
                  >
                    <KeyRound className="h-5 w-5" />
                    مشاهده اطلاعات دسترسی
                  </Button>
                )}
                <Link to="/account/orders">
                  <Button variant={orderData?.status === 'completed' ? 'outline' : 'hero'} size="lg" className={orderData?.status === 'completed' ? 'glass-card border-primary/30' : ''}>
                    مشاهده سفارشات
                  </Button>
                </Link>
                <Link to="/categories">
                  <Button variant="outline" size="lg" className="glass-card border-primary/30">
                    ادامه خرید
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYou;
