import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Shield, Zap, HeadphonesIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, description, image_url, slug, requires_totp")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="glass-card h-[600px] animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">محصولی یافت نشد.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">خانه</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">محصولات</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl glass-card border border-primary/20">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-[500px] object-cover" />
              )}
              <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">{product.requires_totp ? "نیاز به TOTP" : "موجود"}</Badge>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">{formatPrice(Number(product.price))}<span className="text-lg mr-2">تومان</span></span>
            </div>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}
            {product.requires_totp && (
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  این محصول پس از خرید نیاز به دریافت کد TOTP از تلگرام دارد. لطفاً پس از خرید به بخش داشبورد مراجعه کنید.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-4 mb-8">
              <Button variant="hero" size="lg" className="flex-1" onClick={() => addToCart(product.id, 1)}>
                <ShoppingCart className="ml-2 h-5 w-5" />
                افزودن به سبد خرید
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="text-sm font-medium">ضمانت اصالت</span></CardContent></Card>
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><Zap className="h-6 w-6 text-primary" /><span className="text-sm font-medium">تحویل آنی</span></CardContent></Card>
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><HeadphonesIcon className="h-6 w-6 text-primary" /><span className="text-sm font-medium">پشتیبانی ۲۴/۷</span></CardContent></Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="glass-card border border-primary/20">
            <TabsTrigger value="description">توضیحات</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">درباره محصول</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description || ""}</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
