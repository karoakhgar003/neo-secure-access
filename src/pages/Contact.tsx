import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, Send } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8 text-center">
          تماس با <span className="gradient-primary bg-clip-text text-transparent">ما</span>
        </h1>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <h3 className="text-xl font-bold mb-4">فرم تماس</h3>
              <form className="space-y-4">
                <Input placeholder="نام و نام خانوادگی" />
                <Input type="email" placeholder="ایمیل" />
                <Input type="tel" placeholder="شماره تماس" />
                <Textarea placeholder="پیام شما" rows={5} />
                <Button variant="hero" className="w-full">ارسال پیام</Button>
              </form>
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <Mail className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-bold mb-1">ایمیل</h4>
                  <p className="text-muted-foreground">support@neoaccount.com</p>
                </div>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6 flex items-center gap-4">
                <Send className="h-8 w-8 text-primary" />
                <div>
                  <h4 className="font-bold mb-1">تلگرام</h4>
                  <p className="text-muted-foreground">@neoaccount</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
