'use client';

import { Toaster as Sonner, toast } from 'sonner';
import { useTheme } from 'next-themes';
import { CheckCircle2, XCircle, AlertCircle, Info, ShoppingCart, CreditCard, Gift, Tag, Truck, User } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Global Toaster component for the storefront
 * Place this in your root layout
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      position="bottom-right"
      expand={false}
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          closeButton:
            'group-[.toast]:bg-background group-[.toast]:border-border',
        },
      }}
      {...props}
    />
  );
};

// ========================================
// Toast Helper Functions
// ========================================

/**
 * Show a success toast
 */
const showSuccess = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  });
};

/**
 * Show an error toast
 */
const showError = (message: string, description?: string) => {
  toast.error(message, {
    description,
    icon: <XCircle className="h-5 w-5 text-red-500" />,
  });
};

/**
 * Show a warning toast
 */
const showWarning = (message: string, description?: string) => {
  toast.warning(message, {
    description,
    icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  });
};

/**
 * Show an info toast
 */
const showInfo = (message: string, description?: string) => {
  toast.info(message, {
    description,
    icon: <Info className="h-5 w-5 text-blue-500" />,
  });
};

/**
 * Show a cart-related toast
 */
const showCart = (message: string, description?: string, action?: { label: string; onClick: () => void }) => {
  toast.success(message, {
    description,
    icon: <ShoppingCart className="h-5 w-5 text-tenant-primary" />,
    action: action ? { label: action.label, onClick: action.onClick } : undefined,
  });
};

/**
 * Show a payment-related toast
 */
const showPayment = (message: string, description?: string, isSuccess = true) => {
  if (isSuccess) {
    toast.success(message, {
      description,
      icon: <CreditCard className="h-5 w-5 text-green-500" />,
    });
  } else {
    toast.error(message, {
      description,
      icon: <CreditCard className="h-5 w-5 text-red-500" />,
    });
  }
};

/**
 * Show a coupon-related toast
 */
const showCoupon = (message: string, description?: string, isSuccess = true) => {
  if (isSuccess) {
    toast.success(message, {
      description,
      icon: <Tag className="h-5 w-5 text-green-600" />,
    });
  } else {
    toast.error(message, {
      description,
      icon: <Tag className="h-5 w-5 text-red-500" />,
    });
  }
};

/**
 * Show a gift card-related toast
 */
const showGiftCard = (message: string, description?: string, isSuccess = true) => {
  if (isSuccess) {
    toast.success(message, {
      description,
      icon: <Gift className="h-5 w-5 text-purple-500" />,
    });
  } else {
    toast.error(message, {
      description,
      icon: <Gift className="h-5 w-5 text-red-500" />,
    });
  }
};

/**
 * Show a shipping-related toast
 */
const showShipping = (message: string, description?: string) => {
  toast.success(message, {
    description,
    icon: <Truck className="h-5 w-5 text-blue-500" />,
  });
};

/**
 * Show an account-related toast
 */
const showAccount = (message: string, description?: string, isSuccess = true) => {
  if (isSuccess) {
    toast.success(message, {
      description,
      icon: <User className="h-5 w-5 text-green-500" />,
    });
  } else {
    toast.error(message, {
      description,
      icon: <User className="h-5 w-5 text-red-500" />,
    });
  }
};

/**
 * Show a loading toast that can be updated
 */
const showLoading = (message: string): string | number => {
  return toast.loading(message);
};

/**
 * Dismiss a specific toast or all toasts
 */
const dismissToast = (id?: string | number): void => {
  if (id) {
    toast.dismiss(id);
  } else {
    toast.dismiss();
  }
};

// Export toast utilities as a typed namespace
export const storefrontToast: {
  success: (message: string, description?: string) => void;
  error: (message: string, description?: string) => void;
  warning: (message: string, description?: string) => void;
  info: (message: string, description?: string) => void;
  cart: (message: string, description?: string, action?: { label: string; onClick: () => void }) => void;
  payment: (message: string, description?: string, isSuccess?: boolean) => void;
  coupon: (message: string, description?: string, isSuccess?: boolean) => void;
  giftCard: (message: string, description?: string, isSuccess?: boolean) => void;
  shipping: (message: string, description?: string) => void;
  account: (message: string, description?: string, isSuccess?: boolean) => void;
  loading: (message: string) => string | number;
  dismiss: (id?: string | number) => void;
} = {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  cart: showCart,
  payment: showPayment,
  coupon: showCoupon,
  giftCard: showGiftCard,
  shipping: showShipping,
  account: showAccount,
  loading: showLoading,
  dismiss: dismissToast,
};

export { Toaster, toast };
