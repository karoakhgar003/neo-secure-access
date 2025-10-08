import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";

const products = [
  {
    id: 1,
    title: "یوتیوب پریمیوم - ۱ ماهه",
    slug: "youtube-premium-1month",
    price: "۱۹۵,۰۰۰",
    originalPrice: "۲۵۰,۰۰۰",
    badge: "پرفروش",
    rating: 4.9,
    reviews: 324,
    image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
  },
  {
    id: 2,
    title: "نتفلیکس پریمیوم - ۱ ماهه",
    slug: "netflix-premium-1month",
    price: "۱۵۰,۰۰۰",
    originalPrice: "۲۰۰,۰۰۰",
    badge: "تخفیف ویژه",
    rating: 4.8,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop",
  },
  {
    id: 3,
    title: "اسپاتیفای پریمیوم - ۱ ماهه",
    slug: "spotify-premium-1month",
    price: "۱۲۰,۰۰۰",
    originalPrice: "۱۸۰,۰۰۰",
    badge: "جدید",
    rating: 5.0,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=300&fit=crop",
  },
];

const FeaturedProducts = () => {
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
          {products.map((product, index) => (
            <div
              key={product.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <Card className="glass-card hover-lift overflow-hidden border-primary/20 h-full flex flex-col">
                <div className="relative overflow-hidden group">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">
                    {product.badge}
                  </Badge>
                </div>

                <CardContent className="p-6 flex-1">
                  <Link to={`/p/${product.slug}`}>
                    <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                  </Link>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="font-bold text-sm">{product.rating}</span>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      ({product.reviews} نظر)
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-primary">
                      {product.price}
                      <span className="text-sm mr-1">تومان</span>
                    </span>
                    <span className="text-muted-foreground line-through text-sm">
                      {product.originalPrice}
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="p-6 pt-0">
                  <Button variant="hero" className="w-full group">
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
