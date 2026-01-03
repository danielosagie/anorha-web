'use client';

import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import type { ReactNode } from 'react';
import Image from 'next/image';
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

type AuthLayoutProps = {
  readonly children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container relative grid h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
    <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
      {/* Shader Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        <ShaderGradientCanvas
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        >
          <ShaderGradient
            control="query"
            urlString="https://www.shadergradient.co/customize?animate=on&axesHelper=off&bgColor1=%23000000&bgColor2=%23000000&brightness=1.2&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%23647653&color2=%23F4F4F5&color3=%234b5d14&embedMode=off&envPreset=city&fov=45&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=2.6&positionX=0&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=0&rotationZ=0&shader=defaults&type=plane&uDensity=1.3&uFrequency=5.5&uSpeed=0.2&uStrength=4&uTime=0&wireframe=false&zoomOut=false"
          />
        </ShaderGradientCanvas>
      </div>

      {/* Logo */}
      <div className="relative z-20 flex items-center gap-3">
        <Image
          src={require('@/app/assets/anorha_logo.png')}
          alt="Anorha Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        <span className="font-medium text-white text-lg mix-blend-difference">Anorha</span>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
      </div>

      <div className="relative z-20 mt-auto">
        <blockquote className="space-y-2">
          <p className="text-lg text-white mix-blend-difference">
            &ldquo;We cut our listing time in half and I can just focus on selling. Anorha does all the hard work.&rdquo;
          </p>
          <footer className="text-sm text-white/80 mix-blend-difference">Sofia Davis — Boutique Owner, LA</footer>
        </blockquote>
      </div>
    </div>
    <div className="lg:p-8">
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center space-y-6">
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
