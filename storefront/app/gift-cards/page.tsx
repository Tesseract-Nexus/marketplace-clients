'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Gift, CreditCard, Mail, User, MessageSquare, Calendar, Search, Check, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant, useCurrency } from '@/context/TenantContext';
import { cn } from '@/lib/utils';
import {
  getGiftCardTemplates,
  purchaseGiftCard,
  checkGiftCardBalance,
  formatGiftCardCode,
  type GiftCardTemplate,
  type CheckBalanceResponse,
} from '@/lib/api/gift-cards';

// Default amounts used as fallback if no template is loaded
const DEFAULT_AMOUNTS = [25, 50, 75, 100, 150, 200];

export default function GiftCardsPage() {
  const { tenant, settings } = useTenant();
  const { symbol: currencySymbol } = useCurrency();
  const [activeTab, setActiveTab] = useState('purchase');

  // Purchase state
  const [templates, setTemplates] = useState<GiftCardTemplate[]>([]);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  // Balance check state
  const [balanceCode, setBalanceCode] = useState('');
  const [isCheckingBalance, setIsCheckingBalance] = useState(false);
  const [balanceResult, setBalanceResult] = useState<CheckBalanceResponse | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Load templates
  useEffect(() => {
    if (tenant) {
      getGiftCardTemplates(tenant.id, tenant.storefrontId)
        .then((loadedTemplates) => {
          setTemplates(loadedTemplates);
          // Select the first amount from the template, or default to first amount
          const firstTemplate = loadedTemplates[0];
          const amounts = firstTemplate?.amounts ?? [];
          const defaultAmount = DEFAULT_AMOUNTS[0] as number;
          setSelectedAmount(amounts.length > 0 ? (amounts[0] as number) : defaultAmount);
        })
        .catch(console.error);
    }
  }, [tenant]);

  const finalAmount = isCustomAmount ? parseFloat(customAmount) || 0 : selectedAmount || 0;
  const template = templates[0];
  const isValidAmount = finalAmount >= (template?.minAmount || 10) && finalAmount <= (template?.maxAmount || 500);
  const isFormValid = isValidAmount && recipientEmail && recipientName && senderName;

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustomAmount(false);
    setCustomAmount('');
  };

  const handleCustomAmountFocus = () => {
    setIsCustomAmount(true);
    setSelectedAmount(null);
  };

  const handlePurchase = async () => {
    if (!tenant || !isFormValid) return;

    setIsPurchasing(true);
    setPurchaseError(null);

    try {
      await purchaseGiftCard(tenant.id, tenant.storefrontId, {
        amount: finalAmount,
        recipientEmail,
        recipientName,
        senderName,
        message: message || undefined,
      });
      setPurchaseSuccess(true);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : 'Failed to purchase gift card');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleCheckBalance = async () => {
    if (!tenant || !balanceCode) return;

    setIsCheckingBalance(true);
    setBalanceError(null);
    setBalanceResult(null);

    try {
      const result = await checkGiftCardBalance(tenant.id, tenant.storefrontId, balanceCode);
      setBalanceResult(result);
    } catch (error) {
      setBalanceError(error instanceof Error ? error.message : 'Gift card not found');
    } finally {
      setIsCheckingBalance(false);
    }
  };

  const resetPurchaseForm = () => {
    setPurchaseSuccess(false);
    setSelectedAmount(50);
    setCustomAmount('');
    setIsCustomAmount(false);
    setRecipientEmail('');
    setRecipientName('');
    setSenderName('');
    setMessage('');
  };

  if (purchaseSuccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6"
        >
          <Check className="h-10 w-10 text-green-600" />
        </motion.div>
        <h1 className="text-3xl font-bold mb-2">Gift Card Sent!</h1>
        <p className="text-muted-foreground mb-6 max-w-md">
          A {currencySymbol}{finalAmount.toFixed(2)} gift card has been sent to {recipientEmail}.
          They will receive an email with the gift card code shortly.
        </p>
        <Button onClick={resetPurchaseForm} variant="tenant-gradient" size="lg">
          Send Another Gift Card
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-12 md:py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--tenant-primary)]/10 via-background to-[var(--tenant-secondary)]/10" />
        <div
          className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-primary)' }}
        />
        <div
          className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: 'var(--tenant-secondary)' }}
        />

        <div className="container-tenant relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tenant-primary/10 text-tenant-primary mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">The Perfect Gift</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Gift Cards
            </h1>
            <p className="text-lg text-muted-foreground">
              Give the gift of choice. Send a {tenant?.name || 'store'} gift card to someone special.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12 -mt-8">
        <div className="container-tenant max-w-4xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="purchase" className="gap-2">
                <Gift className="h-4 w-4" />
                Purchase Gift Card
              </TabsTrigger>
              <TabsTrigger value="balance" className="gap-2">
                <CreditCard className="h-4 w-4" />
                Check Balance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="purchase">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border shadow-sm overflow-hidden"
              >
                {/* Gift Card Preview */}
                <div className="relative p-8 bg-gradient-to-br from-tenant-primary/20 to-tenant-secondary/20">
                  <div className="max-w-sm mx-auto">
                    <div className="relative aspect-[1.6/1] rounded-xl overflow-hidden shadow-2xl bg-gradient-to-br from-tenant-primary to-tenant-secondary">
                      <div className="absolute inset-0 flex flex-col justify-between p-6 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {settings.logoUrl ? (
                              <Image
                                src={settings.logoUrl}
                                alt={tenant?.name || 'Store'}
                                width={80}
                                height={30}
                                className="h-6 w-auto object-contain brightness-0 invert"
                              />
                            ) : (
                              <span className="text-lg font-bold">{tenant?.name || 'Store'}</span>
                            )}
                          </div>
                          <Gift className="h-6 w-6 opacity-80" />
                        </div>
                        <div>
                          <p className="text-sm opacity-80 mb-1">Gift Card Value</p>
                          <p className="text-3xl font-bold">
                            {currencySymbol}{finalAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      {/* Decorative elements */}
                      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                      <div className="absolute -top-5 -left-5 w-20 h-20 bg-white/10 rounded-full" />
                    </div>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Select Amount</Label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                      {(template?.amounts || DEFAULT_AMOUNTS).map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount && !isCustomAmount ? 'tenant-primary' : 'outline'}
                          className={cn(
                            'h-12 text-lg font-semibold',
                            selectedAmount === amount && !isCustomAmount && 'ring-2 ring-tenant-primary ring-offset-2'
                          )}
                          onClick={() => handleAmountSelect(amount)}
                        >
                          {currencySymbol}{amount}
                        </Button>
                      ))}
                    </div>

                    {template?.allowCustomAmount && (
                      <div className="mt-4">
                        <Label htmlFor="custom-amount" className="text-sm text-muted-foreground">
                          Or enter a custom amount ({currencySymbol}{template.minAmount}-{currencySymbol}{template.maxAmount})
                        </Label>
                        <div className="relative mt-2">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{currencySymbol}</span>
                          <Input
                            id="custom-amount"
                            type="number"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            onFocus={handleCustomAmountFocus}
                            className={cn(
                              'pl-8 h-12 text-lg',
                              isCustomAmount && 'ring-2 ring-tenant-primary ring-offset-2'
                            )}
                            min={template.minAmount}
                            max={template.maxAmount}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Recipient Details */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold block">Recipient Details</Label>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipient-name" className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Recipient Name *
                        </Label>
                        <Input
                          id="recipient-name"
                          placeholder="John Doe"
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="recipient-email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Recipient Email *
                        </Label>
                        <Input
                          id="recipient-email"
                          type="email"
                          placeholder="john@example.com"
                          value={recipientEmail}
                          onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sender-name" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        Your Name *
                      </Label>
                      <Input
                        id="sender-name"
                        placeholder="Your name"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        Personal Message (Optional)
                      </Label>
                      <Textarea
                        id="message"
                        placeholder="Add a personal message to your gift card..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </div>

                  {purchaseError && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm">
                      {purchaseError}
                    </div>
                  )}

                  {/* Purchase Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                    <div className="text-center sm:text-left">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold">{currencySymbol}{finalAmount.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="tenant-glow"
                      size="lg"
                      className="w-full sm:w-auto min-w-[200px]"
                      onClick={handlePurchase}
                      disabled={!isFormValid || isPurchasing}
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Gift className="h-4 w-4 mr-2" />
                          Purchase Gift Card
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="balance">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl border shadow-sm p-6 md:p-8"
              >
                <div className="max-w-md mx-auto text-center">
                  <div className="w-16 h-16 rounded-full bg-tenant-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="h-8 w-8 text-tenant-primary" />
                  </div>

                  <h2 className="text-2xl font-bold mb-2">Check Your Balance</h2>
                  <p className="text-muted-foreground mb-6">
                    Enter your gift card code to check the remaining balance.
                  </p>

                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="XXXX-XXXX-XXXX-XXXX"
                        value={balanceCode}
                        onChange={(e) => setBalanceCode(e.target.value.toUpperCase())}
                        className="h-14 text-center text-lg tracking-widest font-mono uppercase"
                        maxLength={19}
                      />
                    </div>

                    <Button
                      variant="tenant-primary"
                      size="lg"
                      className="w-full"
                      onClick={handleCheckBalance}
                      disabled={!balanceCode || isCheckingBalance}
                    >
                      {isCheckingBalance ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Check Balance
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Balance Result */}
                  <AnimatePresence mode="wait">
                    {balanceResult && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8 p-6 rounded-xl bg-gradient-to-br from-tenant-primary/10 to-tenant-secondary/10 border"
                      >
                        <p className="text-sm text-muted-foreground mb-2">Available Balance</p>
                        <p className="text-4xl font-bold text-tenant-primary mb-4">
                          {currencySymbol}{balanceResult.balance.toFixed(2)}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant={balanceResult.status === 'ACTIVE' ? 'default' : 'secondary'}
                            className={cn(
                              balanceResult.status === 'ACTIVE' && 'bg-green-100 text-green-700'
                            )}
                          >
                            {balanceResult.status}
                          </Badge>
                          {balanceResult.expiresAt && (
                            <span className="text-sm text-muted-foreground">
                              Expires: {new Date(balanceResult.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {balanceError && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-8 p-4 rounded-lg bg-red-50 text-red-600"
                      >
                        {balanceError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </TabsContent>
          </Tabs>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-12 grid sm:grid-cols-3 gap-6"
          >
            {[
              {
                icon: Mail,
                title: 'Instant Delivery',
                description: 'Gift cards are delivered instantly via email',
              },
              {
                icon: Calendar,
                title: 'Never Expires',
                description: 'Gift cards have no expiration date',
              },
              {
                icon: Gift,
                title: 'Easy to Use',
                description: 'Redeem at checkout with the gift card code',
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="text-center p-6 rounded-xl bg-card border"
              >
                <div className="w-12 h-12 rounded-full bg-tenant-primary/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-tenant-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
