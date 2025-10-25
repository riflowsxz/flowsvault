'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub } from 'react-icons/fa';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

export function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  const handleGoogleLogin = async () => {
    try {
      const result = await signIn('google', { 
        redirect: false,
        callbackUrl: '/' 
      });
      
      if (result?.ok) {
        onClose();
        onLoginSuccess?.();
      }
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      const result = await signIn('github', { 
        redirect: false,
        callbackUrl: '/' 
      });
      
      if (result?.ok) {
        onClose();
        onLoginSuccess?.();
      }
    } catch (error) {
      console.error('GitHub login error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="sm:max-w-md w-[95vw] max-w-sm rounded-xl p-6 duration-300 data-[state=closed]:duration-200 animate-in fade-in-80 zoom-in-90 slide-in-from-bottom-4 data-[state=closed]:animate-out data-[state=closed]:fade-out-50 data-[state=closed]:zoom-out-80 data-[state=closed]:slide-out-to-bottom-4"
        aria-describedby="login-modal-description"
      >
        <DialogHeader className="text-center animate-in fade-in-80 slide-in-from-top-2 duration-300">
          <DialogTitle className="text-xl font-semibold">Sign in to your account</DialogTitle>
          <DialogDescription id="login-modal-description" className="text-sm text-muted-foreground">
            Choose a provider to sign in or register
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          <Button
            variant="outline"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-5 animate-in fade-in-75 slide-in-from-bottom-2 duration-300 animate-duration-500"
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with google
          </Button>
          <Button
            variant="outline"
            onClick={handleGitHubLogin}
            className="w-full flex items-center justify-center gap-2 py-5 animate-in fade-in-75 slide-in-from-bottom-2 duration-300 animate-duration-500 animate-delay-100"
          >
            <FaGithub className="h-5 w-5" />
            Sign in with github
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}