import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

import { createVuetify } from 'vuetify'

// LinkBox brand palette (mirrors lib/core/constants/colors.dart -> MyColors)
const brandColors = {
  green: '#0DADA8',
  blue: '#43ACC5',
  red: '#F47874',
  warning: '#FEA736',
  tgreen: '#00925A',
  tpurple: '#6322CB',
  text1: '#202C33',
  text2: '#384753',
  text3: '#6A7788',
  text4: '#818686',
  bgwhite: '#FFFFFF',
  bggreen: '#F2FFFE',
  bgblue: '#F2FAFC',
  conborder: '#EEF2F3',
  greyText: '#333333',
}

const lightTheme = {
  dark: false,
  colors: {
    background: brandColors.bgwhite,
    surface: brandColors.bgwhite,
    'surface-bright': brandColors.bggreen,
    'surface-light': brandColors.conborder,
    primary: brandColors.green,
    secondary: brandColors.blue,
    error: brandColors.red,
    warning: brandColors.warning,
    success: brandColors.tgreen,
    info: brandColors.blue,
    'on-background': brandColors.text1,
    'on-surface': brandColors.text1,
    outline: brandColors.conborder,
    // brand accents (usable as color="brand-blue", text-brand-blue, bg-brand-blue, etc.)
    'brand-blue': brandColors.blue,
    'brand-purple': brandColors.tpurple,
    'brand-orange': brandColors.warning,
    'text-secondary': brandColors.text2,
    'text-tertiary': brandColors.text3,
  },
}

const darkTheme = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#1E1E1E',
    'surface-bright': '#2A2A2A',
    'surface-light': '#2A2A2A',
    primary: brandColors.green,
    secondary: brandColors.blue,
    error: brandColors.red,
    warning: brandColors.warning,
    success: brandColors.tgreen,
    info: brandColors.blue,
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
    outline: brandColors.greyText,
    'brand-blue': brandColors.blue,
    'brand-purple': brandColors.tpurple,
    'brand-orange': brandColors.warning,
    'text-secondary': '#C7CDD1',
    'text-tertiary': '#9CA7AF',
  },
}

const storedTheme = typeof localStorage !== 'undefined'
  ? localStorage.getItem('themeMode')
  : null

export default createVuetify({
  theme: {
    defaultTheme: storedTheme === 'dark' ? 'dark' : 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  defaults: {
    VCard: {
      rounded: 'lg',
      elevation: 0,
      border: true,
    },
    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; letter-spacing: normal; font-weight: 600;',
    },
    VTextField: {
      rounded: 'lg',
      variant: 'outlined',
      density: 'comfortable',
    },
    VSelect: {
      rounded: 'lg',
      variant: 'outlined',
      density: 'comfortable',
    },
    VAutocomplete: {
      rounded: 'lg',
      variant: 'outlined',
      density: 'comfortable',
    },
    VChip: {
      rounded: 'lg',
    },
    VSheet: {
      rounded: 'lg',
    },
    VAlert: {
      rounded: 'lg',
    },
    VTextarea: {
      rounded: 'lg',
      variant: 'outlined',
      density: 'comfortable',
    },
  },
  icons: {
    defaultSet: 'mdi',
  },
})
