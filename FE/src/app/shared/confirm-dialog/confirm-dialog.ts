import {
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';


@Component({
  selector: 'app-confirm-dialog',

  standalone: true,

  imports: [
    FormsModule,
  ],

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
     OPTIONAL TEXT INPUT
  ===================================================== */

  @Input()
  showInput =
    false;


  @Input()
  inputLabel =
    'Name';


  @Input()
  inputPlaceholder =
    'Enter a name';


  @Input()
  inputValue =
    '';


  @Input()
  inputError =
    '';


  @Input()
  inputMaxLength =
    120;


  @Output()
  inputValueChange =
    new EventEmitter<string>();


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
     INPUT
  ===================================================== */

  onInputChange(
    value: string,
  ): void {

    this.inputValue =
      value;


    this.inputValueChange.emit(
      value,
    );

  }


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
    event: MouseEvent,
  ): void {

    if (
      event.target ===
      event.currentTarget
    ) {

      this.cancel();

    }

  }

}