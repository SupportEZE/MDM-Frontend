import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiService } from '../../../core/services/api/api.service';
import { CommonApiService } from '../../../shared/services/common-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormValidationService } from '../../../utility/form-validation';
import { SpkInputComponent } from '../../../../@spk/spk-input/spk-input.component';
import { SpkNgSelectComponent } from '../../../../@spk/spk-ng-select/spk-ng-select.component';
import { SpkFlatpickrComponent } from '../../../../@spk/spk-flatpickr/spk-flatpickr.component';
import { SpkReusableTablesComponent } from '../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { LOGIN_TYPES } from '../../../utility/constants';
import { UploadFileService } from '../../../shared/services/upload.service';
import { FilePondModule } from 'ngx-filepond';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SweetAlertService } from '../../../core/services/alert/sweet-alert.service';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { ModuleDropdownComponent } from '../../../shared/components/module-dropdown/module-dropdown.component';
import { MatDialog } from '@angular/material/dialog';
import { ModuleService } from '../../../shared/services/module.service';
import { FORMIDCONFIG } from '../../../../config/formId.config';
import { ShowcodeCardComponent } from '../../../shared/components/showcode-card/showcode-card.component';
import { ComanFuncationService } from '../../../shared/services/comanFuncation.service';
import { LogService } from '../../../core/services/log/log.service';
import { data } from '../../../shared/data/table_data/easy_table';

@Component({
  selector: 'app-customer-add',
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    MaterialModuleModule,
    SpkInputComponent,
    SpkNgSelectComponent,
    ReactiveFormsModule,
    SpkFlatpickrComponent,
    SpkReusableTablesComponent,
    FilePondModule,
    ShowcodeCardComponent,
  ],
  templateUrl: './customer-add.component.html',
})
export class CustomerAddComponent {
  sameAsBillingAddress: boolean = false;
  submitted = false;
  gstVerified: boolean = false;
  billingAddressSub: Subscription | null = null;
  shippingFieldSubs: Subscription[] = [];
  sameAsBillingInfo: boolean = false;
  basicDetail: any = {};
  orgData: any;
  document: any = [];
  filter: any = {};
  @Input() maxlength?: number;
  listingCount: any = {};
  listing: any = [];
  LOGIN_TYPES = LOGIN_TYPES;
  dropDown: any = [];
  gstTypeOptions: any[] = [];
  accessTypeOptions: any[] = [];
  invoiceForm!: FormGroup;
  originalData: any = {};
  verifyForm!: FormGroup;
  pondFiles: { [key: string]: any[] } = {};
  pageType: any = 'add';
  skLoading: boolean = false;
  invoiceList: any = [];
  @Output() valueChange = new EventEmitter<any>();
  today = new Date();
  invitation_id: string = '';
  _id: string = '';
  customer_id: any = '';
  account: string = '';
  pondAttachmentFiles: any[] = [];
  isPanRequiredError = false;
  pondOptions = this.getPondOptions();
  pondDocumentOptions = this.getPondOptions();

  constructor(
    public dialog: MatDialog,
    public api: ApiService,
    private cd: ChangeDetectorRef,
    public toastr: ToastrServices,
    public CommonApiService: CommonApiService,
    private fb: FormBuilder,
    private router: Router,
    public route: ActivatedRoute,
    public formValidation: FormValidationService,
    public uploadService: UploadFileService,
    public alert: SweetAlertService,
    public coman: ComanFuncationService,
    private logService: LogService,
  ) {}

  ngOnInit() {
    this.invitation_id = this.route.snapshot.queryParams['invitation_id'];

    this.route.paramMap.subscribe((params) => {
      this.customer_id = params?.get('id');
      this.pageType = params?.get('type') || 'add';

      if (this.customer_id && this.pageType === 'edit') {
        this.gstVerified = true;
        this.getDetail();
      }
    });

    if (this.invitation_id) {
      this.inviteValidation();
      this.readDraft();
    }

    this.verifyForm = this.fb.group({
      gst_number: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/,
          ),
        ],
      ],
    });

    this.invoiceForm = this.fb.group({
      company_name: ['', Validators.required],
      invitation_id: [''],
      gst_number: [
        '',
        [
          Validators.required,
          Validators.pattern(
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/,
          ),
        ],
      ],

      company_logo: [null, Validators.required],

      legal_name: [''],
      mobile: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      cin_number: [''],

      email: ['', [Validators.required, Validators.email]],
      website_url: [''],

      // TAX
      tax_gst_number: [
        '',
        Validators.pattern(
          /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/,
        ),
      ],

      gst_type_id: ['', Validators.required],
      company_type: ['', Validators.required],
      nature_of_business: ['', Validators.required],
      access_type: ['', Validators.required],
      pan_number: [
        '',
        [Validators.required, Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)],
      ],
      is_msme_udyam: [null, Validators.required],
      msme_udyam_number: [''],

      msme_udyam_certificate: [null],
      gst_certificate: [null, Validators.required],
      pancard: [null, Validators.required],

      // BILL TO
      bill_to_pincode: [
        '',
        [Validators.required, Validators.pattern(/^[1-9][0-9]{5}$/)],
      ],
      bill_to_city: ['', Validators.required],
      bill_to_state: ['', Validators.required],
      bill_to_block: [''],
      bill_to_address: ['', Validators.required],

      // SHIP TO optional
      ship_to_pincode: ['', [Validators.minLength(6), Validators.maxLength(6)]],
      ship_to_city: ['', Validators.required],
      ship_to_state: ['', Validators.required],
      ship_to_block: [''],
      ship_to_address: ['', Validators.required],

      // BANK
      bank_ifsc_code: ['', Validators.required],

      bank_branch_name: ['', Validators.required],
      bank_name: ['', Validators.required],

      bank_account_number: ['', Validators.required],
      account_name: ['', Validators.required],

      // CONTACT
      contact_person_name: ['', Validators.required],
      contact_person_designation: ['', Validators.required],

      contact_person_mobile: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],

      contact_person_email: ['', [Validators.required, Validators.email]],
      is_both_address_same: [false],
    });

    this.getGstTypeOptions();
    this.getAcessTypeOptions();

    // BANK VERIFY AUTO TRIGGER

    this.invoiceForm.get('is_msme_udyam')?.valueChanges.subscribe((value) => {
      this.msmeField(value);
    });

    const msmeVal = this.invoiceForm.get('is_msme_udyam')?.value;
    this.msmeField(msmeVal);
  }

  inviteValidation() {
    this.skLoading = true;
    this.api.post({ _id: this.invitation_id }, 'invitation/validate').subscribe(
      (result: any) => {
        this.skLoading = false;

        if (result?.statusCode === 200) {
          this.invoiceForm.patchValue({ invitation_id: this.invitation_id });
        }
      },
      () => {
        this.skLoading = false;
      },
    );
  }

  readDraft() {
    this.skLoading = true;

    this.api
      .post({ invitation_id: this.invitation_id }, 'customer/read-draft')
      .subscribe(
        (result: any) => {
          this.skLoading = false;

          if (result?.statusCode === 200) {
            const draftData = result?.data?.customer_draft;

            if (draftData) {
              this.invoiceForm.patchValue({
                ...draftData,
                invitation_id: this.invitation_id,
              });

              this.customer_id = result?.data?._id;

              // GST already verified earlier
              if (draftData.gst_number && draftData.company_name) {
                this.gstVerified = true;

                const gstDisableFields = [
                  'legal_name',
                  'company_name',
                  'tax_gst_number',
                  'gst_number',
                  'pan_number',
                ];

                gstDisableFields.forEach((field) => {
                  this.invoiceForm.get(field)?.disable();
                });
              }

              if (draftData.bank_name && draftData.bank_branch_name) {
                this.isAccountVerify = true;

                const bankDisableFields = [
                  'bank_account_number',
                  'bank_ifsc_code',
                  'account_name',
                  'bank_name',
                  'bank_branch_name',
                ];

                bankDisableFields.forEach((field) => {
                  this.invoiceForm.get(field)?.disable();
                });
              }
            }
          }
        },
        () => {
          this.skLoading = false;
        },
      );
  }

  getDetail() {
    this.api.post({ _id: this.customer_id }, 'customer/detail').subscribe(
      (result: any) => {
        if (result?.statusCode === 200) {
          this.isAccountVerify = true;
          this.invoiceForm.patchValue({
            ...result?.data,
            tax_gst_number: result?.data?.gst_number || '',
            gst_type_id: result?.data?.gst_type_id?._id || '',
            access_type: result?.data?.access_type?._id || '',
          });
          this.originalData = result?.data;
          this.originalData.tax_gst_number = result?.data?.gst_number;
          // this.document = result?.data?.files ?? [];
          // this.cd.detectChanges();
          const disableFields = [
            'legal_name',
            'company_name',
            'tax_gst_number',
            'gst_number',
            'bank_account_number',
            'bank_ifsc_code',
            'account_name',
            'bank_name',
            'bank_branch_name',
            'pan_number',
          ];
          disableFields.forEach((field) => {
            this.invoiceForm.get(field)?.disable();
          });

          // if (result?.data?.is_both_address_same) {
          //   this.copyBillingInfo(result?.data?.is_both_address_same);
          // }
        }
      },
      (error) => {
        this.skLoading = false;
        console.error(error);
      },
    );
  }

  onPincodeInput(event: any, type: string) {
    const pincode = event.target.value;
    if (pincode.length === 6) {
      this.api
        .post({ pincode: pincode }, 'postal-code/read-using-pincode')
        .subscribe((result) => {
          if (result['statusCode'] == 200) {
            if (type === 'bill_to_pincode') {
              this.invoiceForm.patchValue({
                bill_to_city: result?.data?.city || '',
                bill_to_state: result?.data?.state || '',
                // bill_to_block: result?.data?.district || '',
              });
            } else if (type === 'ship_to_pincode') {
              this.invoiceForm.patchValue({
                ship_to_city: result?.data?.city || '',
                ship_to_state: result?.data?.state || '',
                // ship_to_block: result?.data?.district || '',
              });
            }
          }
        });
    }
  }

  accountVerify: boolean = false;
  isAccountVerify: boolean = false;

  verifyBankDetails() {
    const form = this.invoiceForm;

    const accountControl = form.get('bank_account_number');
    const ifscControl = form.get('bank_ifsc_code');

    if (!accountControl?.valid || !ifscControl?.valid) {
      this.toastr.error(
        'Please fill account number and IFSC code',
        '',
        'toast-top-right',
      );
      return;
    }

    this.accountVerify = true;

    const payload = {
      bank_account: accountControl?.value,
      ifsc: ifscControl?.value,
      ...(this.invitation_id && {
        invitation_id: this.invitation_id,
      }),
    };

    this.api.post(payload, 'customer/verify-bank').subscribe(
      (result: any) => {
        this.accountVerify = false;

        if (result?.statusCode === 200) {
          this.isAccountVerify = true;
          this.invoiceForm.patchValue({
            bank_name: result?.data?.bank_name || '',
            bank_branch_name: result?.data?.branch || '',
            account_name: result?.data?.name_at_bank || '',
          });

          const disableFields = [
            'bank_account_number',
            'bank_ifsc_code',
            'account_name',
            'bank_name',
            'bank_branch_name',
          ];

          disableFields.forEach((field) => {
            this.invoiceForm.get(field)?.disable();
          });

          this.toastr.success(result['message'], '', 'toast-top-right');
        }
      },
      () => {
        this.skLoading = false;
        this.toastr.error('Invalid Account', '', {
          positionClass: 'toast-top-right',
        });
      },
    );
  }

  uploadImage(isDraft: boolean = false) {
    const files: any[] = Object.values(this.pondFiles).flat();

    if (!files.length) {
      this.api.disabled = false;
      this.toastr.error('Image is required', '', 'toast-top-right');
      return;
    }

    this.uploadService.uploadFile(
      this._id,
      'customer',
      files,
      '',
      undefined,
      () => {
        this.api.disabled = false;

        this.toastr.success(
          'Customer registered successfully',
          '',
          'toast-top-right',
        );

        this.invoiceForm.reset();

        if (isDraft) {
          this.router.navigate(['/apps/customers/customer-detail', this._id]);
          return;
        }

        if (this.coman?.userData) {
          this.router.navigate(['/apps/customers/customer-detail', this._id]);
        } else {
          this.router.navigate(['/apps/thank-you', 1]);
        }
      },
    );
  }

  ngOnDestroy(): void {
    this.billingAddressSub?.unsubscribe();
    this.shippingFieldSubs.forEach((sub) => sub.unsubscribe());
  }

  getGstTypeOptions() {
    this.api
      .post(
        {
          module_name: 'Customers',
          dropdown_name: 'gst_type_id',
        },
        'dropdown/read-option',
      )
      .subscribe((res: any) => {
        this.gstTypeOptions = res?.data || [];
      });
  }

  getAcessTypeOptions() {
    this.api
      .post(
        {
          module_name: 'Customers',
          dropdown_name: 'access_type',
        },
        'dropdown/read-option',
      )
      .subscribe((res: any) => {
        this.accessTypeOptions = res?.data || [];
      });
  }

  msmeRegistrationOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false },
  ];

  msmeField(value: any) {
    const numCtrl = this.invoiceForm.get('msme_udyam_number');
    const fileCtrl = this.invoiceForm.get('msme_udyam_certificate');

    if (!numCtrl || !fileCtrl) return;

    // reset
    numCtrl.clearValidators();
    fileCtrl.clearValidators();
    numCtrl.enable();

    if (value === true) {
      numCtrl.setValidators([Validators.required]);
      fileCtrl.setValidators([Validators.required]);

      fileCtrl.markAsTouched();
    } else {
      numCtrl.reset();
      numCtrl.disable();

      fileCtrl.setValue(null);
      this.pondFiles['msme_udyam_certificate'] = [];
    }

    numCtrl.updateValueAndValidity();
    fileCtrl.updateValueAndValidity();
  }

  checkFileControl(controlName: string) {
    const ctrl = this.invoiceForm.get(controlName);

    if (ctrl) {
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
  }

  generateMsmeNumber(): string {
    const prefix = 'MSME-NA';
    const random = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${random}`;
  }

  onSingleSelectChange(value: any, type?: any) {
    this.valueChange.emit(value);
  }

  CustomerTypeChange(value: any) {
    this.invoiceForm.patchValue({ customer_id: this.basicDetail._id });
  }

  copyBillingInfo(event: any) {
    const isChecked = event.checked;

    const billingControls = [
      'bill_to_pincode',
      'bill_to_state',
      'bill_to_city',
      'bill_to_block',
      'bill_to_address',
    ];

    const shippingFields = [
      'ship_to_pincode',
      'ship_to_state',
      'ship_to_city',
      'ship_to_block',
      'ship_to_address',
    ];

    const hasInvalidBilling = billingControls.some((control) => {
      if (control === 'bill_to_block') return false;

      const field = this.invoiceForm.get(control);
      if (!field) return true;

      const value = field.value;
      return (
        value === null || value === undefined || value === '' || field.invalid
      );
    });

    if (isChecked && hasInvalidBilling) {
      this.toastr.error(
        'Please fill all required Billing fields correctly before copying.',
        '',
        'toast-top-right',
      );

      this.sameAsBillingInfo = false;

      this.invoiceForm.patchValue(
        { is_both_address_same: false },
        { emitEvent: false },
      );

      return;
    }

    this.sameAsBillingInfo = isChecked;

    if (isChecked) {
      shippingFields.forEach((field, index) => {
        const source = this.invoiceForm.get(billingControls[index]);
        const target = this.invoiceForm.get(field);

        if (source && target) {
          const value = source.value;

          if (billingControls[index] === 'bill_to_block') {
            if (value) {
              target.patchValue(value, { emitEvent: false });
            }
          } else {
            target.patchValue(value, { emitEvent: false });
          }

          target.disable({ emitEvent: false });

          const sub = source.valueChanges
            .pipe(distinctUntilChanged())
            .subscribe((val) => {
              if (this.sameAsBillingInfo) {
                if (billingControls[index] === 'bill_to_block') {
                  if (val) {
                    target.patchValue(val, { emitEvent: false });
                  }
                } else {
                  target.patchValue(val, { emitEvent: false });
                }
              }
            });

          this.shippingFieldSubs.push(sub);
        }
      });
    } else {
      //  Unchecked → reset + enable
      shippingFields.forEach((field) => {
        const control = this.invoiceForm.get(field);
        control?.enable({ emitEvent: false });
        control?.patchValue('', { emitEvent: false });
      });

      //  unsubscribe all
      this.shippingFieldSubs.forEach((sub) => sub.unsubscribe());
      this.shippingFieldSubs = [];
    }
  }

  verifyGST() {
    if (this.gstVerified) {
      return;
    }
    if (this.verifyForm.valid) {
      this.api.disabled = true;
      this.formValidation.removeEmptyFields(this.verifyForm.value);
      const requestData = {
        ...(this.invitation_id && {
          invitation_id: this.invitation_id,
        }),
        ...this.verifyForm.getRawValue(),
      };
      this.api.post(requestData, 'customer/get-gst-detail').subscribe({
        next: (result: any) => {
          if (result?.statusCode === 200) {
            const d = result?.data;
            if (d?.valid) {
              this.invoiceForm.patchValue({
                legal_name: d.legal_name_of_business || '',
                company_name: d.trade_name_of_business || '',
                company_type: d.constitution_of_business || '',
                nature_of_business:
                  d.nature_of_business_activities?.join(', ') || '',
                bill_to_company_name: d.trade_name_of_business || '',
                bill_to_address: d.principal_place_address || '',
                bill_to_state: d.principal_place_split_address?.state || '',
                bill_to_city: d.principal_place_split_address?.city || '',
                // bill_to_block: d.principal_place_split_address?.district || '',
                bill_to_pincode: d.principal_place_split_address?.pincode || '',
                tax_gst_number: d.GSTIN || '',
                gst_number: d.GSTIN || '',
                pan_number: d?.GSTIN ? d.GSTIN.substring(2, 12) : '',
              });

              const disableFields = [
                'legal_name',
                'company_name',
                'tax_gst_number',
                'gst_number',
                'pan_number',
              ];

              disableFields.forEach((field) => {
                this.invoiceForm.get(field)?.disable();
              });
            }
            this.gstVerified = true;
          }
        },
        error: (err) => {
          this.toastr.error('Validation failed', '', 'toast-top-right');
        },
        complete: () => {
          this.api.disabled = false;
        },
      });
    } else {
      this.formValidation.markFormGroupTouched(this.verifyForm); // Call the global function
      this.scrollToFirstInvalidControl();
    }
  }

  onSubmit() {
    this.submitted = true;
    this.checkFileControl('company_logo');
    this.checkFileControl('gst_certificate');
    this.checkFileControl('pancard');

    if (this.invoiceForm.get('is_msme_udyam')?.value === true) {
      this.checkFileControl('msme_udyam_certificate');
    }

    if (this.invoiceForm.valid) {
      if (this.isAccountVerify === false) {
        this.toastr.error(
          'Please verify bank details before submitting the form',
          '',
          'toast-top-right',
        );
        return;
      }

      this.alert
        .confirm('Are you sure you want to save this form?', '', 'Save Form')
        .then((result) => {
          if (!result.isConfirmed) return;
          const isEditMode = this.pageType === 'edit';
          if (isEditMode) {
            const noChanges = this.logService.logActivityOnUpdate(
              isEditMode,
              this.originalData,
              this.invoiceForm.getRawValue(),
              FORMIDCONFIG.ID.CUSTOMER,
              'Customers',
              'update',
              this.originalData._id || null,
              () => {},
            );
            if (noChanges) {
              const allFiles: any[] = Object.values(this.pondFiles).flat();
              if (allFiles.length === 0) {
                this.api.disabled = false;
                this.toastr.warning(
                  'No changes detected',
                  '',
                  'toast-top-right',
                );
                return;
              }
            }
          }
          this.api.disabled = true;
          const httpMethod = isEditMode ? 'patch' : 'post';

          const functionName = isEditMode
            ? 'customer/update'
            : 'customer/create';

          const requestData = {
            ...this.invoiceForm.getRawValue(),
            ...(this.customer_id && {
              customer_id: this.customer_id,
            }),
          };
          this.api[httpMethod](requestData, functionName).subscribe({
            next: (result: any) => {
              if (result?.statusCode === 200) {
                this._id = result?.data?._id || this.customer_id;
                const allFiles: any[] = Object.values(this.pondFiles).flat();

                if (allFiles.length > 0 && this._id) {
                  this.uploadImage(false);
                } else {
                  if (this.coman?.userData) {
                    this.router.navigate([
                      '/apps/customers/customer-detail',
                      this._id,
                    ]);
                  } else {
                    this.router.navigate(['/apps/thank-you', 1]);
                  }

                  this.toastr.success(result.message, '', 'toast-top-right');
                }
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
    } else {
      this.formValidation.markFormGroupTouched(this.invoiceForm); // Call the global function
      this.invoiceForm.updateValueAndValidity();
      this.scrollToFirstInvalidControl();
    }
  }

  scrollToFirstInvalidControl() {
    setTimeout(() => {
      const firstInvalidControl = document.querySelector(
        '.ng-invalid:not(form), spk-input.ng-invalid, spk-ng-select.ng-invalid',
      );

      if (firstInvalidControl) {
        firstInvalidControl.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
        const input = firstInvalidControl.querySelector(
          'input, select, textarea, .ng-select-container',
        ) as HTMLElement;
        if (input) {
          input.focus();
        } else {
          (firstInvalidControl as HTMLElement).focus();
        }
      }
    }, 100);
  }

  onSubmitDraft() {
    const requestData = {
      ...this.invoiceForm.getRawValue(),
      ...(this.customer_id && {
        customer_id: this.customer_id,
      }),
    };

    this.api.disabled = true;

    this.api.post(requestData, 'customer/create-draft').subscribe({
      next: (result: any) => {
        if (result?.statusCode === 200) {
          this._id = result?.data?._id || this.customer_id;

          this.toastr.success(result.message, '', 'toast-top-right');

          this.router.navigate(['/apps/thank-you', 'draft']);
        }
      },
      error: () => {
        this.toastr.error('Draft save failed', '', 'toast-top-right');
        this.api.disabled = false;
      },
      complete: () => {
        this.api.disabled = false;
      },
    });
  }

  getPondOptions(): any {
    const cfg = {
      types: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
      label: 'Only JPG, PNG or PDF allowed',
      maxSize: '15MB',
    };

    return {
      allowMultiple: false,
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

  downloadUndertaking() {
    const link = document.createElement('a');
    link.href = 'https://ezeone.tech/frontend/brand-logos/ozonemdm/sample.docx';
    link.download = 'https://ezeone.tech/frontend/brand-logos/ozonemdm/sample.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    }
    this.invoiceForm.get(type)?.setValue(file);
    this.invoiceForm.get(type)?.markAsTouched();
    this.invoiceForm.get(type)?.updateValueAndValidity();
  }

  onFileRemove(event: any, target: number, type: string) {
    const file = event.file.file;
    if (target === 1) {
      const index = this.pondFiles[type].findIndex(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (index > -1) this.pondFiles[type].splice(index, 1);
    }
    const ctrl = this.invoiceForm.get(type);
    if (ctrl) {
      ctrl.setValue(null);
      ctrl.markAsTouched();
      ctrl.updateValueAndValidity();
    }
  }
}
