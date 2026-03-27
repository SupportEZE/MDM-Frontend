import { Component, EventEmitter, Output } from '@angular/core';
import { SharedModule } from '../../../shared/shared.module';
import { CommonModule } from '@angular/common';
import { MaterialModuleModule } from '../../../material-module/material-module.module';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../../core/services/api/api.service';
import { ToastrServices } from '../../../shared/services/toastr.service ';
import { CommonApiService } from '../../../shared/services/common-api.service';
import { DateService } from '../../../shared/services/date.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ModuleService } from '../../../shared/services/module.service';
import { UploadFileService } from '../../../shared/services/upload.service';
import { FormValidationService } from '../../../utility/form-validation';
import { SpkInputComponent } from '../../../../@spk/spk-input/spk-input.component';
import { SpkNgSelectComponent } from '../../../../@spk/spk-ng-select/spk-ng-select.component';
import { AuthService } from '../../../shared/services/auth.service';
import { RemoveSpaceService } from '../../../core/services/remove-space/removeSpace.service';
import { LOGIN_TYPES } from '../../../utility/constants';

@Component({
  selector: 'app-invite-add',
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    MaterialModuleModule,
    SpkInputComponent,
    SpkNgSelectComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './invite-add.component.html',
})
export class InviteAddComponent {
  LOGIN_TYPES: any = LOGIN_TYPES;
  customerForm: FormGroup = new FormGroup({});
  pageType: any = 'add';
  skLoading: boolean = false;
  districtList: any = [];
  customerType: any;
  filter: any = {};
  listingCount: any = {};
  listing: any = [];
  emailCcList: string[] = [];
  customerTypeId: any;
  id: any;
  customer_code?: string;
  @Output() valueChange = new EventEmitter<any>();

  constructor(
    public api: ApiService,
    public toastr: ToastrServices,
    public CommonApiService: CommonApiService,
    private fb: FormBuilder,
    public spaceRemove: RemoveSpaceService,
    private router: Router,
    public route: ActivatedRoute,
    public formValidation: FormValidationService,
  ) {}

  ngOnInit() {
    this.customerForm = this.fb.group({
      mobile: [
        '',
        [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
        ],
      ],
      email: ['', [Validators.required, Validators.email]],
      email_cc: [''],
    });
  }

 onSubmit() {
    this.customerForm.get('mobile')?.markAsTouched();
    this.customerForm.get('email')?.markAsTouched();
    this.customerForm.get('email_cc')?.markAsTouched();
    if (
      this.customerForm.get('mobile')?.invalid ||
      this.customerForm.get('email')?.invalid ||
      this.customerForm.get('email_cc')?.invalid
    ) {
      return;
    }

    this.api.disabled = true;

    const payload = {
      mobile: this.customerForm.value.mobile,
      email: this.customerForm.value.email,
      email_cc: this.customerForm.value.email_cc
        ? this.customerForm.value.email_cc
            .split(',')
            .map((e: string) => e.trim())
        : [],
    };

    this.api.post(payload, 'invitation/create').subscribe(
      (result) => {
        this.api.disabled = false;
        if (result?.statusCode === 200) {
          this.toastr.success(result.message, '', 'toast-top-right');
          this.customerForm.reset();
          this.router.navigate(['/apps/invite/invite-list']);
        }
      },
      () => {
        this.api.disabled = false;
      },
    );
  }

  formatEmails(value: string): string {
    if (!value) return '';

    return value
      .split(',')
      .map((e: string) => e.trim())
      .filter((e: string) => e.length > 0)
      .join(',');
  }
}
