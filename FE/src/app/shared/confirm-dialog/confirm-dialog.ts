import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';


@Component({
  selector: 'app-confirm-dialog',

  standalone: true,

  imports: [],

  templateUrl:
    './confirm-dialog.html',

  styleUrl:
    './confirm-dialog.css',
})
export class ConfirmDialog {


  /* =====================================================
     CONTENT
  ===================================================== */

  @Input()
  title =
    'Are you sure?';


  @Input()
  message =
    'This action cannot be undone.';


  @Input()
  confirmText =
    'Confirm';


  @Input()
  cancelText =
    'Cancel';


  @Input()
  icon =
    '🗑️';


  /* =====================================================
     EVENTS
  ===================================================== */

  @Output()
  confirmed =
    new EventEmitter<void>();


  @Output()
  cancelled =
    new EventEmitter<void>();


  /* =====================================================
     CONFIRM
  ===================================================== */

  confirm(): void {

    this.confirmed.emit();

  }


  /* =====================================================
     CANCEL
  ===================================================== */

  cancel(): void {

    this.cancelled.emit();

  }


  /* =====================================================
     BACKDROP
  ===================================================== */

  onBackdropClick(
    event:
      MouseEvent,
  ): void {

    if (
      event.target ===
      event.currentTarget
    ) {

      this.cancel();

    }

  }

}