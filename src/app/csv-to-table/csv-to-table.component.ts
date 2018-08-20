import { Component, OnInit, ViewChild } from '@angular/core';
import { Http , Response } from '@angular/http';
import {GlobalUrl} from '../globalUrl';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import 'hammerjs';

export interface PeriodicElement {  
  position: any;
  English: any;
  Hindi: any;
  Definition: any;
  StrongNumber: any;
  References: any;
}

@Component({
  selector: 'csv-to-table',
  templateUrl: './csv-to-table.component.html',
  styleUrls: ['./csv-to-table.component.css']
})
export class CsvToTableComponent implements OnInit {

   ELEMENT_DATA: PeriodicElement[] = [];
   csvData:any;

  displayedColumns: string[] = ['S.No', 'English Word forms', 'Hindi Translation', 'Definition/Facts/Description', 'Strong Number', 'References'];
  dataSource = new MatTableDataSource<PeriodicElement>(this.ELEMENT_DATA);
  // @ViewChild(MatPaginator) paginator: MatPaginator;
  // @ViewChild(MatSort) sort: MatSort;

  ngOnInit() {
    localStorage.setItem("language", "");
    this.getData();
  }

  constructor(private _http:Http,private ApiUrl:GlobalUrl) { }

   display = false;

  getData(){
    this.display = true;
    this._http.get(this.ApiUrl.csvFile)
    .subscribe(data => {
       this.csvData = data.text().split(/\r?\n|\r/);

      for (let i = 1; i < this.csvData.length - 1; i++) {
          let value = this.csvData[i].split('	');
          this.ELEMENT_DATA.push({ position: value[0], English: value[1], Hindi: value[2], Definition: value[3], StrongNumber:value[4], References:value[5] })

        // console.log(value[0]);
      }
      // this.dataSource.paginator = this.paginator;
      // this.dataSource.sort = this.sort;
      this.display = false;
    },(error:Response) =>{
      if(error.status === 404){
        this.display = false;
      }
      else{
        this.display = false;
      }
      
    })
  }

  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();

    // if (this.dataSource.paginator) {
    //   this.dataSource.paginator.firstPage();
    // }
  }

}
