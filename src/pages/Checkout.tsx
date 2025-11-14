import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Shield, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Checkout = () => {
  const [paymentMethod, setPaymentMethod] = useState("zarinpal");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR');
  };

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: 'خطا',
        description: 'لطفا وارد حساب کاربری خود شوید',
        variant: 'destructive'
      });
      navigate('/auth');
      return;
    }

    if (!contactEmail || !contactPhone) {
      toast({
        title: 'خطا',
        description: 'لطفا اطلاعات تماس را وارد کنید',
        variant: 'destructive'
      });
      return;
    }

    if (cartItems.length === 0) {
      toast({
        title: 'خطا',
        description: 'سبد خرید شما خالی است',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      // Create order
      const orderNumber = `NEO-${Date.now()}`;
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: cartTotal,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          status: 'pending' // Start as pending, will be completed when credentials are assigned
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items - expand quantity into separate items
      // If quantity=2, create 2 separate order_items so each gets its own credential
      const orderItems = cartItems.flatMap(item => {
        const itemPrice = item.product_plans?.price || item.products.price || 0;
        console.log('Cart item:', {
          product_id: item.product_id,
          plan_id: item.plan_id,
          plan_name: item.product_plans?.name,
          quantity: item.quantity,
          price: itemPrice
        });
        
        // Create separate order_item for each quantity
        return Array.from({ length: item.quantity }, () => ({
          order_id: order.id,
          product_id: item.product_id,
          plan_id: item.plan_id || null,
          quantity: 1, // Each order_item represents 1 unit
          price: Number(itemPrice)
        }));
      });

      console.log('Creating order items (expanded by quantity):', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error creating order items:', itemsError);
        throw itemsError;
      }

      // Trigger credential assignment for this order
      console.log('=== STARTING CREDENTIAL ASSIGNMENT ===');
      for (const item of orderItems) {
        console.log('Calling assign_credentials_to_pending_orders with product_id:', item.product_id);
        console.log('Expected to match plan_id:', item.plan_id);
        
        const { data: assignData, error: assignError } = await supabase.rpc('assign_credentials_to_pending_orders', {
          p_product_id: item.product_id
        });
        
        console.log('Assignment function returned:', assignData);
        
        if (assignError) {
          console.error('Credential assignment error:', assignError);
        } else {
          console.log('Assignment function completed successfully');
        }
      }
      console.log('=== CREDENTIAL ASSIGNMENT COMPLETE ===');

      // Clear cart
      await clearCart();

      toast({
        title: 'موفق',
        description: 'سفارش شما با موفقیت ثبت شد'
      });

      navigate(`/thank-you?orderId=${order.id}`);
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در ثبت سفارش پیش آمد',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          تکمیل <span className="gradient-primary bg-clip-text text-transparent">خرید</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">اطلاعات تماس</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">ایمیل</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="example@email.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">شماره تماس</Label>
                    <Input 
                      id="phone" 
                      type="tel" 
                      placeholder="09123456789" 
                      dir="ltr"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">روش پرداخت</h2>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse p-4 glass-card border border-primary/20 rounded-lg cursor-pointer">
                    <RadioGroupItem value="zarinpal" id="zarinpal" />
                    <Label htmlFor="zarinpal" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Shield className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-bold">درگاه زرین‌پال</div>
                        <div className="text-sm text-muted-foreground">پرداخت امن با کارت‌های بانکی</div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <div className="flex items-center gap-3 glass-card border border-primary/20 p-4 rounded-lg">
              <Lock className="h-5 w-5 text-primary" />
              <p className="text-sm text-muted-foreground">
                تمام اطلاعات شما با رمزگذاری SSL محافظت می‌شود
              </p>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="glass-card border-primary/20 sticky top-24">
              <CardContent className="p-6 space-y-6">
                <h2 className="text-2xl font-bold">خلاصه سفارش</h2>

                <div className="space-y-3">
                  {cartItems.map((item) => {
                    const itemPrice = item.product_plans?.price || item.products.price || 0;
                    return (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground">{item.products.name}</span>
                          {item.product_plans && (
                            <span className="text-xs text-muted-foreground/70">
                              پلن: {item.product_plans.name}
                            </span>
                          )}
                        </div>
                        <span className="font-medium">{formatPrice(Number(itemPrice) * item.quantity)} تومان</span>
                      </div>
                    );
                  })}

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>جمع کل</span>
                      <span className="text-primary">{formatPrice(cartTotal)} تومان</span>
                    </div>
                  </div>
                </div>

                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full gap-2"
                  onClick={handleCheckout}
                  disabled={loading || cartItems.length === 0}
                >
                  <Lock className="h-4 w-4" />
                  {loading ? 'در حال پردازش...' : 'پرداخت نهایی'}
                </Button>

                <Link to="/cart">
                  <Button variant="ghost" className="w-full">
                    بازگشت به سبد خرید
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
