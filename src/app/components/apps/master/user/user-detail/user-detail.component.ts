import { Component } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { GalleryModule } from '@ks89/angular-modal-gallery';
import { ShowcodeCardComponent } from '../../../../../shared/components/showcode-card/showcode-card.component';
import { MaterialModuleModule } from '../../../../../material-module/material-module.module';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../../../core/services/api/api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FORMIDCONFIG } from '../../../../../../config/formId.config';
import { ModuleService } from '../../../../../shared/services/module.service';
import { ComanFuncationService } from '../../../../../shared/services/comanFuncation.service';
import { LogService } from '../../../../../core/services/log/log.service';

@Component({
  selector: 'app-user-detail',
  imports: [
    SharedModule,
    GalleryModule,
    ShowcodeCardComponent,
    CommonModule,
    MaterialModuleModule,
  ],
  templateUrl: './user-detail.component.html',
})
export class UserDetailComponent {
  submodule: any;
  FORMID: any = FORMIDCONFIG;
  skLoading: boolean = false;
  detailId: any;
  pageRef: number = 0;
  detail: any = {};
  logList: any = [];
  accessRight: any = {};

  constructor(
    public api: ApiService,
    public comanFuncation: ComanFuncationService,
    private moduleService: ModuleService,
    private router: Router,
    public route: ActivatedRoute,
    private logService: LogService,
  ) {}

  ngOnInit() {
    const accessRight = this.moduleService.getAccessMap('User');

    if (accessRight) {
      this.accessRight = accessRight;
    }
    this.route.queryParams.subscribe((params) => {
      this.detailId = params['_id'];
      this.pageRef = params['ref'] || 0;
      if (this.detailId) {
        this.getDetail();
      }
    });
  }

  getDetail() {
    this.skLoading = true;

    this.api
      .post({ _id: this.detailId }, 'user/detail')
      .subscribe((result: any) => {
        this.skLoading = false;

        if (result?.statusCode === 200) {
          this.detail = result?.data;
          this.logService.getLogs(
            FORMIDCONFIG.ID.USER,
            (logs) => {
              this.logList = logs;
            },
            this.detailId,
          );
        }
      });
  }

  onToggleChange(newState: boolean, id: string, status: string) {
    const originalData = { status: this.detail.status };
    const newStatus = newState ? 'Active' : 'Inactive';
    const updatedData = { status: newStatus };

    this.comanFuncation
      .statusChange(newState, id, status, 'toggle', 'user/update-status')
      .subscribe((result: boolean) => {
        if (result) {
          this.logService.logActivityOnUpdate(
            true,
            originalData,
            updatedData,
            FORMIDCONFIG.ID.USER,
            'Users',
            'update',
            id,
          );

          this.getDetail();
        }
      });
  }

  editPage(event: any) {
    const detail = this.detail;
    this.router.navigate(['/apps/master/user/user-edit/'], {
      queryParams: { _id: this.detailId, ref: this.pageRef, type: 'edit' },
      state: { detail },
    });
  }
}
