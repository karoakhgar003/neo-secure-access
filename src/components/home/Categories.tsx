import { Link } from "react-router-dom";
import { Youtube, Music, Film, Gamepad2, Mail, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    id: 1,
    title: "یوتیوب پریمیوم",
    slug: "youtube-premium",
    icon: Youtube,
    count: "۱۵",
    color: "from-red-500/20 to-red-600/20",
  },
  {
    id: 2,
    title: "اسپاتیفای",
    slug: "spotify",
    icon: Music,
    count: "۱۲",
    color: "from-green-500/20 to-green-600/20",
  },
  {
    id: 3,
    title: "نتفلیکس",
    slug: "netflix",
    icon: Film,
    count: "۲۰",
    color: "from-red-500/20 to-pink-600/20",
  },
  {
    id: 4,
    title: "ایکس‌باکس گیم پس",
    slug: "xbox-gamepass",
    icon: Gamepad2,
    count: "۸",
    color: "from-green-500/20 to-blue-600/20",
  },
  {
    id: 5,
    title: "جیمیل بیزینس",
    slug: "gmail-business",
    icon: Mail,
    count: "۱۰",
    color: "from-blue-500/20 to-purple-600/20",
  },
  {
    id: 6,
    title: "فضای ابری",
    slug: "cloud-storage",
    icon: Cloud,
    count: "۶",
    color: "from-cyan-500/20 to-blue-600/20",
  },
];

const Categories = () => {
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
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={`/c/${category.slug}`}
                style={{ animationDelay: `${index * 100}ms` }}
                className="animate-fade-in"
              >
                <Card className="glass-card hover-lift group cursor-pointer border-primary/20 h-full">
                  <CardContent className="p-6">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8 text-foreground" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {category.title}
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      {category.count} محصول موجود
                    </p>
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
