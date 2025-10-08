import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Shield, Users, Award } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 text-center">
            درباره <span className="gradient-primary bg-clip-text text-transparent">NEO ACCOUNT</span>
          </h1>
          <p className="text-xl text-muted-foreground text-center mb-12 leading-relaxed">
            ما بهترین و امن‌ترین راه‌حل برای خرید اکانت‌های دیجیتال معتبر هستیم
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "امنیت", desc: "بالاترین استانداردهای امنیتی" },
              { icon: Users, title: "اعتماد", desc: "بیش از ۱۰,۰۰۰ مشتری راضی" },
              { icon: Award, title: "کیفیت", desc: "محصولات معتبر و باکیفیت" },
            ].map((item, i) => (
              <div key={i} className="text-center glass-card border border-primary/20 p-8 rounded-xl">
                <item.icon className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
