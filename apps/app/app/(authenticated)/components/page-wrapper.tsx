'use client';

import { ReactNode } from 'react';
import { Header } from '../components/header'

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;

}

export function PageWrapper({ children, title, description }: PageWrapperProps) {
  return (
    <div 
      className="flex flex-col border-2 border-[#AFAFAF] rounded-lg w-full p-2 min-h-0 min-h-[98vh]"
      style={{ backgroundColor: '#FFFCF5' }}
    >
    <Header page={title || ''} />
      <div 
        className="flex flex-col flex-1 bg-white rounded-lg border-2 p-4 md:p-6 lg:p-8 overflow-auto "
 
      >
        {title && (
          <div className="mb-4 md:mb-6 flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            {description && (
              <p className="text-gray-600 text-sm md:text-base mt-1 md:mt-2">{description}</p>
            )}
          </div>
        )}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

