import { Component, Input } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { SpkReusableTablesComponent } from '../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { ApiService } from '../../../core/services/api/api.service';
import { ComanFuncationService } from '../../../shared/services/comanFuncation.service';
import { ModuleService } from '../../../shared/services/module.service';
import { FORMIDCONFIG } from '../../../../config/formId.config';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import { LogService } from '../../../core/services/log/log.service';
import { SweetAlertService } from '../../../core/services/alert/sweet-alert.service';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { HighlightService } from '../../../shared/services/highlight.service';
import { RemoveSpaceService } from '../../../core/services/remove-space/removeSpace.service';
import { LOGIN_TYPES } from '../../../utility/constants';
import { AuthService } from '../../../shared/services/auth.service';
import { DateService } from '../../../shared/services/date.service';

@Component({
  selector: 'app-user-list',
  imports: [
    SharedModule,
    CommonModule,
    MaterialModuleModule,
    SpkReusableTablesComponent,
    FormsModule,
  ],
  templateUrl: './invite-list.component.html',
})
export class InviteListComponent {
  @Input() basicDetail!: any;
  page: any = 1;
  FORMID: any = FORMIDCONFIG;
  LOGIN_TYPES: any = LOGIN_TYPES;
  skLoading: boolean = false;
  activeTab: string = 'Pending';
  pagination: any = {};
  filter: any = {};
  mainTabs: any = [];
  modules: any = {};
  listingCount: any = {};
  listing: any = [];
  accessRight: any = {};
  customerType: any;
  customerTypeId: any;
  pageKey = 'invite-list';
  highlightedId: string | undefined;
  orgData: any;
  vendors: any[] = [];
  productHeaders: any[] = [];
  grandTotal = { purchase: 0, consume: 0, balance: 0 };

  filterData: any = {
    company_name: '',
    mobile: '',
  };
  constructor(
    public dialog: MatDialog,
    public api: ApiService,
    public comanFuncation: ComanFuncationService,
    public moduleService: ModuleService,
    public alert: SweetAlertService,
    private router: Router,
    private logService: LogService,
    public spaceRemove: RemoveSpaceService,
    public toastr: ToastrServices,
    private highlightService: HighlightService,
    public route: ActivatedRoute,
    private authService: AuthService,
    private dateService: DateService,
  ) {}

  ngOnInit() {
    this.getList();
  }

  onRefresh() {
    this.filter = {};
    this.getList();
  }

  onTabChange(tab: string) {
    this.activeTab = tab;
    this.pagination.cur_page = 1;
    this.getList();
  }

  goToAddPage() {
    this.router.navigate(['/apps/invite/invite-add']);
  }

  goToDetailPage(rowId: any) {
    this.router.navigate(['/apps/master/user/user-detail', rowId]);
  }

  changeToPagination(btnType: string) {
    if (btnType == 'Previous') {
      if (this.pagination.prev && this.pagination.cur_page > 1) {
        this.pagination.cur_page--; // Decrement the pagination.cur_page number
        this.getList();
      }
    } else {
      if (this.pagination.next) {
        this.pagination.cur_page++; // Increment the pagination.cur_page number
        this.getList();
      }
    }
  }

  changeToPage(newPage: number) {
    this.pagination.cur_page = newPage;
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
        {
          filters: this.filter,
          activeTab: this.activeTab,
          page: this.pagination.cur_page ?? 1,
        },
        'invitation/read',
      )
      .subscribe(
        (result: any) => {
          this.skLoading = false;

          if (result?.statusCode === 200) {
            this.listing = result?.data?.result || [];
            const tabCount = result?.data?.tabCount || {};

            this.mainTabs = [
              {
                name: 'Pending',
                label: 'Pending',
                icon: 'ri-time-fill',
                counts: tabCount.Pending || 0,
              },
              {
                name: 'Accepted',
                label: 'Accepted',
                icon: 'ri-user-follow-fill',
                counts: tabCount.Accepted || 0,
              },
              {
                name: 'Expired',
                label: 'Expired',
                icon: 'ri-close-circle-line',
                counts: tabCount.Expired || 0,
              },
            ];

            this.pagination = result?.data?.pagination || {};
          }
        },
        (error) => {
          this.skLoading = false;
          console.error(error);
        },
      );
  }

  onDeleteRow(rowId: any) {
    this.alert.confirm('Are you sure?').then((result) => {
      if (result.isConfirmed) {
        this.api
          .patch({ _id: rowId, is_delete: 1 }, 'user/delete')
          .subscribe((result) => {
            if (result['statusCode'] === 200) {
              //   Swal.fire('Deleted!', result.message, 'success');
              this.getList();
            }
          });
      }
    });
  }

  editPage(row: any) {
    const detail = row;
    this.router.navigate(['/apps/master/user/user-edit/' + row._id], {
      state: { detail },
    });
  }

  onToggleChange(newState: boolean, id: string, status: string) {
    this.comanFuncation
      .statusChange(newState, id, status, 'toggle', 'user/update-status')
      .subscribe((result: boolean) => {
        if (result) {
          this.getList();
        }
      });
  }

  PageHeaders = [
    { label: 'Created At', field: 'Created At' },
    { label: 'Created By', field: 'Created By' },
    { label: ' Customer Phone Number', field: 'Customer Phone Number' },
    { label: 'Customer Email ID', field: 'Customer Email ID' },
    { label: 'Customer Email CC', field: 'Customer Email CC' },
    { label: 'Invitation Sent', field: 'Invitation Sent' },
  ];
}
