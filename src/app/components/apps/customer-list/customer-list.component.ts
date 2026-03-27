import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { SpkReusableTablesComponent } from '../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api/api.service';
import { ComanFuncationService } from '../../../shared/services/comanFuncation.service';
import { FORMIDCONFIG } from '../../../../config/formId.config';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import { SweetAlertService } from '../../../core/services/alert/sweet-alert.service';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { DateService } from '../../../shared/services/date.service';
import { InvoiceModalComponent } from '../sfa/accounts/invoice/invoice-modal/invoice-modal.component';
import { LOGIN_TYPES } from '../../../utility/constants';
import { AuthService } from '../../../shared/services/auth.service';
import { HighlightService } from '../../../shared/services/highlight.service';

@Component({
  selector: 'app-customer-list',
  imports: [
    SharedModule,
    CommonModule,
    SpkReusableTablesComponent,
    MaterialModuleModule,
    FormsModule,
  ],
  templateUrl: './customer-list.component.html',
})
export class CustomerListComponent {
  @Input() pageHeader: boolean = true;
  // @Input() _id!: any;

  page: any = 1;
  id: string = '';
  _id: string = '';
  invitation_id: string = '';
  LOGIN_TYPES: any = LOGIN_TYPES;
  FORMID: any = FORMIDCONFIG;
  skLoading: boolean = false;
  pagination: any = {};
  filter: any = {};
  listing: any = [];
  activeTab: any = 'Pending';
  listingCount: any = {};
  orgData: any;
  pageKey = 'stock';
  today = new Date();
  statusOptions = [{ name: 'Recieved' }, { name: 'Reject' }];

  mainTabs = [
    {
      name: 'Pending',
      label: 'Pending',
      icon: 'ri-apps-fill',
    },
    {
      name: 'Approved',
      label: 'Approved',
      icon: 'ri-box-3-fill',
    },
  ];

  constructor(
    public dialog: MatDialog,
    public api: ApiService,
    public comanFuncation: ComanFuncationService,
    public alert: SweetAlertService,
    private router: Router,
    public route: ActivatedRoute,
    public toastr: ToastrServices,
    private dateService: DateService,
    private authService: AuthService,
    private highlightService: HighlightService,
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
    this.orgData = this.authService.getUser();

    this.getList();
  }

  ngOnChanges() {
    this.getList();
  }

  onTabChange(tab: any) {
    this.activeTab = tab;
    this.getList();
  }

  setHighLight(rowId: string) {
    this.comanFuncation.setHighLight(
      this.pageKey,
      rowId,
      '',
      this.filter,
      this.pagination.cur_page ? this.pagination.cur_page : 1,
    );
  }

  onRefresh() {
    this.filter = {};
    this.getList();
  }

  goToAddPage() {
    this.router.navigate(['/apps/customers/customer-add'], {});
  }

  goToDetailPage(rowId: string) {
    this.setHighLight(rowId);
    this.router.navigate(['/apps/customers/customer-detail', rowId]);
  }

  changeToPage(page: number) {
    this.pagination.cur_page = page;
    this.getList(); // API call with the updated page
  }

  changeToPagination(action: string) {
    if (
      action === 'Next' &&
      this.pagination.cur_page < this.pagination.total_pages
    ) {
      this.pagination.cur_page++;
    } else if (action === 'Previous' && this.pagination.cur_page > 1) {
      this.pagination.cur_page--;
    }
    this.getList();
  }

  onDateChange(type: 'billing_date' | 'created_at', event: any) {
    if (event) {
      const formattedDate = this.dateService.formatToYYYYMMDD(event); // Convert date to YYYY-MM-DD
      this.filter[type] = formattedDate;
    } else {
      this.filter[type] = null; // Reset the value if cleared
    }
    if (this.filter.billing_date || this.filter.created_at) {
      this.getList();
    }
  }

  getList() {
    this.skLoading = true;

    this.api
      .post(
        { filters: this.filter, sap_status: this.activeTab },
        'customer/read',
      )
      .subscribe(
        (result: any) => {
          this.skLoading = false;

          if (result?.statusCode === 200) {
            this.listing = result.data || [];
            this.pagination = result['pagination'];
          }
        },
        () => {
          this.skLoading = false;
        },
      );
  }

  inviteValidation() {
    this.skLoading = true;

    this.api.post({ _id: this._id }, 'invitation/validate').subscribe(
      (result: any) => {
        this.skLoading = false;

        if (result?.statusCode === 200) {
            }
      },
      () => {
        this.skLoading = false;
      },
    );
  }

  getColumns(): any[] {
    return [
      { label: 'Created At' },
      { label: 'GST IN' },
      { label: 'Company Name' },
      { label: 'Company Type' },
      { label: 'Bill to State' },
      { label: 'Contact Person Name' },
      { label: 'Contact Person Number' },
    ];
  }
}
