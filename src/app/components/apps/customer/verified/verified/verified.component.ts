import {
  Component,
  EventEmitter,
  Input,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ApiService } from '../../../../../core/services/api/api.service';
import { AuthService } from '../../../../../shared/services/auth.service';
import { ComanFuncationService } from '../../../../../shared/services/comanFuncation.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../../../shared/shared.module';
import { MaterialModuleModule } from '../../../../../material-module/material-module.module';
import { SpkInputComponent } from '../../../../../../@spk/spk-input/spk-input.component';
import { SpkNgSelectComponent } from '../../../../../../@spk/spk-ng-select/spk-ng-select.component';
import { SpkFlatpickrComponent } from '../../../../../../@spk/spk-flatpickr/spk-flatpickr.component';
import { SweetAlertService } from '../../../../../core/services/alert/sweet-alert.service';
import { ToastrServices } from '../../../../../shared/services/toastr.service ';
import { FormValidationService } from '../../../../../utility/form-validation';
import { ModuleDropdownComponent } from '../../../../../shared/components/module-dropdown/module-dropdown.component';
import { FORMIDCONFIG } from '../../../../../../config/formId.config';
import { MatDialog } from '@angular/material/dialog';
import { ShowcodeCardComponent } from '../../../../../shared/components/showcode-card/showcode-card.component';
import { LogService } from '../../../../../core/services/log/log.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-verified',
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    MaterialModuleModule,
    SpkInputComponent,
    SpkNgSelectComponent,
    ReactiveFormsModule,
    SpkFlatpickrComponent,
    ShowcodeCardComponent,
  ],
  templateUrl: './verified.component.html',
})
export class VerifiedComponent {
  @Input() basicDetail!: any;
  @Output() refreshBasicDetail = new EventEmitter<void>();
  skLoading: boolean = false;
  dropDown: any = [];
  Category: any = [];
  activeTab: string = '';
  pageType: any = 'add';
  originalData: any = {};

  constructor(
    public api: ApiService,
    public dialog: MatDialog,
    public formValidation: FormValidationService,
    public comanFuncation: ComanFuncationService,
    private fb: FormBuilder,
    private alert: SweetAlertService,
    private toastr: ToastrServices,
    private logService: LogService,
  ) {}

  ngOnInit() {}

  allTrueValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const values = control.value;
      const allTrue = Object.values(values).every((value) => value === true);
      return allTrue ? null : { notAllChecked: true };
    };
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['basicDetail'] && changes['basicDetail'].currentValue) {
      this.basicDetail = changes['basicDetail'].currentValue;

      if (this.basicDetail?.sap_verified_info) {
        this.pageType = 'edit';
      }
    }
  }

  get isMoveToCommit(): boolean {
    return (
      this.basicDetail?.verified_info?.basic_detail &&
      this.basicDetail?.verified_info?.sales_support &&
      this.basicDetail?.sap_status?.toLowerCase() === 'pending'
    );
  }

  modalTitle = 'Dropdown Config';
  openDropdownModal() {
    const dialogRef = this.dialog.open(ModuleDropdownComponent, {
      width: '650px',
      data: {
        call_as: 'modal',
        form_id: FORMIDCONFIG.ID.CUSTOMER,
        title: this.modalTitle,
      },
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        // this.getCategoryName();
      }
    });
  }

  moveToSap() {
    this.alert
      .confirm(`Are you sure you want to commit to SAP?`, '')
      .then((result) => {
        if (!result.isConfirmed) return;
        this.alert.loading();
        this.api.disabled = true;
        const requestData = {
          ...(this.basicDetail?._id && {
            customer_id: this.basicDetail._id,
          }),
        };
        this.api.post(requestData, 'customer/sap-commit').subscribe({
          next: (result: any) => {
            if (result?.statusCode === 200) {
              Swal.close();
              this.refreshBasicDetail.emit();
              this.toastr.success(result.message, '', 'toast-top-right');
            }
          },
          error: (err) => {
            this.toastr.error('Validation failed', '', 'toast-top-right');
          },
          complete: () => {
            this.api.disabled = false;
          },
        });
      });
  }

  getVerifiedClass(key: string): string {
    return this.basicDetail?.verified_info?.[key] ? 'text-success' : '';
  }

  getIcon(key: string): string {
    return this.basicDetail?.verified_info?.[key]
      ? 'verified'
      : 'hourglass_bottom';
  }
}
