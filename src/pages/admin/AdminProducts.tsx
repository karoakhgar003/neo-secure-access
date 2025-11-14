import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string | null;
  category_id: string;
  is_available: boolean;
  categories: { name: string };
}

interface Category {
  id: string;
  name: string;
}

interface ProductPlan {
  id?: string;
  name: string;
  description: string;
  price: string;
  duration_months: string;
  features: string[];
  is_available: boolean;
  is_time_based?: boolean;
  sort_order: number;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    category_id: '',
    image_url: '',
    slug: '',
    is_available: true
  });

  const [plans, setPlans] = useState<ProductPlan[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const [editingPlanIndex, setEditingPlanIndex] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading products:', error);
    } else {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  const loadCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name')
      .order('name');

    if (data) setCategories(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate: must have either a price or at least one plan
    if (!formData.price && plans.length === 0) {
      toast({
        title: 'خطا',
        description: 'محصول باید حداقل یک قیمت پیش‌فرض یا یک پلن داشته باشد',
        variant: 'destructive'
      });
      return;
    }

    let imageUrl = formData.image_url;

    // Upload image if a file was selected
    if (imageFile) {
      setUploadingImage(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        toast({
          title: 'خطا در آپلود تصویر',
          description: uploadError.message,
          variant: 'destructive'
        });
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrl;
      setUploadingImage(false);
    }

    const productData = {
      ...formData,
      price: formData.price ? parseFloat(formData.price) : null,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
      image_url: imageUrl
    };

    let error;
    let productId = editingProduct?.id;

    if (editingProduct) {
      ({ error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id));
    } else {
      const { data, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();
      error = insertError;
      productId = data?.id;
    }

    if (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در ذخیره محصول پیش آمد',
        variant: 'destructive'
      });
      return;
    }

    // Save plans if any
    if (plans.length > 0 && productId) {
      if (editingProduct) {
        // Update/insert plans without deleting (preserve credentials)
        for (const plan of plans) {
          if (plan.id) {
            // Update existing plan
            await supabase
              .from('product_plans')
              .update({
                name: plan.name,
                description: plan.description,
                price: parseFloat(plan.price),
                duration_months: parseInt(plan.duration_months),
                features: plan.features,
                is_available: plan.is_available,
                is_time_based: plan.is_time_based !== false,
                sort_order: plans.indexOf(plan)
              })
              .eq('id', plan.id);
          } else {
            // Insert new plan
            await supabase
              .from('product_plans')
              .insert({
                product_id: productId,
                name: plan.name,
                description: plan.description,
                price: parseFloat(plan.price),
                duration_months: parseInt(plan.duration_months),
                features: plan.features,
                is_available: plan.is_available,
                is_time_based: plan.is_time_based !== false,
                sort_order: plans.indexOf(plan)
              });
          }
        }
      } else {
        // Insert new plans for new product
        const plansToInsert = plans.map((plan, index) => ({
          product_id: productId,
          name: plan.name,
          description: plan.description,
          price: parseFloat(plan.price),
          duration_months: parseInt(plan.duration_months),
          features: plan.features,
          is_available: plan.is_available,
          is_time_based: plan.is_time_based !== false,
          sort_order: index
        }));

        const { error: plansError } = await supabase
          .from('product_plans')
          .insert(plansToInsert);

        if (plansError) {
          toast({
            title: 'هشدار',
            description: 'محصول ذخیره شد اما مشکلی در ذخیره پلن‌ها پیش آمد',
            variant: 'destructive'
          });
        }
      }
    }

    toast({
      title: 'موفق',
      description: editingProduct ? 'محصول به‌روزرسانی شد' : 'محصول اضافه شد'
    });
    setDialogOpen(false);
    resetForm();
    loadProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price ? product.price.toString() : '',
      description: product.description || '',
      category_id: product.category_id,
      image_url: '',
      slug: '',
      is_available: product.is_available
    });
    // Load existing plans
    loadProductPlans(product.id);
    setDialogOpen(true);
  };

  const loadProductPlans = async (productId: string) => {
    const { data, error } = await supabase
      .from('product_plans')
      .select('*')
      .eq('product_id', productId)
      .order('sort_order');

    if (data && !error) {
      setPlans(data.map(plan => ({
        id: plan.id,
        name: plan.name,
        description: plan.description || '',
        price: plan.price.toString(),
        duration_months: plan.duration_months.toString(),
        features: plan.features as string[],
        is_available: plan.is_available,
        sort_order: plan.sort_order
      })));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطا',
        description: 'مشکلی در حذف محصول پیش آمد',
        variant: 'destructive'
      });
    } else {
      toast({ title: 'موفق', description: 'محصول حذف شد' });
      loadProducts();
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      category_id: '',
      image_url: '',
      slug: '',
      is_available: true
    });
    setEditingProduct(null);
    setPlans([]);
    setNewFeature('');
    setEditingPlanIndex(null);
    setImageFile(null);
    setImagePreview('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: 'فرمت نامعتبر',
          description: 'فقط فایل‌های JPG، PNG، WEBP و GIF مجاز هستند',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'حجم بیش از حد',
          description: 'حداکثر حجم مجاز 5 مگابایت است',
          variant: 'destructive'
        });
        return;
      }

      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          
          // Validate file size (5MB)
          if (file.size > 5 * 1024 * 1024) {
            toast({
              title: 'حجم بیش از حد',
              description: 'حداکثر حجم مجاز 5 مگابایت است',
              variant: 'destructive'
            });
            return;
          }

          setImageFile(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onloadend = () => {
            setImagePreview(reader.result as string);
          };
          reader.readAsDataURL(file);

          toast({
            title: 'تصویر آماده است',
            description: 'تصویر با موفقیت paste شد'
          });
        }
      }
    }
  };

  const addPlan = () => {
    setPlans([...plans, {
      name: '',
      description: '',
      price: '',
      duration_months: '1',
      features: [],
      is_available: true,
      is_time_based: true, // Default to time-based plans
      sort_order: plans.length
    }]);
  };

  const updatePlan = (index: number, field: keyof ProductPlan, value: any) => {
    const updatedPlans = [...plans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setPlans(updatedPlans);
  };

  const removePlan = (index: number) => {
    setPlans(plans.filter((_, i) => i !== index));
  };

  const addFeatureToPlan = (planIndex: number, feature: string) => {
    if (!feature.trim()) return;
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features.push(feature);
    setPlans(updatedPlans);
  };

  const removeFeatureFromPlan = (planIndex: number, featureIndex: number) => {
    const updatedPlans = [...plans];
    updatedPlans[planIndex].features = updatedPlans[planIndex].features.filter((_, i) => i !== featureIndex);
    setPlans(updatedPlans);
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
                مدیریت <span className="gradient-primary bg-clip-text text-transparent">محصولات</span>
              </h1>
              <p className="text-muted-foreground">مدیریت محصولات و پلن‌های اشتراک</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button variant="hero" className="gap-2">
                  <Plus className="h-4 w-4" />
                  افزودن محصول
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingProduct ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>نام محصول</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>قیمت پیش‌فرض (تومان) - اختیاری</Label>
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {plans.length > 0 
                        ? 'با وجود پلن، این قیمت نادیده گرفته می‌شود' 
                        : 'اگر پلن ندارید، این فیلد الزامی است'}
                    </p>
                  </div>
                  <div>
                    <Label>دسته‌بندی</Label>
                    <Select
                      required
                      value={formData.category_id}
                      onValueChange={(value) => setFormData({ ...formData, category_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="انتخاب دسته‌بندی" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>توضیحات</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <Label>تصویر محصول</Label>
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {(imagePreview || formData.image_url) && (
                        <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                          <img
                            src={imagePreview || formData.image_url}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                              setFormData({ ...formData, image_url: '' });
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}

                      {/* File Input with Paste Support */}
                      <div
                        className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                        onPaste={handlePasteImage}
                        onClick={() => document.getElementById('image-upload')?.click()}
                      >
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="space-y-2">
                          <Plus className="h-8 w-8 mx-auto text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">
                            کلیک کنید یا تصویر را Paste کنید (Ctrl+V)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            JPG، PNG، WEBP، GIF - حداکثر 5MB
                          </p>
                        </div>
                      </div>

                      {/* Or use URL */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-background px-2 text-muted-foreground">یا</span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">آدرس تصویر (URL)</Label>
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                          disabled={!!imageFile}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plans Section */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-lg">پلن‌های قیمتی (اختیاری)</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addPlan} className="gap-2">
                        <Plus className="h-4 w-4" />
                        افزودن پلن
                      </Button>
                    </div>
                    
                    {plans.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        هیچ پلنی اضافه نشده. برای محصولاتی که چند قیمت دارند (بیسیک، پریمیوم، ماهانه، سالانه) پلن اضافه کنید.
                      </p>
                    )}

                    {plans.map((plan, index) => (
                      <Card key={index} className="mb-4 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="text-base">پلن {index + 1}</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePlan(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">نام پلن</Label>
                              <Input
                                required
                                placeholder="بیسیک، پریمیوم، سالانه..."
                                value={plan.name}
                                onChange={(e) => updatePlan(index, 'name', e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-sm">قیمت (تومان)</Label>
                              <Input
                                type="number"
                                required
                                value={plan.price}
                                onChange={(e) => updatePlan(index, 'price', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm">مدت زمان (ماه)</Label>
                              <Input
                                type="number"
                                required
                                value={plan.duration_months}
                                onChange={(e) => updatePlan(index, 'duration_months', e.target.value)}
                                disabled={!plan.is_time_based}
                              />
                            </div>
                            <div className="flex flex-col items-start justify-end gap-2">
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={plan.is_available}
                                  onChange={(e) => updatePlan(index, 'is_available', e.target.checked)}
                                />
                                <span className="text-sm">در دسترس</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={plan.is_time_based !== false}
                                  onChange={(e) => updatePlan(index, 'is_time_based', e.target.checked)}
                                />
                                <span className="text-sm">محدودیت زمانی دارد</span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">توضیحات پلن</Label>
                            <Input
                              placeholder="مناسب برای..."
                              value={plan.description}
                              onChange={(e) => updatePlan(index, 'description', e.target.value)}
                            />
                          </div>

                          <div>
                            <Label className="text-sm">ویژگی‌ها</Label>
                            <div className="flex gap-2 mb-2">
                              <Input
                                placeholder="ویژگی جدید..."
                                value={editingPlanIndex === index ? newFeature : ''}
                                onChange={(e) => {
                                  setEditingPlanIndex(index);
                                  setNewFeature(e.target.value);
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    addFeatureToPlan(index, newFeature);
                                    setNewFeature('');
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  addFeatureToPlan(index, newFeature);
                                  setNewFeature('');
                                }}
                              >
                                افزودن
                              </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {plan.features.map((feature, featureIndex) => (
                                <div
                                  key={featureIndex}
                                  className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-md text-sm"
                                >
                                  <span>{feature}</span>
                                  <button
                                    type="button"
                                    onClick={() => removeFeatureFromPlan(index, featureIndex)}
                                    className="text-destructive hover:text-destructive/80"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button type="submit" variant="hero" className="w-full" disabled={uploadingImage}>
                    {uploadingImage ? 'در حال آپلود تصویر...' : editingProduct ? 'به‌روزرسانی' : 'افزودن'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="glass-card border-primary/20">
            <CardContent className="p-6">
              {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <Table>
                <TableHeader dir="rtl">
                  <TableRow>
                    <TableHead className="text-right">نام محصول</TableHead>
                    <TableHead className="text-right">دسته‌بندی</TableHead>
                    <TableHead className="text-right">قیمت</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.categories.name}</TableCell>
                      <TableCell>
                        {product.price ? `${product.price.toLocaleString('fa-IR')} تومان` : 'پلن‌های متعدد'}
                      </TableCell>
                      <TableCell>
                        {product.is_available ? 'موجود' : 'ناموجود'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        </div>
      </main>
    </div>
    </>
  );
}
