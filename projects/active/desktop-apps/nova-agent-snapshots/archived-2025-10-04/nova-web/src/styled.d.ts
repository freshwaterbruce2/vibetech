import 'styled-components';

declare module 'styled-components' {
  export interface DefaultTheme {
    primary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  }
}