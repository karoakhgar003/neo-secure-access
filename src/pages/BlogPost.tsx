import { useParams, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BlogPost = () => {
  const { slug } = useParams();
  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("title, content, created_at, image_url, category")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="glass-card h-[400px] animate-pulse" />
        ) : !post ? (
          <div className="text-center text-muted-foreground">مقاله‌ای یافت نشد.</div>
        ) : (
          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Link to="/" className="hover:text-primary transition-colors">خانه</Link>
                <span>/</span>
                <Link to="/blog" className="hover:text-primary transition-colors">وبلاگ</Link>
                <span>/</span>
                <span className="text-foreground">{post.title}</span>
              </nav>
              {post.image_url && (
                <img src={post.image_url} alt={post.title} className="w-full h-64 object-cover rounded-lg mb-6" />
              )}
              <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
              <div className="prose prose-invert max-w-none leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
