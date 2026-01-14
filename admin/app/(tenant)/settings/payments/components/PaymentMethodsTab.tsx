'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, Wallet, Clock, Info } from 'lucide-react';
import { Select } from '@/components/Select';
import { paymentsService, GatewayOption, PaymentMethodInfo, GatewayType } from '@/lib/api/payments';

const methodIcons: Record<string, React.ReactNode> = {
  CARD: <CreditCard className="h-5 w-5" />,
  UPI: <Smartphone className="h-5 w-5" />,
  NET_BANKING: <Building2 className="h-5 w-5" />,
  WALLET: <Wallet className="h-5 w-5" />,
  PAY_LATER: <Clock className="h-5 w-5" />,
  BANK_ACCOUNT: <Building2 className="h-5 w-5" />,
  APPLE_PAY: <Smartphone className="h-5 w-5" />,
  GOOGLE_PAY: <Smartphone className="h-5 w-5" />,
  PAYPAL: <Wallet className="h-5 w-5" />,
};

const countryOptions = [
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'CA', label: 'Canada' },
  { value: 'IN', label: 'India' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'SG', label: 'Singapore' },
  { value: 'HK', label: 'Hong Kong' },
];

export function PaymentMethodsTab() {
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [gateways, setGateways] = useState<GatewayOption[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods(selectedCountry);
  }, [selectedCountry]);

  const loadPaymentMethods = async (countryCode: string) => {
    try {
      setLoading(true);
      const [gatewaysData, methodsData] = await Promise.all([
        paymentsService.getAvailableGateways(countryCode),
        paymentsService.getPaymentMethodsByCountry(countryCode),
      ]);
      setGateways(gatewaysData.gateways);
      setPaymentMethods(methodsData.paymentMethods);
    } catch (error) {
      console.error('Failed to load payment methods:', error);
      setGateways([]);
      setPaymentMethods([]);
    } finally {
      setLoading(false);
    }
  };

  const getMethodsByGateway = () => {
    const methodsByGateway: Record<GatewayType, PaymentMethodInfo[]> = {} as any;
    paymentMethods.forEach((method) => {
      if (!methodsByGateway[method.gatewayType]) {
        methodsByGateway[method.gatewayType] = [];
      }
      methodsByGateway[method.gatewayType].push(method);
    });
    return methodsByGateway;
  };

  const methodsByGateway = getMethodsByGateway();

  return (
    <div className="space-y-6">
      {/* Country Selector */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">Available Payment Methods</h3>
            <p className="text-sm text-muted-foreground">
              View payment methods available for customers in each country
            </p>
          </div>
          <div className="w-64">
            <Select
              value={selectedCountry}
              onChange={(value) => setSelectedCountry(value)}
              options={countryOptions}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              Payment methods are automatically determined based on your configured gateways and
              their regional availability. To add more payment methods, configure additional gateways
              in the Payment Gateways tab.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Available Payment Methods Grid */}
          {paymentMethods.length > 0 ? (
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h4 className="text-md font-semibold text-foreground mb-4">
                Payment Methods for {countryOptions.find((c) => c.value === selectedCountry)?.label}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {paymentMethods.map((method) => (
                  <div
                    key={`${method.type}-${method.gatewayType}`}
                    className="border border-border rounded-lg p-4 hover:border-primary/50 hover:bg-primary/10/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-violet-100 rounded-lg flex items-center justify-center text-primary">
                        {methodIcons[method.type] || <CreditCard className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{method.displayName}</p>
                        <p className="text-xs text-muted-foreground">via {method.gatewayType}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Payment Methods Available</h3>
              <p className="text-muted-foreground">
                No payment gateways are configured for {countryOptions.find((c) => c.value === selectedCountry)?.label}.
                Configure a gateway that supports this region to enable payments.
              </p>
            </div>
          )}

          {/* Gateways by Method */}
          {gateways.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
              <h4 className="text-md font-semibold text-foreground mb-4">Active Gateways</h4>
              <div className="space-y-4">
                {gateways.map((gateway) => (
                  <div
                    key={gateway.gatewayType}
                    className="border border-border rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <h5 className="font-semibold text-foreground">{gateway.displayName}</h5>
                        {gateway.isPrimary && (
                          <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                            Primary
                          </span>
                        )}
                        {gateway.isTestMode && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                            Test
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">Priority: {gateway.priority}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {gateway.paymentMethods.map((method) => (
                        <span
                          key={method.type}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-muted text-foreground rounded"
                        >
                          {methodIcons[method.type] && (
                            <span className="w-3 h-3">{methodIcons[method.type]}</span>
                          )}
                          {method.displayName}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
