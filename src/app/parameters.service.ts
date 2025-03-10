import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParametersService {

  readonly PT = 25;
  readonly SBT = 5;
  readonly LBT = 15;
  readonly PS = 4;

  pomodoroTime = signal(this.getStoredValue('pomodoroTime', this.PT * 60));
  shortBreakTime = signal(this.getStoredValue('shortBreakTime', this.SBT * 60));
  longBreakTime = signal(this.getStoredValue('longBreakTime', this.LBT * 60));
  pomodoros = signal(this.getStoredValue('pomodoros', this.PS));
  
  darkMode = signal(this.getStoredValue('darkMode', false));

  constructor() {}

  private getStoredValue<T>(key: string, defaultValue: T): T {
    const stored = localStorage.getItem(key);
    if (stored === null) return defaultValue;
    return (typeof defaultValue === 'boolean') ? (stored === 'true') as T : parseInt(stored, 10) as T;
  }

  private saveToStorage(key: string, value: any): void {
    localStorage.setItem(key, value.toString());
  }

  toggleDarkMode(): void {
    this.darkMode.set(!this.darkMode());
    this.saveToStorage('darkMode', this.darkMode());
  }

  // Method to update a time setting dynamically
  updateTimeSetting(index: number, newValue: number): void {
    const timeInSeconds = newValue * 60;
    switch (index) {
      case 0:
        this.pomodoroTime.set(timeInSeconds);
        this.saveToStorage('pomodoroTime', timeInSeconds);
        break;
      case 1:
        this.shortBreakTime.set(timeInSeconds);
        this.saveToStorage('shortBreakTime', timeInSeconds);
        break;
      case 2:
        this.longBreakTime.set(timeInSeconds);
        this.saveToStorage('longBreakTime', timeInSeconds);
        break;
    }
  }

  // Method to update the pomodoro count
  updatePomodoros(newValue: number): void {
    this.pomodoros.set(newValue);
    this.saveToStorage('pomodoros', newValue);
  }

  resetParams(): void {
    this.pomodoroTime.set(this.PT * 60);
    this.shortBreakTime.set(this.SBT * 60);
    this.longBreakTime.set(this.LBT * 60);
    this.pomodoros.set(this.PS);

    this.saveToStorage('pomodoroTime', this.PT * 60);
    this.saveToStorage('shortBreakTime', this.SBT * 60);
    this.saveToStorage('longBreakTime', this.LBT * 60);
    this.saveToStorage('pomodoros', this.PS);

    this.darkMode.set(false);
    this.saveToStorage('darkMode', false);
  }
}
