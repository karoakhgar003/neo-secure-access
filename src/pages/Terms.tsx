import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-8">قوانین و مقررات</h1>
        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <p className="leading-relaxed">با استفاده از خدمات NEO ACCOUNT، شما با قوانین و مقررات زیر موافقت می‌کنید.</p>
          <h2 className="text-2xl font-bold text-foreground mt-8">۱. استفاده از خدمات</h2>
          <p className="leading-relaxed">تمامی محصولات ارائه شده توسط NEO ACCOUNT صرفاً برای استفاده شخصی و قانونی می‌باشد.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
