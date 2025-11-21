'use client';

import { ConstructionIcon, ArrowLeftIcon } from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import Link from 'next/link';

export const InConstruction = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center animate-in fade-in zoom-in duration-500">
      <div className="bg-yellow-50 p-6 rounded-full mb-6 border border-yellow-100 shadow-sm">
        <ConstructionIcon className="size-12 text-yellow-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-3">Under Construction</h1>
      <p className="text-gray-600 max-w-md mb-8 text-lg">
        We're currently building something great here. This page will be available soon.
      </p>
      <div className="flex gap-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeftIcon className="mr-2 size-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
};


