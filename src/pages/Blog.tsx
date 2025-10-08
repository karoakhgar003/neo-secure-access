import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "lucide-react";

const Blog = () => {
  const posts = [
    {
      id: 1,
      title: "راهنمای خرید اکانت یوتیوب پریمیوم",
      slug: "youtube-premium-guide",
      excerpt: "همه چیز درباره خرید و استفاده از اکانت یوتیوب پریمیوم",
      date: "۱۵ دی ۱۴۰۳",
      image: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=400&h=300&fit=crop",
      category: "آموزش",
    },
    {
      id: 2,
      title: "مزایای استفاده از اکانت‌های دیجیتال",
      slug: "digital-accounts-benefits",
      excerpt: "چرا باید از اکانت‌های دیجیتال استفاده کنیم؟",
      date: "۱۲ دی ۱۴۰۳",
      image: "https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=300&fit=crop",
      category: "راهنما",
    },
  ];

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">
          وبلاگ <span className="gradient-primary bg-clip-text text-transparent">NEO ACCOUNT</span>
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Link key={post.id} to={`/blog/${post.slug}`}>
              <Card className="glass-card hover-lift border-primary/20 h-full">
                <CardContent className="p-0">
                  <img src={post.image} alt={post.title} className="w-full h-48 object-cover rounded-t-lg" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                      <Calendar className="h-4 w-4" />
                      <span>{post.date}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-2">{post.title}</h3>
                    <p className="text-muted-foreground">{post.excerpt}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Blog;
