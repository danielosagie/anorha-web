declare module '@shadergradient/react' {
  import * as React from 'react';

  export interface ShaderGradientProps {
    control?: 'query' | 'props';
    urlString?: string;
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export const ShaderGradient: React.ComponentType<ShaderGradientProps>;
  
  export interface ShaderGradientCanvasProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }
  
  export const ShaderGradientCanvas: React.ComponentType<ShaderGradientCanvasProps>;
}
