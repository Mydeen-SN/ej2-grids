import { KeyboardEventArgs, L10n, EventHandler, TouchEventArgs, closest } from '@syncfusion/ej2-base';
import { extend, getValue } from '@syncfusion/ej2-base';
import { remove, createElement } from '@syncfusion/ej2-base';
import { isNullOrUndefined, setValue } from '@syncfusion/ej2-base';
import { IGrid, IAction, NotifyArgs, IEdit } from '../base/interface';
import * as events from '../base/constant';
import { EditRender } from '../renderer/edit-renderer';
import { ServiceLocator } from '../services/service-locator';
import { Column } from '../models/column';
import { BooleanEditCell } from '../renderer/boolean-edit-cell';
import { DropDownEditCell } from '../renderer/dropdown-edit-cell';
import { NumericEditCell } from '../renderer/numeric-edit-cell';
import { DefaultEditCell } from '../renderer/default-edit-cell';
import { InlineEdit } from './inline-edit';
import { BatchEdit } from './batch-edit';
import { DialogEdit } from './dialog-edit';
import { Dialog } from '@syncfusion/ej2-popups';
import { parentsUntil, changeButtonType } from '../base/util';
import { FormValidator } from '@syncfusion/ej2-inputs';
import { DatePickerEditCell } from '../renderer/datepicker-edit-cell';
import { calculateRelativeBasedPosition, OffsetPosition } from '@syncfusion/ej2-popups';

/**
 * `Edit` module is used to handle editing actions.
 */
export class Edit implements IAction {
    //Internal variables                  
    private edit: Edit;
    protected renderer: EditRender;
    private editModule: IEdit;
    /** @hidden */
    public formObj: FormValidator;
    public mFormObj: FormValidator;
    private editCellType: Object = {
        'dropdownedit': DropDownEditCell, 'numericedit': NumericEditCell,
        'datepickeredit': DatePickerEditCell, 'booleanedit': BooleanEditCell, 'defaultedit': DefaultEditCell
    };
    private editType: Object = { 'inline': InlineEdit, 'normal': InlineEdit, 'batch': BatchEdit, 'dialog': DialogEdit };
    //Module declarations
    protected parent: IGrid;
    protected serviceLocator: ServiceLocator;
    protected l10n: L10n;
    private dialogObj: Dialog;
    private alertDObj: Dialog;
    private tapped: boolean | number = false;
    private actionBeginFunction: Function;
    private actionCompleteFunction: Function;
    private preventObj: {
        instance: Object,
        handler: Function, arg1?: Object, arg2?: Object, arg3?: Object, arg4?: Object, arg5?: Object, arg6?: Object, arg7?: Object
    };

    /**
     * Constructor for the Grid editing module
     * @hidden
     */
    constructor(parent?: IGrid, serviceLocator?: ServiceLocator) {
        this.parent = parent;
        this.serviceLocator = serviceLocator;
        this.l10n = this.serviceLocator.getService<L10n>('localization');
        this.addEventListener();
        this.updateEditObj();
        this.createAlertDlg();
        this.createConfirmDlg();
    }

    private updateColTypeObj(): void {
        for (let col of this.parent.getColumns() as Column[]) {
            col.edit = extend(
                new this.editCellType[col.editType && this.editCellType[col.editType] ?
                    col.editType : 'defaultedit'](this.parent, this.serviceLocator),
                col.edit || {}
            );
        }
    }

    /**
     * For internal use only - Get the module name.
     * @private
     */
    protected getModuleName(): string {
        return 'edit';
    }

    /**
     * @hidden
     */
    public onPropertyChanged(e: NotifyArgs): void {
        if (e.module !== this.getModuleName()) {
            return;
        }
        let gObj: IGrid = this.parent;
        let newProp: Object = e.properties;
        for (let prop of Object.keys(e.properties)) {
            switch (prop) {
                case 'allowAdding':
                case 'allowDeleting':
                case 'allowEditing':
                    if (gObj.editSettings.allowAdding || gObj.editSettings.allowEditing || gObj.editSettings.allowDeleting) {
                        this.initialEnd();
                    }
                    break;
                case 'mode':
                    this.updateEditObj();
                    gObj.isEdit = false;
                    gObj.refresh();
                    break;
            }
        }
    }

    private updateEditObj(): void {
        if (this.editModule) {
            this.editModule.destroy();
        }
        this.renderer = new EditRender(this.parent, this.serviceLocator);
        this.editModule = new this.editType[this.parent.editSettings.mode](this.parent, this.serviceLocator, this.renderer);
    }

    private initialEnd(): void {
        this.updateColTypeObj();
    }

    private wireEvents(): void {
        EventHandler.add(this.parent.getContent(), 'touchstart', this.tapEvent, this);
    }

    private unwireEvents(): void {
        EventHandler.remove(this.parent.getContent(), 'touchstart', this.tapEvent);
    }

    private tapEvent(e: TouchEventArgs): void {
        if (this.getUserAgent()) {
            if (!this.tapped) {
                this.tapped = setTimeout(this.timeoutHandler(), 300);
            } else {
                clearTimeout(this.tapped as number);
                this.parent.notify(events.doubleTap, e);
                this.tapped = null;
            }
        }
    }

    private getUserAgent(): boolean {
        let userAgent: string = window.navigator.userAgent.toLowerCase();
        return (/iphone|ipod|ipad/ as RegExp).test(userAgent);
    }

    private timeoutHandler(): void {
        this.tapped = null;
    }

    /**
     * To edit any particular row by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row to be edited.
     */
    public startEdit(tr?: HTMLTableRowElement): void {
        let gObj: IGrid = this.parent;
        if (!gObj.editSettings.allowEditing || gObj.isEdit || gObj.editSettings.mode === 'batch') {
            return;
        }
        if (!gObj.getSelectedRows().length) {
            if (!tr) {
                this.showDialog('EditOperationAlert', this.alertDObj);
                return;
            }
        } else if (!tr) {
            tr = gObj.getSelectedRows()[0] as HTMLTableRowElement;
        }
        if (tr.style.display === 'none') {
            return;
        }
        this.editModule.startEdit(tr);
        this.refreshToolbar();
        (gObj.element.querySelector('.e-gridpopup') as HTMLElement).style.display = 'none';
        this.parent.notify('start-edit', {});
    }

    /**
     * Cancel edited state.
     */
    public closeEdit(): void {
        if (this.parent.editSettings.mode === 'batch' && this.parent.editSettings.showConfirmDialog
            && this.parent.element.querySelectorAll('.e-updatedtd').length) {
            this.showDialog('CancelEdit', this.dialogObj);
            return;
        }
        this.editModule.closeEdit();
        this.refreshToolbar();
        this.parent.notify('close-edit', {});
    }

    protected refreshToolbar(): void {
        this.parent.notify(events.toolbarRefresh, {});
    }

    /**
     * To add a new row at top of rows with given data. If data is not passed then it will render empty row.
     * > `editSettings.allowEditing` should be true.
     * @param {Object} data - Defines the new add record data.
     */
    public addRecord(data?: Object): void {
        if (!this.parent.editSettings.allowAdding) {
            return;
        }
        this.editModule.addRecord(data);
        this.refreshToolbar();
        this.parent.notify('start-add', {});
    }

    /**
     * Delete a record with Given options. If fieldname and data is not given then grid will delete the selected record.
     * > `editSettings.allowDeleting` should be true.
     * @param {string} fieldname - Defines the primary key field Name of the column.
     * @param {Object} data - Defines the JSON data of record need to be delete.
     */
    public deleteRecord(fieldname?: string, data?: Object): void {
        let gObj: IGrid = this.parent;
        if (!gObj.editSettings.allowDeleting) {
            return;
        }
        if (!data) {
            if (isNullOrUndefined(gObj.selectedRowIndex) || gObj.selectedRowIndex === -1) {
                this.showDialog('DeleteOperationAlert', this.alertDObj);
                return;
            }
            if (gObj.editSettings.showDeleteConfirmDialog) {
                this.showDialog('ConfirmDelete', this.dialogObj);
                return;
            }
        }
        this.editModule.deleteRecord(fieldname, data);
    }

    /**
     * Delete any visible row by TR element.
     * @param {HTMLTableRowElement} tr - Defines the table row element.
     */
    public deleteRow(tr: HTMLTableRowElement): void {
        this.deleteRecord(null, this.parent.getCurrentViewRecords()[parseInt(tr.getAttribute('aria-rowindex'), 10)]);
    }

    /**
     * If Grid is in editable state, then you can save a record by invoking endEdit.
     */
    public endEdit(): void {
        if (this.parent.editSettings.mode === 'batch' && this.parent.editSettings.showConfirmDialog) {
            this.showDialog('BatchSaveConfirm', this.dialogObj);
            return;
        }
        this.endEditing();
    }

    /**
     * To update value of any cell without change into edit mode.
     * @param {number} rowIndex - Defines the row index.
     * @param {string} field - Defines the column field.
     * @param {string | number | boolean | Date} value - Defines the value to change.
     */
    public updateCell(rowIndex: number, field: string, value: string | number | boolean | Date): void {
        this.editModule.updateCell(rowIndex, field, value);
    }

    /**
     * To update values of a row without changing into edit mode.
     * @param {number} index - Defines the row index.
     * @param {Object} data - Defines the data object to update.
     */
    public updateRow(index: number, data: Object): void {
        this.editModule.updateRow(index, data);
    }

    /**
     * To reset added, edited and deleted records in batch mode.
     */
    public batchCancel(): void {
        this.closeEdit();
    }

    /**
     * To bulk Save added, edited and deleted records in batch mode.
     */
    public batchSave(): void {
        this.endEdit();
    }

    /**
     * To turn any particular cell into edited state by row index and field name in batch mode.
     * @param {number} index - Defines row index to edit particular cell.
     * @param {string} field - Defines the field name of the column to perform batch edit.
     */
    public editCell(index: number, field: string): void {
        this.editModule.editCell(index, field);
    }

    /**
     * To check current status of validation at the time of edited state. If validation passed then it will return true.
     * @return {boolean}
     */
    public editFormValidate(): boolean {
        if (this.formObj) {
            return this.formObj.validate();
        }
        return false;
    }

    /**
     * To get added, edited and deleted data before bulk save to data source in batch mode.
     * @return {Object}
     */
    public getBatchChanges(): Object {
        return this.editModule.getBatchChanges ? this.editModule.getBatchChanges() : {};
    }

    /**
     * To get current value of edited component.
     */
    public getCurrentEditCellData(): string {
        let obj: Object = this.getCurrentEditedData(this.formObj.element, {});
        return obj[Object.keys(obj)[0]];
    }

    /**
     * To save current edited cell in batch. It does not save value to data source.
     */
    public saveCell(): void {
        this.editModule.saveCell();
    }

    private endEditing(): void {
        this.editModule.endEdit();
        this.refreshToolbar();
    }

    private showDialog(content: string, obj: Dialog): void {
        obj.content = '<div>' + this.l10n.getConstant(content) + '</div>';
        obj.dataBind();
        obj.show();
    }

    public getValueFromType(col: Column, value: string | Date | boolean): number | string | Date | boolean {
        let val: number | string | Date | boolean = value;
        switch (col.type) {
            case 'number':
                val = !isNaN(parseFloat(value as string)) ? parseFloat(value as string) : null;
                break;
            case 'boolean':
                if (col.editType !== 'booleanedit') {
                    val = value === this.l10n.getConstant('True') ? true : false;
                }
                break;
            case 'date':
            case 'datetime':
                if (col.editType !== 'datepicker' && value && (value as string).length) {
                    val = new Date(value as string);
                }
                break;
        }
        return val;
    }

    private destroyToolTip(): void {
        let elements: Element[] = [].slice.call(this.parent.element.querySelectorAll('.e-griderror'));
        for (let elem of elements) {
            remove(elem);
        }
        (this.parent.getContent().firstElementChild as HTMLElement).style.position = 'relative';
    }

    private createConfirmDlg(): void {
        this.dialogObj = this.dlgWidget(
            [
                {
                    click: this.dlgOk.bind(this),
                    buttonModel: { content: this.l10n.getConstant('OKButton'), cssClass: 'e-primary', isPrimary: true }
                },
                {
                    click: this.dlgCancel.bind(this),
                    buttonModel: { cssClass: 'e-flat', content: this.l10n.getConstant('CancelButton') }
                }
            ],
            'EditConfirm');
    }

    private createAlertDlg(): void {
        this.alertDObj = this.dlgWidget(
            [
                {
                    click: this.alertClick.bind(this), buttonModel:
                        { content: this.l10n.getConstant('OKButton'), cssClass: 'e-flat', isPrimary: true }
                }
            ],
            'EditAlert');
    }

    private alertClick(): void {
        this.alertDObj.hide();
    }

    private dlgWidget(btnOptions: Object[], name: string): Dialog {
        let div: HTMLElement = createElement('div', { id: this.parent.element.id + name });
        this.parent.element.appendChild(div);
        let options: Object = {
            showCloseIcon: false,
            isModal: true,
            visible: false,
            closeOnEscape: true,
            target: this.parent.element,
            width: '320px',
            animationSettings: { effect: 'None' }
        };
        (options as { buttons: Object[] }).buttons = btnOptions;
        let obj: Dialog = new Dialog(options);
        obj.appendTo(div);
        changeButtonType(obj.element);
        return obj;
    }

    private dlgCancel(): void {
        this.dialogObj.hide();
    }

    private dlgOk(e: MouseEvent): void {
        switch ((this.dialogObj.element.querySelector('.e-dlg-content').firstElementChild as HTMLElement).innerText) {
            case this.l10n.getConstant('ConfirmDelete'):
                this.editModule.deleteRecord();
                break;
            case this.l10n.getConstant('CancelEdit'):
                this.editModule.closeEdit();
                break;
            case this.l10n.getConstant('BatchSaveConfirm'):
                this.endEditing();
                break;
            case this.l10n.getConstant('BatchSaveLostChanges'):
                this.executeAction();
                break;
        }
        this.dlgCancel();
    }

    /**
     * @hidden
     */
    public addEventListener(): void {
        if (this.parent.isDestroyed) { return; }
        this.parent.on(events.inBoundModelChanged, this.onPropertyChanged, this);
        this.parent.on(events.initialEnd, this.initialEnd, this);
        this.parent.on(events.keyPressed, this.keyPressHandler, this);
        this.parent.on(events.autoCol, this.updateColTypeObj, this);
        this.parent.on(events.tooltipDestroy, this.destroyToolTip, this);
        this.parent.on(events.preventBatch, this.preventBatch, this);
        this.parent.on(events.destroyForm, this.destroyForm, this);
        this.actionBeginFunction = this.onActionBegin.bind(this);
        this.actionCompleteFunction = this.actionComplete.bind(this);
        this.parent.addEventListener(events.actionBegin, this.actionBeginFunction);
        this.parent.addEventListener(events.actionComplete, this.actionCompleteFunction);
        this.parent.on(events.initialEnd, this.wireEvents, this);
    }

    /**
     * @hidden
     */
    public removeEventListener(): void {
        if (this.parent.isDestroyed) { return; }
        this.parent.off(events.inBoundModelChanged, this.onPropertyChanged);
        this.parent.off(events.initialEnd, this.initialEnd);
        this.parent.off(events.keyPressed, this.keyPressHandler);
        this.parent.off(events.autoCol, this.updateColTypeObj);
        this.parent.off(events.tooltipDestroy, this.destroyToolTip);
        this.parent.off(events.preventBatch, this.preventBatch);
        this.parent.off(events.destroyForm, this.destroyForm);
        this.parent.removeEventListener(events.actionComplete, this.actionCompleteFunction);
        this.parent.removeEventListener(events.actionBegin, this.actionBeginFunction);
        this.parent.off(events.initialEnd, this.unwireEvents);
    }

    private actionComplete(e: NotifyArgs): void {
        let actions: string[] = ['add', 'beginEdit', 'save', 'delete', 'cancel'];
        if (actions.indexOf(e.requestType) < 0) {
            this.parent.isEdit = false;
        }
        this.refreshToolbar();
    }

    /**
     * @hidden
     */
    public getCurrentEditedData(form: Element, editedData: Object): Object {
        let gObj: IGrid = this.parent;
        let inputs: HTMLInputElement[] = [].slice.call(form.querySelectorAll('.e-field'));
        for (let i: number = 0, len: number = inputs.length; i < len; i++) {
            let col: Column = gObj.getColumnByUid(inputs[i].getAttribute('e-mappinguid'));
            let value: number | string | Date | boolean;
            if (col && col.field) {
                let temp: Function = col.edit.read as Function;
                if (typeof temp === 'string') {
                    temp = getValue(temp, window);
                }
                if (col.type !== 'checkbox') {
                    value = gObj.editModule.getValueFromType(col, (col.edit.read as Function)(inputs[i]));
                } else {
                    value = inputs[i].checked;
                }
                setValue(col.field, value, editedData);
            }
        }
        return editedData;
    }

    /**
     * @hidden
     */
    public onActionBegin(e: NotifyArgs): void {
        let restrictedRequestTypes: string[] = ['filterafteropen', 'filterbeforeopen', 'filterchoicerequest', 'save'];
        if (this.parent.editSettings.mode !== 'batch' && this.formObj && !this.formObj.isDestroyed
            && restrictedRequestTypes.indexOf(e.requestType) === -1) {
            this.destroyForm();
            this.destroyWidgets();
        }
    }

    /**
     * @hidden
     */
    public destroyWidgets(cols?: Column[]): void {
        cols = cols ? cols : this.parent.getColumns() as Column[];
        for (let col of cols) {
            if (col.edit.destroy) {
                col.edit.destroy();
            }
        }
    }

    /**
     * @hidden
     */
    public destroyForm(): void {
        this.destroyToolTip();
        if (this.formObj && !this.formObj.isDestroyed) {
            this.formObj.destroy();
        }
        this.destroyToolTip();
    }

    /**
     * To destroy the editing. 
     * @return {void}
     * @hidden
     */
    public destroy(): void {
        this.destroyForm();
        this.removeEventListener();
        let elem: Element = this.dialogObj.element;
        this.dialogObj.destroy();
        remove(elem);
        elem = this.alertDObj.element;
        this.alertDObj.destroy();
        remove(elem);
        this.unwireEvents();
    }

    private keyPressHandler(e: KeyboardEventArgs): void {
        switch (e.action) {
            case 'insert':
                this.addRecord();
                break;
            case 'delete':
                this.deleteRecord();
                break;
            case 'f2':
                this.startEdit();
                break;
            case 'enter':
                if (!parentsUntil(e.target as HTMLElement, '.e-unboundcelldiv') && this.parent.editSettings.mode !== 'batch' &&
                    (parentsUntil(e.target as HTMLElement, 'e-gridcontent') || (this.parent.frozenRows
                        && parentsUntil(e.target as HTMLElement, 'e-headercontent')))
                    && !document.querySelectorAll('.e-popup-open').length) {
                    e.preventDefault();
                    this.endEdit();
                }
                break;
            case 'escape':
                this.closeEdit();
                break;
        }
    }

    private preventBatch(args: {
        instance: Object,
        handler: Function, arg1?: Object, arg2?: Object, arg3?: Object,
        arg4?: Object, arg5?: Object, arg6?: Object, arg7?: Object
    }): void {
        this.preventObj = args;
        this.showDialog('BatchSaveLostChanges', this.dialogObj);
    }

    private executeAction(): void {
        this.preventObj.handler.call(
            this.preventObj.instance, this.preventObj.arg1, this.preventObj.arg2, this.preventObj.arg3, this.preventObj.arg4,
            this.preventObj.arg5, this.preventObj.arg6, this.preventObj.arg7);
    }

    /**
     * @hidden
     */
    public applyFormValidation(cols?: Column[]): void {
        let gObj: IGrid = this.parent;
        let frzCols: number = gObj.getFrozenColumns();
        let form: HTMLFormElement = gObj.element.querySelector('.e-gridform') as HTMLFormElement;
        let mForm: HTMLFormElement = gObj.element.querySelectorAll('.e-gridform')[1] as HTMLFormElement;
        let rules: Object = {};
        let mRules: Object = {};
        cols = cols ? cols : gObj.columns as Column[];
        for (let col of cols) {
            if (col.validationRules && form.querySelectorAll('#' + gObj.element.id + col.field).length) {
                rules[col.field] = col.validationRules;
            } else if (frzCols && col.validationRules
                && mForm.querySelectorAll('#' + gObj.element.id + col.field).length) {
                mRules[col.field] = col.validationRules;
            }
        }
        this.parent.editModule.formObj = this.createFormObj(form, rules);
        if (frzCols && this.parent.editSettings.mode !== 'dialog') {
            this.parent.editModule.mFormObj = this.createFormObj(mForm, mRules);
        }
    }

    private createFormObj(form: HTMLFormElement, rules: Object): FormValidator {
        return new FormValidator(form, {
            rules: rules as { [name: string]: { [rule: string]: Object } },
            validationComplete: (args: { status: string, inputName: string, element: HTMLElement, message: string }) => {
                this.validationComplete(args);
            },
            customPlacement: (inputElement: HTMLElement, error: HTMLElement) => {
                this.valErrorPlacement(inputElement, error);
            }
        });
    }

    private valErrorPlacement(inputElement: HTMLElement, error: HTMLElement): void {
        if (this.parent.isEdit) {
            let id: string = error.getAttribute('for');
            let elem: Element = this.getElemTable(inputElement).querySelector('#' + id + '_Error');
            if (!elem) {
                this.createTooltip(inputElement, error, id, '');
            } else {
                elem.querySelector('.e-tip-content').innerHTML = error.innerHTML;
            }
        }
    }

    private getElemTable(inputElement: Element): Element {
        let isFHdr: boolean;
        if (this.parent.editSettings.mode !== 'dialog') {
            isFHdr = (this.parent.frozenRows && this.parent.frozenRows
                > (parseInt(inputElement.closest('.e-row').getAttribute('aria-rowindex'), 10) || 0));
        }
        return this.parent.editSettings.mode !== 'dialog' ? isFHdr ? this.parent.getHeaderTable() : this.parent.getContentTable() :
            this.parent.element.querySelector('#' + this.parent.element.id + '_dialogEdit_wrapper');
    }

    private validationComplete(args: { status: string, inputName: string, element: HTMLElement, message: string }): void {
        if (this.parent.isEdit) {
            let elem: HTMLElement = this.getElemTable(args.element).querySelector('#' + args.inputName + '_Error') as HTMLElement;
            if (elem) {
                if (args.status === 'failure') {
                    elem.style.display = '';
                } else {
                    elem.style.display = 'none';
                }
            }
        }
    }

    private createTooltip(element: Element, error: HTMLElement, name: string, display: string): void {
        let gcontent: HTMLElement = this.parent.getContent().firstElementChild as HTMLElement;
        let isScroll: boolean = gcontent.scrollHeight > gcontent.clientHeight;
        let isInline: boolean = this.parent.editSettings.mode !== 'dialog';
        let isFHdr: boolean;
        if (isInline) {
            isFHdr = (this.parent.frozenRows && this.parent.frozenRows
                > (parseInt(element.closest('.e-row').getAttribute('aria-rowindex'), 10) || 0));
        }
        let fCont: Element = this.parent.getContent().querySelector('.e-frozencontent');
        let table: Element = isInline ?
            (isFHdr ? this.parent.getHeaderTable() : this.parent.getContentTable()) :
            this.parent.element.querySelector('#' + this.parent.element.id + '_dialogEdit_wrapper').querySelector('.e-dlg-content');
        let client: ClientRect = table.getBoundingClientRect();
        let left: number = isInline ?
            this.parent.element.getBoundingClientRect().left : client.left;
        let input: HTMLElement = parentsUntil(element, 'e-rowcell') as HTMLElement;
        let inputClient: ClientRect = input.getBoundingClientRect();
        let td: ClientRect = (closest(element, 'td') as HTMLElement).getBoundingClientRect();
        let div: HTMLElement = createElement('div', {
            className: 'e-tooltip-wrap e-popup e-griderror',
            id: name + '_Error',
            styles: 'display:' + display + ';top:' +
                ((isFHdr ? inputClient.top + inputClient.height : inputClient.bottom - client.top
                    - (this.parent.getFrozenColumns() ? fCont.scrollTop : 0)) + table.scrollTop + 9) + 'px;left:' +
                (inputClient.left - left + table.scrollLeft + inputClient.width / 2) + 'px;' +
                'max-width:' + td.width + 'px;text-align:center;'
        });

        let content: Element = createElement('div', { className: 'e-tip-content' });
        content.appendChild(error);
        let arrow: Element = createElement('div', { className: 'e-arrow-tip e-tip-top' });
        arrow.appendChild(createElement('div', { className: 'e-arrow-tip-outer e-tip-top' }));
        arrow.appendChild(createElement('div', { className: 'e-arrow-tip-inner e-tip-top' }));
        div.appendChild(content);
        div.appendChild(arrow);
        table.appendChild(div);
        let lineHeight: number = parseInt(
            document.defaultView.getComputedStyle(div, null).getPropertyValue('font-size'), 10
        );
        if (div.getBoundingClientRect().width < td.width &&
            div.querySelector('label').getBoundingClientRect().height / (lineHeight * 1.2) >= 2) {
            div.style.width = div.style.maxWidth;
        }

        div.style.left = (parseInt(div.style.left, 10) - div.offsetWidth / 2) + 'px';
        if (!isScroll && isInline && !this.parent.allowPaging) {
            gcontent.style.position = 'static';
            let pos: OffsetPosition = calculateRelativeBasedPosition(input, div);
            div.style.top = pos.top + inputClient.height + 9 + 'px';
        }
    }

}
