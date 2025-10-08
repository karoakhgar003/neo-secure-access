import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck, Zap } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 gradient-glow opacity-30 animate-glow" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,182,190,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,182,190,0.1)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass-card px-4 py-2 rounded-full mb-6">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">امن، سریع و مطمئن</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            دسترسی ایمن و سریع به
            <br />
            <span className="gradient-primary bg-clip-text text-transparent">
              اکانت‌های معتبر
            </span>
          </h1>

          {/* Description */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            خرید اکانت‌های دیجیتال با بالاترین سطح امنیت، تحویل آنی و پشتیبانی ۲۴ ساعته
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/categories">
              <Button size="lg" variant="hero" className="text-lg px-8 py-6 group">
                مشاهده محصولات
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/support">
              <Button
                size="lg"
                variant="outline"
                className="glass-card border-primary/30 hover:bg-primary/10 text-lg px-8 py-6"
              >
                <Zap className="ml-2 h-5 w-5" />
                پشتیبانی آنلاین
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
            {[
              { number: "۱۰,۰۰۰+", label: "مشتری راضی" },
              { number: "۹۹.۹٪", label: "رضایت کاربران" },
              { number: "۲۴/۷", label: "پشتیبانی" },
            ].map((stat, index) => (
              <div key={index} className="glass-card p-6 rounded-xl hover-lift">
                <div className="text-3xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
