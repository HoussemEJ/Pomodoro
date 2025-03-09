import {
  Component,
  signal,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  HostListener,
  OnInit,
} from '@angular/core';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragPlaceholder,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { AutofocusDirective } from './autofocus.directive';

interface Task {
  text: string;
  completed: boolean;
}

@Component({
  selector: 'app-notepad',
  imports: [
    CommonModule,
    CdkDropList,
    CdkDrag,
    AutofocusDirective,
    CdkDragPlaceholder,
  ],
  templateUrl: './notepad.component.html',
  styleUrl: './notepad.component.scss',
})
export class NotepadComponent implements OnInit {
  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  tasks = signal<Task[]>([]);
  newTask = signal('');
  editingTask = signal<Task | null>(null); // Track the task being edited
  editedText = signal('');
  activeNoteMenu: Task | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Load tasks from localStorage if available
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
      this.tasks.set(JSON.parse(savedTasks));
    }
  }

  private updateLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks()));
  }

  updateTask(event: Event) {
    const target = event.target as HTMLInputElement;
    this.newTask.set(target.value);
  }

  addTask(event: Event) {
    const keyboardEvent = event as KeyboardEvent;
    if (this.newTask().trim() !== '') {
      this.tasks.update((tasks) => [
        ...tasks,
        { text: this.newTask().trim(), completed: false },
      ]);
      this.newTask.set(''); // Clear input after adding the task
      this.updateLocalStorage();
      keyboardEvent.preventDefault(); // Prevent accidental form submission
    }
  }

  drop(event: CdkDragDrop<Task[]>) {
    const tasksCopy = [...this.tasks()];
    moveItemInArray(tasksCopy, event.previousIndex, event.currentIndex);
    this.tasks.set(tasksCopy);
    this.updateLocalStorage();
  }

  toggleTask(task: Task): void {
    task.completed = !task.completed;
    this.tasks.update((tasks) => [...tasks]);
    this.updateLocalStorage();
  }

  deleteTask(task: Task): void {
    this.activeNoteMenu = null;
    this.tasks.update((tasks) => tasks.filter((t) => t !== task));
    this.updateLocalStorage();
  }

  startEditing(task: Task): void {
    this.activeNoteMenu = null;
    this.editingTask.set(task);
    this.editedText.set(task.text);

    this.cdr.detectChanges();

    if (this.editInput && this.editInput.nativeElement) {
      this.editInput.nativeElement.focus();
    }
  }

  updateEditedText(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.editedText.set(target.value);
  }

  finishEditing(task: Task, event?: Event): void {
    if (event) {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'Enter') {
        keyboardEvent.preventDefault();
      }
    }
    if (this.editedText().trim() !== '') {
      task.text = this.editedText().trim();
      this.tasks.update((tasks) => [...tasks]);
      this.updateLocalStorage();
    }
    this.editingTask.set(null);
  }

  toggleNoteMenu(task: Task, event: Event) {
    event.stopPropagation();
    this.activeNoteMenu = this.activeNoteMenu === task ? null : task;
  }

  // Listen for clicks on the document and hide the active note menu if click is outside
  @HostListener('document:pointerdown', ['$event'])
  onDocumentPointerDown(event: PointerEvent): void {
    const targetElement = event.target as HTMLElement;
    // Check if the click happened inside the note menu or on the ellipsis icon
    if (
      !targetElement.closest('.noteMenu') &&
      !targetElement.closest('.fa-ellipsis')
    ) {
      this.activeNoteMenu = null;
    }
  }

  // Prevent clicks inside the note menu from closing it
  stopPropagation(event: Event) {
    event.stopPropagation();
  }
}
