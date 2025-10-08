import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, Info, Shield, Clock } from "lucide-react";

const DashboardTOTP = () => {
  const telegramBotLink = "https://t.me/neoaccount_bot";

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
