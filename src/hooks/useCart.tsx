import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    name: string;
    price: number;
    image_url: string | null;
    slug: string;
  };
}

export const useCart = () => {
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
        quantity,
        products (
          name,
          price,
          image_url,
          slug
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

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) {
      toast({
        title: 'لطفا وارد شوید',
        description: 'برای افزودن به سبد خرید باید وارد حساب کاربری شوید',
        variant: 'destructive'
      });
      return;
    }

    // Check if item already exists
    const existingItem = cartItems.find(item => item.product_id === productId);

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
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
    return sum + (Number(item.products.price) * item.quantity);
  }, 0);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    refreshCart: loadCart
  };
};
