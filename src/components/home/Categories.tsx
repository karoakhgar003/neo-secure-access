import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const Categories = () => {
  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const getIcon = (iconName: string | null) => {
    if (!iconName) return Icons.Package;
    const Icon = (Icons as any)[iconName];
    return Icon || Icons.Package;
  };

  if (isLoading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              دسته‌بندی <span className="gradient-primary bg-clip-text text-transparent">محصولات</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="glass-card h-40 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            دسته‌بندی <span className="gradient-primary bg-clip-text text-transparent">محصولات</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            انتخاب کنید از میان طیف گسترده‌ای از اکانت‌های معتبر
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories?.map((category, index) => {
            const Icon = getIcon(category.icon);
            return (
              <Link
                key={category.id}
                to={`/c/${category.slug}`}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
              >
                <Card className="glass-card hover-lift group cursor-pointer border-primary/20 h-full">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {category.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
