import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, HeadphonesIcon } from "lucide-react";

const Support = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">
          پشتیبانی <span className="gradient-primary bg-clip-text text-transparent">۲۴/۷</span>
        </h1>
        <div className="max-w-2xl mx-auto">
          <Card className="glass-card border-primary/20 mb-8">
            <CardContent className="p-8 text-center">
              <HeadphonesIcon className="h-16 w-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">تماس با پشتیبانی</h2>
              <p className="text-muted-foreground mb-6">تیم پشتیبانی ما آماده کمک به شماست</p>
              <a href="https://t.me/neoaccount" target="_blank" rel="noopener noreferrer">
                <Button variant="hero" size="lg" className="gap-2">
                  <Send className="h-5 w-5" />
                  ارتباط از طریق تلگرام
                </Button>
              </a>
            </CardContent>
          </Card>
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">فرم تماس</h3>
              <form className="space-y-4">
                <Input placeholder="نام و نام خانوادگی" />
                <Input type="email" placeholder="ایمیل" />
                <Textarea placeholder="پیام شما" rows={5} />
                <Button variant="hero" className="w-full">ارسال پیام</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support;
