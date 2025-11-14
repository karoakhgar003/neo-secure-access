import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const CategoryProducts = () => {
  const { slug } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ["category-products", slug],
    queryFn: async () => {
      // Find category by slug
      const { data: cat, error: catErr } = await supabase
        .from("categories")
        .select("id, name, description")
        .eq("slug", slug)
        .maybeSingle();
      if (catErr) throw catErr;

      // If no category, return empty
      if (!cat) return { category: null, products: [] } as any;

      const { data: products, error: prodErr } = await supabase
        .from("products")
        .select("id, name, price, description, image_url, slug, is_available")
        .eq("category_id", cat.id)
        .order("created_at", { ascending: false });
      if (prodErr) throw prodErr;

      return { category: cat, products };
    }
  });

  const category = (data as any)?.category;
  const products = (data as any)?.products || [];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">خانه</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">محصولات</Link>
          <span>/</span>
          <span className="text-foreground">{category?.name || "دسته‌بندی"}</span>
        </nav>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{category?.name || "محصولات"}</h1>
            <p className="text-muted-foreground">{isLoading ? "در حال بارگذاری..." : `${products.length} محصول موجود`}</p>
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

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="glass-card h-96 animate-pulse" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center text-muted-foreground">محصولی یافت نشد.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product: any, index: number) => (
              <div key={product.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in">
                <Card className="glass-card hover-lift overflow-hidden border-primary/20 h-full flex flex-col">
                  {product.image_url && (
                    <div className="relative overflow-hidden group">
                      <img src={product.image_url} alt={product.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" />
                      <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">
                        {product.is_available ? "موجود" : "ناموجود"}
                      </Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex-1">
                    <Link to={`/p/${product.slug}`}>
                      <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
                    </Link>
                    {product.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{product.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="p-6 pt-0">
                    <Link to={`/p/${product.slug}`} className="w-full">
                      <Button variant="hero" className="w-full">
                        <ArrowLeft className="ml-2 h-4 w-4" />
                        مشاهده و انتخاب پلن
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CategoryProducts;
