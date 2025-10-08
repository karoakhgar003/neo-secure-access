import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowLeft } from "lucide-react";

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
  {
    id: 3,
    title: "نکات امنیتی خرید آنلاین اکانت",
    slug: "online-security-tips",
    excerpt: "چگونه با امنیت کامل اکانت خریداری کنیم",
    date: "۱۰ دی ۱۴۰۳",
    image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop",
    category: "نکات",
  },
];

const BlogPosts = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-card/50 to-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            آخرین <span className="gradient-primary bg-clip-text text-transparent">مطالب</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            راهنماها و آموزش‌های مفید برای شما
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, index) => (
            <div
              key={post.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-fade-in"
            >
              <Card className="glass-card hover-lift overflow-hidden border-primary/20 h-full flex flex-col">
                <div className="relative overflow-hidden group">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur px-3 py-1 rounded-full text-sm font-medium">
                    {post.category}
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
                    <Calendar className="h-4 w-4" />
                    <span>{post.date}</span>
                  </div>

                  <Link to={`/blog/${post.slug}`}>
                    <h3 className="text-xl font-bold mb-3 hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                  </Link>

                  <p className="text-muted-foreground mb-4 line-clamp-2 flex-1">
                    {post.excerpt}
                  </p>

                  <Link to={`/blog/${post.slug}`}>
                    <Button variant="ghost" className="gap-2 p-0 h-auto hover:text-primary group">
                      ادامه مطلب
                      <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/blog">
            <Button
              size="lg"
              variant="outline"
              className="glass-card border-primary/30 hover:bg-primary/10"
            >
              مشاهده تمام مطالب
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BlogPosts;
