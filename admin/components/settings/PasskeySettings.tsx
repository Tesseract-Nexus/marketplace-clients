'use client';

import React, { useState, useEffect } from 'react';
import {
  Fingerprint,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
  X,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  isPasskeySupported,
  registerPasskey,
  getPasskeys,
  renamePasskey,
  deletePasskey,
  type PasskeyInfo,
} from '@/lib/auth/auth-client';

export function PasskeySettings() {
  const [passkeys, setPasskeys] = useState<PasskeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState('');

  // Add passkey state
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setIsSupported(isPasskeySupported());
    loadPasskeys();
  }, []);

  const loadPasskeys = async () => {
    setIsLoading(true);
    try {
      const result = await getPasskeys();
      if (result.success) {
        setPasskeys(result.passkeys);
      }
    } catch {
      // Silently handle
    }
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;

    setError('');
    setIsAdding(true);
    try {
      const result = await registerPasskey(newName.trim());
      if (result.success) {
        setShowNameInput(false);
        setNewName('');
        await loadPasskeys();
      } else {
        if (result.error !== 'CANCELLED') {
          setError(result.message || 'Failed to register passkey.');
        }
      }
    } catch {
      setError('Failed to register passkey.');
    }
    setIsAdding(false);
  };

  const handleRename = async (credentialId: string) => {
    if (!renameValue.trim()) return;

    setError('');
    try {
      const result = await renamePasskey(credentialId, renameValue.trim());
      if (result.success) {
        setPasskeys(prev =>
          prev.map(p =>
            p.credential_id === credentialId ? { ...p, name: renameValue.trim() } : p
          )
        );
        setRenamingId(null);
        setRenameValue('');
      } else {
        setError(result.message || 'Failed to rename passkey.');
      }
    } catch {
      setError('Failed to rename passkey.');
    }
  };

  const handleDelete = async (credentialId: string) => {
    setError('');
    setDeletingId(credentialId);
    try {
      const result = await deletePasskey(credentialId);
      if (result.success) {
        setPasskeys(prev => prev.filter(p => p.credential_id !== credentialId));
      } else {
        setError(result.message || 'Failed to delete passkey.');
      }
    } catch {
      setError('Failed to delete passkey.');
    }
    setDeletingId(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading passkey settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Fingerprint className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">Passkeys</h3>
          <p className="text-sm text-muted-foreground">Sign in with biometrics or security keys</p>
        </div>
      </div>

      {!isSupported && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 border border-warning/30 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>Your browser does not support passkeys. Try using a modern browser like Chrome, Safari, or Edge.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 text-sm text-error bg-error-muted border border-error/30 rounded-lg px-3 py-2 mb-4">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Passkey list */}
      <div className="space-y-3 mb-4">
        {passkeys.length === 0 ? (
          <div className="text-center py-8 px-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-semibold text-foreground mb-1">No passkeys yet</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Sign in faster and more securely with biometrics or security keys
            </p>
            {isSupported && !showNameInput && (
              <Button
                onClick={() => setShowNameInput(true)}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Passkey
              </Button>
            )}
          </div>
        ) : (
          passkeys.map((passkey) => (
            <div
              key={passkey.credential_id}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Fingerprint className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {renamingId === passkey.credential_id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="h-7 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRename(passkey.credential_id);
                          if (e.key === 'Escape') { setRenamingId(null); setRenameValue(''); }
                        }}
                      />
                      <button
                        onClick={() => handleRename(passkey.credential_id)}
                        className="text-success hover:text-success/80"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => { setRenamingId(null); setRenameValue(''); }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground truncate">{passkey.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(passkey.created_at)}
                        {passkey.last_used_at && ` \u00b7 Last used ${formatDate(passkey.last_used_at)}`}
                      </p>
                    </>
                  )}
                </div>
              </div>
              {renamingId !== passkey.credential_id && (
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => {
                      setRenamingId(passkey.credential_id);
                      setRenameValue(passkey.name);
                    }}
                    className="p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                    title="Rename"
                    aria-label={`Rename passkey ${passkey.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete passkey "${passkey.name}"?\n\nYou won't be able to use this passkey to sign in anymore.`)) {
                        handleDelete(passkey.credential_id);
                      }
                    }}
                    disabled={deletingId === passkey.credential_id}
                    className="p-1.5 rounded-md hover:bg-error-muted text-muted-foreground hover:text-error transition-colors disabled:opacity-50"
                    title="Delete"
                    aria-label={`Delete passkey ${passkey.name}`}
                  >
                    {deletingId === passkey.credential_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add passkey */}
      {isSupported && (passkeys.length > 0 || showNameInput) && (
        <>
          {showNameInput ? (
            <div className="flex gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., My MacBook, iPhone"
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                  if (e.key === 'Escape') { setShowNameInput(false); setNewName(''); }
                }}
                disabled={isAdding}
              />
              <Button onClick={handleAdd} disabled={isAdding || !newName.trim()}>
                {isAdding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Register'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowNameInput(false); setNewName(''); }}
                disabled={isAdding}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowNameInput(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add a passkey
            </Button>
          )}
        </>
      )}
    </div>
  );
}
