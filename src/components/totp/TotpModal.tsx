import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, Timer, ExternalLink } from 'lucide-react';
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
  const [waitCountdown, setWaitCountdown] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [isFinalAttempt, setIsFinalAttempt] = useState(false);
  const [locked, setLocked] = useState(false);
  const [lockReason, setLockReason] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  // Countdown timers
  useEffect(() => {
    if (code && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [code, countdown]);

  useEffect(() => {
    if (waitCountdown > 0) {
      const timer = setInterval(() => {
        setWaitCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (waitCountdown === 0 && loading) {
      // When countdown finishes, generate the code
      actuallyGenerateCode();
    }
  }, [waitCountdown, loading]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset state when component unmounts (page reload, navigation)
      setCode(null);
      setCountdown(30);
      setWaitCountdown(0);
      setLoading(false);
    };
  }, []);

  const calculateWaitTime = () => {
    // TOTP codes change every 30 seconds
    const now = Math.floor(Date.now() / 1000);
    const currentPosition = now % 30;
    
    // If we're past 15 seconds in current window, wait for next window
    if (currentPosition > 15) {
      return 30 - currentPosition;
    }
    return 0;
  };

  const generateCode = async () => {
    const waitTime = calculateWaitTime();
    
    if (waitTime > 0) {
      setLoading(true);
      setWaitCountdown(waitTime);
      // actuallyGenerateCode will be called when countdown reaches 0
    } else {
      actuallyGenerateCode();
    }
  };

  const actuallyGenerateCode = async () => {
    setLoading(true);
    setWaitCountdown(0);
    try {
      const { data, error } = await supabase.functions.invoke('generate-totp', {
        body: { orderItemId },
      });

      if (error) {
        // Handle edge function non-2xx without throwing
        const server = (error.context ?? null) as any;
        if (server?.locked) {
          setLocked(true);
          setLockReason(server?.lock_reason || null);
          setErrorMessage(server?.error || 'شما از تمام تلاش‌های خود استفاده کرده‌اید. لطفا با پشتیبانی تماس بگیرید.');
          return;
        }
        toast({ title: 'خطا', description: server?.error || 'خطایی رخ داد', variant: 'destructive' });
        return;
      }

      if (data.error) {
        if (data.locked) {
          setLocked(true);
          setErrorMessage('شما از تمام تلاش‌های خود استفاده کرده‌اید. لطفا با پشتیبانی تماس بگیرید.');
        } else if (data.success) {
          setSuccess(true);
          toast({ title: 'ورود موفق', description: data.error });
        } else {
          toast({ title: 'خطا', description: data.error, variant: 'destructive' });
        }
        return;
      }

      setCode(data.code);
      setCountdown(data.expiresIn);
      setAttempt(data.attempt);
      setIsFinalAttempt(data.isFinalAttempt);
    } catch (error: any) {
      console.error('Error generating TOTP:', error);
      const status = error?.status ?? error?.code;
      let server = (error?.context ?? null) as any;

      // Fallback: try to parse JSON payload embedded in error.message
      if (!server && typeof error?.message === 'string') {
        const match = error.message.match(/\{.*\}$/);
        if (match) {
          try { server = JSON.parse(match[0]); } catch {}
        }
      }

      if ((error?.name === 'FunctionsHttpError' || error?.name === 'FunctionsRelayError') && status === 403) {
        const serverMsg = server?.error as string | undefined;
        if (server?.locked) {
          setLocked(true);
          setErrorMessage(
            serverMsg || 'شما از تمام تلاش‌های خود استفاده کرده‌اید. لطفا با پشتیبانی تماس بگیرید.'
          );
          return;
        }
        toast({ title: 'خطا', description: serverMsg || 'دسترسی غیرمجاز', variant: 'destructive' });
        return;
      }

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

      if (error) {
        const server = (error.context ?? null) as any;
        if (server?.locked) {
          setLocked(true);
          setLockReason(server?.lock_reason || null);
          setErrorMessage(server?.message || 'به دلیل تلاش‌های ناموفق، صندلی شما قفل شد. لطفا با پشتیبانی تماس بگیرید.');
          return;
        }
        toast({ title: 'خطا', description: server?.message || server?.error || 'عدم دسترسی', variant: 'destructive' });
        return;
      }

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
          setLockReason(data.lock_reason || null);
          setErrorMessage('متاسفانه ورود شما موفق نبود و صندلی شما قفل شد. لطفا با پشتیبانی تماس بگیرید.');
        } else {
          setCode(null);
          setErrorMessage('ورود شما ناموفق بود. لطفا دوباره تلاش کنید و مطمئن شوید که کد را قبل از انقضا وارد می‌کنید.');
          toast({
            title: 'ورود ناموفق',
            description: 'کد وارد شده صحیح نبود یا منقضی شده است. لطفا دوباره تلاش کنید.',
            variant: 'destructive',
          });
        }
      }
    } catch (error: any) {
      console.error('Error confirming login:', error);
      const status = error?.status ?? error?.code;
      const context = (error?.context ?? null) as any;

      if (error?.name === 'FunctionsHttpError' && status === 403) {
        const serverMsg = context?.error || context?.message;
        if (context?.locked) {
          setLocked(true);
          setErrorMessage(serverMsg || 'به دلیل تلاش‌های ناموفق، صندلی شما قفل شد. لطفا با پشتیبانی تماس بگیرید.');
          return;
        }
        toast({ title: 'خطا', description: serverMsg || 'عدم دسترسی', variant: 'destructive' });
        return;
      }

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
    // Prevent closing if code is active or loading (but allow if waiting for next window)
    if ((code && !success && !locked) || (loading && waitCountdown === 0)) {
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
    setWaitCountdown(0);
    setAttempt(0);
    setIsFinalAttempt(false);
    setLocked(false);
    setLockReason(null);
    setSuccess(false);
    setErrorMessage(null);
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-lg"
        onInteractOutside={(e) => {
          // Prevent closing on outside click if code is active
          if ((code && !success && !locked) || (loading && waitCountdown === 0)) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on ESC if code is active
          if ((code && !success && !locked) || (loading && waitCountdown === 0)) {
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

        {locked || errorMessage ? (
          <div className="space-y-4">
            <Alert className="border-destructive/30 bg-destructive/5">
              <XCircle className="h-4 w-4 text-destructive" />
              <AlertDescription className="space-y-2">
                <p>{errorMessage || 'صندلی شما قفل شده است.'}</p>
                {lockReason && (
                  <p className="text-xs text-muted-foreground">علت: {lockReason}</p>
                )}
                <p className="text-sm">
                  برای حل این مشکل، لطفا با تیم پشتیبانی تماس بگیرید.
                </p>
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Link to="/support" className="flex-1">
                <Button variant="hero" className="w-full gap-2">
                  <ExternalLink className="h-4 w-4" />
                  تماس با پشتیبانی
                </Button>
              </Link>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                بستن
              </Button>
            </div>
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
        ) : !code && waitCountdown === 0 ? (
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
                  'کد TOTP حداکثر ۳۰ ثانیه اعتبار دارد. برای بهترین نتیجه، کد در بهترین زمان ممکن صادر می‌شود.'
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
        ) : waitCountdown > 0 ? (
          <div className="space-y-4">
            <Alert className="border-primary/30 bg-primary/5">
              <Timer className="h-4 w-4 text-primary" />
              <AlertDescription>
                <p className="font-bold mb-2">در حال آماده‌سازی کد شما...</p>
                <p className="text-sm">
                  برای اطمینان از دریافت کد با بیشترین زمان اعتبار، {waitCountdown} ثانیه دیگر منتظر بمانید.
                </p>
              </AlertDescription>
            </Alert>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border-4 border-primary/30">
                <div className="text-4xl font-bold text-primary">{waitCountdown}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                ثانیه تا صدور کد
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-bold mb-2">در این مدت:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>✓ صفحه ورود را باز کنید</li>
                <li>✓ نام کاربری و رمز عبور را وارد کنید</li>
                <li>✓ آماده وارد کردن کد TOTP باشید</li>
              </ul>
            </div>

            <Button
              onClick={() => {
                setWaitCountdown(0);
                setLoading(false);
              }}
              variant="outline"
              className="w-full"
            >
              انصراف
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
