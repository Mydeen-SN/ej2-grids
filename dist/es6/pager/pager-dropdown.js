import { createElement, remove } from '@syncfusion/ej2-base';
import { DropDownList } from '@syncfusion/ej2-dropdowns';
/**
 * `PagerDropDown` module handles selected pageSize from DropDownList.
 */
var PagerDropDown = /** @class */ (function () {
    /**
     * Constructor for pager module
     * @hidden
     */
    function PagerDropDown(pagerModule) {
        this.pagerModule = pagerModule;
    }
    /**
     * For internal use only - Get the module name.
     * @private
     * @hidden
     */
    PagerDropDown.prototype.getModuleName = function () {
        return 'pagerdropdown';
    };
    /**
     * The function is used to render pager dropdown
     * @hidden
     */
    PagerDropDown.prototype.render = function () {
        var pagerObj = this.pagerModule;
        this.pagerDropDownDiv = createElement('div', { className: 'e-pagesizes' });
        var dropDownDiv = createElement('div', { className: 'e-pagerdropdown' });
        var defaultTextDiv = createElement('div', { className: 'e-pagerconstant' });
        var input = createElement('input', { attrs: { type: 'text', tabindex: '1' } });
        this.pagerCons = createElement('span', { className: 'e-constant', innerHTML: this.pagerModule.getLocalizedLabel('pagerDropDown') });
        dropDownDiv.appendChild(input);
        defaultTextDiv.appendChild(this.pagerCons);
        this.pagerDropDownDiv.appendChild(dropDownDiv);
        this.pagerDropDownDiv.appendChild(defaultTextDiv);
        this.pagerModule.element.appendChild(this.pagerDropDownDiv);
        var pageSizesModule = this.pagerModule.pageSizes;
        var pageSizesArray = (pageSizesModule.length ? pageSizesModule : [5, 10, 12, 20]);
        var defaultValue = (pageSizesArray).indexOf(this.pagerModule.pageSize) > -1 ? this.pagerModule.pageSize : pageSizesArray[0];
        this.dropDownListObject = new DropDownList({
            dataSource: pageSizesArray,
            value: defaultValue,
            change: this.onChange.bind(this)
        });
        this.dropDownListObject.appendTo(input);
        pagerObj.pageSize = defaultValue;
        pagerObj.dataBind();
        pagerObj.trigger('dropDownChanged', { pageSize: defaultValue });
    };
    /**
     * For internal use only - Get the pagesize.
     * @private
     * @hidden
     */
    PagerDropDown.prototype.onChange = function (e) {
        this.pagerModule.pageSize = this.dropDownListObject.value;
        this.pagerModule.dataBind();
        this.pagerModule.trigger('dropDownChanged', { pageSize: this.dropDownListObject.value });
    };
    /**
     * To destroy the Pagerdropdown
     * @method destroy
     * @return {void}
     * @hidden
     */
    PagerDropDown.prototype.destroy = function (args) {
        if (this.dropDownListObject && !this.dropDownListObject.isDestroyed) {
            this.dropDownListObject.destroy();
            remove(this.pagerDropDownDiv);
        }
    };
    return PagerDropDown;
}());
export { PagerDropDown };
