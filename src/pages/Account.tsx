import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Settings, ShieldCheck, Calendar } from "lucide-react";

const Account = () => {
  const recentOrders = [
    {
      id: "#NEO-۱۲۳۴۵۶",
      date: "۱۵ دی ۱۴۰۳",
      product: "یوتیوب پریمیوم - ۱ ماهه",
      status: "تحویل داده شده",
      price: "۱۹۵,۰۰۰",
    },
    {
      id: "#NEO-۱۲۳۴۵۵",
      date: "۱۰ دی ۱۴۰۳",
      product: "نتفلیکس پریمیوم - ۱ ماهه",
      status: "فعال",
      price: "۱۵۰,۰۰۰",
    },
  ];

  const activeSubscriptions = [
    {
      service: "یوتیوب پریمیوم",
      expiry: "۱۵ بهمن ۱۴۰۳",
      daysLeft: 30,
    },
    {
      service: "نتفلیکس",
      expiry: "۲۰ بهمن ۱۴۰۳",
      daysLeft: 35,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          حساب <span className="gradient-primary bg-clip-text text-transparent">کاربری</span>
        </h1>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link to="/account/orders">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">سفارشات من</h3>
                  <p className="text-sm text-muted-foreground">مشاهده تاریخچه خرید</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/dashboard">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">داشبورد دیجیتال</h3>
                  <p className="text-sm text-muted-foreground">مدیریت اشتراک‌ها</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to="/account/settings">
            <Card className="glass-card border-primary/20 hover-lift cursor-pointer">
              <CardContent className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">تنظیمات</h3>
                  <p className="text-sm text-muted-foreground">مدیریت حساب کاربری</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">آخرین سفارشات</h2>
              <Link to="/account/orders">
                <Button variant="ghost" className="text-primary">مشاهده همه</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Card key={order.id} className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-lg">{order.id}</p>
                        <p className="text-sm text-muted-foreground">{order.date}</p>
                      </div>
                      <div className="px-3 py-1 bg-green-500/20 text-green-500 rounded-full text-sm">
                        {order.status}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-2">{order.product}</p>
                    <p className="text-primary font-bold">{order.price} تومان</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Active Subscriptions */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">اشتراک‌های فعال</h2>
              <Link to="/dashboard">
                <Button variant="ghost" className="text-primary">مشاهده داشبورد</Button>
              </Link>
            </div>
            <div className="space-y-4">
              {activeSubscriptions.map((sub, index) => (
                <Card key={index} className="glass-card border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-lg">{sub.service}</h3>
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        انقضا: {sub.expiry}
                      </p>
                      <p className="text-sm font-medium text-primary">
                        {sub.daysLeft} روز باقیمانده
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
