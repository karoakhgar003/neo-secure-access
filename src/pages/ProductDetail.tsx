import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Star, Shield, Zap, HeadphonesIcon, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ProductDetail = () => {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);

  const product = {
    title: "یوتیوب پریمیوم - اشتراک ۱ ماهه",
    price: "۱۹۵,۰۰۰",
    originalPrice: "۲۵۰,۰۰۰",
    rating: 4.9,
    reviews: 324,
    stock: "موجود",
    badge: "پرفروش",
    images: [
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800&h=600&fit=crop",
    ],
    description: "با خرید اشتراک یوتیوب پریمیوم از NEO ACCOUNT، تجربه‌ای بی‌نظیر از تماشای ویدیوهای یوتیوب را داشته باشید. بدون تبلیغات، با امکان دانلود و پخش در پس‌زمینه.",
    features: [
      "تماشای بدون تبلیغات",
      "دانلود ویدیوها برای تماشای آفلاین",
      "پخش در پس‌زمینه",
      "دسترسی به YouTube Music Premium",
      "پشتیبانی ۴K",
      "تحویل فوری پس از خرید",
    ],
    isTOTP: false,
  };

  const [selectedImage, setSelectedImage] = useState(product.images[0]);

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
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl glass-card border border-primary/20">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-[500px] object-cover"
              />
              <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">
                {product.badge}
              </Badge>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === image ? "border-primary" : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <img src={image} alt={`تصویر ${index + 1}`} className="w-full h-24 object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <h1 className="text-4xl font-bold mb-4">{product.title}</h1>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <span className="font-bold">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">({product.reviews} نظر)</span>
              <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                {product.stock}
              </Badge>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">
                {product.price}
                <span className="text-lg mr-2">تومان</span>
              </span>
              <span className="text-xl text-muted-foreground line-through">
                {product.originalPrice}
              </span>
              <Badge className="bg-red-500/20 text-red-500 border-red-500/30">
                ۲۲٪ تخفیف
              </Badge>
            </div>

            <p className="text-muted-foreground leading-relaxed mb-6">
              {product.description}
            </p>

            {product.isTOTP && (
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  این محصول پس از خرید نیاز به دریافت کد TOTP از تلگرام دارد. لطفاً پس از خرید به بخش داشبورد مراجعه کنید.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center glass-card border border-primary/20 rounded-lg">
                <Button
                  variant="ghost"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-lg"
                >
                  -
                </Button>
                <span className="px-6 font-bold">{quantity}</span>
                <Button
                  variant="ghost"
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-lg"
                >
                  +
                </Button>
              </div>
              <Button variant="hero" size="lg" className="flex-1">
                <ShoppingCart className="ml-2 h-5 w-5" />
                افزودن به سبد خرید
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">ضمانت اصالت</span>
                </CardContent>
              </Card>
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <Zap className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">تحویل آنی</span>
                </CardContent>
              </Card>
              <Card className="glass-card border-primary/20">
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <HeadphonesIcon className="h-6 w-6 text-primary" />
                  <span className="text-sm font-medium">پشتیبانی ۲۴/۷</span>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="glass-card border border-primary/20">
            <TabsTrigger value="description">توضیحات</TabsTrigger>
            <TabsTrigger value="features">ویژگی‌ها</TabsTrigger>
            <TabsTrigger value="reviews">دیدگاه کاربران</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">درباره محصول</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                  <br /><br />
                  با خرید این محصول از NEO ACCOUNT، از تمامی امکانات پریمیوم بهره‌مند خواهید شد.
                  تمام اکانت‌ها از طریق منابع معتبر تهیه شده و ضمانت کارکرد دارند.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="features" className="mt-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">ویژگی‌های محصول</h3>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">نظرات کاربران</h3>
                <p className="text-muted-foreground">
                  بخش نظرات به زودی فعال خواهد شد.
                </p>
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
