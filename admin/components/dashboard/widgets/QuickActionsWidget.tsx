'use client';

import React from 'react';
import { Package, Users, ShoppingCart, Star, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardDescription,
  DashboardCardContent,
} from './shared';
import { AdminUIText } from '@/components/translation/AdminTranslatedText';
import { useAdminTranslatedText } from '@/hooks/useAdminTranslatedText';

export function QuickActionsWidget() {
  // Translated labels
  const { translatedText: addProductLabel } = useAdminTranslatedText('Add Product');
  const { translatedText: addProductDesc } = useAdminTranslatedText('Create new product');
  const { translatedText: manageStaffLabel } = useAdminTranslatedText('Manage Staff');
  const { translatedText: manageStaffDesc } = useAdminTranslatedText('User management');
  const { translatedText: viewOrdersLabel } = useAdminTranslatedText('View Orders');
  const { translatedText: viewOrdersDesc } = useAdminTranslatedText('Order management');
  const { translatedText: reviewsLabel } = useAdminTranslatedText('Reviews');
  const { translatedText: reviewsDesc } = useAdminTranslatedText('Customer feedback');

  const actions = [
    {
      icon: Package,
      label: addProductLabel,
      description: addProductDesc,
      color: "blue",
      href: "/products"
    },
    {
      icon: Users,
      label: manageStaffLabel,
      description: manageStaffDesc,
      color: "emerald",
      href: "/staff"
    },
    {
      icon: ShoppingCart,
      label: viewOrdersLabel,
      description: viewOrdersDesc,
      color: "violet",
      href: "/orders"
    },
    {
      icon: Star,
      label: reviewsLabel,
      description: reviewsDesc,
      color: "amber",
      href: "/reviews"
    }
  ];

  return (
    <DashboardCard className="border-border bg-white/80 backdrop-blur">
      <DashboardCardHeader className="pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <DashboardCardTitle className="text-xl"><AdminUIText text="Quick Actions" /></DashboardCardTitle>
            <DashboardCardDescription><AdminUIText text="Streamline your daily admin tasks" /></DashboardCardDescription>
          </div>
        </div>
      </DashboardCardHeader>
      <DashboardCardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Link href={action.href} key={index} className="block w-full">
                <Button
                  variant="ghost"
                  className={`w-full h-full group p-6 text-center border border-border rounded-xl hover:border-${action.color}-300 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white`}
                >
                  <div className="flex flex-col items-center">
                    <div className={`mb-4 p-3 rounded-xl bg-${action.color}-100 group-hover:scale-110 transition-transform duration-300 w-fit`}>
                      <Icon className={`h-6 w-6 text-${action.color}-600`} />
                    </div>
                    <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {action.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {action.description}
                    </div>
                  </div>
                </Button>
              </Link>
            );
          })}
        </div>
      </DashboardCardContent>
    </DashboardCard>
  );
}
