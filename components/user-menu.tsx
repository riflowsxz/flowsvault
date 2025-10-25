'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useLanguage } from '@/lib/i18n/context';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { User, LogOut, Camera, UserX, Sun, Moon, Key } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { validateImage } from '@/lib/image-upload';

const ApiKeysModal = lazy(() => import('@/components/ApiKeysModal').then(mod => ({ default: mod.ApiKeysModal })));

export function UserMenu() {
  const { data: session, status, update } = useSession();
  const { t } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApiKeysModal, setShowApiKeysModal] = useState(false);

  const handleSignOut = useCallback(async () => {
    await signOut({ redirect: false });
    window.location.reload();
  }, []);

  const handleUpdatePicture = useCallback(async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        
        if (!file) return;
        
        const validation = validateImage(file);
        if (!validation.isValid) {
          toast.error(validation.error || t('invalidImageFile'));
          return;
        }
        
        try {
          const imageUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          
          const response = await fetch('/api/profile/picture', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image: imageUrl }),
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Profile picture update error response:', errorData);
            throw new Error(`Failed to update profile picture: ${response.status} - ${response.statusText}`);
          }
          
          if (session) {
            await update({ 
              ...session, 
              user: { 
                ...session.user, 
                image: imageUrl 
              } 
            });
            
            toast.success(t('profilePictureUpdated'));
          }
          
          toast.success(t('profilePictureUpdated'));
        } catch (error) {
          console.error('Error updating profile picture:', error);
          toast.error(t('profilePictureFailed'));
        }
      };
      
      input.click();
    } catch (error) {
      console.error('Error handling profile picture update:', error);
      toast.error('Failed to update profile picture');
    }
  }, [session, t, update]);

  const handleDeleteAccountConfirm = useCallback(async () => {
    setShowDeleteDialog(false);
    try {
      const response = await fetch('/api/profile/delete', {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete account');
      }
      
      toast.success(t('accountDeleted'));
      
      await signOut({ 
        redirect: false
      });
      
      document.cookie.split(";").forEach(function(c) { 
        if (c.trim().startsWith("next-auth.")) {
          document.cookie = c.trim().split("=")[0] + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      });
      
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error(t('accountDeleteFailed'));
    }
  }, [t]);

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 lg:h-10 lg:w-10 hover:bg-primary/10 rounded-lg border-primary/20 hover:border-primary/40 p-0 overflow-hidden"
          title={session?.user?.name || session?.user?.email || 'User'}
        >
          {session?.user?.image ? (
            <div className="relative h-full w-full">
              <Image
                src={session.user.image} 
                alt="User profile"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
          ) : (
            <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 lg:h-5 lg:w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 rounded-lg border bg-popover p-2 text-popover-foreground" align="end" forceMount>
        <div className="flex items-center justify-between p-2">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">
              {session?.user?.name || session?.user?.email || 'User'}
            </p>
            <p className="text-xs text-muted-foreground">
              {session?.user?.email || ''}
            </p>
          </div>
        </div>
        <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? (
            <>
              <Sun className="mr-2 h-4 w-4" />
              <span>{t('lightMode')}</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4" />
              <span>{t('darkMode')}</span>
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleUpdatePicture}>
          <Camera className="mr-2 h-4 w-4" />
          <span>{t('changeProfilePicture')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowApiKeysModal(true)}>
          <Key className="mr-2 h-4 w-4" />
          <span>{t('apiKeys')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive focus:text-destructive">
          <UserX className="mr-2 h-4 w-4" />
          <span>{t('deleteAccount')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteAccountConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteAccountConfirmDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="pt-3">
          <AlertDialogCancel className="w-full sm:flex-1 h-9 text-sm">
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccountConfirm}
            className="w-full sm:flex-1 h-9 text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    <Suspense fallback={null}>
      {showApiKeysModal && (
        <ApiKeysModal open={showApiKeysModal} onOpenChange={setShowApiKeysModal} />
      )}
    </Suspense>
    </>
  );
}