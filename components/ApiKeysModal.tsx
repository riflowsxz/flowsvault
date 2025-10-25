'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Key, Trash2, Copy, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/context';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  prefix: string;
  createdAt: string;
  lastUsedAt: string | null;
}

interface ApiKeysModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiKeysModal({ open, onOpenChange }: ApiKeysModalProps) {
  const { t } = useLanguage();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [keyToDelete, setKeyToDelete] = useState<ApiKey | null>(null);
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});

  const fetchApiKeys = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/keys', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }

      const data = await response.json();
      setApiKeys(data.data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast.error(t('failedToLoadApiKeys'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (open) {
      fetchApiKeys();
    }
  }, [open, fetchApiKeys]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast.error(t('apiKeyNameRequired'));
      return;
    }

    if (apiKeys.length >= 3) {
      toast.error(t('maxApiKeysReached'), {
        description: t('maxApiKeysReachedDesc'),
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.code === 'MAX_KEYS_REACHED') {
          toast.error(t('maxApiKeysReached'), {
            description: t('maxApiKeysReachedDesc'),
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to create API key');
      }

      const data = await response.json();
      const newKeyId = data.data.id;
      
      // Fetch updated list first
      await fetchApiKeys();
      
      // Show the newly created key immediately
      setVisibleKeys(prev => ({
        ...prev,
        [newKeyId]: true
      }));
      
      // Clear form and close it
      setNewKeyName('');
      setShowCreateForm(false);
      
      toast.success(t('apiKeyCreatedSuccess'));
    } catch (error) {
      console.error('Error creating API key:', error);
      toast.error(error instanceof Error ? error.message : t('failedToCreateApiKey'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (key: ApiKey) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/keys/${key.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(t('failedToRevokeApiKey'));
      }

      await fetchApiKeys();
      setKeyToDelete(null);
      toast.success(t('apiKeyRevokedSuccess'));
    } catch (error) {
      console.error('Error revoking API key:', error);
      toast.error(t('failedToRevokeApiKey'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('copiedToClipboard'));
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedHours = String(hours).padStart(2, '0');
    
    return `${day}/${month}/${year} - ${formattedHours}.${minutes} ${ampm}`;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className="w-[calc(100vw-1.5rem)] max-w-[96vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 max-h-[92vh] sm:max-h-[88vh] md:max-h-[85vh] overflow-y-auto"
        >
          <DialogHeader className="text-center sm:text-center space-y-2">
            <DialogTitle className="flex items-center justify-center gap-2 text-base sm:text-lg md:text-xl font-bold">
              <Key className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('apiKeysManagement')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              {t('apiKeysDescription')}
            </DialogDescription>
            <div className="text-xs sm:text-sm font-medium text-center pt-1">
              <span className={apiKeys.length >= 3 ? 'text-destructive' : 'text-primary'}>
                {apiKeys.length}/3 {t('apiKeyLimit')}
              </span>
            </div>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
            {showCreateForm ? (
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 border rounded-lg sm:rounded-xl bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="keyName" className="text-sm sm:text-base font-semibold">{t('apiKeyName')}</Label>
                  <Input
                    id="keyName"
                    placeholder={t('apiKeyNamePlaceholder')}
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    maxLength={100}
                    disabled={loading}
                    className="text-sm sm:text-base h-10 sm:h-11"
                  />
                </div>
                <div className="flex flex-col gap-2 sm:gap-3">
                  <Button 
                    onClick={handleCreateKey} 
                    disabled={loading || !newKeyName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-5 text-sm sm:text-base font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {t('creating')}
                      </>
                    ) : (
                      t('create')
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewKeyName('');
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-5 text-sm sm:text-base font-semibold"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            ) : null}

            {!showCreateForm && (
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-sm sm:text-base font-semibold px-1">{t('activeApiKeys')}</h3>
                {loading && apiKeys.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">{t('loading')}</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                    {t('noApiKeysYet')}
                  </div>
                ) : (
                <div className="space-y-2">
                  {apiKeys.map((key, index) => (
                    <div
                      key={key.id}
                      className="p-3 border rounded-lg bg-card/50 hover:bg-card"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <p className="font-medium text-sm truncate flex-1">{key.name}</p>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="h-7 w-7 hover:bg-primary/10"
                            title={visibleKeys[key.id] ? 'Hide' : 'Show'}
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(key.key)}
                            className="h-7 w-7 hover:bg-primary/10"
                            title="Copy"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKeyToDelete(key)}
                            disabled={loading}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <code className="block text-xs bg-muted px-2 py-1 rounded font-mono truncate mb-1.5">
                        {visibleKeys[key.id] ? key.key : '•'.repeat(key.key.length)}
                      </code>
                      <div className="flex flex-wrap gap-x-2 text-[10px] text-muted-foreground">
                        <span>{t('createdAt')} {formatDate(key.createdAt)}</span>
                        {key.lastUsedAt && (
                          <span>• {t('lastUsed')} {formatDate(key.lastUsedAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}

            {!showCreateForm && (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center py-5 text-sm sm:text-base font-semibold"
                disabled={loading || apiKeys.length >= 3}
              >
                {apiKeys.length >= 3 ? t('maxApiKeysReached') : t('createNewApiKey')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!keyToDelete} onOpenChange={(isOpen) => !isOpen && setKeyToDelete(null)}>
        <AlertDialogContent 
          className="w-[calc(100vw-1.5rem)] max-w-[96vw] sm:max-w-lg rounded-lg sm:rounded-xl p-4 sm:p-6"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base sm:text-lg break-words">{t('revokeApiKeyTitle')}</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm break-words">
              {t('revokeApiKeyMessage').replace('{name}', keyToDelete?.name || '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 sm:pt-4 flex-col sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel 
              onClick={(e) => {
                e.stopPropagation();
                setKeyToDelete(null);
              }}
              className="w-full sm:flex-1 h-10 sm:h-9 text-xs sm:text-sm m-0"
            >
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.stopPropagation();
                if (keyToDelete) {
                  handleDeleteKey(keyToDelete);
                }
              }}
              className="w-full sm:flex-1 h-10 sm:h-9 text-xs sm:text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('revokeKey')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
