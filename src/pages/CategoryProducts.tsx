import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CategoryProducts = () => {
  const { slug } = useParams();
  
  const categoryNames: { [key: string]: string } = {
    "youtube-premium": "یوتیوب پریمیوم",
    "spotify": "اسپاتیفای",
    "netflix": "نتفلیکس",
    "xbox-gamepass": "ایکس‌باکس گیم پس",
    "gmail-business": "جیمیل بیزینس",
    "cloud-storage": "فضای ابری",
  };

  const products = [
    {
      id: 1,
      title: `${categoryNames[slug || ""]} - اشتراک ۱ ماهه`,
      slug: `${slug}-1month`,
      price: "۱۹۵,۰۰۰",
      originalPrice: "۲۵۰,۰۰۰",
      badge: "پرفروش",
      rating: 4.9,
      reviews: 324,
      stock: "موجود",
      image: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&h=300&fit=crop",
    },
    {
      id: 2,
      title: `${categoryNames[slug || ""]} - اشتراک ۳ ماهه`,
      slug: `${slug}-3month`,
      price: "۵۲۰,۰۰۰",
      originalPrice: "۶۵۰,۰۰۰",
      badge: "تخفیف ویژه",
      rating: 4.8,
      reviews: 256,
      stock: "موجود",
      image: "https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=400&h=300&fit=crop",
    },
    {
      id: 3,
      title: `${categoryNames[slug || ""]} - اشتراک ۶ ماهه`,
      slug: `${slug}-6month`,
      price: "۹۵۰,۰۰۰",
      originalPrice: "۱,۲۰۰,۰۰۰",
      badge: "پیشنهاد ویژه",
      rating: 5.0,
      reviews: 189,
      stock: "موجود",
      image: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&h=300&fit=crop",
    },
    {
      id: 4,
      title: `${categoryNames[slug || ""]} - اشتراک سالانه`,
      slug: `${slug}-yearly`,
      price: "۱,۷۵۰,۰۰۰",
      originalPrice: "۲,۳۰۰,۰۰۰",
      badge: "بهترین قیمت",
      rating: 4.9,
      reviews: 412,
      stock: "موجود",
      image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=300&fit=crop",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">خانه</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">محصولات</Link>
          <span>/</span>
          <span className="text-foreground">{categoryNames[slug || ""] || "دسته‌بندی"}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              {categoryNames[slug || ""] || "محصولات"}
            </h1>
            <p className="text-muted-foreground">
              {products.length} محصول موجود
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              فیلتر
            </Button>
            <Select defaultValue="newest">
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="مرتب‌سازی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">جدیدترین</SelectItem>
                <SelectItem value="price-low">ارزان‌ترین</SelectItem>
                <SelectItem value="price-high">گران‌ترین</SelectItem>
                <SelectItem value="popular">محبوب‌ترین</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
                  <Badge className="absolute top-4 left-4 bg-green-500/90 backdrop-blur">
                    {product.stock}
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
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProducts;
