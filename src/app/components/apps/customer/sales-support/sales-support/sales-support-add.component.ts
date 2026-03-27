import {
  Component,
  EventEmitter,
  Inject,
  Input,
  Optional,
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
import { SpkReusableTablesComponent } from '../../../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { ShowcodeCardComponent } from '../../../../../shared/components/showcode-card/showcode-card.component';
import { FORMIDCONFIG } from '../../../../../../config/formId.config';
import { forkJoin } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CustomerModalComponent } from '../../customer-modal/customer-modal.component';
import { LOGIN_TYPES } from '../../../../../utility/constants';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { LogService } from '../../../../../core/services/log/log.service';

@Component({
  selector: 'app-sales-support-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    MaterialModuleModule,
    SpkInputComponent,
    SpkNgSelectComponent,
    SpkFlatpickrComponent,
    SpkReusableTablesComponent,
    ShowcodeCardComponent,
  ],
  templateUrl: './sales-support-add.component.html',
})
export class SalesSupportAddComponent {
  @Input() basicDetail!: any;
  @Input() verificationId!: any;
  @Input() isSapVerfiy: boolean = false;
  LOGIN_TYPES = LOGIN_TYPES;
  loginType: any = [];
  @Output() refreshBasicDetail = new EventEmitter<void>();
  skLoading: boolean = false;
  pageType: any = 'add';
  activeTab: string = 'Sales Support';
  salesSupportForm!: FormGroup;
  salesPersonForm!: FormGroup;
  section: string = '';
  commercialTermsForm!: FormGroup;
  commercialSelData: any = {};
  commercialOriginalData: any;
  listing: any[] = [];
  salesSupportList: any[] = [];
  salesPersonList: any[] = [];
  salesSupportOptions: any[] = [];
  salesPersonOptions: any[] = [];
  zoneOptions: any[] = [];
  subZoneOptions: any[] = [];
  segmentOptions: any[] = [];
  customerGroupOptions: any[] = [];
  paymentTermsOptions: any[] = [];
  isSalesPersonLoading = false;
  isSalesSupportLoading = false;
  orgData: any;
  isCommercialLoading = false;
  dmsAccountOption: any[] = [
    { label: 'Yes', value: 'Yes' },
    { label: 'No', value: 'No' },
  ];
  discountTypeOptions: any[] = [];
  commercial_id: any;
  supportData: any = {};
  supportPersonData: any = {};

  constructor(
    public api: ApiService,
    private authService: AuthService,
    public formValidation: FormValidationService,
    public comanFuncation: ComanFuncationService,
    private fb: FormBuilder,
    private alert: SweetAlertService,
    private toastr: ToastrServices,
    public dialog: MatDialog,
    private router: Router,
    public route: ActivatedRoute,
    private viewScroller: ViewportScroller,
    private logService: LogService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.orgData = this.authService.getUser();
    const role = this.orgData?.login_type_name
      ?.toUpperCase()
      ?.replace(/\s+/g, '_');

    this.salesSupportForm = this.fb.group({
      sales_support_id: ['', Validators.required],
      location_id: ['', Validators.required],
      zone_id: ['', Validators.required],
    });

    /* ---------------- SALES PERSON FORM ---------------- */

    this.salesPersonForm = this.fb.group({
      sales_person_id: ['', Validators.required],
      location_id: ['', Validators.required],
      zone_id: ['', Validators.required],
      is_hod_approval_mail: [false],
    });

    /* ---------------- COMMERCIAL TERMS FORM ---------------- */

    this.commercialTermsForm = this.fb.group({
      business_segment_id: ['', Validators.required],
      customer_group_id: ['', Validators.required],
      discount_type_id: ['', Validators.required],
      payment_terms_id: ['', Validators.required],
      credit_limit: ['', Validators.required],
      dms_account: ['', Validators.required],
    });

    this.salesSupportForm
      .get('sales_support_id')
      ?.valueChanges.subscribe((value: any) => {
        const selectedUser = this.salesSupportOptions.find(
          (x: any) => x.value === value,
        );

        if (selectedUser) {
          this.salesSupportForm.patchValue({
            location_id: selectedUser.location,
            zone_id: selectedUser.zone,
          });

          this.supportData = {
            location: selectedUser?.location,
            zone: selectedUser?.zone,
            sales_support: selectedUser?.label,
          };

          this.salesSupportForm.get('location_id')?.disable();
          this.salesSupportForm.get('zone_id')?.disable();
        }
      });

    /* ---------- SALES PERSON ---------- */
    this.salesPersonForm
      .get('sales_person_id')
      ?.valueChanges.subscribe((value: any) => {
        const selectedUser = this.salesPersonOptions.find(
          (x: any) => x.value === value,
        );

        if (selectedUser) {
          this.salesPersonForm.patchValue({
            location_id: selectedUser.location,
            zone_id: selectedUser.zone,
          });

          this.supportPersonData = {
            location: selectedUser?.location,
            zone: selectedUser?.zone,
            sales_support: selectedUser?.label,
          };
          this.salesPersonForm.get('location_id')?.disable();
          this.salesPersonForm.get('zone_id')?.disable();
        }
      });

    if (!this.hasAccountAccess) {
      this.commercialTermsForm?.disable();
    }

    this.apiCall();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      (changes['basicDetail'] && changes?.['basicDetail']?.currentValue) ||
      (changes['verificationId'] && changes?.['verificationId']?.currentValue)
    ) {
      this.basicDetail = changes['basicDetail'].currentValue;

      if (this.basicDetail?.verified_info) {
        this.checkedStates = {
          ...this.checkedStates,
          ...this.basicDetail.verified_info,
        };
      }

      if (this.basicDetail?.commercial_terms?.length) {
        this.pageType = 'edit';
        const term = this.basicDetail?.commercial_terms?.[0];
        const mappedData = {
          business_segment_id: term?.business_segment_id?._id,
          customer_group_id: term?.customer_group_id?._id,
          discount_type_id: term?.discount_type_id?._id,
          payment_terms_id: term?.payment_terms_id?._id,
          dms_account: term?.dms_account,
          credit_limit: term?.credit_limit,
        };
        const OrgmappedData = {
          business_segment: term?.business_segment_id?.option_name,
          customer_group: term?.customer_group_id?.option_name,
          discount_type: term?.discount_type_id?.option_name,
          payment_term: term?.payment_terms_id?.option_name,
          dms_account: term?.dms_account,
          credit_limit: term?.credit_limit,
        };

        this.commercialTermsForm.patchValue(mappedData);
        this.commercialOriginalData = JSON.parse(JSON.stringify(OrgmappedData));
        this.commercial_id = term?._id;
        this.commercialTermsForm.get('business_segment_id')?.disable();
      }

      if (changes?.['verificationId']?.currentValue) {
        this.verificationId = changes?.['verificationId']?.currentValue;
      }

      if (this.basicDetail?._id) {
        this.getSalesSupportList();
        this.getSalesPersonList();
      }
    }
  }

  get hasAccess(): boolean {
    return (
      [
        LOGIN_TYPES.ORGANIZATION_ADMIN,
        LOGIN_TYPES.SAP_USER,
        LOGIN_TYPES.SALES_SUPPORT_USER,
      ].includes(this.orgData?.login_type_id) && !this.isSapVerfiy
    );
  }

  onSelectChange(selectedId: any, key: string, options: any[]) {
    console.log(selectedId, 'selectedId');

    const option = options?.find(
      (item) => item._id === selectedId || item.value === selectedId,
    );
    if (!this.commercialSelData) {
      this.commercialSelData = {};
    }
    this.commercialSelData[`${key}`] = option?.label || '';
  }

  get hasAccountAccess(): boolean {
    return (
      [
        LOGIN_TYPES.ORGANIZATION_ADMIN,
        LOGIN_TYPES.SAP_USER,
        LOGIN_TYPES.SALES_SUPPORT_USER,
        LOGIN_TYPES.ACCOUNT_USER,
      ].includes(this.orgData?.login_type_id) && !this.isSapVerfiy
    );
  }

  get isDelete(): boolean {
    return (
      [
        LOGIN_TYPES.ORGANIZATION_ADMIN,
        LOGIN_TYPES.SAP_USER,
        LOGIN_TYPES.SALES_SUPPORT_USER,
      ].includes(this.orgData?.login_type_id) && !this.isSapVerfiy
    );
  }

  hasAddAccess(): boolean {
    const role = this.orgData?.login_type_name
      ?.toUpperCase()
      ?.replace(/\s+/g, '_');

    return (
      [
        this.LOGIN_TYPES.ORGANIZATION_ADMIN,
        this.LOGIN_TYPES.SALES_SUPPORT_USER,
        this.LOGIN_TYPES.SAP_USER,
      ].includes(role) && !this.isSapVerfiy
    );
  }

  checkedStates: Record<string, boolean> = {
    salesSupportInfo: false,
    salesPersonInfo: false,
    commercialTermsInfo: false,
  };

  allowedKeys: string[] = [
    'salesSupportInfo',
    'salesPersonInfo',
    'commercialTermsInfo',
  ];

  get areAllChecked(): boolean {
    return this.allowedKeys.every((key) => this.checkedStates[key]);
  }

  onSectionCheckChange(section: string, checked: boolean) {
    this.checkedStates[section] = checked;

    if (this.areAllChecked) {
      let body: any = document.querySelector('body');
      body.style.scrollBehavior = 'smooth';
      this.viewScroller.scrollToPosition([0, 0]);
    }
  }

  apiCall() {
    this.skLoading = true;

    forkJoin({
      /* ---------- SALES SUPPORT ---------- */

      sales_support: this.api.post(
        {
          login_type_id: 4,
        },
        'customer/sales-user-dropdown',
      ),

      /* ---------- SALES PERSON ---------- */

      sales_person: this.api.post(
        {
          login_type_id: 6,
        },
        'customer/sales-user-dropdown',
      ),

      /* ---------- ZONE ---------- */

      zone: this.api.post(
        {
          dropdown_name: 'zone',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      /* ---------- SUB ZONE ---------- */

      sub_zone: this.api.post(
        {
          dropdown_name: 'sub_zone',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      /* ---------- BUSINESS SEGMENT ---------- */

      business_segment: this.api.post(
        {
          dropdown_name: 'business_segment',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      /* ---------- CUSTOMER GROUP ---------- */

      customer_group: this.api.post(
        {
          dropdown_name: 'customer_group',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      /* ---------- DISCOUNT TYPE ---------- */

      discount_type: this.api.post(
        {
          dropdown_name: 'discount_type',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      /* ---------- PAYMENT TERM ---------- */

      payment_term: this.api.post(
        {
          dropdown_name: 'payment_term',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),
    }).subscribe({
      next: (res: any) => {
        this.salesSupportOptions = (res?.sales_support?.data ?? []).map(
          (x: any) => ({
            label: `${x.name} (${x.user_code})`,
            value: x._id,
            location: x.location_id?.option_name,
            zone: x.zone_id?.option_name,
          }),
        );

        this.salesPersonOptions = (res?.sales_person?.data ?? []).map(
          (x: any) => ({
            label: `${x.name} (${x.user_code})`,
            value: x._id,
            location: x.location_id?.option_name,
            zone: x.zone_id?.option_name,
          }),
        );
        this.subZoneOptions = res.sub_zone?.data ?? [];

        this.segmentOptions = (res.business_segment?.data ?? []).map(
          (x: any) => ({
            label: x.option_name,
            value: x._id,
          }),
        );

        this.customerGroupOptions = (res.customer_group?.data ?? []).map(
          (x: any) => ({
            label: x.option_name,
            value: x._id,
          }),
        );

        this.customerGroupOptions = res.customer_group?.data ?? [];
        this.discountTypeOptions = (res.discount_type?.data ?? []).map(
          (x: any) => ({
            label: x.option_name,
            value: x._id,
          }),
        );
        this.paymentTermsOptions = (res.payment_term?.data ?? []).map(
          (x: any) => ({
            label: x.option_name,
            value: x._id,
          }),
        );
      },

      error: () => {
        this.skLoading = false;
      },

      complete: () => {
        this.skLoading = false;
      },
    });
  }

  addSalesSupport() {
    if (this.salesSupportForm.valid) {
      const formValue = this.salesSupportForm.value;
      const payload = {
        customer_id: this.basicDetail?._id,
        data: [
          {
            sales_support_id: formValue.sales_support_id,
          },
        ],
      };
      const data = {};
      const noChanges = this.logService.logActivityOnUpdate(
        true,
        data,
        this.supportData,
        FORMIDCONFIG.ID.CUSTOMER,
        'Customers',
        'add',
        this.basicDetail._id || null,
        () => {},
      );
      if (noChanges) {
        this.api.disabled = false;
        this.toastr.warning('No changes detected', '', 'toast-top-right');
        return;
      }
      this.isSalesSupportLoading = true;
      this.api.post(payload, 'customer/sales-support/add').subscribe({
        next: (res: any) => {
          this.isSalesSupportLoading = false;
          if (res?.statusCode === 200) {
            this.toastr.success(res?.message, '', 'toast-top-right');
            this.salesSupportForm.reset();
            this.getSalesSupportList();
          }
        },
        error: () => {
          this.isSalesSupportLoading = false;
        },
      });
    } else {
      this.formValidation.markFormGroupTouched(this.salesSupportForm); // Call the global function
    }
  }

  addSalesPerson() {
    if (this.salesPersonForm.valid) {
      const formValue = this.salesPersonForm.value;
      const payload = {
        customer_id: this.basicDetail?._id,
        data: [
          {
            sales_person_id: formValue.sales_person_id,
            is_hod_approval_mail: formValue.is_hod_approval_mail || false,
          },
        ],
      };
      const data = {};
      const noChanges = this.logService.logActivityOnUpdate(
        true,
        data,
        {
          ...this.supportPersonData,
          is_hod_approval_mail: formValue.is_hod_approval_mail || false,
        },
        FORMIDCONFIG.ID.CUSTOMER,
        'Customers',
        'add',
        this.basicDetail._id || null,
        () => {},
      );
      if (noChanges) {
        this.api.disabled = false;
        this.toastr.warning('No changes detected', '', 'toast-top-right');
        return;
      }
      this.isSalesPersonLoading = true;
      this.api.post(payload, 'customer/sales-person/add').subscribe({
        next: (res: any) => {
          this.isSalesPersonLoading = false;
          if (res?.statusCode === 200) {
            this.toastr.success(res?.message, '', 'toast-top-right');
            this.salesPersonForm.reset();
            this.getSalesPersonList();
          }
        },
        error: () => {
          this.isSalesPersonLoading = false;
        },
      });
    } else {
      this.formValidation.markFormGroupTouched(this.salesPersonForm); // Call the global function
    }
  }

  getSalesSupportList() {
    const payload = {
      customer_id: this.basicDetail?._id,
    };

    this.api.post(payload, 'customer/sales-support-read').subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.salesSupportList = res.data.map((item: any) => ({
            ...item,
            isdelLoading: false,
          }));
        }
      },
    });
  }

delete(type: string, id: string, row: any) {
  this.alert
    .confirm(
      'Are you sure?',
      `You want to delete this ${type}?`,
      'Yes delete it!',
    )
    .then((result) => {
      if (result.isConfirmed) {
        row.isdelLoading = true;

        const payload = {
          customer_id: this.basicDetail?._id,
          _id: id,
        };

        const api =
          type === 'sales support'
            ? 'sales-support-remove'
            : 'sales-person-remove';

        this.api.patch(payload, `customer/${api}`).subscribe({
          next: (result) => {
            if (result['statusCode'] === 200) {

              const customerId = this.basicDetail?._id || '';

              console.log('Customer Id:', customerId); 

              this.logService.logActivityOnDelete(
                4,
                'Customer',
                'delete',
                customerId, 
                type + '-' + (row?.sales_support_id?.name || ''),
              );

              Swal.fire('Deleted Successfully', result.message, 'success');
              row.isdelLoading = false;

              if (type === 'sales support') {
                this.getSalesSupportList();
              } else {
                this.getSalesPersonList();
              }
            }
          },
          error: () => {
            row.isdelLoading = false;
          },
        });
      }
    });
}



  getSalesPersonList() {
    const payload = {
      customer_id: this.basicDetail?._id,
    };

    this.api.post(payload, 'customer/sales-person-read').subscribe({
      next: (res: any) => {
        if (res?.data) {
          this.salesPersonList = res.data.map((item: any) => ({
            ...item,
            isdelLoading: false,
          }));
        }
      },
    });
  }

  addCommercialTerms() {
    if (this.commercialTermsForm.valid) {
      const isHodApproval = this.salesPersonList.some(
        (item) => item?.is_hod_approval_mail === true,
      );
      if (this.salesSupportList.length === 0) {
        this.toastr.error('Add sales support first', '', 'toast-top-right');
        return;
      }
      if (this.salesPersonList.length === 0) {
        this.toastr.error('Add sales Person first', '', 'toast-top-right');
        return;
      }

      if (!isHodApproval) {
        this.toastr.error(
          'Please add at least one sales person with HOD approval.',
          '',
          'toast-top-right',
        );
        return;
      }

      const msg =
        this.pageType === 'edit'
          ? 'update this commercial terms'
          : 'add this commercial terms';

      this.alert
        .confirm(`Are you sure you want to ${msg}?`, '')
        .then((result) => {
          if (!result.isConfirmed) return;

          const isEditMode = this.pageType === 'edit';
          const httpMethod = isEditMode ? 'patch' : 'post';

          const data = {
            ...this.commercialSelData,
            credit_limit: this.commercialTermsForm?.value?.credit_limit,
          };

          if (isEditMode) {
            const noChanges = this.logService.logActivityOnUpdate(
              isEditMode,
              this.commercialOriginalData,
              data,
              FORMIDCONFIG.ID.CUSTOMER,
              'Customers',
              'update',
              this.basicDetail._id || null,
              () => {},
            );
            if (noChanges) {
              this.api.disabled = false;
              this.toastr.warning('No changes detected', '', 'toast-top-right');
              return;
            }
          }

          const apiUrl = isEditMode
            ? 'customer/commercial-terms/update'
            : 'customer/commercial-terms/add';

          const formValue = this.commercialTermsForm.getRawValue();
          if (!isEditMode) {
            delete formValue?._id;
          }
          const payload = {
            customer_id: this.basicDetail?._id,
            ...(isEditMode && { commercial_id: this.commercial_id }),
            ...(formValue && { data: formValue }),
          };

          this.isCommercialLoading = true;
          this.alert.loading();

          this.api[httpMethod](payload, apiUrl).subscribe({
            next: (res: any) => {
              this.isCommercialLoading = false;
              if (res?.statusCode === 200) {
                Swal.close();
                this.toastr.success(res.message, '', 'toast-top-right');
                this.refreshBasicDetail.emit();
              }
            },

            error: () => {
              this.toastr.error('Something went wrong', '', 'toast-top-right');
            },

            complete: () => {
              Swal.close();
              this.isCommercialLoading = false;
            },
          });
        });
    } else {
      this.formValidation.markFormGroupTouched(this.commercialTermsForm);
    }
  }

  approveVerification() {
    this.alert
      .confirm(
        'Are you sure you want to approve all the verification details?',
        '',
      )
      .then((result: any) => {
        if (result.isConfirmed) {
          this.alert.loading();
          const payload = {
            customer_id: this.basicDetail?._id,
            ...this.checkedStates,
            sales_support: this.areAllChecked,
          };

          this.api.post(payload, 'customer/verify-customer-info').subscribe({
            next: (result: any) => {
              if (result?.statusCode === 200) {
                Swal.close();
                this.toastr.success(result['message'], '', 'toast-top-right');
                this.refreshBasicDetail.emit();
              }
            },
            error: (err: any) => {
              this.toastr.error(
                err?.error?.message || 'Something went wrong',
                '',
                'toast-top-right',
              );

              console.error(err);
            },
          });
        }
      });
  }

  openModal(type: string, row?: any) {
    let data: any = '';
    const selectedFields = Object.fromEntries(
      Object.entries(this.checkedStates).filter(
        ([key, value]) => value && this.allowedKeys.includes(key),
      ),
    );
    const dialogRef = this.dialog.open(CustomerModalComponent, {
      width: '500px',
      data: {
        pageType: 'Sales Support',
        data: data,
        customer_id: this.basicDetail?._id,
        activeTab: this.activeTab,
        basicDetail: this.basicDetail,
        checkedStates: selectedFields,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.refreshBasicDetail.emit();
      }
    });
  }

  openRejectModal() {
    this.openModal('reject', 'Reject');
  }

  salesSupportColumns = [
    { label: 'Sales Support', table_class: '' },
    { label: 'Base Location', table_class: '' },
    { label: 'Zone', table_class: '' },
  ];

  salesPersonColumns = [
    { label: 'Sales Support', table_class: '' },
    { label: 'Base Location', table_class: '' },
    { label: 'Zone', table_class: '' },
    { label: 'HOD Approval', table_class: '' },
  ];

  commercialHeader = [
    { label: 'Business Segment', table_class: '' },
    { label: 'Customer Group', table_class: '' },
    { label: 'Discount Type', table_class: '' },
    { label: 'Payment Terms', table_class: '' },
    { label: 'Credit Limit', table_class: '' },
    { label: 'DMS Account', table_class: '' },
  ];
}
