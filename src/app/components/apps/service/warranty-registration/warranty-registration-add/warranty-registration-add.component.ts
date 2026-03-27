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
import { ApiService } from '../../../../../core/services/api/api.service';
import { ToastrServices } from '../../../../../shared/services/toastr.service ';
import { CommonApiService } from '../../../../../shared/services/common-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadFileService } from '../../../../../shared/services/upload.service';
import { FormValidationService } from '../../../../../utility/form-validation';
import { SpkNgSelectComponent } from '../../../../../../@spk/spk-ng-select/spk-ng-select.component';
import { SpkReusableTablesComponent } from '../../../../../../@spk/spk-reusable-tables/spk-reusable-tables.component';
import { FilePondModule } from 'ngx-filepond';
import { ComanFuncationService } from '../../../../../shared/services/comanFuncation.service';
import { HighlightService } from '../../../../../shared/services/highlight.service';
import { SweetAlertService } from '../../../../../core/services/alert/sweet-alert.service';
@Component({
  selector: 'app-warranty-registration-add',
  imports: [
    FormsModule,
    CommonModule,
    SharedModule,
    MaterialModuleModule,
    SpkNgSelectComponent,
    ReactiveFormsModule,
    SpkReusableTablesComponent,
    FilePondModule,
  ],
  templateUrl: './warranty-registration-add.component.html',
})
export class WarrantyRegistrationAddComponent {
  addForm: FormGroup = new FormGroup({});
  pageType: any = 'add';
  @Output() valueChange = new EventEmitter<any>();
  today = new Date();
  warranty_items: any = [];
  pondFiles: any[] = [];
  customer_id: any;
  pageKey = 'warranty-registration';
  activeTab: any = 'Warranty Registration';
  pondBannerFiles1: any[] = []; // For "Complete Site Images"
  pondBannerFiles2: any[] = []; // For "Clear Project Photo"
  constructor(
    public api: ApiService,
    public toastr: ToastrServices,
    public CommonApiService: CommonApiService,
    private fb: FormBuilder,
    private router: Router,
    public route: ActivatedRoute,
    private formValidation: FormValidationService,
    private uploadService: UploadFileService,
    public comanFuncation: ComanFuncationService,
    private highlightService: HighlightService,
    public alert: SweetAlertService,
  ) {}

  ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    let highlight = this.highlightService.getHighlight(this.pageKey);
    if (highlight != undefined) {
      this.activeTab = highlight.tab;
      this.highlightService.clearHighlight(this.pageKey);
    }
    this.addForm = new FormGroup({
      site_id: new FormControl('', Validators.required),
      site_name: new FormControl(''),
      invoice_number: new FormControl(''),
      invoice_id: new FormControl(''),
      user_id: new FormControl('', Validators.required),
      user_name: new FormControl(''),
      warranty_date: new FormControl('', Validators.required),
      po_no: new FormControl('', Validators.required),
      ro_code: new FormControl('', Validators.required),
      ro_name: new FormControl('', Validators.required),
      application_type: new FormControl('', Validators.required),
      date_of_installation: new FormControl('', Validators.required),
      site_address: new FormControl('', Validators.required),
    });

    if (nav?.extras?.state?.['detail']) {
      const detailData = nav.extras.state['detail'];
    } else {
      const navigation = history.state;
      console.log(navigation);
      console.log(navigation?.selectedRows, 'navigation?.selectedRows');

      this.warranty_items = navigation?.selectedRows;
      this.customer_id = navigation?.customer_id;

      if (this.warranty_items?.length) {
        const invoiceNumber = this.warranty_items[0].invoice_number;
        const invoiceId = this.warranty_items[0]._id;

        this.addForm.patchValue({
          invoice_number: invoiceNumber,
          invoice_id: invoiceId,
        });
      }

      this.warranty_items.forEach((row: any, i: number) => {
        const controlName = `inputQty${i}`;
        this.addForm.addControl(
          controlName,
          new FormControl('', Validators.required),
        );
        if (row.total_quantity === row.consume_quantity) {
          this.addForm.get(controlName)?.setValue(0);

          this.addForm.get(controlName)?.disable();
        } else {
          this.addForm.get(controlName)?.setValue(row.inputQty);
        }
      });
    }
    console.log(this.addForm.value, 'addForm');
    this.CommonApiService.getUserData();
  }

  onSearch(search: string, type: string) {
    if (type === 'user') {
      this.CommonApiService.getUserData('', search);
    }
    if (type === 'site') {
      const userId = this.addForm.get('user_id')?.value || '';
      this.CommonApiService.getCustomerData(userId, '', '', search);
    }
  }

  getPondOptions(type: 'image' | 'pdf', maxFiles = 6): any {
    const commonOptions = {
      allowFileTypeValidation: true,
      labelIdle: 'Click or drag files here to upload...',
      server: {
        process: (
          _fieldName: any,
          file: any,
          _metadata: any,
          load: (arg0: string) => void,
        ) => {
          setTimeout(() => {
            load(Date.now().toString());
          }, 1000);
        },
        revert: (_uniqueFileId: any, load: () => void) => {
          load();
        },
      },
    };

    if (type === 'image') {
      return {
        ...commonOptions,
        allowMultiple: true,
        acceptedFileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
        maxFileSize: '2MB',
        maxFiles: maxFiles,
        allowImageValidateSize: true,
        labelFileTypeNotAllowed: 'Only PNG and JPEG files are allowed',
        fileValidateTypeLabelExpectedTypes: 'Allowed: PNG, JPEG',
        labelImageValidateSizeTooSmall:
          'Image is too small. Min: {minWidth}×{minHeight}',
        labelImageValidateSizeTooBig:
          'Image is too large. Max: {maxWidth}×{maxHeight}',
      };
    } else {
      return {
        ...commonOptions,
        allowMultiple: false,
        acceptedFileTypes: ['application/pdf'],
        maxFileSize: '10MB',
        labelFileTypeNotAllowed: 'Only PDF files are allowed',
        fileValidateTypeLabelExpectedTypes: 'Allowed: PDF',
      };
    }
  }

  onFileProcessed(event: any, imageLabel: string, target: number) {
    const file = event.file.file;
    Object.assign(file, { image_type: imageLabel }); // yahan label set ho raha hai
    if (target === 1) {
      this.pondBannerFiles1 = [...(this.pondBannerFiles1 || []), file];
    } else if (target === 2) {
      this.pondBannerFiles2 = [...(this.pondBannerFiles2 || []), file];
    }
  }

  onFileRemove(event: any, target: number) {
    const file = event.file.file;
    if (target === 1) {
      const index = this.pondBannerFiles1.findIndex(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (index > -1) this.pondBannerFiles1.splice(index, 1);
    } else if (target === 2) {
      const index = this.pondBannerFiles2.findIndex(
        (f) => f.name === file.name && f.size === file.size,
      );
      if (index > -1) this.pondBannerFiles2.splice(index, 1);
    }
  }

  findName(value: any, type: string) {
    if (type === 'user') {
      const selectedValue = this.CommonApiService.userData.find(
        (item: any) => item.value === value,
      );
      if (selectedValue) {
        this.addForm.patchValue({ user_name: selectedValue.label });
      }
    }

    if (type === 'site') {
      const selectedValue = this.CommonApiService.customerData.find(
        (item: any) => item.value === value,
      );
      if (selectedValue) {
        this.addForm.patchValue({
          site_name: selectedValue.label,
          site_address: selectedValue.address,
        });
      }
    }
  }

  onSubmit() {
    this.warranty_items.forEach((item: any) => {});
    if (this.addForm.valid) {
      if (
        this.pondBannerFiles1.length === 0 ||
        this.pondBannerFiles2.length === 0
      ) {
        this.toastr.error(
          'Please upload both Complete Site Images and Peel Off Images',
          '',
          'toast-top-right',
        );
        return;
      }

      this.pondFiles = [...this.pondBannerFiles1, ...this.pondBannerFiles2];
      this.warranty_items.forEach((item: any) => {
        if (item.total_quantity === item.consume_quantity) item.inputQty = 0;
      });

      this.alert
        .confirm(
          'Are you sure you want to update this warranty?',
          'Once updated, this cannot be undone.',
          'Update it!',
        )
        .then((result) => {
          if (result.isConfirmed) {
            this.api.disabled = true;

            // 2. Patch inputQty from form into warranty_items[0]
            const inputQtyControl = this.addForm.get('inputQty0');
            const inputQtyValue = Number(inputQtyControl?.value || 0);

            if (!this.warranty_items?.[0]) {
              this.toastr.error(
                'Warranty item is missing',
                '',
                'toast-top-right',
              );
              this.api.disabled = false;
              return;
            }

            // Set value to warranty_items[0]
            this.warranty_items[0].warranty_items =
              this.warranty_items[0].warranty_items || [];
            this.warranty_items[0].warranty_items[0] = {
              ...this.warranty_items[0].warranty_items[0],
              inputQty: inputQtyValue,
            };

            // 3. Prepare payload
            const formValues = { ...this.addForm.getRawValue() };
            delete formValues.inputQty0; // remove temp form field

            this.formValidation.removeEmptyFields(formValues);

            const payload = {
              ...formValues,
              warranty_items: this.warranty_items,
            };

            // 4. Submit
            const isEditMode = this.pageType === 'edit';
            const httpMethod = isEditMode ? 'patch' : 'post';
            const functionName = isEditMode
              ? 'warranty/update'
              : 'warranty/create';

            this.api[httpMethod](payload, functionName).subscribe((result) => {
              if (result['statusCode'] === 200) {
                if (this.pondFiles.length > 0) {
                  this.uploadService.uploadFile(
                    result['data']['inserted_id'],
                    'warranty',
                    this.pondFiles,
                    'Warranty Images',
                    `/apps/customers/customer-list/5/vendor/customer-detail/${this.customer_id}`,
                  );
                } else {
                  this.api.disabled = false;
                  this.router.navigate([
                    `/apps/customers/customer-list/5/vendor/customer-detail/${this.customer_id}`,
                  ]);
                  this.toastr.success(result['message'], '', 'toast-top-right');
                  this.addForm.reset();
                }
              }
            });
          }
        });
    } else {
      this.formValidation.markFormGroupTouched(this.addForm);
    }
  }

  getColumns(): any[] {
    return [
      { label: 'S.No.' },
      { label: 'Product Name' },
      { label: 'Product Code' },
      { label: 'Purchase Qty', tableHeadColumn: 'text-center' },
      { label: 'Qty', tableHeadColumn: 'text-center' },
      { label: 'Warranty Qty', tableHeadColumn: 'text-center' },
      { label: 'Balance Qty', tableHeadColumn: 'text-center' },
      { label: 'Batch No.' },
      { label: 'Grade' },
      { label: 'Color' },
      { label: 'Length' },
      { label: 'Width' },
    ];
  }

  qtyChange(row: any, index: number): void {
    const controlName = `inputQty${index}`;
    const rowNumber = index + 1;
    const control = this.addForm.get(controlName);
    const qty = Number(control?.value);

    console.log(row, 'row');

    // Allow negative values, just check it's a valid number
    if (isNaN(qty)) {
      this.toastr.error('Enter a valid quantity.', '', {
        positionClass: 'toast-top-right',
      });
      control?.setValue(null);
      return;
    }
    row.inputQty = qty;

    if (row.balance_quantity === undefined && qty > row.total_quantity) {
      this.alert.showAlert(
        `Row number ${rowNumber}: ` +
          `Qty cannot exceed ${row.total_quantity} Purchase Qty</span>`,
      );
      control?.patchValue(row.total_quantity);
      row.inputQty = row.total_quantity;
      return;
    }
    if (qty > row.balance_quantity) {
      this.alert.showAlert(
        `Row number ${rowNumber} :
          Only ${row.balance_quantity} items remaining to registered under warranty `,
      );
      control?.patchValue(row.balance_quantity);
      row.inputQty = row.balance_quantity;

      return;
    } else {
      row.inputQty = qty;
    }
  }

  applicationType = [
    { label: 'RVI', value: 'RVI' },
    { label: 'Signage', value: 'Signage' },
    { label: 'Highmast', value: 'Highmast' },
    { label: 'Pol mouted Emblen', value: 'Pol mouted Emblen' },
    { label: 'Canopy Facia', value: 'Canopy Facia' },
    { label: 'Monolith', value: 'Monolith' },
    { label: 'EV Charging Canopy', value: 'EV Charging Canopy' },
    { label: 'QOC Canopy', value: 'MQOC Canopynolith' },
  ];
}
