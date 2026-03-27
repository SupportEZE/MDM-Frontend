import { CommonModule } from '@angular/common';
import { Component, Inject, Input } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ApiService } from '../../../../../core/services/api/api.service';
import { ToastrServices } from '../../../../../shared/services/toastr.service ';
import { ModalHeaderComponent } from '../../../../../shared/components/modal-header/modal-header.component';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../../../../../shared/shared.module';
import { MaterialModuleModule } from '../../../../../material-module/material-module.module';
import { FilePondModule } from 'ngx-filepond';
import { UploadFileService } from '../../../../../shared/services/upload.service';
import { SweetAlertService } from '../../../../../core/services/alert/sweet-alert.service';
import { SpkInputComponent } from '../../../../../../@spk/spk-input/spk-input.component';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-warranty-modal',
    standalone: true,
    imports: [SharedModule, CommonModule, FormsModule, ModalHeaderComponent, MaterialModuleModule, FilePondModule, SpkInputComponent, ReactiveFormsModule],
    templateUrl: './warranty-modal.component.html',
})
export class WarrantyModalComponent {
    skLoading: boolean = false
    data: any = {};
    status: string = '';

    UpdatedDetails = new FormGroup({
        po_no: new FormControl('', Validators.required),
        ro_name: new FormControl('', Validators.required),
        ro_code: new FormControl('', Validators.required),
        site_address: new FormControl('', Validators.required),
    });
    constructor(@Inject(MAT_DIALOG_DATA) public modalData: any, private dialogRef: MatDialogRef<WarrantyModalComponent>, public api: ApiService, public toastr: ToastrServices, public uploadService: UploadFileService, public alert: SweetAlertService) { }

    ngOnInit() {
        this.data._id = this.modalData.DetailId
        console.log('Modal Data:', this.modalData);
        console.log('Modal Data:TYPE', this.modalData.type);

        if (this.data?.options?.length) {
            this.status = this.data.options[0].name; // default to 'Verified'
        }
        if (this.modalData.DetailId) {
            this.getDetail();
        }
    }

    pondFiles: any[] = [];
    pondAttachmentFiles: any[] = [];
    pondOptions = this.getPondOptions('image');
    pondDocumentOptions = this.getPondOptions('warranty_verification_attachment');
    getPondOptions(type: 'image' | 'warranty_verification_attachment'): any {
        const commonOptions = {
            allowFileTypeValidation: true,
            labelIdle: "Click or drag files here to upload...",
            server: {
                process: (_fieldName: any, file: any, _metadata: any, load: (arg0: string) => void) => {
                    setTimeout(() => {
                        load(Date.now().toString());
                    }, 1000);
                },
                revert: (_uniqueFileId: any, load: () => void) => {
                    load();
                }
            }
        };

        if (type === 'image') {
            return {
                ...commonOptions,
                allowMultiple: true,
                acceptedFileTypes: ['image/jpeg', 'image/png', 'image/jpg'],
                maxFileSize: '2MB',
                // maxFiles: this.giftList.length,
                allowImageValidateSize: true,
                labelFileTypeNotAllowed: 'Only PNG and JPEG files are allowed',
                fileValidateTypeLabelExpectedTypes: 'Allowed: PNG, JPEG',
                labelImageValidateSizeTooSmall: 'Image is too small. Min: {minWidth}×{minHeight}',
                labelImageValidateSizeTooBig: 'Image is too large. Max: {maxWidth}×{maxHeight}',
            };
        } else {
            return {
                ...commonOptions,
                allowMultiple: true,
                acceptedFileTypes: ['application/pdf'],
                maxFileSize: '10MB',
                labelFileTypeNotAllowed: 'Only PDF files are allowed',
                fileValidateTypeLabelExpectedTypes: 'Allowed: PDF',
            };
        }
    }
    onFileProcessed(event: any, type: string) {
        const file = event.file.file;
        Object.assign(file, { image_type: type });
        if (type === 'warranty_verification_attachment') {
            this.pondAttachmentFiles = [...(this.pondAttachmentFiles || []), file];
        }
    }
    onFileRemove(event: any, type: string) {
        const file = event.file.file;
        if (type === 'warranty_verification_attachment') {
            const index = this.pondAttachmentFiles.findIndex(f => f.name === file.name && f.size === file.size);
            if (index > -1) {
                this.pondAttachmentFiles.splice(index, 1);
            }
        }
    }

    statusChange() {
        this.pondFiles = [...this.pondAttachmentFiles];
        if (this.modalData.type === 'warranty') {
            if (this.pondFiles.length === 0) {
                this.toastr.error('Please upload atleast one attachment', '', 'toast-top-right');
                return;
            }
            this.alert.confirm('Are you sure you want to upload this attachment?', 'Once uploaded, it cannot be changed.', 'Upload it!'
            ).then(result => {
                if (result.isConfirmed) {
                    this.api.disabled = true;
                    this.uploadService.uploadFile(this.data._id, 'warranty', this.pondFiles, 'Warranty Verification Attachment', undefined,
                        () => {
                            this.api.disabled = false;
                            this.dialogRef.close(true);
                        }
                    );
                }
            });
            return;
        }
        if (this.data.status === 'Verified') {
            // if (this.pondFiles.length === 0) {
            //     this.toastr.error('Please upload atleast one attachment', '', 'toast-top-right');
            //     return;
            // }

            if (!this.data.mtc_number?.trim()) {
                this.toastr.error('Please enter MTC Number', '', 'toast-top-right');
                return;
            }
        }
        this.alert.confirm('Are you sure you want to update the status?', 'Once changed, the status cannot be undone.', 'Update it!'
        ).then(result => {
            if (result.isConfirmed) {
                this.api.disabled = true;
                this.api.patch(this.data, 'warranty/update-status').subscribe((result: any) => {
                    if (result['statusCode'] === 200) {
                        if (this.pondFiles.length > 0) {
                            this.uploadService.uploadFile(this.data._id, 'warranty', this.pondFiles, 'Warranty Verification Attachment', undefined,
                                () => this.dialogRef.close(true)
                            );
                        } else {
                            this.api.disabled = false;
                            this.toastr.success(result['message'], '', 'toast-top-right');
                            this.dialogRef.close(true);
                        }
                    }
                });
            }
        });
    }

    updateWarranty() {

        const changes = Object.keys(this.getChangedFields(this.originalDetails, this.UpdatedDetails.value)).length > 0;
        console.log(changes)

        if (changes) {

            this.alert.confirm('Are you sore ?')
                .then((result) => {
                    if (result.isConfirmed) {

                        const payload = {
                            _id: this.modalData.DetailId,
                            ...this.UpdatedDetails.value
                        };
                        this.api.disabled = true;
                        this.api.patch(payload, 'warranty/updateWarrantyDetail').subscribe(result => {
                            this.api.disabled = false;
                            if (result.statusCode === 200) {
                                this.toastr.success(result.message, '', 'toast-top-right');
                                this.dialogRef.close(true);
                                // this.closeModal()
                            } else {
                                this.toastr.error('Something went wrong!', '', 'toast-top-right');
                            }
                        });
                    }
                })

        } else {
            this.toastr.warning('No Changes Detected', '', 'toast-top-right')
        }
    }

    originalDetails: any;
    getDetail() {
        this.skLoading = true;
        this.api.post({ _id: this.modalData.DetailId }, 'warranty/detail').subscribe(result => {
            if (result['statusCode'] === 200) {
                this.skLoading = false;
                const origunalDetail = result['data'];
                this.UpdatedDetails.patchValue(origunalDetail);
                this.originalDetails = origunalDetail

            }
        });
    }

    closeModal() {
        this.dialogRef.close(); // Closes the dialog
    }

    getChangedFields(original: any, updated: any): any {
        const changed: any = {};

        for (const key of Object.keys(updated)) {
            const oldValue = original[key];
            const newValue = updated[key];

            if (oldValue !== newValue && key !== 'product_id' && key !== 'enquiry_id') {
                changed[key] = newValue;
            }
        }

        return changed;
    }
}
