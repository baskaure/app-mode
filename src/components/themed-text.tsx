import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, Police, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'titreCarte' | 'eyebrow' | 'small' | 'smallBold' | 'link' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? (type === 'eyebrow' ? 'textSecondary' : 'text')] },
        styles[type],
        type === 'link' && { color: theme.text },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: { fontFamily: Police.normal, fontSize: 16, lineHeight: 24 },
  title: { fontFamily: Police.gras, fontSize: 36, lineHeight: 40, letterSpacing: -1.2 },
  subtitle: { fontFamily: Police.gras, fontSize: 30, lineHeight: 35, letterSpacing: -0.9 },
  titreCarte: { fontFamily: Police.demiGras, fontSize: 19, lineHeight: 25, letterSpacing: -0.3 },
  eyebrow: { fontFamily: Police.demiGras, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, textTransform: 'uppercase' },
  small: { fontFamily: Police.normal, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: Police.demiGras, fontSize: 14, lineHeight: 20 },
  link: { fontFamily: Police.moyen, fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' },
  code: { fontFamily: Fonts.mono, fontSize: 12 },
});
