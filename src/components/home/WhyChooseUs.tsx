import { Shield, Zap, HeadphonesIcon, Lock, CheckCircle2, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Shield,
    title: "امنیت بالا",
    description: "تمام اکانت‌ها از طریق منابع معتبر و با بالاترین سطح امنیت تهیه می‌شوند",
  },
  {
    icon: Zap,
    title: "تحویل آنی",
    description: "دریافت فوری اطلاعات اکانت بلافاصله پس از تکمیل خرید",
  },
  {
    icon: HeadphonesIcon,
    title: "پشتیبانی ۲۴/۷",
    description: "تیم پشتیبانی ما همیشه آماده پاسخگویی به سوالات شما در تلگرام است",
  },
  {
    icon: Lock,
    title: "محرمانگی کامل",
    description: "اطلاعات شما با رمزگذاری پیشرفته محافظت می‌شود",
  },
  {
    icon: CheckCircle2,
    title: "ضمانت اصالت",
    description: "تضمین ۱۰۰٪ اصالت و کارکرد تمام اکانت‌های فروخته شده",
  },
  {
    icon: Award,
    title: "قیمت مناسب",
    description: "بهترین قیمت‌ها در بازار با امکان استفاده از کد تخفیف",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            چرا <span className="gradient-primary bg-clip-text text-transparent">NEO ACCOUNT</span>؟
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            مزایای خرید از ما را بشناسید
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
              >
                <Card className="glass-card hover-lift border-primary/20 h-full">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
