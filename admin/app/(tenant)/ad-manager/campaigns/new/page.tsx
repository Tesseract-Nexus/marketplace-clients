'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Megaphone,
  DollarSign,
  Image as ImageIcon,
  Target,
  FileCheck,
  Calendar,
  Info,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/Select';
import { Checkbox } from '@/components/ui/checkbox';
import { PermissionGate } from '@/components/permission-gate';
import { Permissions } from '@/hooks/usePermission';
import { useDialog } from '@/contexts/DialogContext';
import { adManagerService } from '@/lib/services/adManagerService';
import type { AdCreative, CreateAdCampaignRequest, AdBidStrategy, AdPaymentType } from '@/lib/api/types';
import { cn } from '@/lib/utils';
import { PaymentStep } from './components/PaymentStep';
import { useTenantCurrency } from '@/hooks/useTenantCurrency';

const STEPS = [
  { id: 'details', title: 'Campaign Details', icon: Megaphone },
  { id: 'budget', title: 'Budget & Schedule', icon: DollarSign },
  { id: 'creatives', title: 'Creatives', icon: ImageIcon },
  { id: 'targeting', title: 'Targeting', icon: Target },
  { id: 'payment', title: 'Payment', icon: CreditCard },
  { id: 'review', title: 'Review', icon: FileCheck },
];

const BID_STRATEGY_OPTIONS = [
  { value: 'CPC', label: 'Cost Per Click (CPC)' },
  { value: 'CPM', label: 'Cost Per 1000 Impressions (CPM)' },
  { value: 'CPA', label: 'Cost Per Acquisition (CPA)' },
  { value: 'FIXED_DAILY', label: 'Fixed Daily Budget' },
];

interface FormData {
  name: string;
  description: string;
  budgetTotal: number;
  budgetDaily: number;
  bidStrategy: AdBidStrategy;
  bidAmount: number;
  startDate: string;
  endDate: string;
  targetAllStorefronts: boolean;
  targetStorefrontIds: string[];
  selectedCreativeIds: string[];
  paymentType: AdPaymentType;
}

function StepIndicator({ steps, currentStep }: { steps: typeof STEPS; currentStep: number }) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Mobile: Current step indicator */}
      <div className="sm:hidden text-center mb-4">
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
        <p className="font-semibold text-primary">{steps[currentStep].title}</p>
      </div>

      {/* Mobile: Progress dots */}
      <div className="flex justify-center gap-2 sm:hidden">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              index === currentStep && 'w-6 bg-primary',
              index < currentStep && 'bg-success',
              index > currentStep && 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Desktop: Full step indicator */}
      <div className="hidden sm:flex items-center justify-center">
        {steps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <div key={step.id} className="flex items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all',
                  isActive && 'border-primary bg-primary text-primary-foreground',
                  isCompleted && 'border-success bg-success text-white',
                  !isActive && !isCompleted && 'border-muted-foreground/30 text-muted-foreground'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <StepIcon className="w-5 h-5" />
                )}
              </div>
              <div className="ml-2 mr-4">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isActive && 'text-primary',
                    isCompleted && 'text-success',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-12 h-0.5 mx-2',
                    index < currentStep ? 'bg-success' : 'bg-muted'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailsStep({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaign Details</CardTitle>
        <CardDescription>
          Give your campaign a name and describe its purpose
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Campaign Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Summer Sale 2024"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Choose a descriptive name to easily identify this campaign
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe the campaign objectives and target audience..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetStep({
  formData,
  setFormData,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
          <CardDescription>Set your campaign spending limits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="budgetTotal">Total Budget *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budgetTotal"
                  type="number"
                  placeholder="5000"
                  value={formData.budgetTotal || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetTotal: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum amount to spend over the campaign lifetime
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budgetDaily">Daily Budget</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="budgetDaily"
                  type="number"
                  placeholder="200"
                  value={formData.budgetDaily || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetDaily: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Optional daily spending limit for pacing
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bidStrategy">Bid Strategy *</Label>
              <Select
                value={formData.bidStrategy}
                onChange={(value) =>
                  setFormData({ ...formData, bidStrategy: value as AdBidStrategy })
                }
                options={BID_STRATEGY_OPTIONS}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bidAmount">Bid Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bidAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.50"
                  value={formData.bidAmount || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, bidAmount: parseFloat(e.target.value) || 0 })
                  }
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {formData.bidStrategy === 'CPM' ? 'Cost per 1000 impressions' : 'Cost per action'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Schedule</CardTitle>
          <CardDescription>Set when your campaign should run</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="pl-9"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty for continuous running until budget is exhausted
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CreativesStep({
  formData,
  setFormData,
  creatives,
  loading,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  creatives: AdCreative[];
  loading: boolean;
}) {
  const toggleCreative = (id: string) => {
    const current = formData.selectedCreativeIds;
    if (current.includes(id)) {
      setFormData({
        ...formData,
        selectedCreativeIds: current.filter((c) => c !== id),
      });
    } else {
      setFormData({
        ...formData,
        selectedCreativeIds: [...current, id],
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Creatives</CardTitle>
        <CardDescription>
          Choose the ad creatives to use in this campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : creatives.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No creatives available</p>
            <Button variant="outline" asChild>
              <Link href="/ad-manager/creatives/new">Upload Creative</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creatives.map((creative) => {
              const isSelected = formData.selectedCreativeIds.includes(creative.id);
              return (
                <div
                  key={creative.id}
                  onClick={() => toggleCreative(creative.id)}
                  className={cn(
                    'relative border rounded-lg overflow-hidden cursor-pointer transition-all',
                    isSelected
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {creative.primaryImageUrl ? (
                      <img
                        src={creative.primaryImageUrl}
                        alt={creative.name}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="font-medium truncate">{creative.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {creative.width} x {creative.height}px
                    </p>
                  </div>
                  {isSelected && (
                    <div className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {formData.selectedCreativeIds.length > 0 && (
          <p className="text-sm text-muted-foreground mt-4">
            {formData.selectedCreativeIds.length} creative(s) selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TargetingStep({
  formData,
  setFormData,
  storefronts,
  loading,
}: {
  formData: FormData;
  setFormData: (data: FormData) => void;
  storefronts: { id: string; name: string; slug: string }[];
  loading: boolean;
}) {
  const toggleStorefront = (id: string) => {
    const current = formData.targetStorefrontIds;
    if (current.includes(id)) {
      setFormData({
        ...formData,
        targetStorefrontIds: current.filter((s) => s !== id),
      });
    } else {
      setFormData({
        ...formData,
        targetStorefrontIds: [...current, id],
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Target Storefronts</CardTitle>
        <CardDescription>
          Choose where your ads will be displayed
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="targetAll"
            checked={formData.targetAllStorefronts}
            onCheckedChange={(checked) =>
              setFormData({
                ...formData,
                targetAllStorefronts: checked === true,
                targetStorefrontIds: checked ? [] : formData.targetStorefrontIds,
              })
            }
          />
          <div>
            <Label htmlFor="targetAll" className="font-medium cursor-pointer">
              Target All Storefronts
            </Label>
            <p className="text-sm text-muted-foreground">
              Display ads on all available storefronts
            </p>
          </div>
        </div>

        {!formData.targetAllStorefronts && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4" />
              <span>Select specific storefronts to target</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {storefronts.map((storefront) => {
                  const isSelected = formData.targetStorefrontIds.includes(storefront.id);
                  return (
                    <div
                      key={storefront.id}
                      onClick={() => toggleStorefront(storefront.id)}
                      className={cn(
                        'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-all',
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <div>
                        <p className="font-medium">{storefront.name}</p>
                        <p className="text-sm text-muted-foreground">{storefront.slug}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {formData.targetStorefrontIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {formData.targetStorefrontIds.length} storefront(s) selected
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ReviewStep({
  formData,
  creatives,
  storefronts,
}: {
  formData: FormData;
  creatives: AdCreative[];
  storefronts: { id: string; name: string; slug: string }[];
}) {
  const selectedCreatives = creatives.filter((c) =>
    formData.selectedCreativeIds.includes(c.id)
  );
  const selectedStorefronts = storefronts.filter((s) =>
    formData.targetStorefrontIds.includes(s.id)
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Review Campaign</CardTitle>
          <CardDescription>
            Review your campaign settings before saving
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">DETAILS</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{formData.name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Description</span>
                <span className="font-medium truncate max-w-xs">
                  {formData.description || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">BUDGET & SCHEDULE</h4>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-medium">${formData.budgetTotal.toLocaleString()}</span>
              </div>
              {formData.budgetDaily > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Daily Budget</span>
                  <span className="font-medium">${formData.budgetDaily.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bid Strategy</span>
                <span className="font-medium">{formData.bidStrategy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bid Amount</span>
                <span className="font-medium">${formData.bidAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Schedule</span>
                <span className="font-medium">
                  {formData.startDate} {formData.endDate && `- ${formData.endDate}`}
                </span>
              </div>
            </div>
          </div>

          {/* Creatives */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">CREATIVES</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              {selectedCreatives.length === 0 ? (
                <p className="text-muted-foreground">No creatives selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedCreatives.map((c) => (
                    <Badge key={c.id} variant="secondary">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Targeting */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">TARGETING</h4>
            <div className="bg-muted/50 rounded-lg p-4">
              {formData.targetAllStorefronts ? (
                <Badge variant="default">All Storefronts</Badge>
              ) : selectedStorefronts.length === 0 ? (
                <p className="text-muted-foreground">No storefronts selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedStorefronts.map((s) => (
                    <Badge key={s.id} variant="secondary">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-warning-muted border border-warning/30 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-warning">Campaign will be saved as Draft</p>
          <p className="text-sm text-warning-foreground">
            After saving, you can submit it for approval or launch it directly if you have
            permissions.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { showAlert } = useDialog();
  const { currency } = useTenantCurrency();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [creatives, setCreatives] = useState<AdCreative[]>([]);
  const [storefronts, setStorefronts] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [loadingCreatives, setLoadingCreatives] = useState(true);
  const [loadingStorefronts, setLoadingStorefronts] = useState(true);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    budgetTotal: 0,
    budgetDaily: 0,
    bidStrategy: 'CPC',
    bidAmount: 0,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetAllStorefronts: true,
    targetStorefrontIds: [],
    selectedCreativeIds: [],
    paymentType: 'DIRECT',
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoadingCreatives(true);
        setLoadingStorefronts(true);

        const [creativesRes, storefrontsRes] = await Promise.all([
          adManagerService.getCreatives({ status: 'ACTIVE' }),
          adManagerService.getEligibleStorefronts(),
        ]);

        if (creativesRes.success) {
          setCreatives(creativesRes.data);
        }
        if (storefrontsRes.success) {
          setStorefronts(storefrontsRes.data);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoadingCreatives(false);
        setLoadingStorefronts(false);
      }
    }

    loadData();
  }, []);

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Details
        return formData.name.trim().length > 0;
      case 1: // Budget
        return (
          formData.budgetTotal > 0 &&
          formData.bidAmount > 0 &&
          formData.startDate.length > 0
        );
      case 2: // Creatives
        return true; // Optional
      case 3: // Targeting
        return formData.targetAllStorefronts || formData.targetStorefrontIds.length > 0;
      case 4: // Payment
        return formData.paymentType === 'DIRECT' || formData.paymentType === 'SPONSORED';
      case 5: // Review
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      showAlert({
        title: 'Validation Error',
        message: 'Please fill in all required fields before continuing.',
      });
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const request: CreateAdCampaignRequest = {
        name: formData.name,
        description: formData.description || undefined,
        budgetTotal: formData.budgetTotal,
        budgetDaily: formData.budgetDaily || undefined,
        bidStrategy: formData.bidStrategy,
        bidAmount: formData.bidAmount,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        targetAllStorefronts: formData.targetAllStorefronts,
        targetStorefrontIds: formData.targetAllStorefronts
          ? undefined
          : formData.targetStorefrontIds,
      };

      const response = await adManagerService.createCampaign(request);

      if (response.success) {
        await showAlert({
          title: 'Success',
          message: 'Campaign created successfully!',
        });
        router.push(`/ad-manager/campaigns/${response.data.id}`);
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (err) {
      console.error('Failed to create campaign:', err);
      await showAlert({
        title: 'Error',
        message: 'Failed to create campaign. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGate permission={Permissions.ADS_CAMPAIGNS_MANAGE} fallback="styled">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ad-manager/campaigns">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Back to Campaigns</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Create Campaign</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Set up a new advertising campaign
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-4xl mx-auto">
          {/* Step Indicator */}
          <StepIndicator steps={STEPS} currentStep={currentStep} />

          {/* Step Content */}
          {currentStep === 0 && (
            <DetailsStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 1 && (
            <BudgetStep formData={formData} setFormData={setFormData} />
          )}
          {currentStep === 2 && (
            <CreativesStep
              formData={formData}
              setFormData={setFormData}
              creatives={creatives}
              loading={loadingCreatives}
            />
          )}
          {currentStep === 3 && (
            <TargetingStep
              formData={formData}
              setFormData={setFormData}
              storefronts={storefronts}
              loading={loadingStorefronts}
            />
          )}
          {currentStep === 4 && (
            <PaymentStep
              budgetTotal={formData.budgetTotal}
              startDate={formData.startDate}
              endDate={formData.endDate}
              currency={currency}
              paymentType={formData.paymentType}
              setPaymentType={(type) => setFormData({ ...formData, paymentType: type })}
            />
          )}
          {currentStep === 5 && (
            <ReviewStep
              formData={formData}
              creatives={creatives}
              storefronts={storefronts}
            />
          )}

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 sm:mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
              className="justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="justify-center">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave} disabled={saving} className="justify-center">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
