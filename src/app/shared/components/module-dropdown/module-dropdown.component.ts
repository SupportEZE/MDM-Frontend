import { Component, Inject, Input } from '@angular/core';
import { SharedModule } from '../../shared.module';
import { CommonModule } from '@angular/common';
import { ToastrServices } from '../../services/toastr.service ';
import { ApiService } from '../../../core/services/api/api.service';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import { FormsModule } from '@angular/forms';
// import { ModalHeaderComponent } from '../modal-header/modal-header.component';
import { ComanFuncationService } from '../../services/comanFuncation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ModalHeaderComponent } from '../modal-header/modal-header.component';
import { SkeletonComponent } from '../skeleton/skeleton.component';
import { DataNotFoundComponent } from '../data-not-found/data-not-found.component';

@Component({
  selector: 'app-module-dropdown',
  imports: [
    CommonModule,
    MaterialModuleModule,
    FormsModule,
    SkeletonComponent,
    DataNotFoundComponent,
  ],
  templateUrl: './module-dropdown.component.html',
})
export class ModuleDropdownComponent {
  skLoading: boolean = false;
  optionLoading: boolean = false;
  btnDisabled: boolean = false;
  data: any = {};
  @Input() moduleData: any;
  dropDown: any = [];
  dropDownValue: any = [];
  dropDownDependentValue: any = [];
  openIndex: number | null = null;
  form_id!: number;
  dropdown_name!: string;
  modalTitle = 'Dropdown Config';

  constructor(
    @Inject(MAT_DIALOG_DATA) public modalData: any,

    private dialogRef: MatDialogRef<ModuleDropdownComponent>,
    private toastr: ToastrServices,
    public api: ApiService,
    private comanFuncation: ComanFuncationService,
  ) {}
  ngOnInit() {
    if (this.data?.title) {
      this.modalTitle = this.data.title;
    }
    console.log(this.modalData, 'modalData');

    if (this.modalData.call_as === 'modal') {
      this.form_id = this.modalData.form_id;
      this.dropdown_name = this.modalData.dropdown_name;
    }

    this.getCategoryName();
  }

  toggleCollapse(index: number) {
    this.openIndex = this.openIndex === index ? null : index;
    this.data.dependent_value_option = '';
  }

  deletingMap: { [key: string]: boolean } = {};

  delete(cat_id: string, id: string, label: any) {
    if (this.deletingMap[id]) return; // already deleting → ignore

    this.deletingMap[id] = true; // lock

    this.api
      .patch(
        {
          _id: id,
          module_id: this.form_id,
          is_delete: 1,
        },
        'dropdown/delete-option',
      )
      .subscribe({
        next: (res) => {
          if (res['statusCode'] === 200) {
            this.getOptions(cat_id);
            this.toastr.success(res['message'], '', 'toast-top-right');
          }
        },
        error: () => {},
        complete: () => {
          this.deletingMap[id] = false; // unlock
        },
      });
  }

  getCategoryName() {
    this.skLoading = true;

    this.api
      .post(
        {
          module_id: this.form_id, // static 4 from modal
          dropdown_name: this.dropdown_name, // gst_type
        },
        'dropdown/read',
      )
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
          this.dropDown = result['data'];
          this.skLoading = false;
        }
      });
  }

  getOptions(id: string) {
    this.dropDownValue = [];
    this.data.dropdown_option = '';
    this.data.dropdown_value = '';
    this.optionLoading = true;
    this.api
      .post({ dropdown_id: id }, 'dropdown/read-option')
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
          this.optionLoading = false;
          this.dropDownValue = result['data'];
        }
      });
  }

  getDependentOptions(id: string) {
    this.dropDownDependentValue = [];
    this.data.dropdown_option = '';
    this.data.dropdown_value = '';
    this.optionLoading = true;
    this.api
      .post({ dropdown_id: id }, 'dropdown/read-option')
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
          this.optionLoading = false;
          this.dropDownDependentValue = result['data'];
        }
      });
  }

  submitOption(id: string, dropdown_name: string, dropDownDependentValue: any) {
    if (!this.data.dropdown_option && !this.data.dropdown_value) {
      this.toastr.error('Option is required', '', 'toast-top-right');
      return;
    }

    // DEPENDENT OPTION REQUIRED
    if (dropDownDependentValue > 0 && !this.data.dependent_value_option) {
      this.toastr.error('Dependent option is required', '', 'toast-top-right');
      return;
    }

    this.btnDisabled = true;

    const value = this.data.dropdown_value?.trim() || this.data.dropdown_option;
    this.api
      .post(
        {
          module_id: this.form_id,
          dropdown_id: id,
          dropdown_name: dropdown_name,
          option_name: this.data.dropdown_option,
          value: value,
        },
        'dropdown/create-option',
      )
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
          this.data.dropdown_option = '';
          this.data.dropdown_value = '';
          this.btnDisabled = false;
          this.getOptions(id);
          this.toastr.success(result['message'], '', 'toast-top-right');
        } else {
          this.btnDisabled = false;
        }
      });
  }

  closeModal() {
    this.dialogRef.close(); // Closes the dialog
  }
}
