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
import { CommonModule } from '@angular/common';
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
import { AccountAddComponent } from '../../account/account-add/account-add.component';
import { MatRadioModule } from '@angular/material/radio';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sales-hod-add',
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
    ShowcodeCardComponent,
    MatRadioModule,
  ],
  templateUrl: './sales-hod-add.component.html',
})
export class SalesHodAddComponent {
  @Input() basicDetail!: any;
  @Input() verificationId!: any;
  @Input() isSapVerfiy: boolean = false;
  @Output() refreshBasicDetail = new EventEmitter<void>();
  skLoading: boolean = false;
  pageType: any = 'add';
  sales_hod_verification_id: string | null = null;
  isHod: boolean = false;
  salesHodForm!: FormGroup;

  statusOptions: any[] = [
    { label: 'Approve', value: 'Approve' },
    { label: 'Reject', value: 'Reject' },
  ];

  constructor(
    public api: ApiService,
    public formValidation: FormValidationService,
    public comanFuncation: ComanFuncationService,
    private fb: FormBuilder,
    private router: Router,
    private alert: SweetAlertService,
    private toastr: ToastrServices,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const verificationId =
      this.route.snapshot.queryParamMap.get('verification_id');

    if (verificationId) {
      this.sales_hod_verification_id = verificationId;
    }

    this.isHod = !!this.sales_hod_verification_id;

    // Form initialize
    this.salesHodForm = this.fb.group({
      sales_hod_status: [null, Validators.required],
      sales_hod_remark: [''],
    });

    this.salesHodForm
      .get('sales_hod_status')
      ?.valueChanges.subscribe((status) => {
        const remarkControl = this.salesHodForm.get('sales_hod_remark');

        if (status === 'Reject') {
          remarkControl?.setValidators([Validators.required]);
        } else {
          remarkControl?.clearValidators();
          remarkControl?.setValue('');
        }

        remarkControl?.updateValueAndValidity();
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!this.salesHodForm) return;

    if (changes['basicDetail']?.currentValue) {
      this.basicDetail = changes['basicDetail'].currentValue;

      const isHod = !!this.sales_hod_verification_id;
      this.salesHodForm.patchValue({
        sales_hod_status: this.basicDetail?.sales_hod_status || null,
        sales_hod_remark: this.basicDetail?.sales_hod_remark,
      });

      if (isHod) {
        this.salesHodForm.enable();
      } else {
        this.salesHodForm.disable();
      }
    }
  }

  onSubmit() {
    if (this.salesHodForm.valid) {
      this.alert
        .confirm(`Are you sure you want to update status?`, '')
        .then((result) => {
          if (!result.isConfirmed) return;
          this.api.disabled = true;
          this.formValidation.removeEmptyFields(this.salesHodForm.value);
          const isEditMode = this.pageType === 'edit';
          const requestData = {
            ...this.salesHodForm.getRawValue(),
            ...(this.basicDetail?._id && {
              customer_id: this.basicDetail._id,
            }),
            ...(this.verificationId && {
              verification_id: this.verificationId,
            }),
          };
          this.api.post(requestData, 'customer/update-sales-hod').subscribe({
            next: (result: any) => {
              if (result?.statusCode === 200) {
                this.refreshBasicDetail.emit();
                this.toastr.success(result.message, '', 'toast-top-right');
                this.router.navigate(['/apps/thank-you', 'hod']);
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
      this.formValidation.markFormGroupTouched(this.salesHodForm); // Call the global function
    }
  }
}
