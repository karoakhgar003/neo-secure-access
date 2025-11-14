import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Copy, Eye, EyeOff, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  status: string;
  credentials: any;
  credential_data: any;
  product_name: string | null;
  plan_name: string | null;
  expires_at: string | null;
  orders: {
    order_number: string;
    user_id: string;
    contact_email: string;
    status: string;
    profiles: {
      full_name: string | null;
    };
  };
  products: {
    name: string;
    requires_totp: boolean;
  } | null;
  product_plans: {
    name: string;
  } | null;
}

interface AccountSeat {
  id: string;
  status: string;
  created_at: string;
  product_credentials: {
    username: string;
    password: string;
    additional_info: string | null;
    totp_secret: string | null;
  };
}

export default function AdminOrderCredentials() {
  const { orderItemId } = useParams();
  const [orderItem, setOrderItem] = useState<OrderItem | null>(null);
  const [accountSeat, setAccountSeat] = useState<AccountSeat | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showTotp, setShowTotp] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrderItem();
  }, [orderItemId]);

  const loadOrderItem = async () => {
    if (!orderItemId) return;

    // Load order item with all relationships
    const { data: item, error: itemError } = await supabase
      .from('order_items')
      .select(`
        *,
        orders!inner(
          order_number,
          user_id,
          contact_email,
          status,
          profiles(full_name)
        ),
        products(name, requires_totp),
        product_plans(name)
      `)
      .eq('id', orderItemId)
      .single();

    if (itemError) {
      console.error('Error loading order item:', itemError);
      toast({ title: 'خطا', description: 'خطا در بارگذاری اطلاعات', variant: 'destructive' });
      setLoading(false);
      return;
    }

    setOrderItem(item as any);

    // Load account seat with credentials
    const { data: seat, error: seatError } = await supabase
      .from('account_seats')
      .select(`
        id,
        status,
        created_at,
        product_credentials(username, password, additional_info, totp_secret)
      `)
      .eq('order_item_id', orderItemId)
      .maybeSingle();

    if (seatError) {
      console.error('Error loading account seat:', seatError);
    } else if (seat) {
      setAccountSeat(seat as any);
    }

    setLoading(false);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'کپی شد', description: `${label} کپی شد` });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      pending: { variant: "secondary", label: "در انتظار" },
      unclaimed: { variant: "outline", label: "دریافت نشده" },
      success: { variant: "default", label: "موفق" },
      expired: { variant: "destructive", label: "منقضی شده" }
    };

    const statusInfo = variants[status] || { variant: "outline" as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!orderItem) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">سفارش یافت نشد</p>
              <Link to="/admin/orders">
                <Button variant="outline" className="mt-4 gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  بازگشت به سفارشات
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const credentials = accountSeat?.product_credentials || orderItem.credentials || orderItem.credential_data;
  const hasTotp = credentials?.requires_totp || accountSeat?.product_credentials?.totp_secret;

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            اطلاعات <span className="gradient-primary bg-clip-text text-transparent">اعتبارنامه</span>
          </h1>
          <Link to="/admin/orders">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              بازگشت به سفارشات
            </Button>
          </Link>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Order Info */}
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle>اطلاعات سفارش</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">شماره سفارش</p>
                  <p className="font-medium">{orderItem.orders.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">وضعیت</p>
                  <div>{getStatusBadge(accountSeat?.status || orderItem.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">مشتری</p>
                  <p className="font-medium">{orderItem.orders.profiles?.full_name || 'نامشخص'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">ایمیل</p>
                  <p className="font-medium text-sm">{orderItem.orders.contact_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">محصول</p>
                  <p className="font-medium">{orderItem.product_name || orderItem.products?.name || 'نامشخص'}</p>
                </div>
                {orderItem.plan_name && (
                  <div>
                    <p className="text-sm text-muted-foreground">پلن</p>
                    <p className="font-medium">{orderItem.plan_name}</p>
                  </div>
                )}
              </div>
              {orderItem.expires_at && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">تاریخ انقضا</p>
                  <p className="font-medium text-destructive">
                    {new Date(orderItem.expires_at).toLocaleDateString('fa-IR')}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credentials */}
          {credentials ? (
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  اطلاعات ورود
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Username */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">نام کاربری</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={credentials.username || ''}
                      readOnly
                      className="flex-1 px-3 py-2 bg-muted rounded-md font-mono"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(credentials.username, 'نام کاربری')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Password */}
                {credentials.password && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">رمز عبور</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={credentials.password}
                        readOnly
                        className="flex-1 px-3 py-2 bg-muted rounded-md font-mono"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(credentials.password, 'رمز عبور')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* TOTP Secret */}
                {accountSeat?.product_credentials?.totp_secret && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">TOTP Secret</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type={showTotp ? 'text' : 'password'}
                        value={accountSeat.product_credentials.totp_secret}
                        readOnly
                        className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowTotp(!showTotp)}
                      >
                        {showTotp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(accountSeat.product_credentials.totp_secret, 'TOTP Secret')}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Additional Info */}
                {credentials.additional_info && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">اطلاعات تکمیلی</label>
                    <div className="mt-1 p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                      {credentials.additional_info}
                    </div>
                  </div>
                )}

                {hasTotp && (
                  <div className="pt-3 border-t">
                    <Badge variant="outline" className="gap-2">
                      <Key className="h-3 w-3" />
                      این سرویس نیاز به TOTP دارد
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="glass-card border-primary/20">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">هنوز اعتبارنامه‌ای اختصاص داده نشده است</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
