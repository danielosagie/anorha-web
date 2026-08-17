'use client';

import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import { ShaderGradient, ShaderGradientCanvas } from '@shadergradient/react';
import Image from 'next/image';
import type { ReactNode } from 'react';

type AuthLayoutProps = {
  readonly children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container relative grid h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
    <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
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
          {/*
            The split itself is deliberately untouched: image left, form right.
            Only the three gradient stops move, from the terracotta ramp
            (#8b4a3a / #db8769 / #dfd5a5) to the K-0 green ramp. They are the
            first thing a new seller sees, and they were the last terracotta
            left in the app. The ramp runs deep to hero green to pale, rather
            than through the board's bright #93C822, which the shader pushes to
            neon across a panel this large. The design is called soft.
          */}
          <ShaderGradient
            control="query"
            urlString="https://shadergradient.co/customize?animate=on&axesHelper=off&brightness=1.4&cAzimuthAngle=180&cDistance=3.6&cPolarAngle=90&cameraZoom=1&color1=%232f4312&color2=%236f9c26&color3=%23cde6a0&destination=onCanvas&embedMode=off&envPreset=city&format=gif&fov=45&frameRate=10&gizmoHelper=hide&grain=on&lightType=3d&pixelDensity=1&positionX=-1.4&positionY=0&positionZ=0&range=disabled&rangeEnd=40&rangeStart=0&reflection=0.1&rotationX=0&rotationY=10&rotationZ=50&shader=defaults&type=plane&uAmplitude=1&uDensity=1.3&uFrequency=5.5&uSpeed=0.3&uStrength=4&uTime=0&wireframe=false"
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
        <span className="font-medium text-lg text-white mix-blend-difference">
          Anorha
        </span>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <ModeToggle />
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
