import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from "@angular/core";
import * as D3 from "d3-3.5.17";
import { Http, ResponseType, Response, Headers } from '@angular/http';
import { GlobalUrl } from '../globalUrl';
import { ToastrService } from 'ngx-toastr';
import { BrowserModule } from '@angular/platform-browser';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})

export class ReportsComponent {

  single: any = [];
  multi: any[];

  trimLabels: false;

  view: any[] = [1050, 500];

  // options
  showLegend = true;

  colorScheme = {
    domain: ['#a8385d', '#7aa3e5', '#C7B42C', '#AAAAAA']
  };

  // pie
  showLabels = true;
  explodeSlices = false;
  doughnut = false;

  onSelect(event) {
    console.log(event);
  }

  LangArray: any;
  langFirstIndex: any;
  display: boolean;
  glang: any;
  autoalign: any;
  manualalign: any;

  constructor(private toastr: ToastrService, private API: GlobalUrl, private _http: Http, private ApiUrl: GlobalUrl) {
    this.toastr.toastrConfig.positionClass = "toast-top-center"
    this.toastr.toastrConfig.closeButton = true;
    this.toastr.toastrConfig.progressBar = true;
    this.toastr.toastrConfig.timeOut = 1200;
  }

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
  }

  glLangChange(key) {
    //console.log('event run')

    this.glang = key;
    this.display = true;
    document.getElementById('pie').style.visibility = "hidden";
    this._http.get(this.ApiUrl.reports + "/" + key + "/grk-ugnt")
      .subscribe(Response => {
        if (Response.json()) {
          this.display = false;
          this.toastr.success('Reports loaded.')
          // console.log (Object.values((Object.values( Response.json()))[0])  )
          // console.log ( Object(Object.values( Response.json()))["autoAlignedCount"] )

          this.manualalign = (Object.values((Object.values(Response.json()))[0]))[3];
          this.autoalign = (Object.values((Object.values(Response.json()))[0]))[1];

          this.single = [{ "name": "AutoAligned", "value": this.autoalign }, { "name": "ManualAligned", "value": this.manualalign }]
          document.getElementById('pie').style.visibility = "visible";

        }
        else {
          this.display = false;
          this.toastr.error(Response.json().message)
        }
        this.display = false;

      })

  }
}
