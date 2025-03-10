import { Component, HostListener, inject, OnInit, signal } from '@angular/core';
import { ParametersService } from '../parameters.service';

@Component({
  selector: 'app-settings',
  imports: [],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {

  private parametersService = inject(ParametersService);
  
  settingsOpen = false;
  pomodoros = this.parametersService.pomodoros;
  darkMode = this.parametersService.darkMode;

  readonly DEFAULT_BASE_H = 344;
  readonly DEFAULT_BASE_S = 93;
  readonly DEFAULT_BASE_L = 59;

  backgroundColor = signal(this.getCssVariable('--white-01'));
  accentColor = signal(localStorage.getItem('themeColor') || this.getComputedHex());

  options = [
    // { label: 'Background', cssVar: '--white-01', color: this.backgroundColor },
    { label: 'Color Theme', cssVar: '--accent-01', color: this.accentColor },
  ];

  timeOptions = [
    { label: 'Pomodoro', value: this.parametersService.pomodoroTime },
    { label: 'Short Break', value: this.parametersService.shortBreakTime },
    { label: 'Long Break', value: this.parametersService.longBreakTime },
  ];

  @HostListener('document:pointerdown')
  onDocumentPointerDown(): void {
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  ngOnInit(): void {
    const savedColor = localStorage.getItem('themeColor');
  
    if (savedColor) {
      this.accentColor.set(savedColor); // Update signal
      this.applyColor(savedColor); // Apply to CSS variables
    }

    this.applyDarkModeStyles();
  }

  applyColor(color: string): void {
    const hsl = this.hexToHSL(color);
  
    document.documentElement.style.setProperty('--base-h', hsl.h.toString());
    document.documentElement.style.setProperty('--base-s', `${hsl.s}%`);
    document.documentElement.style.setProperty('--base-l', `${hsl.l}%`);
  }

  toggleSettings() {
    this.settingsOpen = !this.settingsOpen;
  }

  toggleDarkMode() {
    this.parametersService.toggleDarkMode();
    this.applyDarkModeStyles();
  }

  applyDarkModeStyles() {
    if (this.darkMode()) {
      document.documentElement.style.setProperty('--black-01', '#FCFCFD');
      document.documentElement.style.setProperty('--white-01', '#1E1E20');
    } else {
      document.documentElement.style.setProperty('--black-01', '#1E1E20');
      document.documentElement.style.setProperty('--white-01', '#FCFCFD');
    }
  }

  updateColor(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newColor = input.value;
  
    // Convert Hex to HSL
    const hsl = this.hexToHSL(newColor);
    
    // Update the CSS variables
    document.documentElement.style.setProperty('--base-h', hsl.h.toString());
    document.documentElement.style.setProperty('--base-s', `${hsl.s}%`);
    document.documentElement.style.setProperty('--base-l', `${hsl.l}%`);
  
    // Update the signal (if necessary)
    this.options[index].color.set(newColor);

    localStorage.setItem('themeColor', newColor);
  }  
  
  getCssVariable(variable: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#ffffff';
  }

  updateTime(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value);
    this.parametersService.updateTimeSetting(index, numericValue);
  }

  updatePomodoros(event: Event): void {
    const input = event.target as HTMLInputElement;
    const numericValue = Number(input.value);
    this.parametersService.updatePomodoros(numericValue);
  }

  validateNumber(event: KeyboardEvent): void {
    // Allow if the key converts to a number (digits 0-9)
    if (!isNaN(Number(event.key))) {
      return;
    }

    // Allow control keys (most of them have names longer than 1 character)
    if (event.key.length > 1) {
      return;
    }

    // Otherwise, prevent the input
    event.preventDefault();
  }

  closeMenu() {
    this.settingsOpen = false;
  }

  getComputedHex(): string {
    const h = parseFloat(this.getCssVariable('--base-h')) || this.DEFAULT_BASE_H ;
    const s = parseFloat(this.getCssVariable('--base-s')) || this.DEFAULT_BASE_S ;
    const l = parseFloat(this.getCssVariable('--base-l')) || this.DEFAULT_BASE_L ;
  
    return this.hslToHex(h, s, l);
  }  
  

  hexToHSL(hex: string): { h: number; s: number; l: number } {
    let r = 0, g = 0, b = 0;
    
    // Convert hex to RGB
    if (hex.startsWith("#")) {
      hex = hex.substring(1);
    }
    if (hex.length === 3) {
      hex = hex.split("").map(char => char + char).join("");
    }
  
    r = parseInt(hex.substring(0, 2), 16) / 255;
    g = parseInt(hex.substring(2, 4), 16) / 255;
    b = parseInt(hex.substring(4, 6), 16) / 255;
  
    // Convert RGB to HSL
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
  
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else if (max === b) h = (r - g) / d + 4;
  
      h *= 60;
    }
  
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  hslToHex(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
  
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255)
        .toString(16)
        .padStart(2, '0');
  
    return `#${f(0)}${f(8)}${f(4)}`;
  }  

  resetToDefault() {
    this.parametersService.resetParams();
    this.applyDarkModeStyles();

    localStorage.removeItem('themeColor');
    document.documentElement.style.setProperty('--base-h', this.DEFAULT_BASE_H.toString());
    document.documentElement.style.setProperty('--base-s', `${this.DEFAULT_BASE_S}%`);
    document.documentElement.style.setProperty('--base-l', `${this.DEFAULT_BASE_L}%`);
    const defaultColor = this.hslToHex(this.DEFAULT_BASE_H, this.DEFAULT_BASE_S, this.DEFAULT_BASE_L);
    this.accentColor.set(defaultColor);
  }
}
