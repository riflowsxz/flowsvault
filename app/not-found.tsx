'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-6xl font-bold text-gray-800 dark:text-white">404</h1>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Page Not Found</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        <div>
          <Link href="/" passHref>
            <Button size="lg" className="w-full sm:w-auto">
              Go back home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}