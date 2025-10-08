import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Shield, Key, Send } from "lucide-react";

const Dashboard = () => {
  const subscriptions = [
    {
      id: 1,
      service: "یوتیوب پریمیوم",
      plan: "اشتراک ماهانه",
      expiry: "۱۵ بهمن ۱۴۰۳",
      daysLeft: 30,
      status: "فعال",
      hasCredentials: true,
      hasTOTP: false,
    },
    {
      id: 2,
      service: "سرویس ویژه با TOTP",
      plan: "اشتراک ماهانه",
      expiry: "۲۰ بهمن ۱۴۰۳",
      daysLeft: 35,
      status: "فعال",
      hasCredentials: true,
      hasTOTP: true,
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          داشبورد <span className="gradient-primary bg-clip-text text-transparent">دیجیتال</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">اشتراک‌های فعال</span>
              </div>
              <p className="text-3xl font-bold">{subscriptions.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">نزدیک‌ترین انقضا</span>
              </div>
              <p className="text-3xl font-bold">۳۰ روز</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <Key className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground text-sm">اکانت‌های امن</span>
              </div>
              <p className="text-3xl font-bold">۱۰۰٪</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6">اشتراک‌های شما</h2>

        <div className="space-y-6">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{sub.service}</h3>
                    <p className="text-muted-foreground">{sub.plan}</p>
                  </div>
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    {sub.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">تاریخ انقضا</p>
                      <p className="font-bold">{sub.expiry}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">زمان باقیمانده</p>
                      <p className="font-bold text-primary">{sub.daysLeft} روز</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {sub.hasCredentials && (
                    <Link to="/dashboard/credentials">
                      <Button variant="hero" className="gap-2">
                        <Key className="h-4 w-4" />
                        مشاهده اطلاعات ورود
                      </Button>
                    </Link>
                  )}
                  {sub.hasTOTP && (
                    <Link to="/dashboard/totp">
                      <Button variant="outline" className="glass-card border-primary/30 gap-2">
                        <Send className="h-4 w-4" />
                        دریافت کد از تلگرام
                      </Button>
                    </Link>
                  )}
                  <Button variant="outline" className="glass-card border-primary/30">
                    تمدید اشتراک
                  </Button>
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

export default Dashboard;
