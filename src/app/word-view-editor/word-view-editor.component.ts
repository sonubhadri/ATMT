import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GlobalUrl } from '../globalUrl';
import { MatPaginator, MatSort, MatTableDataSource } from '@angular/material';
import 'hammerjs';
import { parse } from 'url';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute, Params } from '@angular/router';

export interface PeriodicElement {
  StrongNumber: any;
  Checked: any;
  Unchecked: any;
}

@Component({
  selector: 'word-view-editor',
  templateUrl: './word-view-editor.component.html',
  styleUrls: ['./word-view-editor.component.css']
})
export class WordViewEditorComponent implements OnInit {

  ELEMENT_DATA: PeriodicElement[] = [];

  displayedColumns: string[] = ['Strong Number', 'Checked', 'Unchecked'];
  dataSource = new MatTableDataSource<PeriodicElement>(this.ELEMENT_DATA);
  LangArray: any;
  strongArray: any
  langFirstIndex: any;
  display:boolean;

  ngOnInit() {
    localStorage.setItem("language", "");
    
    this.langFirstIndex = 0;

    
    this._http.get(this.ApiUrl.getLang)
      .subscribe(data => {
        this.LangArray = data.json();
      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Language data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })


    this._http.get(this.ApiUrl.strongslist)
      .subscribe(data => {
        this.display = true;
        this.strongArray = data.json();
        this.getSampeTranslationData();
        
      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Strongs data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })
    
  }

  constructor(public router: Router, private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl, private changeDetectorRefs: ChangeDetectorRef) {
  }


  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  getSampeTranslationData() {
    if (this.strongArray) {
      for (let i = 0; i < this.strongArray.length; i++) {

         
        this.ELEMENT_DATA.push({StrongNumber:this.strongArray[i], Checked:'NA', Unchecked:'NA' })
      }
      this.dataSource = new MatTableDataSource<PeriodicElement>(this.ELEMENT_DATA);
    }
    this.display = false;
  }

}

