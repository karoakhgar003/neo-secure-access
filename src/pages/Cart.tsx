import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Minus, ShoppingCart, Tag } from "lucide-react";

const Cart = () => {
  const cartItems = [
    {
      id: 1,
      title: "یوتیوب پریمیوم - اشتراک ۱ ماهه",
      price: 195000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=200&h=150&fit=crop",
    },
    {
      id: 2,
      title: "نتفلیکس پریمیوم - اشتراک ۱ ماهه",
      price: 150000,
      quantity: 2,
      image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=200&h=150&fit=crop",
    },
  ];

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount;

  const formatPrice = (price: number) => {
    return price.toLocaleString('fa-IR');
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          سبد <span className="gradient-primary bg-clip-text text-transparent">خرید</span>
        </h1>

        {cartItems.length === 0 ? (
          <Card className="glass-card border-primary/20 text-center py-12">
            <CardContent>
              <ShoppingCart className="h-24 w-24 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2">سبد خرید شما خالی است</h2>
              <p className="text-muted-foreground mb-6">
                محصولات مورد نظر خود را به سبد خرید اضافه کنید
              </p>
              <Link to="/categories">
                <Button variant="hero">مشاهده محصولات</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                        <p className="text-primary font-bold text-xl">
                          {formatPrice(item.price)} تومان
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-4">
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center glass-card border border-primary/20 rounded-lg">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="px-4 font-bold">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="glass-card border-primary/20 sticky top-24">
                <CardContent className="p-6 space-y-6">
                  <h2 className="text-2xl font-bold">خلاصه سفارش</h2>

                  <div className="space-y-3">
                    <div className="flex justify-between text-muted-foreground">
                      <span>جمع جزء</span>
                      <span>{formatPrice(subtotal)} تومان</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>تخفیف</span>
                      <span className="text-green-500">{formatPrice(discount)} تومان</span>
                    </div>
                    <div className="border-t border-border pt-3">
                      <div className="flex justify-between text-xl font-bold">
                        <span>جمع کل</span>
                        <span className="text-primary">{formatPrice(total)} تومان</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="کد تخفیف" className="flex-1" />
                      <Button variant="outline" className="gap-2">
                        <Tag className="h-4 w-4" />
                        اعمال
                      </Button>
                    </div>
                  </div>

                  <Link to="/checkout">
                    <Button variant="hero" size="lg" className="w-full">
                      ادامه فرآیند خرید
                    </Button>
                  </Link>

                  <Link to="/categories">
                    <Button variant="ghost" className="w-full">
                      ادامه خرید
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Cart;
