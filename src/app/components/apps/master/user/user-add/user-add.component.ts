import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MaterialModuleModule } from '../../../../../material-module/material-module.module';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../../../core/services/api/api.service';
import { ToastrServices } from '../../../../../shared/services/toastr.service ';
import { CommonApiService } from '../../../../../shared/services/common-api.service';
import { DateService } from '../../../../../shared/services/date.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleService } from '../../../../../shared/services/module.service';
import { UploadFileService } from '../../../../../shared/services/upload.service';
import { FormValidationService } from '../../../../../utility/form-validation';
import { SpkInputComponent } from '../../../../../../@spk/spk-input/spk-input.component';
import { SpkNgSelectComponent } from '../../../../../../@spk/spk-ng-select/spk-ng-select.component';
import { AuthService } from '../../../../../shared/services/auth.service';
import { FORMIDCONFIG } from '../../../../../../config/formId.config';
import { forkJoin } from 'rxjs';
import { LOGIN_TYPES } from '../../../../../utility/constants';
import { LogService } from '../../../../../core/services/log/log.service';
import { SweetAlertService } from '../../../../../core/services/alert/sweet-alert.service';

@Component({
  selector: 'app-user-add',
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    MaterialModuleModule,
    SpkInputComponent,
    SpkNgSelectComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './user-add.component.html',
})
export class UserAddComponent {
  userForm: FormGroup = new FormGroup({});
  pageType: any = 'add';
  skLoading: boolean = false;
  districtList: any = [];
  @Output() valueChange = new EventEmitter<any>();
  id: any;
  activeTab: number = 0;
  LOGIN_TYPES = LOGIN_TYPES;
  pageRef: number = 0;
  showReportingManager: boolean = false;
  zoneOptions: any[] = [];
  subZoneOptions: any[] = [];
  reportingManagerOptions: any[] = [];
  originalData: any = {};

  constructor(
    public api: ApiService,
    public toastr: ToastrServices,
    public CommonApiService: CommonApiService,
    private fb: FormBuilder,
    private router: Router,
    public route: ActivatedRoute,
    public alert: SweetAlertService,
    public formValidation: FormValidationService,
    private logService: LogService,
  ) {}

  ngOnInit() {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      mobile: ['', Validators.required],
      email: [''],
      user_code: ['', Validators.required],
      department: ['', Validators.required],
      designation: ['', Validators.required],
      location_id: ['', Validators.required],
      zone_id: ['', Validators.required],
      reporting_manager_id: [''],
    });

    this.route.queryParams.subscribe((params) => {
      this.pageRef = Number(params['ref']) || 0;
      this.pageType = params['type'] || '';

      this.showReportingManager =
        this.pageRef === LOGIN_TYPES.SALES_PERSON_USER ||
        this.pageRef === LOGIN_TYPES.SALES_SUPPORT_USER;

      if (this.pageType === 'edit' && params['_id']) {
        this.id = params['_id'];
      }

      if (this.showReportingManager) {
        this.userForm.get('reporting_manager_id')?.clearValidators();
        this.userForm.get('reporting_manager_id')?.updateValueAndValidity();
      }
    });

    const nav = this.router.getCurrentNavigation();
    const detailData = nav?.extras?.state?.['detail'] || history.state?.detail;

    if (detailData) {
      this.id = detailData._id;
      this.pageType = 'edit';

      this.originalData = {
        ...detailData,
        location_id: detailData.location_id?._id,
        zone_id: detailData.zone_id?._id,
        reporting_manager_id: detailData.reporting_manager_id?._id,
      };

      this.userForm.patchValue({
        ...detailData,
        location_id: detailData.location_id?._id,
        zone_id: detailData.zone_id?._id,
        reporting_manager_id: detailData.reporting_manager_id?._id,
      });
    } else if (this.id) {
      this.getDetail();
    }

    this.apiCall();
  }

  getDetail() {
    this.api.post({ _id: this.id }, 'user/detail').subscribe((res: any) => {
      if (res?.statusCode === 200) {
        const data = res.data;

        this.originalData = {
          ...data,
          location_id: data.location_id?._id,
          zone_id: data.zone_id?._id,
          reporting_manager_id: data.reporting_manager_id?._id,
        };

        this.userForm.patchValue({
          ...data,
          location_id: data.location_id?._id,
          zone_id: data.zone_id?._id,
          reporting_manager_id: data.reporting_manager_id?._id,
        });
      }
    });
  }

  getLabelFromOptions(value: any, options: any[]) {
    return options?.find((item) => item.value === value)?.label || value;
  }

  apiCall() {
    this.skLoading = true;

    forkJoin({
      zone: this.api.post(
        {
          dropdown_name: 'zone',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      sub_zone: this.api.post(
        {
          dropdown_name: 'sub_zone',
          module_id: FORMIDCONFIG.ID.CUSTOMER,
        },
        'dropdown/read-option',
      ),

      reporting_manager_id: this.api.post(
        {
          login_type_id: this.pageRef,
        },
        'customer/sales-user-dropdown',
      ),
    }).subscribe({
      next: (res: any) => {
        this.zoneOptions = (res.zone?.data ?? []).map((x: any) => ({
          label: x.option_name,
          value: x._id,
        }));

        this.subZoneOptions = (res.sub_zone?.data ?? []).map((x: any) => ({
          label: x.option_name,
          value: x._id,
        }));

        this.reportingManagerOptions = (
          res.reporting_manager_id?.data ?? []
        ).map((x: any) => ({
          label: `${x.name} (${x.user_code})`,
          value: x._id,
        }));
      },
      error: () => {
        this.skLoading = false;
      },
      complete: () => {
        this.skLoading = false;
      },
    });
  }

  onSingleSelectChange(value: any, type?: any) {
    if (type === 'state') {
      this.getDistrict(value);
    }
  }

  getDistrict(state: string) {
    this.api
      .post({ state: state }, 'postal-code/districts')
      .subscribe((result) => {
        if (result['statusCode'] == 200) {
          this.districtList = result['data'];
        }
      });
  }

  onValueChange(event: any, type?: string) {
    const valueStr = event?.toString(); // Convert to string
    if (valueStr.length === 6 && type === 'pincode') {
      this.getPostalMaster(event);
    }
    this.valueChange.emit(event);
  }

  getPostalMaster(pincode: any) {
    this.api
      .post({ pincode: pincode }, 'postal-code/read-using-pincode')
      .subscribe((result) => {
        if (result['statusCode'] == 200) {
          this.userForm.controls['state'].setValue(result['data']['state']);
          this.getDistrict(result['data']['state']);
          this.userForm.controls['district'].setValue(
            result['data']['district'],
          );
          this.userForm.controls['city'].setValue(result['data']['city']);
        }
      });
  }

  onSearch(search: string, type: string) {
    if (type === 'state') {
      this.CommonApiService.getStates(search);
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

  onSubmit() {
    if (!this.userForm.valid) {
      this.formValidation.markFormGroupTouched(this.userForm);
      this.userForm.updateValueAndValidity();
      this.scrollToFirstInvalidControl();
      return;
    }

    this.alert
      .confirm('Are you sure you want to save this form?', '', 'Save User')
      .then((result) => {
        if (!result.isConfirmed) return;

        const isEditMode = this.pageType === 'edit';

        const map = (data: any) => ({
          ...data,
          location_id: this.getLabelFromOptions(
            data.location_id,
            this.zoneOptions,
          ),
          zone_id: this.getLabelFromOptions(data.zone_id, this.subZoneOptions),
          reporting_manager_id: this.getLabelFromOptions(
            data.reporting_manager_id,
            this.reportingManagerOptions,
          ),
        });

        if (isEditMode) {
          const noChanges = this.logService.logActivityOnUpdate(
            true,
            map(this.originalData),
            map(this.userForm.getRawValue()),
            FORMIDCONFIG.ID.USER,
            'Users',
            'update',
            this.originalData?._id,
          );

          if (noChanges) {
            this.toastr.warning('No changes detected', '', 'toast-top-right');
            return;
          }
        }

        this.api.disabled = true;

        this.formValidation.removeEmptyFields(this.userForm.value);

        const httpMethod = isEditMode ? 'patch' : 'post';
        const functionName = isEditMode ? 'user/update' : 'user/create';

        if (isEditMode) {
          this.userForm.value._id = this.id;
        }

        const requestData = {
          ...this.userForm.value,
          login_type_id: Number(this.pageRef),
          ...(isEditMode && { row_id: this.id }),
        };

        this.api[httpMethod](requestData, functionName).subscribe({
          next: (res: any) => {
            if (res?.statusCode === 200) {
              this.toastr.success(res.message, '', 'toast-top-right');
              this.router.navigate(['/apps/master/user']);
              this.userForm.reset();
            }
          },
          error: () => {
            this.toastr.error('Validation failed', '', 'toast-top-right');
          },
          complete: () => {
            this.api.disabled = false;
          },
        });
      });
  }
}
