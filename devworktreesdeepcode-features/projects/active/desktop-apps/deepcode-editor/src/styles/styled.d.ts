import 'styled-components';
import { VibeTheme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme extends VibeTheme {
    // Add theme properties that are accessed directly from components
    background: string;
    text: string;
    border: string;
    primary: string;
    error: string;
    surface: string;
    textSecondary: string;
    fontFamily: string;
    success: string;
    // Add missing properties that components expect
    hover: string;
    accent: string;
    input: string;
    info: string;
  }
}