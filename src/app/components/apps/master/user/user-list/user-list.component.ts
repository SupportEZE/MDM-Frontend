import { Component } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { SpkReusableTablesComponent } from '../../../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../../../core/services/api/api.service';
import { ComanFuncationService } from '../../../../../shared/services/comanFuncation.service';
import { ModuleService } from '../../../../../shared/services/module.service';
import { FORMIDCONFIG } from '../../../../../../config/formId.config';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MaterialModuleModule } from '../../../../../material-module/material-module.module';
import { LogService } from '../../../../../core/services/log/log.service';
import Swal from 'sweetalert2';
import { SweetAlertService } from '../../../../../core/services/alert/sweet-alert.service';
import { ToastrServices } from '../../../../../shared/services/toastr.service ';
import { LOGIN_TYPES } from '../../../../../utility/constants';
import { DateService } from '../../../../../shared/services/date.service';

@Component({
  selector: 'app-user-list',
  imports: [
    SharedModule,
    CommonModule,
    SpkReusableTablesComponent,
    MaterialModuleModule,
    FormsModule,
  ],
  templateUrl: './user-list.component.html',
})
export class UserListComponent {
  page: any = 1;
  FORMID: any = FORMIDCONFIG;
  skLoading: boolean = false;
  activeTab: any = LOGIN_TYPES.SALES_SUPPORT_USER;
  pagination: any = {};
  LOGIN_TYPES: any = LOGIN_TYPES;
  filter: any = {};
  pageKey = 'user-list';
  modules: any = {};
  listingCount: any = {};
  listing: any = [];
  accessRight: any = {};
  mainTabs = [
    {
      name: LOGIN_TYPES.SALES_SUPPORT_USER,
      label: 'Sales Support User',
      icon: 'ri-apps-fill',
    },
    {
      name: LOGIN_TYPES.SALES_PERSON_USER,
      label: 'Sales Person User',
      icon: 'ri-box-3-fill',
    },
    {
      name: LOGIN_TYPES.ACCOUNT_USER,
      label: 'Account User',
      icon: 'ri-box-3-fill',
    },
  ];
  constructor(
    public dialog: MatDialog,
    public api: ApiService,
    public comanFuncation: ComanFuncationService,
    public moduleService: ModuleService,
    public alert: SweetAlertService,
    private router: Router,
    private logService: LogService,
    private dateService: DateService,
    public toastr: ToastrServices,
  ) {}

  ngOnInit() {
    this.getList();
  }

  onRefresh() {
    this.filter = {};
    this.getList();
  }

  onTabChange(tab: any) {
    this.activeTab = tab;
    this.getList();
  }

  goToAddPage(type: string) {
    this.router.navigate(['/apps/master/user/user-add'], {
      queryParams: {
        ref: this.activeTab,
        type: type,
      },
    });
  }

  setHighLight(rowId: string) {
    this.comanFuncation.setHighLight(
      this.pageKey,
      rowId,
      this.activeTab,
      this.filter,
      this.pagination.cur_page ? this.pagination.cur_page : 1,
    );
  }

  goToDetail(rowId: any) {
    this.setHighLight(rowId);
    this.router.navigate(['/apps/master/user/user-detail/' + rowId], {
      queryParams: { _id: rowId, ref: this.activeTab },
    });
  }

  onDateChange(type: 'created_at', event: any) {
    if (event) {
      const formattedDate = this.dateService.formatToYYYYMMDD(event);
      this.filter[type] = formattedDate;
    } else {
      this.filter[type] = null;
    }
    if (this.filter.created_at) {
      this.getList();
    }
  }

  // -------- Pagination//

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
  // -------- Pagination//

  getList() {
    this.skLoading = true;
    this.api
      .post(
        {
          filters: this.filter,
          login_type_id: this.activeTab,
          page: this.pagination.cur_page ?? 1,
        },
        'user/read',
      )
      .subscribe((result) => {
        if (result['statusCode'] == 200) {
          this.skLoading = false;
          this.listing = result['data']['result'];
          this.listingCount = result['data']['statusTabs'];
          this.listing.forEach(
            (list: any) => (list.isChecked = list.status === 'Active'),
          );
          this.pagination = result['pagination'];
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

  get PageHeaders() {
    return [
      { label: 'Created Date' },
      { label: 'Created By' },
      { label: 'Name' },
      { label: 'Mobile No.' },
      { label: 'Code' },
      { label: 'Email ID' },
      { label: 'Department' },
      { label: 'Designation' },
      { label: 'Base Location' },
      { label: 'Zone' },

      ...(this.activeTab === LOGIN_TYPES.SALES_PERSON_USER ||
      this.activeTab === LOGIN_TYPES.SALES_SUPPORT_USER
        ? [{ label: 'Reporting Manager' }]
        : []),

      { label: 'Status' },
    ];
  }
}
