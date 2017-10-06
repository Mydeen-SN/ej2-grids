import { extend } from '@syncfusion/ej2-base';
import { remove } from '@syncfusion/ej2-base';
import { parentsUntil } from '../base/util';
import * as events from '../base/constant';
import { RowRenderer } from '../renderer/row-renderer';
var NormalEdit = (function () {
    function NormalEdit(parent, serviceLocator, renderer) {
        this.parent = parent;
        this.renderer = renderer;
        this.serviceLocator = serviceLocator;
        this.addEventListener();
    }
    NormalEdit.prototype.clickHandler = function (e) {
        var target = e.target;
        var gObj = this.parent;
        if (parentsUntil(target, 'e-gridcontent')) {
            this.rowIndex = parentsUntil(target, 'e-rowcell') ? parseInt(target.parentElement.getAttribute('aria-rowindex'), 10) : -1;
            if (gObj.isEdit) {
                gObj.editModule.endEdit();
            }
        }
    };
    NormalEdit.prototype.dblClickHandler = function (e) {
        if (parentsUntil(e.target, 'e-rowcell') && this.parent.editSettings.allowEditOnDblClick) {
            this.parent.editModule.startEdit(parentsUntil(e.target, 'e-row'));
        }
    };
    NormalEdit.prototype.editComplete = function (e) {
        switch (e.requestType) {
            case 'save':
                this.parent.selectRow(0);
                this.parent.trigger(events.actionComplete, extend(e, {
                    requestType: 'save',
                    type: events.actionComplete
                }));
                break;
            case 'delete':
                this.parent.selectRow(this.editRowIndex);
                this.parent.trigger(events.actionComplete, extend(e, {
                    requestType: 'delete',
                    type: events.actionComplete
                }));
                break;
        }
        this.parent.element.focus();
    };
    NormalEdit.prototype.startEdit = function (tr) {
        var gObj = this.parent;
        var primaryKeys = gObj.getPrimaryKeyFieldNames();
        var primaryKeyValues = [];
        this.rowIndex = this.editRowIndex = parseInt(tr.getAttribute('aria-rowindex'), 10);
        this.previousData = gObj.getCurrentViewRecords()[this.rowIndex];
        for (var i = 0; i < primaryKeys.length; i++) {
            primaryKeyValues.push(this.previousData[primaryKeys[i]]);
        }
        var args = {
            row: tr, primaryKey: primaryKeys, primaryKeyValue: primaryKeyValues, requestType: 'beginEdit',
            rowData: this.previousData, rowIndex: this.rowIndex, type: 'edit', cancel: false
        };
        gObj.trigger(events.beginEdit, args);
        args.type = 'actionBegin';
        gObj.trigger(events.actionBegin, args);
        if (args.cancel) {
            return;
        }
        gObj.clearSelection();
        gObj.isEdit = true;
        this.renderer.update(args);
        this.uid = tr.getAttribute('data-uid');
        gObj.editModule.applyFormValidation();
        args.type = 'actionComplete';
        gObj.trigger(events.actionComplete, args);
    };
    NormalEdit.prototype.endEdit = function () {
        var gObj = this.parent;
        if (!this.parent.isEdit || !gObj.editModule.formObj.validate()) {
            return;
        }
        var editedData = extend({}, this.previousData);
        var args = {
            requestType: 'save', type: events.actionBegin, data: editedData, cancel: false,
            previousData: this.previousData, selectedRow: gObj.selectedRowIndex, foreignKeyData: {}
        };
        editedData = gObj.editModule.getCurrentEditedData(gObj.element.querySelector('.e-gridform'), editedData);
        if (gObj.element.querySelectorAll('.e-editedrow').length) {
            args.action = 'edit';
            gObj.trigger(events.actionBegin, args);
            if (args.cancel) {
                return;
            }
            gObj.notify(events.updateData, args);
        }
        else {
            args.action = 'add';
            args.selectedRow = 0;
            gObj.notify(events.modelChanged, args);
            if (args.cancel) {
                return;
            }
        }
        this.parent.notify(events.dialogDestroy, {});
        this.stopEditStatus();
    };
    NormalEdit.prototype.editHandler = function (args) {
        var _this = this;
        if (args.promise) {
            args.promise.then(function (e) { return _this.edSucc(e, args); }).catch(function (e) { return _this.edFail(e); });
        }
        else {
            this.editSuccess({}, args);
        }
    };
    NormalEdit.prototype.edSucc = function (e, args) {
        this.editSuccess(e, args);
    };
    NormalEdit.prototype.edFail = function (e) {
        this.editFailure(e);
    };
    NormalEdit.prototype.editSuccess = function (e, args) {
        if (e.result) {
            this.parent.trigger(events.beforeDataBound, e);
            args.data = e.result;
        }
        else {
            this.parent.trigger(events.beforeDataBound, args);
        }
        args.type = events.actionComplete;
        this.refreshRow(args.data);
        this.parent.trigger(events.actionComplete, args);
        this.parent.selectRow(this.rowIndex > -1 ? this.rowIndex : this.editRowIndex);
        this.parent.element.focus();
    };
    NormalEdit.prototype.editFailure = function (e) {
        this.parent.trigger(events.actionFailure, e);
    };
    NormalEdit.prototype.refreshRow = function (data) {
        var row = new RowRenderer(this.serviceLocator, null, this.parent);
        var rowObj = this.parent.getRowObjectFromUID(this.uid);
        if (rowObj) {
            rowObj.changes = data;
            row.refresh(rowObj, this.parent.columns, true);
        }
    };
    NormalEdit.prototype.closeEdit = function () {
        var gObj = this.parent;
        var args = {
            requestType: 'cancel', type: events.actionBegin, data: this.previousData, selectedRow: gObj.selectedRowIndex
        };
        gObj.trigger(events.actionBegin, args);
        this.stopEditStatus();
        args.type = events.actionComplete;
        if (gObj.editSettings.mode !== 'dialog') {
            this.refreshRow(args.data);
        }
        gObj.selectRow(this.rowIndex);
        gObj.element.focus();
        gObj.trigger(events.actionComplete, args);
    };
    NormalEdit.prototype.addRecord = function (data) {
        var gObj = this.parent;
        if (gObj.isEdit) {
            return;
        }
        if (data) {
            gObj.notify(events.modelChanged, {
                requestType: 'add', type: events.actionBegin, data: data
            });
            return;
        }
        this.previousData = {};
        this.uid = '';
        for (var _i = 0, _a = gObj.columns; _i < _a.length; _i++) {
            var col = _a[_i];
            this.previousData[col.field] = data && data[col.field] ? data[col.field] : col.defaultValue;
        }
        var args = {
            cancel: false, foreignKeyData: {},
            requestType: 'add', data: this.previousData, type: events.actionBegin
        };
        gObj.trigger(events.actionBegin, args);
        if (args.cancel) {
            return;
        }
        gObj.clearSelection();
        gObj.isEdit = true;
        this.renderer.addNew({ rowData: args.data, requestType: 'add' });
        gObj.editModule.applyFormValidation();
        args.type = events.actionComplete;
        args.row = gObj.element.querySelector('.e-addedrow');
        gObj.trigger(events.actionComplete, args);
    };
    NormalEdit.prototype.deleteRecord = function (fieldname, data) {
        this.editRowIndex = this.parent.selectedRowIndex;
        this.parent.notify(events.modelChanged, {
            requestType: 'delete', type: events.actionBegin, foreignKeyData: {},
            data: data ? [data] : this.parent.getSelectedRecords(), tr: this.parent.getSelectedRows(), cancel: false
        });
    };
    NormalEdit.prototype.stopEditStatus = function () {
        var gObj = this.parent;
        gObj.isEdit = false;
        var elem = gObj.element.querySelector('.e-addedrow');
        if (elem) {
            remove(elem);
        }
        elem = gObj.element.querySelector('.e-editedrow');
        if (elem) {
            elem.classList.remove('e-editedrow');
        }
    };
    NormalEdit.prototype.addEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.on(events.crudAction, this.editHandler, this);
        this.parent.on(events.doubleTap, this.dblClickHandler, this);
        this.parent.on(events.click, this.clickHandler, this);
        this.parent.on(events.dblclick, this.dblClickHandler, this);
        this.parent.on(events.deleteComplete, this.editComplete, this);
        this.parent.on(events.saveComplete, this.editComplete, this);
    };
    NormalEdit.prototype.removeEventListener = function () {
        if (this.parent.isDestroyed) {
            return;
        }
        this.parent.off(events.crudAction, this.editHandler);
        this.parent.off(events.doubleTap, this.dblClickHandler);
        this.parent.off(events.click, this.clickHandler);
        this.parent.off(events.dblclick, this.dblClickHandler);
        this.parent.off(events.deleteComplete, this.editComplete);
        this.parent.off(events.saveComplete, this.editComplete);
    };
    NormalEdit.prototype.destroy = function () {
        this.removeEventListener();
    };
    return NormalEdit;
}());
export { NormalEdit };
