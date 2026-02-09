'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, Plus, Folder, ChevronRight, Trash2, Loader2, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useNavPath, useTenant } from '@/context/TenantContext';
import { useListsStore, List } from '@/store/lists';
import { useAuthStore } from '@/store/auth';

export default function ListsPage() {
  const getNavPath = useNavPath();
  const { tenant } = useTenant();
  const { customer, accessToken, isAuthenticated } = useAuthStore();
  const { lists, isLoading, fetchLists, createList, deleteList } = useListsStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isAuthenticated && tenant && customer) {
      fetchLists(tenant.id, tenant.storefrontId, customer.id, accessToken || '');
    }
  }, [isAuthenticated, tenant, customer?.id, accessToken, fetchLists]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !tenant || !customer || !accessToken) return;

    setIsCreating(true);
    try {
      await createList(
        tenant.id,
        tenant.storefrontId,
        customer.id,
        accessToken,
        newListName.trim(),
        newListDescription.trim() || undefined
      );
      setNewListName('');
      setNewListDescription('');
      setIsCreateOpen(false);
    } catch (error) {
      console.error('Failed to create list:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!tenant || !customer || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteList(tenant.id, tenant.storefrontId, customer.id, accessToken, listId);
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to delete list:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
            <Heart className="h-10 w-10 text-tenant-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Sign in to view your lists</h3>
          <p className="text-muted-foreground mb-4">
            Create and manage wishlists, gift lists, and more.
          </p>
          <Button asChild className="btn-tenant-primary">
            <Link href={getNavPath('/auth/login')}>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-tenant-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold">My Lists</h2>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="btn-tenant-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create New List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New List</DialogTitle>
                <DialogDescription>
                  Create a new list to organize your favorite products.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    List Name *
                  </label>
                  <Input
                    id="name"
                    placeholder="e.g., Christmas Ideas, Birthday Gifts"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Description (optional)
                  </label>
                  <Input
                    id="description"
                    placeholder="Add a description..."
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="btn-tenant-primary"
                  onClick={handleCreateList}
                  disabled={!newListName.trim() || isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create List'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {lists.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--tenant-primary)]/10 flex items-center justify-center">
              <Folder className="h-10 w-10 text-tenant-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first list to start organizing products you love.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {lists.map((list, index) => (
                <motion.div
                  key={list.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={getNavPath(`/account/lists/${list.slug}`)}
                    className="group flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-[var(--tenant-primary)]/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[var(--tenant-primary)]/10 flex items-center justify-center group-hover:bg-[var(--tenant-primary)]/20 transition-colors">
                        {list.isDefault ? (
                          <Heart className="h-6 w-6 text-tenant-primary" />
                        ) : (
                          <Folder className="h-6 w-6 text-tenant-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold flex items-center gap-2">
                          {list.name}
                          {list.isDefault && (
                            <span className="text-xs bg-[var(--tenant-primary)]/10 text-tenant-primary px-2 py-0.5 rounded-full">
                              Default
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                          {list.description && ` • ${list.description}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!list.isDefault && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setDeleteConfirmId(list.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-tenant-primary transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this list? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDeleteList(deleteConfirmId)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete List'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
