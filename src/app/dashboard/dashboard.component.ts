import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { GlobalUrl } from '../globalUrl';
import { Http, ResponseType, Response, Headers } from '@angular/http';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  headers = new Headers();
  list: any;
  user: any;
  translateArray = new Array();
  translateBookArray = new Array();
  alignArray = new Array();
  alignBookArray = new Array();
  checkArray = new Array();
  checkBookArray = new Array();

  constructor(private API: GlobalUrl, public router: Router,
    private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl) {
    this.toastr.toastrConfig.positionClass = "toast-top-center"
    this.toastr.toastrConfig.closeButton = true;
    this.toastr.toastrConfig.progressBar = true;
    this.createAuthorizationHeader(this.headers);
  }

  createAuthorizationHeader(headers: Headers) {
    if (localStorage.getItem("access-token")) {
      headers.append('Authorization', 'bearer ' +
        localStorage.getItem("access-token"));

      this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));
    }
  }

  decodeToken(token) {
    var playload = JSON.parse(atob(token.split('.')[1]));
    //console.log(playload)
    this.user = playload.sub;
    let dd = Number(playload.exp)
    var timeDiff = Math.abs(new Date(dd * 1000).getTime() - new Date().getTime());
    if (Math.ceil(timeDiff / (1000 * 3600 * 24)) > 1) {
      localStorage.setItem("access-token", '');
      this.router.navigate(['../app-login']);
    }
  }

  AlignmentClick(i){
    console.log(i)
    localStorage.setItem("AlignmentLang",this.alignArray[i]);
    localStorage.setItem("AlignmentBooks",this.alignBookArray[i]);
    this.router.navigate(['../app-bcv-search/' + this.alignArray[i]+ '/' + this.alignBookArray[i]]);
  }

  ngOnInit() {
    this._http.get(this.ApiUrl.taskListForUser + "/" + this.user, {
      headers: this.headers
    })
      .subscribe(data => {
        this.list = data.json();
        //console.log(this.list[0].books)

        for (let i = 0; i < this.list.length; i++) {
          if (this.list[i].role == "translate") {
            this.translateArray.push(this.list[i].project)
            this.translateBookArray.push(this.list[i].books)
          }
          else if (this.list[i].role == "align") {
            this.alignArray.push(this.list[i].project)
            this.alignBookArray.push(this.list[i].books)
          }
          else if (this.list[i].role == "check") {
            this.checkArray.push(this.list[i].project)
            this.checkBookArray.push(this.list[i].books)
          }
        }



      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })
  }

}
