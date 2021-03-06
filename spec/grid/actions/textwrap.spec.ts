/**
 * Grid base spec 
 */
import { EmitType } from '@syncfusion/ej2-base';
import { createElement, remove } from '@syncfusion/ej2-base';
import { Grid } from '../../../src/grid/base/grid';
import { Page } from '../../../src/grid/actions/page';
import { Freeze } from '../../../src/grid/actions/freeze';
import { data } from '../base/datasource.spec';
import '../../../node_modules/es6-promise/dist/es6-promise';

Grid.Inject(Page, Freeze);

describe('auto wrap testing', () => {
    describe('auto wrap properties', () => {
        let gridObj: Grid;
        let elem: HTMLElement = createElement('div', { id: 'Grid' });
        let actionComplete: (e?: Object) => void;
        beforeAll((done: Function) => {
            let dataBound: EmitType<Object> = () => { done(); };
            document.body.appendChild(elem);
            gridObj = new Grid(
                {
                    dataSource: data, allowPaging: false,
                    columns: [
                        { headerText: 'OrderID', field: 'OrderID' },
                        { headerText: 'CustomerID', field: 'CustomerID' },
                        { headerText: 'EmployeeID', field: 'EmployeeID' },
                        { headerText: 'ShipCountry', field: 'ShipCountry' },
                        { headerText: 'ShipCity', field: 'ShipCity' },
                    ],
                    allowTextWrap: true,
                    textWrapSettings: { wrapMode: 'header' },
                    dataBound: dataBound,
                    actionComplete: actionComplete,
                });
            gridObj.appendTo('#Grid');
        });

        it('class testing for header', () => {
            expect(gridObj.element.classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.element.querySelector('.e-columnheader').classList.contains('e-wrap')).toBeTruthy();
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeFalsy();
        });
        it('class testing for content', () => {
            gridObj.textWrapSettings.wrapMode = 'content';
            gridObj.dataBind();
            expect(gridObj.element.classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.element.querySelector('.e-columnheader').classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeTruthy();
        });
        it('class testing for both', () => {
            gridObj.textWrapSettings.wrapMode = 'both';
            gridObj.dataBind();
            expect(gridObj.element.classList.contains('e-wrap')).toBeTruthy();
            expect(gridObj.element.querySelector('.e-columnheader').classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeFalsy();
        });
        it('class testing for auto wrap property as false', () => {
            gridObj.allowTextWrap = false;
            gridObj.textWrapSettings.wrapMode = 'both';
            gridObj.dataBind();
            expect(gridObj.element.classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.element.querySelector('.e-columnheader').classList.contains('e-wrap')).toBeFalsy();
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeFalsy();
        });
        afterAll(() => {
            remove(elem);
        });
    });
    describe('auto wrap properties for stacked headercolumns', () => {
        let gridObj: Grid;
        let elem: HTMLElement = createElement('div', { id: 'Grid' });
        let actionComplete: (e?: Object) => void;
        beforeAll((done: Function) => {
            let dataBound: EmitType<Object> = () => { done(); };
            document.body.appendChild(elem);
            gridObj = new Grid(
                {
                    dataSource: data, allowPaging: false,
                    columns: [{
                        headerText: 'Detail of the order', columns: [{ headerText: 'OrderID', field: 'OrderID' },
                        { headerText: 'CustomerID', field: 'CustomerID' },
                        { headerText: 'EmployeeID', field: 'EmployeeID' }
                        ]
                    },
                    {
                        headerText: 'Details of shipping', columns: [{ headerText: 'ShipCountry', field: 'ShipCountry' },
                        { headerText: 'ShipCity', field: 'ShipCity' }]
                    }
                    ],
                    allowTextWrap: true,
                    textWrapSettings: { wrapMode: 'header' },
                    dataBound: dataBound,
                    actionComplete: actionComplete,
                });
            gridObj.appendTo('#Grid');
        });

        it('class testing for header in stackedheadercolumns', () => {
            expect(gridObj.element.classList.contains('e-wrap')).toBeFalsy();
            let headerRows: Element[] = [].slice.call(gridObj.element.querySelectorAll('.e-columnheader'));
            for (let i: number = 0; i < headerRows.length; i++) {
                expect(headerRows[i].classList.contains('e-wrap')).toBeTruthy();
            }
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeFalsy();
        });
        afterAll(() => {
            remove(elem);
        });
    });
    describe('auto wrap properties for GroupedColumns', () => {
        let gridObj: Grid;
        let elem: HTMLElement = createElement('div', { id: 'Grid' });
        let actionComplete: (e?: Object) => void;
        beforeAll((done: Function) => {
            let dataBound: EmitType<Object> = () => { done(); };
            document.body.appendChild(elem);
            gridObj = new Grid(
                {
                    dataSource: data, allowPaging: false,
                    columns: [{
                        headerText: 'Detail of the order', columns: [{ headerText: 'OrderID', field: 'OrderID' },
                        { headerText: 'CustomerID', field: 'CustomerID' },
                        { headerText: 'EmployeeID', field: 'EmployeeID' }
                        ]
                    },
                    {
                        headerText: 'Details of shipping', columns: [{ headerText: 'ShipCountry', field: 'ShipCountry' },
                        { headerText: 'ShipCity', field: 'ShipCity' }]
                    }
                    ],
                    allowTextWrap: true,
                    textWrapSettings: { wrapMode: 'header' },
                    dataBound: dataBound,
                    actionComplete: actionComplete,
                });
            gridObj.appendTo('#Grid');
        });
        it('class testing for header with GroupedColumns', () => {
            gridObj.allowGrouping = true;
            gridObj.groupSettings.columns = ['CustomerID'];
            expect(gridObj.element.classList.contains('e-wrap')).toBeFalsy();
            let headerRows: Element[] = [].slice.call(gridObj.element.querySelectorAll('.e-columnheader'));
            for (let i: number = 0; i < headerRows.length; i++) {
                expect(headerRows[i].classList.contains('e-wrap')).toBeTruthy();
            }
            expect(gridObj.getContent().classList.contains('e-wrap')).toBeFalsy();
        });
        afterAll(() => {
            remove(elem);
        });
    });

    describe('Auto wrap with Freeze', () => {
        let gridObj: Grid;
        let elem: HTMLElement = createElement('div', { id: 'Grid' });
        beforeAll((done: Function) => {
            let dataBound: EmitType<Object> = () => { done(); };
            document.body.appendChild(elem);
            gridObj = new Grid(
                {
                    dataSource: data,
                    frozenColumns: 2,
                    frozenRows: 2,
                    columns: [{ field: 'OrderID', width: 100, headerText: 'Order IDDDDDDDDDDDDDDDDDDDDDDDDDDDDDDD' },
                    { field: 'CustomerID', width: 100, headerText: 'Customer ID' },
                    { field: 'EmployeeID', width: 100, headerText: 'Employee ID' },
                    { field: 'ShipName', width: 100, headerText: 'Ship Name' },
                    { field: 'ShipAddress', width: 100, headerText: 'Ship Address' },
                    { field: 'OrderDate', headerText: 'Order Date', width: 130, format: 'yMd', textAlign: 'right' },
                    { field: 'Freight', width: 110, format: 'C2', headerText: 'Freight' },
                    { field: 'ShipCountry', width: 130, headerText: 'Ship Country' },
                    { field: 'Verified', headerText: 'Verified', width: 190 }
                    ],
                    allowTextWrap: true,
                    textWrapSettings: { wrapMode: 'header' },
                    dataBound: dataBound
                });
            gridObj.appendTo('#Grid');
        });

        it('comparing height', () => {
            let fHdrTr: HTMLElement = gridObj.getHeaderContent().querySelector('.e-frozenheader').querySelector('tr');
            let mHdrTr: HTMLElement = gridObj.getHeaderContent().querySelector('.e-movableheader').querySelector('tr');
            let fHdrContTr: HTMLElement = gridObj.getHeaderContent()
                .querySelector('.e-frozenheader').querySelector('tbody').querySelector('tr');
            let mHdrContTr: HTMLElement = gridObj.getHeaderContent()
                .querySelector('.e-movableheader').querySelector('tbody').querySelector('tr');
            let fContTr: HTMLElement = gridObj.getContent().querySelector('.e-frozencontent').querySelector('tr');
            let mContTr: HTMLElement = gridObj.getContent().querySelector('.e-movablecontent').querySelector('tr');
            gridObj.textWrapSettings.wrapMode = 'both';
            gridObj.dataBind();
            expect(fHdrTr.offsetHeight).toBe(mHdrTr.offsetHeight);
            expect(fHdrContTr.offsetHeight).toBe(mHdrContTr.offsetHeight);
            expect(fContTr.offsetHeight).toBe(mContTr.offsetHeight);
            gridObj.textWrapSettings.wrapMode = 'header';
            gridObj.dataBind();
            expect(fHdrTr.offsetHeight).toBe(mHdrTr.offsetHeight);
            expect(fHdrContTr.offsetHeight).toBe(mHdrContTr.offsetHeight);
            expect(fContTr.offsetHeight).toBe(mContTr.offsetHeight);
            gridObj.textWrapSettings.wrapMode = 'content';
            gridObj.dataBind();
            expect(fHdrTr.offsetHeight).toBe(mHdrTr.offsetHeight);
            expect(fHdrContTr.offsetHeight).toBe(mHdrContTr.offsetHeight);
            expect(fContTr.offsetHeight).toBe(mContTr.offsetHeight);
            expect((gridObj.getHeaderContent().firstChild as Element).classList.contains('e-wrap')).toBeTruthy();
            gridObj.allowTextWrap = false;
            gridObj.dataBind();
            expect(fHdrTr.offsetHeight).toBe(mHdrTr.offsetHeight);
            expect(fHdrContTr.offsetHeight).toBe(mHdrContTr.offsetHeight);
            expect(fContTr.offsetHeight).toBe(mContTr.offsetHeight);
        });

        afterAll(() => {
            remove(elem);
        });
    });
});