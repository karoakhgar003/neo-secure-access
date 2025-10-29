import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
const FeaturedProducts = () => {
  const { data: products, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name)")
        .eq("is_available", true)
        .limit(6)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });
  const { addToCart } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-card/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              محصولات <span className="gradient-primary bg-clip-text text-transparent">ویژه</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-96 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-card/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            محصولات <span className="gradient-primary bg-clip-text text-transparent">ویژه</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            پرفروش‌ترین و محبوب‌ترین اکانت‌ها با بهترین قیمت
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <Card className="glass-card hover-lift overflow-hidden border-primary/20 h-full flex flex-col">
                {product.image_url && (
                  <div className="relative overflow-hidden group">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">
                      {product.requires_totp ? "نیاز به TOTP" : "موجود"}
                    </Badge>
                  </div>
                )}

                <CardContent className="p-6 flex-1">
                  <Link to={`/p/${product.slug}`}>
                    <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                  </Link>

                  {product.description && (
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(Number(product.price))}
                      <span className="text-sm mr-1">تومان</span>
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button variant="hero" className="w-full group" onClick={() => addToCart(product.id, 1)}>
                    <ShoppingCart className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                    افزودن به سبد خرید
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/categories">
            <Button
              size="lg"
              variant="outline"
              className="glass-card border-primary/30 hover:bg-primary/10"
            >
              مشاهده تمام محصولات
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
