import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Package, ShoppingCart, TrendingUp, DollarSign, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type TimePeriod = "7" | "30" | "90" | "180" | "365";

export default function AdminDashboard() {
  const [period, setPeriod] = useState<TimePeriod>("30");
  const [stats, setStats] = useState({
    users: 0,
    products: 0,
    orders: 0,
    totalEarnings: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);
  const [orderData, setOrderData] = useState<{ date: string; count: number }[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<{ name: string; value: number }[]>([]);
  const [topProducts, setTopProducts] = useState<{ name: string; sales: number }[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, [period]);

  const loadDashboardData = async () => {
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [usersRes, productsRes, ordersRes, earningsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount, status").eq("status", "completed")
    ]);

    const totalEarnings = (earningsRes.data || []).reduce((sum, order) => sum + Number(order.total_amount), 0);

    const { count: pendingCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");

    const { count: completedCount } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed");

    setStats({
      users: usersRes.count || 0,
      products: productsRes.count || 0,
      orders: ordersRes.count || 0,
      totalEarnings,
      pendingOrders: pendingCount || 0,
      completedOrders: completedCount || 0
    });

    const { data: periodOrders } = await supabase
      .from("orders")
      .select("created_at, total_amount, status, order_items(product_id, product_name, products(name))")
      .gte("created_at", startDate.toISOString())
      .order("created_at", { ascending: true });

    const revenueByDay: Record<string, number> = {};
    const ordersByDay: Record<string, number> = {};
    const productSales: Record<string, number> = {};
    const statusCount: Record<string, number> = { pending: 0, processing: 0, completed: 0, cancelled: 0 };

    (periodOrders || []).forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString("fa-IR");

      if (order.status === "completed") {
        revenueByDay[date] = (revenueByDay[date] || 0) + Number(order.total_amount);
      }

      ordersByDay[date] = (ordersByDay[date] || 0) + 1;
      statusCount[order.status as keyof typeof statusCount]++;

      const orderItems = order.order_items as any[];
      (orderItems || []).forEach(item => {
        const productName = item.product_name || item.products?.name || "نامشخص";
        productSales[productName] = (productSales[productName] || 0) + 1;
      });
    });

    setRevenueData(Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })));
    setOrderData(Object.entries(ordersByDay).map(([date, count]) => ({ date, count })));
    setOrderStatusData([
      { name: "در انتظار", value: statusCount.pending },
      { name: "در حال پردازش", value: statusCount.processing },
      { name: "تکمیل شده", value: statusCount.completed },
      { name: "لغو شده", value: statusCount.cancelled }
    ]);
    setTopProducts(
      Object.entries(productSales)
        .map(([name, sales]) => ({ name, sales }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5)
    );

    const { data: recentOrders } = await supabase
      .from("orders")
      .select("order_number, status, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(10);

    setRecentActivities(recentOrders || []);
  };

  const COLORS = ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"];

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: "در انتظار",
      processing: "در حال پردازش",
      completed: "تکمیل شده",
      cancelled: "لغو شده"
    };
    return labels[status] || status;
  };

  return (
    <>
      <Header />
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <main className="mr-64 flex-1 p-8">
          <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                داشبورد <span className="gradient-primary bg-clip-text text-transparent">مدیریت</span>
              </h1>
              <p className="text-muted-foreground">خلاصهای از عملکرد سیستم</p>
            </div>
            <Select value={period} onValueChange={(value) => setPeriod(value as TimePeriod)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 روز گذشته</SelectItem>
                <SelectItem value="30">30 روز گذشته</SelectItem>
                <SelectItem value="90">3 ماه گذشته</SelectItem>
                <SelectItem value="180">6 ماه گذشته</SelectItem>
                <SelectItem value="365">یک سال گذشته</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">کاربران</p>
                <p className="text-3xl font-bold">{stats.users.toLocaleString("fa-IR")}</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Package className="h-6 w-6 text-purple-500" />
                  </div>
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">محصولات</p>
                <p className="text-3xl font-bold">{stats.products.toLocaleString("fa-IR")}</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-green-500" />
                  </div>
                  <span className="text-xs text-yellow-500">{stats.pendingOrders} در انتظار</span>
                </div>
                <p className="text-sm text-muted-foreground mb-1">سفارشات</p>
                <p className="text-3xl font-bold">{stats.orders.toLocaleString("fa-IR")}</p>
              </CardContent>
            </Card>
            <Card className="glass-card border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">درآمد کل</p>
                <p className="text-2xl font-bold">{stats.totalEarnings.toLocaleString("fa-IR")}</p>
                <p className="text-xs text-muted-foreground">تومان</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
