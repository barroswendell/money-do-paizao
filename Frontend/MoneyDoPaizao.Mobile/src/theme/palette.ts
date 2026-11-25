import type { AppearanceSettings } from '../services/api';

export const DEFAULT_APPEARANCE: AppearanceSettings = {
  useCustomTheme: false,
  primaryColor: '#071629',
  secondaryColor: '#D4A64A',
  isDarkMode: false,
};

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value.trim());

function rgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function luminance(color: string) {
  const [red, green, blue] = rgb(color).map((channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrast(first: string, second: string) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function readableOn(background: string) {
  return contrast('#FFFFFF', background) >= contrast('#000000', background) ? '#FFFFFF' : '#000000';
}

function mix(color: string, target: string, amount: number) {
  const targetChannels = rgb(target);
  const channels = rgb(color).map((channel, index) => (
    Math.round(channel + (targetChannels[index] - channel) * amount).toString(16).padStart(2, '0')
  ));
  return `#${channels.join('')}`;
}

function ensureContrast(color: string, background: string, minimum: number) {
  const target = readableOn(background);
  for (let step = 0; step < 20; step += 1) {
    const candidate = mix(color, target, step / 20);
    if (contrast(candidate, background) >= minimum) return candidate;
  }
  return target;
}

export function buildColors(appearance: AppearanceSettings) {
  const dark = appearance.isDarkMode;
  const surface = dark ? '#162231' : '#FFFFFF';
  const input = dark ? '#111C2A' : '#FFFFFF';
  const basePrimary = appearance.useCustomTheme && isHexColor(appearance.primaryColor)
    ? appearance.primaryColor.trim() : DEFAULT_APPEARANCE.primaryColor;
  const secondary = appearance.useCustomTheme && isHexColor(appearance.secondaryColor)
    ? appearance.secondaryColor.trim() : DEFAULT_APPEARANCE.secondaryColor;
  const primaryTone = dark && basePrimary.toUpperCase() === DEFAULT_APPEARANCE.primaryColor ? '#4A73B8' : basePrimary;
  const primary = ensureContrast(primaryTone, surface, 3);
  const selected = mix(surface, secondary, dark ? 0.16 : 0.14);

  return {
    background: dark ? '#0D1622' : '#F4F7F7',
    surface,
    input,
    foreground: dark ? '#F1F5F9' : '#071629',
    muted: dark ? '#AFBBC9' : '#526173',
    border: dark ? '#334457' : '#DAE2E7',
    fieldBorder: dark ? '#63768D' : '#8191A3',
    primary,
    primaryForeground: readableOn(primary),
    link: ensureContrast(primaryTone, surface, 5),
    secondary,
    secondaryForeground: readableOn(secondary),
    selected,
    selectedForeground: ensureContrast(secondary, selected, 5),
    focus: ensureContrast(secondary, input, 3),
    success: dark ? '#7ADCB3' : '#176A4F',
    destructive: dark ? '#FFA7A3' : '#A12828',
  };
}

export function colorVariables(colors: ReturnType<typeof buildColors>) {
  return Object.fromEntries(Object.entries(colors).flatMap(([name, hex]) => {
    const key = `--color-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
    const [red, green, blue] = rgb(hex);
    return [[`${key}-r`, red], [`${key}-g`, green], [`${key}-b`, blue]];
  }));
}
