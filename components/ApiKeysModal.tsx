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
import { Key, Trash2, Copy, AlertTriangle, Plus, Eye, EyeOff } from 'lucide-react';
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
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null);
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
        throw new Error(errorData.error || 'Failed to create API key');
      }

      const data = await response.json();
      setCreatedKey({ key: data.data.key, name: data.data.name });
      setNewKeyName('');
      setShowCreateForm(false);
      await fetchApiKeys();
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
          className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-xl md:max-w-2xl lg:max-w-3xl rounded-lg sm:rounded-xl p-4 sm:p-6 duration-300 data-[state=closed]:duration-200 animate-in fade-in-80 zoom-in-90 slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-80 data-[state=closed]:slide-out-to-bottom-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto"
        >
          <DialogHeader className="text-center sm:text-center animate-in fade-in-80 slide-in-from-top-2 duration-300">
            <DialogTitle className="flex items-center justify-center gap-2 text-lg sm:text-xl font-semibold">
              <Key className="h-4 w-4 sm:h-5 sm:w-5" />
              {t('apiKeysManagement')}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground px-2 sm:px-0">
              {t('apiKeysDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:gap-4 py-2 sm:py-4">
            {!showCreateForm ? (
              <Button
                onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center justify-center gap-2 py-4 sm:py-5 text-sm sm:text-base animate-in fade-in-75 slide-in-from-bottom-2 duration-300"
                disabled={loading}
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                {t('createNewApiKey')}
              </Button>
            ) : (
              <div className="space-y-3 p-3 sm:p-4 border rounded-lg sm:rounded-xl bg-muted/30 animate-in fade-in-75 slide-in-from-bottom-2 duration-300 animate-duration-500">
                <Label htmlFor="keyName" className="text-sm sm:text-base">{t('apiKeyName')}</Label>
                <Input
                  id="keyName"
                  placeholder={t('apiKeyNamePlaceholder')}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  maxLength={100}
                  disabled={loading}
                  className="text-sm sm:text-base h-9 sm:h-10"
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    onClick={handleCreateKey} 
                    disabled={loading || !newKeyName.trim()}
                    className="w-full flex items-center justify-center gap-2 py-4 sm:py-5 text-sm sm:text-base order-1"
                  >
                    {t('create')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewKeyName('');
                    }}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 sm:py-5 text-sm sm:text-base order-2"
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </div>
            )}

            {!showCreateForm && (
              <div className="space-y-3 sm:space-y-4 animate-in fade-in-75 slide-in-from-bottom-2 duration-300 animate-delay-100">
                <h3 className="text-sm sm:text-base font-semibold px-1">{t('activeApiKeys')}</h3>
                {loading && apiKeys.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">{t('loading')}</div>
                ) : apiKeys.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
                    {t('noApiKeysYet')}
                  </div>
                ) : (
                <div className="space-y-2 sm:space-y-3">
                  {apiKeys.map((key, index) => (
                    <div
                      key={key.id}
                      className="flex flex-col gap-3 p-3 sm:p-4 border rounded-lg sm:rounded-xl bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 animate-in fade-in-75 slide-in-from-bottom-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm sm:text-base truncate">{key.name}</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all w-fit">
                              {visibleKeys[key.id] ? key.key : '••••••••••••••••••••••••••••••'}
                            </code>
                            <span className="text-xs text-muted-foreground">
                              {t('createdAt')} {formatDate(key.createdAt)}
                            </span>
                          </div>
                          {key.lastUsedAt && (
                            <p className="text-xs text-muted-foreground">
                              {t('lastUsed')} {formatDate(key.lastUsedAt)}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-0.5 flex-shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleKeyVisibility(key.id)}
                            className="h-9 w-9 sm:h-8 sm:w-8"
                            title={visibleKeys[key.id] ? 'Hide' : 'Show'}
                          >
                            {visibleKeys[key.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyToClipboard(key.key)}
                            className="h-9 w-9 sm:h-8 sm:w-8"
                            title="Copy"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setKeyToDelete(key)}
                            disabled={loading}
                            className="h-9 w-9 sm:h-8 sm:w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!createdKey} onOpenChange={(isOpen) => !isOpen && setCreatedKey(null)}>
        <AlertDialogContent 
          className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg rounded-lg sm:rounded-xl p-4 sm:p-6"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 flex-shrink-0" />
              <span className="break-words">{t('saveYourApiKey')}</span>
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 sm:space-y-4">
                <div className="text-xs sm:text-sm">
                  {t('apiKeyCreatedMessage')}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">{t('name')}</Label>
                  <div className="text-xs sm:text-sm font-medium break-words">{createdKey?.name}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs sm:text-sm">{t('apiKey')}</Label>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <code className="flex-1 text-[10px] sm:text-xs bg-muted p-2 sm:p-3 rounded font-mono break-all overflow-x-auto">
                      {createdKey?.key}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => createdKey && copyToClipboard(createdKey.key)}
                      className="w-full sm:w-auto h-9 sm:h-8"
                    >
                      <Copy className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-0" />
                      <span className="sm:hidden ml-2">Copy</span>
                    </Button>
                  </div>
                </div>
                <div className="p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                  <div className="text-[10px] sm:text-xs text-amber-900 dark:text-amber-200">
                    <strong>{t('securityWarning')}:</strong> {t('securityWarningMessage')}
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-3 sm:pt-4">
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                setCreatedKey(null);
              }}
              className="w-full h-10 sm:h-9 text-xs sm:text-sm animate-in fade-in-0 slide-in-from-bottom-3 duration-400 ease-out"
            >
              {t('iHaveSavedMyKey')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!keyToDelete} onOpenChange={(isOpen) => !isOpen && setKeyToDelete(null)}>
        <AlertDialogContent 
          className="w-[calc(100vw-2rem)] max-w-[95vw] sm:max-w-lg rounded-lg sm:rounded-xl p-4 sm:p-6"
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
              className="w-full sm:flex-1 h-10 sm:h-9 text-xs sm:text-sm m-0 animate-in fade-in-0 slide-in-from-bottom-3 duration-400 delay-75 ease-out"
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
              className="w-full sm:flex-1 h-10 sm:h-9 text-xs sm:text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors animate-in fade-in-0 slide-in-from-bottom-3 duration-400 delay-150 ease-out"
            >
              {t('revokeKey')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
