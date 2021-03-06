import { isNullOrUndefined } from '@syncfusion/ej2-base';
import { createElement, attributes } from '@syncfusion/ej2-base';
import { Column } from '../models/column';
import { Cell } from '../models/cell';
import { ICellRenderer } from '../base/interface';
import { setStyleAndAttributes } from '../base/util';
import { CellRenderer } from './cell-renderer';
import { AriaService, IAriaOptions } from '../services/aria-service';
import { createCheckBox } from '@syncfusion/ej2-buttons';
/**
 * HeaderCellRenderer class which responsible for building header cell content. 
 * @hidden
 */
export class HeaderCellRenderer extends CellRenderer implements ICellRenderer<Column> {

    public element: HTMLElement = createElement('TH', { className: 'e-headercell', attrs: { role: 'columnheader', tabindex: '-1' } });
    private ariaService: AriaService = new AriaService();
    private hTxtEle: Element = createElement('span', { className: 'e-headertext' });
    private sortEle: Element = createElement('div', { className: 'e-sortfilterdiv e-icons' });
    private gui: Element = createElement('div');
    private chkAllBox: Element = createElement('input', { className: 'e-checkselectall', attrs: { 'type': 'checkbox' } });
    /**
     * Function to return the wrapper for the TH content.
     * @returns string 
     */
    public getGui(): string | Element {
        return <Element>this.gui.cloneNode();
    }

    /**
     * Function to render the cell content based on Column object.
     * @param  {Column} column
     * @param  {Object} data     
     * @param  {Element}
     */
    public render(cell: Cell<Column>, data: Object, attributes?: { [x: string]: Object }): Element {
        let node: Element = this.element.cloneNode() as Element;
        let fltrMenuEle: Element = createElement('div', { className: 'e-filtermenudiv e-icons e-icon-filter' });
        return this.prepareHeader(cell, node, fltrMenuEle);
    }

    /**
     * Function to refresh the cell content based on Column object.
     * @param  {Cell} cell
     * @param  {Element} node          
     */
    public refresh(cell: Cell<Column>, node: Element): Element {
        this.clean(node);
        let fltrMenuEle: Element = createElement('div', { className: 'e-filtermenudiv e-icons e-icon-filter' });
        return this.prepareHeader(cell, node, fltrMenuEle);
    }

    private clean(node: Element): void {
        node.innerHTML = '';
    }

    private prepareHeader(cell: Cell<Column>, node: Element, fltrMenuEle: Element): Element {
        let column: Column = cell.column; let ariaAttr: IAriaOptions<boolean> = {};
        //Prepare innerHtml
        let innerDIV: HTMLDivElement = <HTMLDivElement>this.getGui();

        attributes(innerDIV, {
            'e-mappinguid': column.uid,
            'class': 'e-headercelldiv'
        });

        if (column.type !== 'checkbox') {

            let value: string = column.headerText;

            let headerText: Element = <Element>this.hTxtEle.cloneNode();

            //TODO: Header Template support.

            headerText[column.getDomSetter()] = value;

            innerDIV.appendChild(headerText);
        } else {
            column.editType = 'booleanedit';
            let checkAllWrap: Element = createCheckBox(false, { checked: false, label: ' ' });
            checkAllWrap.insertBefore(this.chkAllBox.cloneNode(), checkAllWrap.firstChild);
            innerDIV.appendChild(checkAllWrap);
            innerDIV.classList.add('e-headerchkcelldiv');
        }

        this.buildAttributeFromCell(node as HTMLElement, cell);

        this.appendHtml(node, innerDIV);

        node.appendChild(this.sortEle.cloneNode());

        if ((this.parent.allowFiltering && this.parent.filterSettings.type !== 'filterbar') &&
            (column.allowFiltering && !isNullOrUndefined(column.field)) &&
            !(this.parent.showColumnMenu && column.showColumnMenu)) {
            attributes(fltrMenuEle, {
                'e-mappinguid': 'e-flmenu-' + column.uid,
            });
            node.classList.add('e-fltr-icon');
            let matchFlColumns: Object[] = [];
            if (this.parent.filterSettings.columns.length && this.parent.filterSettings.columns.length !== matchFlColumns.length) {
                for (let index: number = 0; index < this.parent.columns.length; index++) {
                    for (let count: number = 0; count < this.parent.filterSettings.columns.length; count++) {
                        if (this.parent.filterSettings.columns[count].field === column.field) {
                            fltrMenuEle.classList.add('e-filtered');
                            matchFlColumns.push(column.field);
                            break;
                        }
                    }
                }
            }
            node.appendChild(fltrMenuEle.cloneNode());
        }

        if (cell.className) {
            node.classList.add(cell.className);
        }

        if (column.customAttributes) {
            setStyleAndAttributes(node as HTMLElement, column.customAttributes);
        }

        if (column.allowSorting) {
            ariaAttr.sort = 'none';
        }
        if (column.allowGrouping) {
            ariaAttr.grabbed = false;
        }
        node = this.extendPrepareHeader(column, node);
        if (!isNullOrUndefined(column.headerTemplate)) {
            if (column.headerTemplate.indexOf('#') !== -1) {
                innerDIV.innerHTML = document.querySelector(column.headerTemplate).innerHTML.trim();
            } else {
                innerDIV.innerHTML = column.headerTemplate;
            }
        }

        this.ariaService.setOptions(<HTMLElement>node, ariaAttr);

        if (!isNullOrUndefined(column.headerTextAlign) || !isNullOrUndefined(column.textAlign)) {
            let alignment: string = column.headerTextAlign || column.textAlign;
            (innerDIV as HTMLElement).style.textAlign = alignment;
            if (alignment === 'right' || alignment === 'left') {
                node.classList.add(alignment === 'right' ? 'e-rightalign' : 'e-leftalign');
            } else if (alignment === 'center') {
                node.classList.add('e-centeralign');
            }
        }

        if (column.clipMode === 'clip') {
            node.classList.add('e-gridclip');
        } else if (column.clipMode === 'ellipsiswithtooltip') {
            node.classList.add('e-ellipsistooltip');
        }
        node.setAttribute('aria-rowspan', (!isNullOrUndefined(cell.rowSpan) ? cell.rowSpan : 1).toString());
        node.setAttribute('aria-colspan', '1');
        return node;
    }

    private extendPrepareHeader(column: Column, node: Element): Element {
        if (this.parent.showColumnMenu && column.showColumnMenu && !isNullOrUndefined(column.field)) {
            let element: Element = (createElement('div', { className: 'e-icons e-columnmenu' }));
            let matchFilteredColumns: Object[] = [];
            if (this.parent.filterSettings.columns.length && this.parent.filterSettings.columns.length !== matchFilteredColumns.length) {
                for (let i: number = 0; i < this.parent.columns.length; i++) {
                    for (let j: number = 0; j < this.parent.filterSettings.columns.length; j++) {
                        if (this.parent.filterSettings.columns[j].field === column.field) {
                            element.classList.add('e-filtered');
                            matchFilteredColumns.push(column.field);
                            break;
                        }
                    }
                }
            }
            node.classList.add('e-fltr-icon');
            node.appendChild(element);
        }

        if (this.parent.allowResizing) {
            let handler: HTMLElement = createElement('div');
            handler.className = column.allowResizing ? 'e-rhandler e-rcursor' : 'e-rsuppress';
            node.appendChild(handler);
        }
        return node;
    }

    /**
     * Function to specifies how the result content to be placed in the cell.
     * @param  {Element} node
     * @param  {string|Element} innerHtml
     * @returns Element
     */
    public appendHtml(node: Element, innerHtml: string | Element): Element {
        node.appendChild(<Element>innerHtml);
        return node;
    }
}