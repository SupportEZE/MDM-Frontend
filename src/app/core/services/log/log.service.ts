import { Injectable } from '@angular/core';
import { ApiService } from '../api/api.service';
import { formatDate } from '@angular/common';
@Injectable({
  providedIn: 'root',
})
export class LogService {
  constructor(public api: ApiService) {}

  // Detect changes between original and updated data
  private getChanges(original: any, updated: any) {
    if (!original || !updated) return {};

    const deepEqual = (a: any, b: any): boolean => {
      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
      }

      if (a && b && typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every((key) => deepEqual(a[key], b[key]));
      }

      return a === b;
    };

    return Object.keys(updated).reduce((changes: any, key) => {
      const oldValue = original[key];
      const newValue = updated[key];
      if (newValue === '' || newValue === null || newValue === undefined) {
        return changes;
      }

      // Exclude if both old and new values are empty arrays
      if (
        Array.isArray(oldValue) &&
        Array.isArray(newValue) &&
        oldValue.length === 0 &&
        newValue.length === 0
      ) {
        return changes;
      }

      // Add to changes if the values are different
      if (oldValue !== newValue) {
        changes[key] = { old: oldValue, new: newValue };
      }

      if (!deepEqual(oldValue, newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }

      return changes;
    }, {});
  }

  // Log changes only if there are updates
  // directMainLog(
  //   moduleId: any,
  //   moduleFormId: any,
  //   moduleName: any,
  //   label: any,
  //   key_action: any,
  //   module_type: string
  // ) {

  //   this.api
  //     .post(
  //       {
  //         module_name: moduleName,
  //         message: label + ' field has been ' + key_action,
  //         action: key_action,
  //         module_id: moduleId,
  //         form_id: moduleFormId,
  //         module_type: module_type,
  //       },
  //       'log/form-action'
  //     )
  //     .subscribe((result) => {
  //       if (result['statusCode'] === 200) {
  //         // this.logsApi()
  //         // this.api.disabled = false;
  //       }
  //     });
  // }

  directMainLog(
    moduleId: any,
    moduleFormId: any,
    moduleName: any,
    label: any,
    key_action: any,
    module_type: string,
  ) {
    const formIdToSend = moduleFormId ?? null;
    this.api
      .post(
        {
          module_name: moduleName,
          message: `${label} field has been ${key_action}`,
          action: key_action,
          module_id: moduleId,
          form_id: 19,
          module_type: module_type,
        },
        'log/form-action',
      )
      .subscribe((result) => {
        if (result['statusCode'] === 200) {
        }
      });
  }

  logActivityOnUpdate(
    isEditMode: boolean,
    originalData: any,
    updatedData: any,
    moduleId: number,
    moduleName: string,
    action: string,
    rowId?: any,
    onNoChanges?: () => void,
    module_type?: string,
  ): string | boolean {
    if (!isEditMode) return false; // Only log for edits

    // const changes = this.getChanges(originalData, updatedData);
    const changes = this.getChanges1(originalData, updatedData);
    if (Object.keys(changes).length === 0) {
      if (onNoChanges) onNoChanges();
      return true;
    }
    const logData = {
      module_id: moduleId,
      module_name: moduleName,
      action,
      row_id: rowId,
      changes,
      module_type: module_type,
    };
    if (rowId === '') {
      delete logData.row_id;
    }
    this.api.post(logData, 'log/transaction-action').subscribe((result) => {
      if (result.statusCode === 200) {
      }
    });
    return false; // Indicating that changes were logged
  }

  logActivityOnDelete(
    moduleId: number,
    moduleName: string,
    action: string,
    rowId?: any,
    label?: string,
    module_type?: string,
  ) {
    const logData = {
      module_id: moduleId,
      module_name: moduleName,
      action,
      row_id: rowId,
      message: `Delete ${label} Record with ID - ${rowId} `,
      module_type: module_type,
    };
    this.api.post(logData, 'log/transaction-action').subscribe((result) => {
      if (result.statusCode === 200) {
      }
    });
  }

  logActivityOnAdd(
    moduleId: number,
    moduleName: string,
    rowId: any,
    message: string,
    module_type?: string,
  ) {
    const logData = {
      module_id: moduleId,
      module_name: moduleName,
      action: 'add',
      row_id: rowId,
      message: message,
      module_type: module_type,
    };
    this.api.post(logData, 'log/transaction-action').subscribe((result) => {
      if (result.statusCode === 200) {
      }
    });
  }

  logActivityOnImage(
    moduleId: number,
    moduleName: string,
    action: string,
    rowId?: any,
    label?: string,
  ) {
    const logData = {
      module_id: moduleId,
      module_name: moduleName,
      action,
      row_id: rowId,
      message: `${label} record with ID - ${rowId} `,
    };
    this.api
      .post(logData, 'log/transaction-actionnnnnn')
      .subscribe((result) => {
        if (result.statusCode === 200) {
        }
      });
  }

  // Fetch logs
  getLogs(
    moduleId: number,
    callback: (logs: any, logOriginal?: any) => void,
    row?: string,
    module_type?: string,
  ) {
    const payload: any = { module_id: moduleId };
    if (row) {
      payload.module_id = moduleId;
      payload.row_id = row;
    }
    if (module_type) {
      payload.module_type = module_type;
    }

    this.api.post(payload, 'log/read').subscribe((result) => {
      if (result.statusCode === 200) {
        const formattedLogs = result.data.map((log: any) => ({
          createdName: log.created_name,
          createdAt: new Date(log.created_at),
          changes: this.formatChanges(log.changes ? log.changes : log.message),
        }));
        callback(formattedLogs, result?.data);
      }
    });
  }

  // formatChanges(changes: any): string {
  //     if (typeof changes === 'string') {
  //         return changes;
  //     }
  //     if (changes && typeof changes === 'object') {
  //         return Object.entries(changes)
  //         .map(([field, value]: any) => {
  //             const formattedField = field.replace(/_/g, ' ')
  //             return `${formattedField.charAt(0).toUpperCase() + formattedField.slice(1)}: changed from
  //                             <span class="text-danger">${value.old}</span> to
  //                             <span class="text-success">${value.new}</span>`;
  //         })
  //         .join('<br>');
  //     } else {
  //         return '';
  //     }
  // }

  // formatChanges(changes: any): string {
  //   // Price Confiq Format In Product Module//
  //   const isArrayLikeChange =
  //     changes &&
  //     typeof changes === 'object' &&
  //     Object.keys(changes).every(
  //       (key) => !isNaN(Number(key)) && changes[key]?.old && changes[key]?.new
  //     );
  //   if (isArrayLikeChange) {
  //     return Object.keys(changes)
  //       .map((key) => {
  //         const oldItem = changes[key].old;
  //         const newItem = changes[key].new;
  //         // Dynamically choose a label field (e.g. zone, name, etc.)
  //         const labelKey =
  //           Object.keys(oldItem).find((k) => typeof oldItem[k] === 'string') ||
  //           `Row ${key}`;
  //         const label = oldItem[labelKey] || newItem[labelKey] || `Row ${key}`;

  //         const fieldDiffs = Object.keys(oldItem)
  //           .filter((field) => oldItem[field] !== newItem[field])
  //           .map(
  //             (field) =>
  //               `${field}: changed from <span class="text-danger">${this.stringifyValue(
  //                 oldItem[field]
  //               )}</span>
  //                      to <span class="text-success">${this.stringifyValue(
  //                        newItem[field]
  //                      )}</span>`
  //           );
  //         return `${label + ''}: ${fieldDiffs.join('<br>')}`;
  //       })
  //       .filter(Boolean)
  //       .join('<br>');
  //   }
  //   // Price Confiq Format In Product Module//

  //   if (typeof changes === 'string') return changes;

  //   const stringifyValue = (val: any): string => {
  //     if (val === null || val === undefined || val === '') return '-';

  //     // Handle ISO date format and format as 'd MMM yyyy'
  //     if (typeof val === 'string' && val.includes('T') && val.includes('Z')) {
  //       try {
  //         const date = new Date(val);
  //         return formatDate(date, 'd MMM yyyy', 'en-US'); // e.g. "21 Apr 2025"
  //       } catch {
  //         return val;
  //       }
  //     }

  //     // Show simplified display for array of objects
  //     if (Array.isArray(val)) {
  //       return val
  //         .map((item: any) => {
  //           if (item.product_name) return item.product_name;
  //           if (item.name) return item.name;
  //           return JSON.stringify(item);
  //         })
  //         .join(', ');
  //     }

  //     if (typeof val === 'object') {
  //       if (val.product_name) return val.product_name;
  //       if (val.name) return val.name;
  //       return JSON.stringify(val);
  //     }

  //     return String(val);
  //   };

  //   const getDifferenceInArrays = (oldArr: any[], newArr: any[]): string => {
  //     const oldNames = oldArr.map(
  //       (item: any) => item.name || JSON.stringify(item)
  //     );
  //     const newNames = newArr.map(
  //       (item: any) => item.name || JSON.stringify(item)
  //     );

  //     const removed = oldNames.filter((x) => !newNames.includes(x));
  //     const added = newNames.filter((x) => !oldNames.includes(x));
  //     let output = '';
  //     if (removed.length) {
  //       output += `Last Value: <span class="text-danger">${removed.join(
  //         ', '
  //       )}</span><br>`;
  //     }
  //     if (added.length) {
  //       output += `Updated Value: <span class="text-success">${added.join(
  //         ', '
  //       )}</span><br>`;
  //     }

  //     return output || 'No actual difference';
  //   };

  //   if (changes && typeof changes === 'object') {
  //     return Object.entries(changes)
  //       .map(([field, value]: any) => {
  //         const formattedField = field.replace(/_/g, ' ');
  //         const label =
  //           formattedField.charAt(0).toUpperCase() + formattedField.slice(1);
  //         // Special handling for additional_target array
  //         if (Array.isArray(value.old) && Array.isArray(value.new)) {
  //           return `${label}: <br>${getDifferenceInArrays(
  //             value.old,
  //             value.new
  //           )}`;
  //         } else {
  //           return `${label}:  changed from
  //                           <span class="text-danger">${stringifyValue(
  //                             value.old
  //                           )}</span> to
  //                           <span class="text-success">${stringifyValue(
  //                             value.new
  //                           )}</span>`;
  //         }
  //       })
  //       .join('<br>');
  //     // Regular fields
  //   }

  //   return '';
  // }

  formatChanges(changes: any): string {
    const stringifyValue = (val: any): string => {
      if (val === null || val === undefined || val === '') return '-';

      if (
        typeof val === 'string' &&
        val.includes('T') &&
        (val.includes('Z') || val.includes('+'))
      ) {
        try {
          const date = new Date(val);
          if (!isNaN(date.getTime())) {
            return formatDate(date, 'd MMM yyyy', 'en-US');
          }
        } catch {}
      }

      if (Array.isArray(val)) {
        return val
          .map(
            (item: any) => item.user_name || item.name || JSON.stringify(item),
          )
          .join(', ');
      }

      if (typeof val === 'object') {
        if (val.user_name) return val.user_name;
        if (val.name) return val.name;
        return JSON.stringify(val);
      }
      return String(val);
    };

    const getDifferenceInArrays = (oldArr: any[], newArr: any[]): string => {
      const oldNames = oldArr.map(
        (item: any) => item.user_name || item.name || JSON.stringify(item),
      );
      const newNames = newArr.map(
        (item: any) => item.user_name || item.name || JSON.stringify(item),
      );

      const removed = oldNames.filter((x) => !newNames.includes(x));
      const added = newNames.filter((x) => !oldNames.includes(x));

      let output = '';
      if (added.length) {
        output += `<span class="text-success">Assigned:</span> ${added.join(
          ', ',
        )}<br>`;
      }
      if (removed.length) {
        output += `<span class="text-danger">Unassigned:</span> ${removed.join(
          ', ',
        )}<br>`;
      }

      return output || 'No actual difference';
    };

    // 🔹 Case 1: Array-like old/new changes (0,1,... keys)
    const isArrayLikeChange =
      changes &&
      typeof changes === 'object' &&
      Object.keys(changes).every(
        (key) => !isNaN(Number(key)) && changes[key]?.old && changes[key]?.new,
      );

    if (isArrayLikeChange) {
      return Object.keys(changes)
        .map((key) => {
          const oldItem = changes[key].old;
          const newItem = changes[key].new;
          const modulePrefix = oldItem.module_name
            ? `${oldItem.module_name}: `
            : '';
          const diffs = Object.keys(oldItem)
            .filter((field) => oldItem[field] !== newItem[field])
            .map(
              (field) =>
                `<span class="font-bold">${modulePrefix}</span>${field}: changed from 
              <span class="text-danger">${stringifyValue(
                oldItem[field],
              )}</span> 
              to <span class="text-success">${stringifyValue(
                newItem[field],
              )}</span>`,
            );
          return diffs.join('<br>');
        })
        .filter(Boolean)
        .join('<br>');
    }

    if (typeof changes === 'string') return changes;

    if (changes && typeof changes === 'object') {
      return Object.entries(changes)
        .map(([field, value]: any) => {
          const formattedField = field.replace(/_/g, ' ');
          const label =
            formattedField.charAt(0).toUpperCase() + formattedField.slice(1);

          // Only compare old/new arrays
          if (
            value &&
            typeof value === 'object' &&
            Array.isArray(value.old) &&
            Array.isArray(value.new)
          ) {
            return `${label}: <br>${getDifferenceInArrays(
              value.old,
              value.new,
            )}`;
          }

          // Case: Value is just an array (e.g. "Assigned" list)
          if (Array.isArray(value)) {
            const colorClass =
              label.toLowerCase() === 'unassigned'
                ? 'text-danger'
                : 'text-success';
            return `<span class="${colorClass}">${label}:</span> ${stringifyValue(
              value,
            )}`;
          }

          // Case: Value is an object with old/new or OLD/NEW keys
          if (value && typeof value === 'object') {
            let oldVal = undefined;
            let newVal = undefined;
            let hasNew = false;

            if ('old' in value) oldVal = value.old;
            if ('new' in value) {
              newVal = value.new;
              hasNew = true;
            }
            if ('OLD' in value) oldVal = value.OLD;
            if ('NEW' in value) {
              newVal = value.NEW;
              hasNew = true;
            }

            if (hasNew) {
              const oldStr = stringifyValue(oldVal);
              const newStr = stringifyValue(newVal);

              if (oldStr === '-' || oldStr === '') {
                // It's a Create/Add action
                return `${label}: <span class="text-success">${newStr}</span>`;
              }
              // It's an Update action
              return `${label}: changed from 
                  <span class="text-danger">${oldStr}</span> 
                  to <span class="text-success">${newStr}</span>`;
            }
          }

          // Fallback
          return `${label}: ${stringifyValue(value)}`;
        })
        .join('<br>');
    }

    return '';
  }

  stringifyValue(val: any): string {
    if (val === null || val === undefined || val === '') return '-';
    if (
      typeof val === 'string' &&
      val.includes('T') &&
      (val.includes('Z') || val.includes('+'))
    ) {
      try {
        const date = new Date(val);
        if (!isNaN(date.getTime())) {
          return formatDate(date, 'd MMM yyyy', 'en-US');
        }
      } catch {
        return val;
      }
    }
    if (Array.isArray(val)) {
      return val
        .map(
          (item: any) => item.product_name || item.name || JSON.stringify(item),
        )
        .join(', ');
    }
    if (typeof val === 'object') {
      return val.product_name || val.name || JSON.stringify(val);
    }
    return String(val);
  }

  // ---------------------------- //

  logActivityOnUpdateArray(
    isEditMode: boolean,
    originalData: any[], // array of users
    updatedData: any[], // array of users
    moduleId: number,
    moduleName: string,
    action: string,
    rowId?: any,
    onNoChanges?: () => void,
    module_type?: string,
    comparision_base?: string,
  ): boolean {
    if (!isEditMode) return false; // Only log for edits

    const changes = this.getChangesArray(
      originalData,
      updatedData,
      comparision_base || 'user_code',
    );

    if (!changes || Object.keys(changes).length === 0) {
      if (onNoChanges) onNoChanges();
      return true; // no changes
    }

    const logData: any = {
      module_id: moduleId,
      module_name: moduleName,
      action,
      row_id: rowId,
      changes,
      module_type,
    };

    if (rowId === '') {
      delete logData.row_id;
    }

    this.api.post(logData, 'log/transaction-action').subscribe((result) => {
      if (result.statusCode === 200) {
        // success
      }
    });

    return false; // changes were logged
  }

  private getChangesArray(
    original: any[],
    updated: any[],
    comparision_base: string,
  ) {
    if (!Array.isArray(original) || !Array.isArray(updated)) return {};

    const oldCodes = original.map((u) => u[comparision_base]?.toLowerCase());
    const newCodes = updated.map((u) => u[comparision_base]?.toLowerCase());

    const assigned = updated.filter(
      (u) => !oldCodes.includes(u[comparision_base]?.toLowerCase()),
    );
    const removed = original.filter(
      (u) => !newCodes.includes(u[comparision_base]?.toLowerCase()),
    );
    if (comparision_base === 'user_code') {
      const changes: any = {};
      if (assigned.length) changes.assigned = assigned;
      if (removed.length) changes.unassigned = removed;
      return changes;
    }
    if (comparision_base === 'product_code') {
      const changes: any = {};
      if (assigned.length) changes.product_added = assigned;
      if (removed.length) changes.product_removed = removed;
      return changes;
    }
  }

  getArrayDifferences(original: any[], updated: any[]): any {
    const changes: any = {};

    original.forEach((oldItem, index) => {
      const newItem = updated[index];
      const diff: any = {};

      for (const key in oldItem) {
        if (oldItem[key] !== newItem?.[key]) {
          diff[key] = { old: oldItem[key], new: newItem?.[key] };
        }
      }

      if (Object.keys(diff).length > 0) {
        changes[index] = {
          old: oldItem,
          new: newItem,
        };
      }
    });

    return changes;
  }

  // ---------------------------- //

  private getUpdateChanges(
    original: any,
    updated: any,
    path = '',
    ignoreKeys: string[] = ['_id', 'createdAt', 'updatedAt'],
  ): Record<string, any> {
    const changes: Record<string, any> = {};

    const isPrimitive = (val: any) => val === null || typeof val !== 'object';

    const isEmptyArray = (arr: any) => Array.isArray(arr) && arr.length === 0;

    const fullPath = (base: string, key: string) =>
      base ? `${base}.${key}` : key;

    for (const key of Object.keys(updated)) {
      if (ignoreKeys.includes(key)) continue;

      const oldVal = original?.[key];
      const newVal = updated[key];
      const currentPath = fullPath(path, key);

      // Skip null, undefined, or blank string in new value
      if (newVal === '' || newVal === null || newVal === undefined) continue;

      // Skip if both arrays are empty
      if (isEmptyArray(oldVal) && isEmptyArray(newVal)) continue;

      // Handle nested objects
      if (
        oldVal &&
        newVal &&
        typeof oldVal === 'object' &&
        typeof newVal === 'object' &&
        !Array.isArray(oldVal) &&
        !Array.isArray(newVal)
      ) {
        const nestedChanges = this.getUpdateChanges(
          oldVal,
          newVal,
          currentPath,
          ignoreKeys,
        );
        Object.assign(changes, nestedChanges);
      } else if (Array.isArray(oldVal) && Array.isArray(newVal)) {
        // Handle array comparison
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[currentPath] = { old: oldVal, new: newVal };
        }
      } else if (String(oldVal) !== String(newVal)) {
        // Compare primitive values (loose equality with type conversion)
        changes[currentPath] = { old: oldVal, new: newVal };
      }
    }

    return changes;
  }

  private getChanges1(original: any, updated: any) {
    if (!original || !updated) return {};

    const deepEqual = (a: any, b: any): boolean => {
      if (a === b) return true;

      if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => deepEqual(item, b[index]));
      }

      if (a && b && typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) return false;
        return aKeys.every((key) => deepEqual(a[key], b[key]));
      }

      // Loose equality for primitives like '10' and 10
      if (
        (typeof a === 'string' || typeof a === 'number') &&
        (typeof b === 'string' || typeof b === 'number') &&
        a == b
      ) {
        return true;
      }

      return false;
    };

    const changes: any = {};

    for (const key of Object.keys(updated)) {
      const oldValue = original[key];
      const newValue = updated[key];

      if (newValue === '' || newValue === null || newValue === undefined)
        continue;

      if (
        Array.isArray(oldValue) &&
        Array.isArray(newValue) &&
        oldValue.length === 0 &&
        newValue.length === 0
      ) {
        continue;
      }

      if (!deepEqual(oldValue, newValue)) {
        changes[key] = { old: oldValue, new: newValue };
      }
    }

    return changes;
  }
}
