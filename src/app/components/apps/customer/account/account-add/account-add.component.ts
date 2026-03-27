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
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule, ViewportScroller } from '@angular/common';
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
import { forkJoin } from 'rxjs';
import { LogService } from '../../../../../core/services/log/log.service';
import { Router } from '@angular/router';
import { FilePondModule } from 'ngx-filepond';
import { MatRadioModule } from '@angular/material/radio';
import { UploadFileService } from '../../../../../shared/services/upload.service';
import { LOGIN_TYPES } from '../../../../../utility/constants';

@Component({
  selector: 'app-account-add',
  standalone: true,
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
    FilePondModule,
    MatRadioModule,
  ],
  templateUrl: './account-add.component.html',
})
export class AccountAddComponent {
  @Input() basicDetail!: any;
  @Input() pageType: any = 'add';
  @Input() isAccountLogin: boolean = false;
  @Input() isSapVerfiy: boolean = false;

  skLoading: boolean = false;
  pondOptions = this.getPondOptions();
  pondDocumentOptions = this.getPondOptions();
  pondFiles: { [key: string]: any[] } = {};
  dropDown: any = [];
  Category: any = [];
  activeTab: string = '';
  accountForm!: FormGroup;
  customerGroupOptions: any[] = [];
  paymentTermsOptions: any[] = [];
  discountTypeOptions: any[] = [];
  accountCodeOptions: any[] = [];
  originalData: any;
  LOGIN_TYPES = LOGIN_TYPES;
  isEditable: boolean = false;
  loginType: number = 0;

  constructor(
    public api: ApiService,
    public dialog: MatDialog,
    private router: Router,
    public formValidation: FormValidationService,
    private uploadService: UploadFileService,
    public comanFuncation: ComanFuncationService,
    private fb: FormBuilder,
    private alert: SweetAlertService,
    private toastr: ToastrServices,
    private logService: LogService,
    private authService: AuthService,
    private viewScroller: ViewportScroller,
  ) {}

  statusOptions: any[] = [
    { label: 'Approve', value: 'Approve' },
    { label: 'Reject', value: 'Reject' },
  ];

  ngOnInit() {
    this.accountForm = this.fb.group({
      account_status: [null, Validators.required],
      account_remark: [''],
    });

    const user = this.authService.getUser();
    this.loginType = user?.login_type_id ?? 0;

    this.isEditable =
      this.loginType === this.LOGIN_TYPES.ACCOUNT_USER ||
      this.loginType === this.LOGIN_TYPES.SAP_USER;

    this.accountForm.get('account_status')?.valueChanges.subscribe((status) => {
      const remarkControl = this.accountForm.get('account_remark');

      if (status === 'Reject') {
        remarkControl?.setValidators([Validators.required]);
      } else {
        remarkControl?.clearValidators();
        remarkControl?.setValue('');
      }

      remarkControl?.updateValueAndValidity();
    });

    // this.editAccountInfo();
  }

  // editAccountInfo() {
  //   if (!this.basicDetail?._id) return;
  //   const payload = { _id: this.basicDetail._id };
  //   this.api.post(payload, 'customer/detail').subscribe((res: any) => {
  //     const data = res?.data;
  //     if (!data) return;

  //     const statusValue =
  //       data.account_status === null || data.account_status === undefined
  //         ? null
  //         : data.account_status
  //           ? 'Approve'
  //           : 'Reject';

  //     this.accountForm.patchValue({
  //       account_status: statusValue,
  //       account_remark: data.account_remark || '',
  //     });

  //     if (!this.isEditable) {
  //       this.accountForm.disable();
  //     }
  //   });
  // }

  get showAccount(): boolean {
    return (
      this.isAccountLogin ||
      ['Approve', 'Reject'].includes(this.basicDetail?.account_status)
    );
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.accountForm) return;
    if (changes['basicDetail']?.currentValue) {
      this.basicDetail = changes['basicDetail'].currentValue;

      this.accountForm.patchValue({
        account_status: this.basicDetail?.account_status || null,
        account_remark: this.basicDetail?.account_remark,
      });
      this.originalData = {
        account_status: this.basicDetail?.account_status || '',
        account_remark: this.basicDetail?.account_remark,
      };

      if (this.isSapVerfiy || !this.isAccountLogin) {
        this.accountForm?.disable();
      } else {
        this.accountForm?.enable();
      }
    }
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
        this.getCategoryName();
      }
    });
  }

  @Output() accountCheckChange = new EventEmitter<boolean>();

  checkedStates: Record<string, boolean> = {
    accountApproval: false,
  };

  onSectionCheckChange(section: string, event: any) {
    const checked = event?.target?.checked ?? event;

    this.checkedStates[section] = checked;

    if (section === 'accountApproval') {
      this.accountCheckChange.emit(checked);
    }
  }

  getCategoryName() {
    this.skLoading = true;
    this.api
      .post(
        {
          dropdown_name: 'gst_type',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read',
      )
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
          this.Category = result?.data ?? [];
          this.skLoading = false;
        }
      });
  }

  onFileRemove(event: any, target: number, type: string) {
    const file = event.file.file;
    if (target === 1) {
      const index = this.pondFiles[type].findIndex(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (index > -1) this.pondFiles[type].splice(index, 1);
    }
    const ctrl = this.accountForm.get(type);
    if (ctrl) {
      ctrl.setValue(null);
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
  }

  getPondOptions(): any {
    const cfg = {
      types: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      label: 'Only JPG, PNG or PDF allowed',
      maxSize: '15MB',
    };

    return {
      allowMultiple: true,
      maxFiles: 5,
      allowFileTypeValidation: true,
      acceptedFileTypes: cfg.types,
      maxFileSize: cfg.maxSize,

      labelIdle: 'Click or drag file here...',
      labelFileTypeNotAllowed: cfg.label,
      fileValidateTypeLabelExpectedTypes: cfg.label,

      server: {
        process: (_f: any, _file: any, _m: any, load: any) =>
          setTimeout(() => load(Date.now().toString()), 500),
        revert: (_id: any, load: any) => load(),
      },
    };
  }

  onFileProcessed(
    event: any,
    imageLabel: string,
    target: number,
    type: string,
  ) {
    const file = event.file.file;
    Object.assign(file, { image_type: type });

    if (target === 1) {
      this.pondFiles[type] = [...(this.pondFiles[type] || []), file];
      this.accountForm.get(type)?.setValue(this.pondFiles[type]); // array store
    }

    this.accountForm.get(type)?.markAsTouched();
  }

  uploadImage() {
    const files: any[] = Object.values(this.pondFiles).flat();

    if (!files.length) {
      this.api.disabled = false;
      return;
    }

    this.uploadService.uploadFile(
      this.basicDetail?._id,
      'customer',
      files,
      '',
      undefined,
      () => {
        this.api.disabled = false;

        this.toastr.success(
          'Account approval submitted successfully',
          '',
          'toast-top-right',
        );
      },
    );
  }

  onSubmit() {
    if (this.accountForm.valid) {
      const isEditMode = this.pageType === 'edit';

      const action = isEditMode ? 'update' : 'add';
      const noChanges = this.logService.logActivityOnUpdate(
        true,
        this.originalData,
        this.accountForm.value,
        FORMIDCONFIG.ID.CUSTOMER,
        'Customers',
        action,
        this.basicDetail?._id || null,
        () => {},
      );
      if (noChanges) {
        const allFiles: any[] = Object.values(this.pondFiles).flat();
        if (allFiles.length === 0) {
          this.api.disabled = false;
          this.toastr.warning('No changes detected', '', 'toast-top-right');
          return;
        }
      }

      this.alert
        .confirm('Are you sure you want to submit this account approval?', '')
        .then((result) => {
          if (!result.isConfirmed) return;

          this.api.disabled = true;
          const formValue = this.accountForm.getRawValue();
          const payload = {
            customer_id: this.basicDetail?._id,
            account_status: formValue.account_status,
            account_remark: formValue.account_remark || '',
          };

          this.api.post(payload, 'customer/account-approval').subscribe({
            next: (result: any) => {
              if (result?.statusCode === 200) {
                // this.editAccountInfo();

                this.basicDetail.form_data = this.basicDetail.form_data || {};
                this.basicDetail.form_data.account_info = {
                  ...this.basicDetail.form_data.account_info,
                  account_status: payload.account_status,
                  account_remark: payload.account_remark,
                };

                const files: any[] = Object.values(this.pondFiles).flat();

                if (files.length > 0) {
                  this.uploadImage();
                } else {
                  this.api.disabled = false;
                  this.toastr.success(result.message, '', 'toast-top-right');
                }
              }
            },

            error: () => {
              this.toastr.error('Validation failed', '', 'toast-top-right');
              this.api.disabled = false;
            },
          });
        });
    } else {
      this.formValidation.markFormGroupTouched(this.accountForm);
    }
  }
}
