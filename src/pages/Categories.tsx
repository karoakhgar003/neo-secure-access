import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description")
        .order("name");
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            دسته‌بندی <span className="gradient-primary bg-clip-text text-transparent">محصولات</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            از میان طیف گسترده‌ای از اکانت‌های معتبر دیجیتال انتخاب کنید
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="glass-card h-40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories?.map((category: any, index: number) => (
              <Link key={category.id} to={`/c/${category.slug}`} style={{ animationDelay: `${index * 50}ms` }} className="animate-fade-in">
                <Card className="glass-card hover-lift group cursor-pointer border-primary/20 h-full">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{category.name}</h3>
                    {category.description && (
                      <p className="text-muted-foreground text-sm mb-3">{category.description}</p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
