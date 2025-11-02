import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TotpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderItemId: string;
}

export default function TotpModal({ open, onOpenChange, orderItemId }: TotpModalProps) {
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [attempt, setAttempt] = useState(0);
  const [isFinalAttempt, setIsFinalAttempt] = useState(false);
  const [locked, setLocked] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  // Countdown timer
  useEffect(() => {
    if (code && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [code, countdown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset state when component unmounts (page reload, navigation)
      setCode(null);
      setCountdown(30);
      setLoading(false);
    };
  }, []);

  const generateCode = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-totp', {
        body: { orderItemId },
      });

      if (error) throw error;

      if (data.error) {
        if (data.locked) {
          setLocked(true);
          toast({
            title: 'صندلی قفل شده',
            description: data.error,
            variant: 'destructive',
          });
        } else if (data.success) {
          setSuccess(true);
          toast({
            title: 'ورود موفق',
            description: data.error,
          });
        } else if (data.waitTime) {
          toast({
            title: 'لطفا صبر کنید',
            description: data.error,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'خطا',
            description: data.error,
            variant: 'destructive',
          });
        }
        return;
      }

      setCode(data.code);
      setCountdown(data.expiresIn);
      setAttempt(data.attempt);
      setIsFinalAttempt(data.isFinalAttempt);
    } catch (error: any) {
      console.error('Error generating TOTP:', error);
      toast({
        title: 'خطا',
        description: 'خطا در دریافت کد. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmLogin = async (success: boolean) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('confirm-totp-login', {
        body: { orderItemId, success },
      });

      if (error) throw error;

      if (success) {
        setSuccess(true);
        toast({
          title: 'ورود موفق',
          description: 'ورود شما با موفقیت ثبت شد',
        });
        setTimeout(() => onOpenChange(false), 2000);
      } else {
        if (data.locked) {
          setLocked(true);
          toast({
            title: 'صندلی قفل شد',
            description: data.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'تلاش ناموفق',
            description: data.message,
            variant: 'destructive',
          });
          setCode(null);
        }
      }
    } catch (error: any) {
      console.error('Error confirming login:', error);
      toast({
        title: 'خطا',
        description: 'خطا در ثبت وضعیت. لطفا دوباره تلاش کنید.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Prevent closing if code is active or loading
    if ((code && !success && !locked) || loading) {
      toast({
        title: 'هشدار',
        description: 'لطفا ابتدا وضعیت ورود خود را اعلام کنید یا صبر کنید تا کد منقضی شود.',
        variant: 'destructive',
      });
      return;
    }

    // Reset all state
    setCode(null);
    setCountdown(30);
    setAttempt(0);
    setIsFinalAttempt(false);
    setLocked(false);
    setSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-lg"
        onInteractOutside={(e) => {
          // Prevent closing on outside click if code is active
          if ((code && !success && !locked) || loading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on ESC if code is active
          if ((code && !success && !locked) || loading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            کد احراز هویت دو مرحله‌ای (TOTP)
          </DialogTitle>
          <DialogDescription>
            کد یکبار مصرف برای ورود به اکانت خود
          </DialogDescription>
        </DialogHeader>

        {locked ? (
          <div className="space-y-4">
            <Alert className="border-destructive/30 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription>
                صندلی شما قفل شده است. لطفا با پشتیبانی تماس بگیرید.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full" variant="outline">
              بستن
            </Button>
          </div>
        ) : success ? (
          <div className="space-y-4">
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>
                ورود شما با موفقیت ثبت شد. از این به بعد می‌توانید از اکانت استفاده کنید.
              </AlertDescription>
            </Alert>
            <Button onClick={handleClose} className="w-full">
              بستن
            </Button>
          </div>
        ) : !code ? (
          <div className="space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertDescription>
                {isFinalAttempt ? (
                  <div className="space-y-2">
                    <p className="font-bold text-destructive">هشدار: این آخرین تلاش شماست!</p>
                    <p>در صورت عدم موفقیت، صندلی شما قفل خواهد شد و باید با پشتیبانی تماس بگیرید.</p>
                  </div>
                ) : (
                  'کد TOTP فقط ۳۰ ثانیه اعتبار دارد. لطفا قبل از دریافت کد، آماده ورود باشید.'
                )}
              </AlertDescription>
            </Alert>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-bold">راهنمای ورود موفق:</h4>
              <ol className="text-sm space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">۱</span>
                  صفحه ورود را باز کنید و اطلاعات کاربری را وارد کنید
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">۲</span>
                  دکمه "دریافت کد" را بزنید
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">۳</span>
                  کد ۶ رقمی را سریع کپی کرده و در صفحه ورود وارد کنید
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold">۴</span>
                  فوراً وضعیت ورود خود را اعلام کنید
                </li>
              </ol>
            </div>

            {attempt > 0 && (
              <Alert>
                <AlertDescription>
                  تلاش {attempt} از ۲: {isFinalAttempt ? 'این آخرین شانس شماست!' : 'یک تلاش دیگر باقی مانده'}
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={generateCode}
              disabled={loading}
              className="w-full"
              variant={isFinalAttempt ? 'destructive' : 'default'}
            >
              {loading ? 'در حال دریافت...' : isFinalAttempt ? 'دریافت کد نهایی' : 'دریافت کد TOTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-8 border border-primary/30">
                <div className="text-5xl font-mono font-bold tracking-wider text-primary mb-2">
                  {code}
                </div>
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Timer className="h-4 w-4" />
                  <span className="text-sm">
                    {countdown} ثانیه تا انقضا
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(code);
                  toast({ title: 'کپی شد', description: 'کد به کلیپبورد کپی شد' });
                }}
                className="w-full"
              >
                کپی کد
              </Button>
            </div>

            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <AlertDescription>
                سریع عمل کنید! این کد فقط {countdown} ثانیه اعتبار دارد.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <p className="text-sm text-center font-medium">آیا موفق به ورود شدید؟</p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => confirmLogin(true)}
                  disabled={loading}
                  className="gap-2"
                  variant="default"
                >
                  <CheckCircle className="h-4 w-4" />
                  بله، وارد شدم
                </Button>
                <Button
                  onClick={() => confirmLogin(false)}
                  disabled={loading}
                  variant="destructive"
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  خیر، نشد
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
