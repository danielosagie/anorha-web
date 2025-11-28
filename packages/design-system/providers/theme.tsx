import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemeProvider } from 'next-themes';

export const ThemeProvider = ({
  children,
  ...properties
}: ThemeProviderProps) => (
  <NextThemeProvider
    attribute="class"
    defaultTheme="light" //Change back to system for light them back
    enableSystem={false}
    disableTransitionOnChange
    {...properties}
  >
    {children}
  </NextThemeProvider>
);
