import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const AccountOrders = () => {
  const orders = [
    {
      id: "#NEO-۱۲۳۴۵۶",
      date: "۱۵ دی ۱۴۰۳",
      product: "یوتیوب پریمیوم - اشتراک ۱ ماهه",
      status: "تحویل داده شده",
      price: "۱۹۵,۰۰۰",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop",
    },
    {
      id: "#NEO-۱۲۳۴۵۵",
      date: "۱۰ دی ۱۴۰۳",
      product: "نتفلیکس پریمیوم - اشتراک ۱ ماهه",
      status: "فعال",
      price: "۱۵۰,۰۰۰",
      image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=100&h=100&fit=crop",
    },
    {
      id: "#NEO-۱۲۳۴۵۴",
      date: "۵ دی ۱۴۰۳",
      product: "اسپاتیفای پریمیوم - اشتراک ۱ ماهه",
      status: "تکمیل شده",
      price: "۱۲۰,۰۰۰",
      image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          سفارشات <span className="gradient-primary bg-clip-text text-transparent">من</span>
        </h1>

        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <img
                    src={order.image}
                    alt={order.product}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-3">
                      <div>
                        <h3 className="font-bold text-xl mb-2">{order.product}</h3>
                        <p className="text-muted-foreground text-sm">
                          شماره سفارش: {order.id}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          تاریخ: {order.date}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={
                          order.status === "فعال" 
                            ? "bg-green-500/20 text-green-500 border-green-500/30"
                            : "bg-blue-500/20 text-blue-500 border-blue-500/30"
                        }>
                          {order.status}
                        </Badge>
                        <p className="text-primary font-bold text-xl">
                          {order.price} تومان
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <Button variant="hero" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        دانلود اطلاعات
                      </Button>
                      <Button variant="outline" size="sm" className="glass-card border-primary/30">
                        جزئیات سفارش
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountOrders;
