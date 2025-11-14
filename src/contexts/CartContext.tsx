import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CartItem {
  id: string;
  product_id: string;
  plan_id: string | null;
  quantity: number;
  products: {
    name: string;
    price: number | null;
    image_url: string | null;
    slug: string;
  };
  product_plans?: {
    id: string;
    name: string;
    price: number;
    duration_months: number;
  } | null;
}

interface CartContextType {
  cartItems: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity: number, planId?: string) => Promise<void>;
  updateQuantity: (cartItemId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCart = async () => {
    if (!user) {
      setCartItems([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        plan_id,
        quantity,
        products (
          name,
          price,
          image_url,
          slug
        ),
        product_plans (
          id,
          name,
          price,
          duration_months
        )
      `)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error loading cart:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در بارگذاری سبد خرید پیش آمد',
        variant: 'destructive'
      });
    } else {
      setCartItems(data as CartItem[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCart();
  }, [user]);

  const addToCart = async (productId: string, quantity: number = 1, planId?: string) => {
    if (!user) {
      toast({
        title: 'لطفا وارد شوید',
        description: 'برای افزودن به سبد خرید باید وارد حساب کاربری شوید',
        variant: 'destructive'
      });
      return;
    }

    // Check if item already exists with same plan
    const existingItem = cartItems.find(item => 
      item.product_id === productId && item.plan_id === (planId || null)
    );

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          plan_id: planId || null,
          quantity
        });

      if (error) {
        console.error('Error adding to cart:', error);
        toast({
          title: 'خطا',
          description: 'مشکلی در افزودن به سبد خرید پیش آمد',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'افزوده شد',
          description: 'محصول به سبد خرید اضافه شد'
        });
        await loadCart();
      }
    }
  };

  const updateQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    const { error } = await supabase
      .from('cart_items')
      .update({ quantity: newQuantity })
      .eq('id', cartItemId);

    if (error) {
      console.error('Error updating quantity:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در به‌روزرسانی تعداد پیش آمد',
        variant: 'destructive'
      });
    } else {
      await loadCart();
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', cartItemId);

    if (error) {
      console.error('Error removing from cart:', error);
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف از سبد خرید پیش آمد',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'حذف شد',
        description: 'محصول از سبد خرید حذف شد'
      });
      await loadCart();
    }
  };

  const clearCart = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error('Error clearing cart:', error);
    } else {
      await loadCart();
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => {
    // Use plan price if available, otherwise fall back to product price
    const price = item.product_plans?.price || item.products.price || 0;
    return sum + (Number(price) * item.quantity);
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        cartTotal,
        cartCount,
        refreshCart: loadCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};