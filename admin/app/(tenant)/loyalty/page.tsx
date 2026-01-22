'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Award, Gift, TrendingUp, Users, Plus, Trash2, Save, RefreshCw, Loader2, AlertCircle, Crown, Medal, Star, Sparkles, ChevronUp, Cake, UserPlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { PermissionGate, Permission } from '@/components/permission-gate';
import { cn } from '@/lib/utils';
import { useDialog } from '@/contexts/DialogContext';
import { apiClient } from '@/lib/api/client';
import type { LoyaltyProgram, LoyaltyTier } from '@/lib/api/types';

// API Response wrapper type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string };
}

type TabType = 'settings' | 'tiers' | 'bonuses';

const DEFAULT_TIERS: LoyaltyTier[] = [
  {
    name: 'Bronze',
    minimumPoints: 0,
    discountPercent: 0,
    benefits: 'Earn 1 point per dollar',
  },
  {
    name: 'Silver',
    minimumPoints: 1000,
    discountPercent: 5,
    benefits: '5% discount + Earn 1 point per dollar',
  },
  {
    name: 'Gold',
    minimumPoints: 5000,
    discountPercent: 10,
    benefits: '10% discount + Earn 1 point per dollar + Exclusive offers',
  },
];

export default function LoyaltyProgramPage() {
  const { showAlert, showConfirm } = useDialog();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [programExists, setProgramExists] = useState(false);

  const [formData, setFormData] = useState({
    name: 'Rewards Program',
    description: 'Earn points on every purchase and redeem for rewards',
    pointsPerDollar: 1,
    minimumRedemption: 100,
    pointsExpiration: 365,
    isActive: true,
    signupBonus: 100,
    birthdayBonus: 50,
    referralBonus: 200,
    tiers: DEFAULT_TIERS,
  });

  // Fetch existing program
  const fetchProgram = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get<ApiResponse<LoyaltyProgram>>('/loyalty/program');

      if (response.success && response.data) {
        const program = response.data;
        setProgramExists(true);
        setFormData({
          name: program.name || 'Rewards Program',
          description: program.description || '',
          pointsPerDollar: program.pointsPerDollar || 1,
          minimumRedemption: program.minimumRedemption || 100,
          pointsExpiration: program.pointsExpiration || 365,
          isActive: program.isActive ?? true,
          signupBonus: program.signupBonus || 0,
          birthdayBonus: program.birthdayBonus || 0,
          referralBonus: program.referralBonus || 0,
          tiers: program.tiers?.length > 0 ? program.tiers : DEFAULT_TIERS,
        });
      } else {
        setProgramExists(false);
      }
    } catch (err) {
      console.error('Failed to fetch loyalty program:', err);
      // If program doesn't exist, that's ok - use defaults
      setProgramExists(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const handleAddTier = () => {
    setFormData({
      ...formData,
      tiers: [
        ...formData.tiers,
        {
          name: '',
          minimumPoints: 0,
          discountPercent: 0,
          benefits: '',
        },
      ],
    });
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = formData.tiers.filter((_, i) => i !== index);
    setFormData({ ...formData, tiers: newTiers });
  };

  const handleTierChange = (index: number, field: keyof LoyaltyTier, value: string | number) => {
    const newTiers = [...formData.tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setFormData({ ...formData, tiers: newTiers });
  };

  const getTierStyle = (tierName: string, index: number) => {
    const lowerName = tierName.toLowerCase();
    if (lowerName.includes('platinum') || lowerName.includes('diamond')) {
      return {
        bg: 'bg-primary/5',
        border: 'border-border',
        text: 'text-foreground',
        icon: Crown,
        iconBg: 'bg-primary',
        badge: 'bg-muted-foreground',
      };
    }
    if (lowerName.includes('gold')) {
      return {
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        text: 'text-warning',
        icon: Crown,
        iconBg: 'bg-warning',
        badge: 'bg-warning',
      };
    }
    if (lowerName.includes('silver')) {
      return {
        bg: 'bg-muted',
        border: 'border-border',
        text: 'text-muted-foreground',
        icon: Medal,
        iconBg: 'bg-muted-foreground',
        badge: 'bg-muted-foreground',
      };
    }
    if (lowerName.includes('bronze')) {
      return {
        bg: 'bg-warning/10',
        border: 'border-warning/30',
        text: 'text-warning',
        icon: Star,
        iconBg: 'bg-warning',
        badge: 'bg-warning',
      };
    }
    // Default based on index
    const defaults = [
      { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: Star, iconBg: 'bg-warning', badge: 'bg-warning' },
      { bg: 'bg-muted', border: 'border-border', text: 'text-muted-foreground', icon: Medal, iconBg: 'bg-muted-foreground', badge: 'bg-muted-foreground' },
      { bg: 'bg-warning/10', border: 'border-warning/30', text: 'text-warning', icon: Crown, iconBg: 'bg-warning', badge: 'bg-warning' },
      { bg: 'bg-primary/5', border: 'border-border', text: 'text-foreground', icon: Crown, iconBg: 'bg-primary', badge: 'bg-muted-foreground' },
    ];
    return defaults[index % defaults.length];
  };

  const handleSave = async () => {
    // Validate
    if (!formData.name.trim()) {
      await showAlert({ title: 'Error', message: 'Please enter a program name.' });
      return;
    }

    // Validate tiers
    for (let i = 0; i < formData.tiers.length; i++) {
      if (!formData.tiers[i].name.trim()) {
        await showAlert({ title: 'Error', message: `Please enter a name for Tier ${i + 1}.` });
        return;
      }
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        name: formData.name,
        description: formData.description,
        pointsPerDollar: formData.pointsPerDollar,
        minimumRedemption: formData.minimumRedemption,
        pointsExpiration: formData.pointsExpiration,
        isActive: formData.isActive,
        signupBonus: formData.signupBonus,
        birthdayBonus: formData.birthdayBonus,
        referralBonus: formData.referralBonus,
        tiers: formData.tiers,
      };

      const response = programExists
        ? await apiClient.put<ApiResponse<LoyaltyProgram>>('/loyalty/program', payload)
        : await apiClient.post<ApiResponse<LoyaltyProgram>>('/loyalty/program', payload);

      if (response.success) {
        setProgramExists(true);
        await showAlert({ title: 'Success', message: 'Loyalty program saved successfully!' });
      } else {
        throw new Error(response.error?.message || 'Failed to save loyalty program');
      }
    } catch (err) {
      console.error('Failed to save loyalty program:', err);
      await showAlert({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to save loyalty program. Please try again.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading loyalty program...</span>
        </div>
      </div>
    );
  }

  return (
    <PermissionGate
      permission={Permission.MARKETING_LOYALTY_VIEW}
      fallback="styled"
      fallbackTitle="Loyalty Program Access Required"
      fallbackDescription="You don't have the required permissions to manage the loyalty program. Please contact your administrator to request access."
      loading={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}
    >
    <div className="min-h-screen bg-background">
      <div className="space-y-6 animate-in fade-in duration-500">
        <PageHeader
          title="Loyalty Program"
          description="Configure your customer loyalty and rewards program"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Marketing' },
            { label: 'Loyalty Program' },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchProgram} disabled={saving}>
                <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Program
                  </>
                )}
              </Button>
            </div>
          }
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-destructive">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchProgram} className="ml-auto">
              Retry
            </Button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Program Status</p>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Award className="h-6 w-6 text-success" />
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border',
                formData.isActive
                  ? 'bg-success-muted text-success-foreground border-success/30'
                  : 'bg-muted text-foreground border-border'
              )}
            >
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Points per Dollar</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formData.pointsPerDollar}x
            </p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Signup Bonus</p>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Gift className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="text-3xl font-bold text-primary">
              {formData.signupBonus}
            </p>
            <p className="text-xs text-muted-foreground mt-2">points</p>
          </div>

          <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-muted-foreground">Loyalty Tiers</p>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-warning" />
              </div>
            </div>
            <p className="text-3xl font-bold text-warning">
              {formData.tiers.length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-card rounded-lg border border-border shadow-sm">
          <div className="border-b border-border">
            <nav className="flex">
              <Button
                variant="ghost"
                onClick={() => setActiveTab('settings')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 rounded-none transition-colors',
                  activeTab === 'settings'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                General Settings
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('tiers')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 rounded-none transition-colors',
                  activeTab === 'tiers'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Loyalty Tiers
              </Button>
              <Button
                variant="ghost"
                onClick={() => setActiveTab('bonuses')}
                className={cn(
                  'flex-1 py-4 px-6 text-sm font-semibold border-b-2 rounded-none transition-colors',
                  activeTab === 'bonuses'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Bonuses
              </Button>
            </nav>
          </div>

          {/* General Settings Tab */}
          {activeTab === 'settings' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-4">Program Details</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Program Status</p>
                      <p className="text-sm text-muted-foreground">Enable or disable the loyalty program</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Program Name
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Rewards Program"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                      placeholder="Earn points on every purchase..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Points per Dollar Spent
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={formData.pointsPerDollar}
                        onChange={(e) =>
                          setFormData({ ...formData, pointsPerDollar: parseFloat(e.target.value) || 0 })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        How many points customers earn per dollar
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Minimum Points to Redeem
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={formData.minimumRedemption}
                        onChange={(e) =>
                          setFormData({ ...formData, minimumRedemption: parseInt(e.target.value) || 0 })
                        }
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Minimum balance required for redemption
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Points Expiry (Days)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.pointsExpiration}
                      onChange={(e) =>
                        setFormData({ ...formData, pointsExpiration: parseInt(e.target.value) || 0 })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Number of days before points expire (0 = never)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loyalty Tiers Tab */}
          {activeTab === 'tiers' && (
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Loyalty Tiers</h3>
                  <p className="text-sm text-muted-foreground">
                    Create tiers to reward your most loyal customers
                  </p>
                </div>
                <Button onClick={handleAddTier} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tier
                </Button>
              </div>

              {formData.tiers.map((tier, index) => {
                const tierStyle = getTierStyle(tier.name, index);
                const TierIcon = tierStyle.icon;

                return (
                <div key={index} className={cn(
                  "rounded-xl border-2 p-6 transition-all hover:shadow-lg",
                  tierStyle.bg,
                  tierStyle.border
                )}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md",
                        tierStyle.iconBg
                      )}>
                        <TierIcon className="h-6 w-6" />
                      </div>
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm",
                          tierStyle.badge
                        )}>
                          <ChevronUp className="h-3 w-3" />
                          Tier {index + 1}
                        </span>
                        {tier.name && (
                          <p className={cn("text-lg font-bold mt-1", tierStyle.text)}>
                            {tier.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {formData.tiers.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTier(index)}
                        className="hover:bg-destructive/10 hover:text-destructive bg-white/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-white/60 rounded-lg">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{tier.minimumPoints.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Points Required</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{tier.discountPercent}%</p>
                      <p className="text-xs text-muted-foreground">Discount</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-white/40 p-4 rounded-lg">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tier Name
                      </label>
                      <Input
                        value={tier.name}
                        onChange={(e) => handleTierChange(index, 'name', e.target.value)}
                        placeholder="e.g., Gold"
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Minimum Points Required
                      </label>
                      <Input
                        type="number"
                        min="0"
                        value={tier.minimumPoints}
                        onChange={(e) =>
                          handleTierChange(index, 'minimumPoints', parseInt(e.target.value) || 0)
                        }
                        className="bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Discount Percentage
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={tier.discountPercent}
                        onChange={(e) =>
                          handleTierChange(index, 'discountPercent', parseFloat(e.target.value) || 0)
                        }
                        className="bg-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Benefits Description
                      </label>
                      <textarea
                        value={tier.benefits}
                        onChange={(e) => handleTierChange(index, 'benefits', e.target.value)}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-white"
                        placeholder="Describe the benefits of this tier..."
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
                );
              })}

              {formData.tiers.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No tiers configured. Add your first tier to get started.</p>
                </div>
              )}
            </div>
          )}

          {/* Bonuses Tab */}
          {activeTab === 'bonuses' && (
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Bonus Points</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Configure bonus point rewards for special events
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Signup Bonus Card */}
                  <div className="p-5 rounded-xl border-2 border-success/30 bg-success/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-success flex items-center justify-center text-white shadow-md">
                        <UserPlus className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Signup Bonus</p>
                        <p className="text-xs text-muted-foreground">New member reward</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={formData.signupBonus}
                        onChange={(e) =>
                          setFormData({ ...formData, signupBonus: parseInt(e.target.value) || 0 })
                        }
                        className="text-lg font-bold text-center bg-white pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        points
                      </span>
                    </div>
                  </div>

                  {/* Birthday Bonus Card */}
                  <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                        <Cake className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Birthday Bonus</p>
                        <p className="text-xs text-muted-foreground">Annual birthday gift</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={formData.birthdayBonus}
                        onChange={(e) =>
                          setFormData({ ...formData, birthdayBonus: parseInt(e.target.value) || 0 })
                        }
                        className="text-lg font-bold text-center bg-white pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        points
                      </span>
                    </div>
                  </div>

                  {/* Referral Bonus Card */}
                  <div className="p-5 rounded-xl border-2 border-primary/30 bg-primary/5 hover:shadow-lg transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
                        <Share2 className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">Referral Bonus</p>
                        <p className="text-xs text-muted-foreground">Friend referral reward</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        value={formData.referralBonus}
                        onChange={(e) =>
                          setFormData({ ...formData, referralBonus: parseInt(e.target.value) || 0 })
                        }
                        className="text-lg font-bold text-center bg-white pr-16"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                        points
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Card */}
              <div className="bg-primary/5 rounded-lg border border-primary/30 p-6">
                <h4 className="text-lg font-bold text-foreground mb-4">Program Preview</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Sign up and get:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                      {formData.signupBonus} points
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Earn on every purchase:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                      {formData.pointsPerDollar} point per $1
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Birthday reward:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                      {formData.birthdayBonus} points
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-foreground">Refer a friend:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30">
                      {formData.referralBonus} points
                    </span>
                  </div>
                  {formData.pointsExpiration > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Points expire in:</span>
                      <span className="text-sm font-semibold text-foreground">
                        {formData.pointsExpiration} days
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </PermissionGate>
  );
}
