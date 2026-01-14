'use client';

import React from 'react';
import { Layout, RotateCcw, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDashboardLayoutContext } from '@/contexts/DashboardLayoutContext';
import { AdminUIText, AdminPageTitle } from '@/components/translation/AdminTranslatedText';

export function DashboardToolbar() {
  const { isEditMode, setEditMode, resetLayout, isSaving } = useDashboardLayoutContext();

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground"><AdminPageTitle text="Dashboard" as="span" /></h1>
        {isEditMode && (
          <p className="text-sm text-muted-foreground mt-1">
            <AdminUIText text="Drag widgets to reorder them. Changes are saved automatically." />
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {isSaving && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span><AdminUIText text="Saving..." /></span>
          </div>
        )}

        {isEditMode && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetLayout}
            className="text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            <AdminUIText text="Reset" />
          </Button>
        )}

        <Button
          variant={isEditMode ? "default" : "outline"}
          size="sm"
          onClick={() => setEditMode(!isEditMode)}
          className={isEditMode ? 'bg-primary hover:bg-primary' : ''}
        >
          {isEditMode ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              <AdminUIText text="Done" />
            </>
          ) : (
            <>
              <Layout className="h-4 w-4 mr-2" />
              <AdminUIText text="Customize" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
