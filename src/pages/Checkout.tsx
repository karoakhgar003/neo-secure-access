import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreditCard, Wallet, Lock } from "lucide-react";

const Checkout = () => {
  const orderItems = [
    {
      id: 1,
      title: "یوتیوب پریمیوم - اشتراک ۱ ماهه",
      price: 195000,
      quantity: 1,
    },
  ];

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR');
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
                      placeholder="email@example.com"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">شماره تماس</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-6">روش پرداخت</h2>
                <RadioGroup defaultValue="zarinpal" className="space-y-4">
                  <div className="flex items-center space-x-2 space-x-reverse p-4 glass-card border border-primary/20 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="zarinpal" id="zarinpal" />
                    <Label htmlFor="zarinpal" className="flex items-center gap-3 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-bold">درگاه زرین‌پال</div>
                        <div className="text-sm text-muted-foreground">پرداخت امن با کارت‌های بانکی</div>
                      </div>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse p-4 glass-card border border-primary/20 rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <RadioGroupItem value="crypto" id="crypto" />
                    <Label htmlFor="crypto" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Wallet className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-bold">پرداخت با ارز دیجیتال</div>
                        <div className="text-sm text-muted-foreground">پرداخت با بیت‌کوین، اتریوم و...</div>
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

                <div className="space-y-4">
                  {orderItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium line-clamp-1">{item.title}</p>
                        <p className="text-sm text-muted-foreground">تعداد: {item.quantity}</p>
                      </div>
                      <p className="font-bold">{formatPrice(item.price)}</p>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-muted-foreground">
                    <span>جمع جزء</span>
                    <span>{formatPrice(subtotal)} تومان</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>جمع کل</span>
                    <span className="text-primary">{formatPrice(subtotal)} تومان</span>
                  </div>
                </div>

                <Link to="/thank-you">
                  <Button variant="hero" size="lg" className="w-full">
                    پرداخت نهایی
                  </Button>
                </Link>

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
