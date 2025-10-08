import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Link } from "react-router-dom";
import { Youtube, Music, Film, Gamepad2, Mail, Cloud, Tv, Book } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const categories = [
  {
    id: 1,
    title: "یوتیوب پریمیوم",
    slug: "youtube-premium",
    icon: Youtube,
    count: "۱۵",
    description: "دسترسی به یوتیوب بدون تبلیغات",
    color: "from-red-500/20 to-red-600/20",
  },
  {
    id: 2,
    title: "اسپاتیفای",
    slug: "spotify",
    icon: Music,
    count: "۱۲",
    description: "پخش موسیقی بدون محدودیت",
    color: "from-green-500/20 to-green-600/20",
  },
  {
    id: 3,
    title: "نتفلیکس",
    slug: "netflix",
    icon: Film,
    count: "۲۰",
    description: "تماشای فیلم و سریال",
    color: "from-red-500/20 to-pink-600/20",
  },
  {
    id: 4,
    title: "ایکس‌باکس گیم پس",
    slug: "xbox-gamepass",
    icon: Gamepad2,
    count: "۸",
    description: "بازی‌های نامحدود",
    color: "from-green-500/20 to-blue-600/20",
  },
  {
    id: 5,
    title: "جیمیل بیزینس",
    slug: "gmail-business",
    icon: Mail,
    count: "۱۰",
    description: "ایمیل حرفه‌ای",
    color: "from-blue-500/20 to-purple-600/20",
  },
  {
    id: 6,
    title: "فضای ابری",
    slug: "cloud-storage",
    icon: Cloud,
    count: "۶",
    description: "ذخیره‌سازی آنلاین",
    color: "from-cyan-500/20 to-blue-600/20",
  },
  {
    id: 7,
    title: "آمازون پریم",
    slug: "amazon-prime",
    icon: Tv,
    count: "۵",
    description: "تماشا و خرید آنلاین",
    color: "from-orange-500/20 to-yellow-600/20",
  },
  {
    id: 8,
    title: "کتاب‌های صوتی",
    slug: "audiobooks",
    icon: Book,
    count: "۷",
    description: "گوش دادن به کتاب",
    color: "from-purple-500/20 to-pink-600/20",
  },
];

const Categories = () => {
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => {
            const Icon = category.icon;
            return (
              <Link
                key={category.id}
                to={`/c/${category.slug}`}
                style={{ animationDelay: `${index * 50}ms` }}
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
                    <p className="text-muted-foreground text-sm mb-3">
                      {category.description}
                    </p>
                    <p className="text-primary font-medium text-sm">
                      {category.count} محصول موجود
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
