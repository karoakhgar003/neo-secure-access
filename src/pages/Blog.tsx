import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Blog = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, summary, created_at, image_url, category")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fa-IR');

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          وبلاگ <span className="gradient-primary bg-clip-text text-transparent">NEO ACCOUNT</span>
        </h1>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="glass-card h-72 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts?.map((post: any) => (
              <Link key={post.id} to={`/blog/${post.slug}`}>
                <Card className="glass-card hover-lift border-primary/20 h-full">
                  <CardContent className="p-0">
                    {post.image_url && (
                      <img src={post.image_url} alt={post.title} className="w-full h-48 object-cover rounded-t-lg" />
                    )}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(post.created_at)}</span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{post.title}</h3>
                      {post.summary && <p className="text-muted-foreground">{post.summary}</p>}
                    </div>
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

export default Blog;
