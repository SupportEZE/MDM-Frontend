import { Component } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { GalleryModule } from '@ks89/angular-modal-gallery';
import { ShowcodeCardComponent } from '../../../shared/components/showcode-card/showcode-card.component';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import { CommonModule, ViewportScroller } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FORMIDCONFIG } from '../../../../config/formId.config';
import { SpkProductCardComponent } from '../../../../@spk/reusable-apps/spk-product-card/spk-product-card.component';
import { ApiService } from '../../../core/services/api/api.service';
import { SpkReusableTablesComponent } from '../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { InvoiceModalComponent } from '../sfa/accounts/invoice/invoice-modal/invoice-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../shared/services/auth.service';
import { LOGIN_TYPES } from '../../../utility/constants';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { FormsModule } from '@angular/forms';
import { SweetAlertService } from '../../../core/services/alert/sweet-alert.service';
import { CustomerModalComponent } from '../customer/customer-modal/customer-modal.component';
import { ComanFuncationService } from '../../../shared/services/comanFuncation.service';
import { AccountAddComponent } from '../customer/account/account-add/account-add.component';
import { ModuleDropdownComponent } from '../../../shared/components/module-dropdown/module-dropdown.component';
import { SalesSupportAddComponent } from '../customer/sales-support/sales-support/sales-support-add.component';
import { SalesHodAddComponent } from '../customer/sales-hod/sales-hod-add/sales-hod-add.component';
import { VerifiedComponent } from '../customer/verified/verified/verified.component';
import { LogsComponent } from '../../../shared/components/logs/logs.component';
import { LogService } from '../../../core/services/log/log.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customer-detail',
  imports: [
    SharedModule,
    GalleryModule,
    ShowcodeCardComponent,
    CommonModule,
    MaterialModuleModule,
    SpkReusableTablesComponent,
    SpkProductCardComponent,
    AccountAddComponent,
    SalesSupportAddComponent,
    SalesHodAddComponent,
    VerifiedComponent,
    LogsComponent,
    FormsModule,
  ],
  templateUrl: './customer-detail.component.html',
})
export class CustomerDetailComponent {
  activeTab: string = 'Basic Detail';
  LOGIN_TYPES: any = LOGIN_TYPES;
  skLoading: boolean = false;
  DetailId: any;
  loginType: any = [];
  verificationId: any;
  Detail: any = {};
  orgData: any;
  mainTabs: any = [];
  customerType: any;
  accessRight: any = {};
  document: any = [];
  customerTypeId: any;
  customerLoginType: any;
  customerLoginTypeId: any;
  customerId: any;

  allDetails: any = {};
  submodule: any;
  documentUploaded: boolean = false;
  adharUploaded: boolean = false;
  isHodVerification: boolean = false;
  basicDetail: any = {};
  logList: any = [];
  showRestOfLogs: boolean = false;

  get filteredLogList() {
    return this.showRestOfLogs ? this.logList : this.logList.slice(0, 5);
  }

  onRestOfLogsChange(checked: boolean) {
    this.showRestOfLogs = checked;
  }

  checkedStates: Record<string, boolean> = {
    basicInfo: false,
    contactPerson: false,
    billTo: false,
    shipTo: false,
    bankInfo: false,
    taxInfo: false,
    documentInfo: false,
  };

  allowedKeys: string[] = [
    'basicInfo',
    'contactPerson',
    'billTo',
    'shipTo',
    'bankInfo',
    'taxInfo',
    'documentInfo',
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

  constructor(
    public api: ApiService,
    private router: Router,
    public comanFun: ComanFuncationService,
    public route: ActivatedRoute,
    public dialog: MatDialog,
    private authService: AuthService,
    public toastr: ToastrServices,
    public alert: SweetAlertService,
    private logService: LogService,
    private viewScroller: ViewportScroller,
  ) {}

  ngOnInit() {
    this.orgData = this.authService.getUser();
    console.log(this.orgData, 'orgData');
    this.route.paramMap.subscribe((paramMap) => {
      this.DetailId = paramMap.get('id');
      this.verificationId =
        this.route.snapshot.queryParamMap.get('verification_id');

      if (this.verificationId) {
        this.isHodVerification = true;
      }

      if (this.DetailId) {
        this.getDetail();
      }
    });
  }

  get isShowTabs(): boolean {
    return [LOGIN_TYPES.ORGANIZATION_ADMIN, LOGIN_TYPES.SAP_USER].includes(
      this.orgData?.login_type_id,
    );
  }

  get canShowCheckbox(): boolean {
    return [LOGIN_TYPES.ORGANIZATION_ADMIN, LOGIN_TYPES.SAP_USER].includes(
      this.orgData?.login_type_id,
    );
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
        pageType: 'Basic Detail',
        data: data,
        customer_id: this.DetailId,
        activeTab: this.activeTab,
        basicDetail: this.basicDetail,
        checkedStates: selectedFields,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === true) {
        this.getDetail();
      }
    });
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
            customer_id: this.DetailId,
            ...this.checkedStates,
            basic_detail: this.areAllChecked,
          };

          this.api.post(payload, 'customer/verify-customer-info').subscribe({
            next: (result: any) => {
              if (result?.statusCode === 200) {
                Swal.close();
                this.toastr.success(result['message'], '', 'toast-top-right');
                this.getDetail();
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

  openRejectModal() {
    this.openModal('profile_status', 'Reject');
  }

  getDetail() {
    this.skLoading = true;

    this.api.post({ _id: this.DetailId }, 'customer/detail').subscribe(
      (result: any) => {
        this.skLoading = false;

        if (result?.statusCode === 200) {
          this.Detail = result?.data?.detail || result?.data;

          this.document = result?.['data']?.['files'] ?? [];
          if (!this.isHodVerification) {
            this.logService.getLogs(
              FORMIDCONFIG.ID.CUSTOMER,
              (logs) => {
                this.logList = logs;
              },
              this.DetailId ? this.DetailId : '',
            );
          }

          this.mainTabs = [
            {
              name: 'Basic Detail',
              label: 'Basic Detail',
              icon: 'ri-user-3-fill',
            },

            {
              name: 'Sales Support',
              label: 'Sales Support',
              icon: 'ri-team-fill',
            },

            {
              name: 'HOD',
              label: 'HOD',
              icon: 'ri-shield-user-fill',
            },

            ...(this.isShowTabs
              ? [
                  {
                    name: 'SAP Verified',
                    label: 'SAP Verified',
                    icon: 'ri-verified-badge-fill',
                  },
                ]
              : []),
          ];

          if (this.Detail?.verified_info) {
            this.checkedStates = {
              ...this.checkedStates,
              ...this.Detail.verified_info,
            };
          }
        }
      },
      (error) => {
        this.skLoading = false;
        console.error(error);
      },
    );
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.getDetail();
  }

  docRemove(id: string) {
    this.alert
      .confirm('Are you sure?', 'You want to delete this document?', 'Yes it!')
      .then((result) => {
        if (result.isConfirmed) {
          this.api
            .patch(
              {
                _id: id,
              },
              'customer/delete-docs',
            )
            .subscribe((result) => {
              if (result['statusCode'] === 200) {
                this.getDetail();
                this.toastr.success(result['message'], '', 'toast-top-right');
              }
            });
        }
      });
  }

  delete(id: string, api: string, label: string) {
    this.comanFun
      .delete(id, this.submodule, label, api, 'single_action', this.customerId)
      .subscribe((result: boolean) => {
        if (result === true) {
          this.getDetail();
        }
      });
  }

  verifyCustomer(status: string) {
    const payload = {
      customer_id: this.DetailId,
      verification_id: this.verificationId,
    };

    this.skLoading = true;

    this.api.post(payload, 'customer/verify-customer-info').subscribe({
      next: (result: any) => {
        if (result?.statusCode === 200) {
          this.toastr.success(result['message'], '', 'toast-top-right');
        }
        this.toastr.error('Invalid Account', '', {
          positionClass: 'toast-top-right',
        });
      },

      complete: () => {
        this.skLoading = false;
      },
    });
  }

  isShow() {
    return (
      !this.isSapVerfiy &&
      [LOGIN_TYPES.SAP_USER, LOGIN_TYPES.ORGANIZATION_ADMIN].includes(
        this.orgData?.login_type_id,
      )
    );
  }
  goToDetail() {
    this.router.navigate(['/apps/customers/customer-edit/edit', this.DetailId]);
  }

  get isAccountLogin(): boolean {
    return (
      [
        LOGIN_TYPES.ORGANIZATION_ADMIN,
        LOGIN_TYPES.ACCOUNT_USER,
        LOGIN_TYPES.SAP_USER,
      ].includes(this.orgData?.login_type_id) && !this.isSapVerfiy
    );
  }

  get isSapVerfiy(): boolean {
    return (
      this.Detail?.verified_info?.basic_detail &&
      this.Detail?.verified_info?.sales_support &&
      this.Detail?.sap_status?.toLowerCase() === 'approved'
    );
  }
}
