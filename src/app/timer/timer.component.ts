import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, signal, computed, inject, effect } from '@angular/core';
import { ParametersService } from '../parameters.service';

enum Mode {
  pomodoro,
  shortbreak,
  longbreak,
}

@Component({
  selector: 'app-timer',
  imports: [CommonModule],
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.scss'],
})
export class TimerComponent implements OnInit, OnDestroy {

  private parametersService = inject(ParametersService);
  
  // Timer durations (in seconds)
  pomodoroTime = this.parametersService.pomodoroTime;
  shortBreakTime = this.parametersService.shortBreakTime;
  longBreakTime = this.parametersService.longBreakTime;
  pomodoros = this.parametersService.pomodoros;

  timerValue = signal(this.pomodoroTime());
  
  play: boolean = false;
  private intervalId: any = null;

  targetEndTime = signal<number | null>(null);
  pomodoroCount: number = 0;
  mode: Mode = Mode.pomodoro;
  Mode = Mode;

  initialStartTime: number | null = null;
  startAngle: number = 0;

  pausedIntervalId: any = null;
  lastPausedUpdate: number | null = null;

  timeString = computed(() => {
    const minutes = Math.floor(this.timerValue() / 60);
    const seconds = this.timerValue() % 60;
    return (
      minutes.toString().padStart(2, '0') +
      ':' +
      seconds.toString().padStart(2, '0')
    );
  });

  // Analog clock hand degrees
  hourDegrees = signal(0);
  minuteDegrees = signal(0);
  secondDegrees = signal(0);
  private clockIntervalId: any = null;

  readonly updateTimerEffect = effect(() => {
    const pomodoro = this.pomodoroTime();
    const shortBreak = this.shortBreakTime();
    const longBreak = this.longBreakTime();
    
    if (!this.play) {
      this.setModeTime();
    }
  });

  // Clock numbers: 0 => "12", 1 => "1", ... 11 => "11"
  numbers: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  ngOnInit() {
    // Restore saved timer if present
    const storedTarget = localStorage.getItem('targetEndTime');
    if (storedTarget) {
      this.targetEndTime.set(Number(storedTarget));
      const target = this.targetEndTime();
      const remainingSeconds =
        target !== null
          ? Math.max(0, Math.ceil((target - Date.now()) / 1000))
          : 0;
      if (remainingSeconds > 0) {
        this.timerValue.set(remainingSeconds);
        this.play = true;
        this.start();
      } else {
        localStorage.removeItem('targetEndTime');
      }
    }

    this.updateClockHands();

    // Update the analog clock every second
    this.clockIntervalId = setInterval(() => this.updateClockHands(), 1000);

    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  ngOnDestroy() {
    this.pause();
    clearInterval(this.clockIntervalId);
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  updateClockHands() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours() % 12;
    this.secondDegrees.set(seconds * 6); // 360°/60
    this.minuteDegrees.set(minutes * 6 + seconds * 0.1);
    this.hourDegrees.set(hours * 30 + minutes * 0.5);
  }

  updateTimer() {
    if (this.targetEndTime() !== null) {
      const target = this.targetEndTime();
      const remainingSeconds =
        target !== null
          ? Math.max(0, Math.ceil((target - Date.now()) / 1000))
          : 0;
      this.timerValue.set(remainingSeconds);
      if (remainingSeconds <= 0) {
        this.pause();
        localStorage.removeItem('targetEndTime');
        this.handleTimerEnd();
      }
    }
  }

  start() {
    if (!this.intervalId) {
      if (this.targetEndTime() === null) {
        this.initialStartTime = Date.now();
        const startDate = new Date(this.initialStartTime);
        // Calculate the starting angle (in degrees) based on the current minute and second.
        this.startAngle =
          startDate.getMinutes() * 6 + startDate.getSeconds() * 0.1;
        // When (re)starting, set targetEndTime relative to the current timerValue.
        const newTarget = Date.now() + this.timerValue() * 1000;
        this.targetEndTime.set(newTarget);
        localStorage.setItem('targetEndTime', newTarget.toString());
      }
      this.updateTimer();
      this.intervalId = setInterval(() => this.updateTimer(), 250);
      this.play = true;
    }
  }

  pause() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    localStorage.removeItem('targetEndTime');
    this.targetEndTime.set(null);
  }

  reset() {
    this.pause();
    if (this.pausedIntervalId) {
      clearInterval(this.pausedIntervalId);
      this.pausedIntervalId = null;
      this.lastPausedUpdate = null;
    }
    this.play = false;
    this.pomodoroCount = 0;
    this.mode = Mode.pomodoro;
    localStorage.removeItem('targetEndTime');
    this.targetEndTime.set(null);
    this.initialStartTime = null;
    this.setModeTime();
  }

  fastForward() {
    this.pause();
    this.timerValue.set(0);
    this.play = false;
    localStorage.removeItem('targetEndTime');
    this.targetEndTime.set(null);
    this.handleTimerEnd();
  }

  togglePlayPause() {
    if (!this.play) {
      // If the timer hasn't started at all, initialize it.
      if (this.targetEndTime() === null) {
        this.start();
        return;
      }
      // Resuming from pause: clear the paused updater and restart the normal timer.
      if (this.pausedIntervalId) {
        clearInterval(this.pausedIntervalId);
        this.pausedIntervalId = null;
        this.lastPausedUpdate = null;
      }
      this.play = true;
      if (!this.intervalId) {
        this.intervalId = setInterval(() => this.updateTimer(), 250);
      }
    } else {
      // Pausing: start an interval that continuously extends targetEndTime in real time.
      this.lastPausedUpdate = Date.now();
      if (!this.pausedIntervalId) {
        this.pausedIntervalId = setInterval(() => {
          const now = Date.now();
          const delta = now - (this.lastPausedUpdate ?? now);
          const currentTarget = this.targetEndTime();
          if (currentTarget !== null) {
            const newTarget = currentTarget + delta;
            this.targetEndTime.set(newTarget);
            localStorage.setItem('targetEndTime', newTarget.toString());
          }
          this.lastPausedUpdate = now;
        }, 250);
      }
      this.play = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    }
  }

  handleTimerEnd() {
    this.play = false;
    if (this.mode === Mode.pomodoro) {
      this.pomodoroCount++;
      this.mode =
        this.pomodoroCount % this.pomodoros() === 0 ? Mode.longbreak : Mode.shortbreak;
    } else {
      this.mode = Mode.pomodoro;
    }
    this.initialStartTime = null;
    this.setModeTime();
  }

  setModeTime() {
    switch (this.mode) {
      case Mode.pomodoro:
        this.timerValue.set(this.pomodoroTime());
        break;
      case Mode.shortbreak:
        this.timerValue.set(this.shortBreakTime());
        break;
      case Mode.longbreak:
        this.timerValue.set(this.longBreakTime());
        break;
    }
  }

  handleVisibilityChange = () => {
    if (
      document.visibilityState === 'visible' &&
      this.targetEndTime() !== null
    ) {
      this.updateTimer();
    }
  };

  /**
   * Positions each number around the exact same pivot the clock arms use:
   *   left: 50%, bottom: 50%, transform-origin: bottom center.
   * We offset the angle so that 0 => "12" is at the top.
   *
   * If the numbers are a bit off, try adjusting `radius` (e.g. 106, 110, 112).
   */
  getNumberStyle(n: number): { [key: string]: string } {
    // n=0 => "12" => angle= (0*30) => 0 => then offset by +90? or -90?
    // We'll do angle= 90 - n*30 => 0 => 90 => top, 3 => 0 => right, 6 => -90 => bottom, 9 => -180 => left.
    const angle = n * 30;
    const radius = 108;
    return {
      bottom: '50%',
      right: '50%',
      transform: `translate(50%, 50%) rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`,
    };
  }

  // getPieSlice(): string {
  //   if (!this.initialStartTime || this.targetEndTime() === null) return 'none';
  //   // Total scheduled duration in seconds (from the very first start to the current target end).
  //   const totalDurationSec = (this.targetEndTime - this.initialStartTime) / 1000;
  //   // Each second is 0.1° on a 60-minute (3600 sec) full circle.
  //   const sliceAngle = totalDurationSec * 0.1;
  //   return `conic-gradient(from ${this.startAngle}deg, var(--accent-01) 0deg, var(--accent-02) ${sliceAngle}deg, transparent ${sliceAngle}deg, transparent 360deg)`;
  // }

  pieSlice = computed(() => {
    const target = this.targetEndTime();
    // Use minuteDegrees as a reactive dependency representing the current clock position.
    const currentAngle = this.minuteDegrees();
    if (!target) return 'none';
    const remainingSeconds = Math.max(0, (target - Date.now()) / 1000);
    // For a 60-min circle, each second equals 0.1°
    const sliceAngle = remainingSeconds * 0.1;
    return `conic-gradient(from ${currentAngle}deg, var(--accent-02) 0deg, var(--accent-03) ${sliceAngle}deg, transparent ${sliceAngle}deg, transparent 360deg)`;
  });
}
