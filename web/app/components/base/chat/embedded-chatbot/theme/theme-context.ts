import { createContext, useContext } from 'use-context-selector'
import { hexToRGBA } from './utils'

export class Theme {
  public chatColorTheme: string | null
  public chatColorThemeInverted: boolean

  public primaryColor = '#22D3EE'
  public backgroundHeaderColorStyle = 'background: linear-gradient(135deg, rgba(10, 14, 28, 0.92) 0%, rgba(30, 27, 75, 0.9) 45%, rgba(15, 118, 110, 0.86) 100%)'
  public headerBorderBottomStyle = 'borderBottom: 1px solid rgba(255, 255, 255, 0.12)'
  public colorFontOnHeaderStyle = 'color: #E5E7EB'
  public colorPathOnHeader = 'text-text-primary-on-surface'
  public backgroundButtonDefaultColorStyle = 'background: linear-gradient(135deg, #1D4ED8 0%, #0EA5E9 100%); color: #FFFFFF;'
  public roundedBackgroundColorStyle = 'backgroundColor: rgba(148, 163, 184, 0.12)'
  public chatBubbleColorStyle = 'background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 27, 75, 0.86) 100%); border: 1px solid rgba(34, 211, 238, 0.16)'

  constructor(chatColorTheme: string | null = null, chatColorThemeInverted = false) {
    this.chatColorTheme = chatColorTheme
    this.chatColorThemeInverted = chatColorThemeInverted
    this.configCustomColor()
    this.configInvertedColor()
  }

  private configCustomColor() {
    if (this.chatColorTheme !== null && this.chatColorTheme !== '') {
      this.primaryColor = this.chatColorTheme ?? '#1C64F2'
      this.backgroundHeaderColorStyle = `background: linear-gradient(135deg, ${hexToRGBA(this.primaryColor, 0.85)} 0%, ${hexToRGBA(this.primaryColor, 0.55)} 100%); backdropFilter: blur(16px)`
      this.backgroundButtonDefaultColorStyle = `background: linear-gradient(135deg, ${hexToRGBA(this.primaryColor, 0.95)} 0%, ${hexToRGBA(this.primaryColor, 0.75)} 100%); color: #FFFFFF;`
      this.roundedBackgroundColorStyle = `backgroundColor: ${hexToRGBA(this.primaryColor, 0.08)}`
      this.chatBubbleColorStyle = `background: linear-gradient(135deg, ${hexToRGBA(this.primaryColor, 0.22)} 0%, ${hexToRGBA(this.primaryColor, 0.12)} 100%); border: 1px solid ${hexToRGBA(this.primaryColor, 0.2)}`
    }
  }

  private configInvertedColor() {
    if (this.chatColorThemeInverted) {
      this.backgroundHeaderColorStyle = 'backgroundColor: #ffffff'
      this.colorFontOnHeaderStyle = `color: ${this.primaryColor}`
      this.headerBorderBottomStyle = 'borderBottom: 1px solid #ccc'
      this.colorPathOnHeader = this.primaryColor
    }
  }
}

export class ThemeBuilder {
  private _theme?: Theme
  private buildChecker = false

  public get theme() {
    if (this._theme === undefined) {
      this._theme = new Theme()
      return this._theme
    }
    else {
      return this._theme
    }
  }

  public buildTheme(chatColorTheme: string | null = null, chatColorThemeInverted = false) {
    if (!this.buildChecker) {
      this._theme = new Theme(chatColorTheme, chatColorThemeInverted)
      this.buildChecker = true
    }
    else {
      if (this.theme?.chatColorTheme !== chatColorTheme || this.theme?.chatColorThemeInverted !== chatColorThemeInverted) {
        this._theme = new Theme(chatColorTheme, chatColorThemeInverted)
        this.buildChecker = true
      }
    }
  }
}

const ThemeContext = createContext<ThemeBuilder>(new ThemeBuilder())
export const useThemeContext = () => useContext(ThemeContext)
