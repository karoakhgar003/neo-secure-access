import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ShoppingCart, Star, Shield, Zap, HeadphonesIcon, AlertCircle, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";

const ProductDetail = () => {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, description, image_url, slug, requires_totp")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: plans } = useQuery({
    queryKey: ["product-plans", product?.id],
    queryFn: async () => {
      if (!product?.id) return [];
      const { data, error } = await supabase
        .from("product_plans")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      
      // Auto-select first plan if available
      if (data && data.length > 0 && !selectedPlan) {
        setSelectedPlan(data[0].id);
      }
      
      return data || [];
    },
    enabled: !!product?.id,
  });

  const formatPrice = (price: number) => new Intl.NumberFormat('fa-IR').format(price);

  const hasPlans = plans && plans.length > 0;
  const selectedPlanData = hasPlans && selectedPlan ? plans.find(p => p.id === selectedPlan) : null;
  const displayPrice = selectedPlanData ? selectedPlanData.price : product?.price || 0;

  const handleAddToCart = () => {
    if (!product) return;
    
    if (hasPlans && !selectedPlan) {
      toast({
        title: 'لطفاً یک پلن انتخاب کنید',
        description: 'برای افزودن به سبد خرید باید یک پلن را انتخاب کنید',
        variant: 'destructive'
      });
      return;
    }
    
    addToCart(product.id, 1, selectedPlan || undefined);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="glass-card h-[600px] animate-pulse" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center text-muted-foreground">محصولی یافت نشد.</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-primary transition-colors">خانه</Link>
          <span>/</span>
          <Link to="/categories" className="hover:text-primary transition-colors">محصولات</Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl glass-card border border-primary/20">
              {product.image_url && (
                <img src={product.image_url} alt={product.name} className="w-full h-[500px] object-cover" />
              )}
              <Badge className="absolute top-4 right-4 bg-primary/90 backdrop-blur">{product.requires_totp ? "نیاز به TOTP" : "موجود"}</Badge>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-4xl font-bold text-primary">{formatPrice(Number(displayPrice))}<span className="text-lg mr-2">تومان</span></span>
            </div>
            {product.description && (
              <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Plans Selection */}
            {hasPlans && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">انتخاب پلن:</h3>
                <RadioGroup value={selectedPlan || ''} onValueChange={setSelectedPlan}>
                  <div className="space-y-3">
                    {plans.map((plan) => (
                      <div key={plan.id} className="relative">
                        <RadioGroupItem value={plan.id} id={plan.id} className="peer sr-only" />
                        <Label
                          htmlFor={plan.id}
                          className="flex items-start gap-4 p-4 rounded-lg border-2 border-muted bg-background hover:bg-accent cursor-pointer transition-all peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-lg">{plan.name}</span>
                              {plan.duration_months && plan.duration_months > 1 && (
                                <Badge variant="secondary">{plan.duration_months} ماهه</Badge>
                              )}
                            </div>
                            {plan.description && (
                              <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                            )}
                            {plan.features && Array.isArray(plan.features) && (plan.features as string[]).length > 0 && (
                              <ul className="text-sm space-y-1">
                                {(plan.features as string[]).map((feature, idx) => (
                                  <li key={idx} className="flex items-center gap-2">
                                    <Check className="h-3 w-3 text-primary" />
                                    <span>{feature}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-xl text-primary">
                              {formatPrice(Number(plan.price))}
                            </span>
                            <span className="text-sm block text-muted-foreground">تومان</span>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}

            {product.requires_totp && (
              <Alert className="mb-6 border-primary/30 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription>
                  این محصول پس از خرید نیاز به دریافت کد TOTP از تلگرام دارد. لطفاً پس از خرید به بخش داشبورد مراجعه کنید.
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="hero" 
                size="lg" 
                className="flex-1" 
                onClick={handleAddToCart}
                disabled={hasPlans && !selectedPlan}
              >
                <ShoppingCart className="ml-2 h-5 w-5" />
                افزودن به سبد خرید
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><Shield className="h-6 w-6 text-primary" /><span className="text-sm font-medium">ضمانت اصالت</span></CardContent></Card>
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><Zap className="h-6 w-6 text-primary" /><span className="text-sm font-medium">تحویل آنی</span></CardContent></Card>
              <Card className="glass-card border-primary/20"><CardContent className="p-4 flex flex-col items-center text-center gap-2"><HeadphonesIcon className="h-6 w-6 text-primary" /><span className="text-sm font-medium">پشتیبانی ۲۴/۷</span></CardContent></Card>
            </div>
          </div>
        </div>

        <Tabs defaultValue="description" className="mb-12">
          <TabsList className="glass-card border border-primary/20">
            <TabsTrigger value="description">توضیحات</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <h3 className="text-2xl font-bold mb-4">درباره محصول</h3>
                <p className="text-muted-foreground leading-relaxed">{product.description || ""}</p>
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
