import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ParametersService {

  pomodoroTime = signal(25 * 60);
  shortBreakTime = signal(5 * 60);
  longBreakTime = signal(15 * 60);
  pomodoros = signal(4);

  constructor() {}

  // Method to update a time setting dynamically
  updateTimeSetting(index: number, newValue: number): void {
    switch (index) {
      case 0:
        this.pomodoroTime.set(newValue * 60);
        break;
      case 1:
        this.shortBreakTime.set(newValue * 60);
        break;
      case 2:
        this.longBreakTime.set(newValue * 60);
        break;
    }
  }

  // Method to update the pomodoro count
  updatePomodoros(newValue: number): void {
    this.pomodoros.set(newValue);
  }

  resetParams(): void {
    this.pomodoroTime.set(25 * 60);
    this.shortBreakTime.set(5 * 60);
    this.longBreakTime.set(15 * 60);
    this.pomodoros.set(4);
  }
}
