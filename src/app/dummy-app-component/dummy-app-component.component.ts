import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { GlobalUrl } from '../globalUrl';
import { Router } from '@angular/router';
import 'hammerjs';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'dummy-app-component',
  templateUrl: './dummy-app-component.component.html',
  styleUrls: ['./dummy-app-component.component.css']
})
export class DummyAppComponentComponent implements OnInit {

  navBarFlag: boolean = true;
  logoutFlag: boolean = false;
  guestUser = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoZXJva3VAeW9wbWFpbC5jb20iLCJleHAiOjE1MzgxNjIwMTgsInJvbGUiOiJtZW1iZXIifQ.diVbmG_9TqRvgNIWKsnfrbgWUoqJxtWCc_HVVoFjMac";

  constructor(private toastr: ToastrService, private ApiUrl: GlobalUrl, private _http: Http, public router: Router) {
    this.createAuthorizationHeader(this.headers);
    this.toastr.toastrConfig.positionClass = "toast-top-center"
    this.toastr.toastrConfig.closeButton = true;
    this.toastr.toastrConfig.progressBar = true;
    this.toastr.toastrConfig.timeOut = 1200;
    if (localStorage.getItem('access-token')) {
      this.navBarFlag = true;
      this.logoutFlag = true;
    }
  }

  ngOnInit() { }

  createAuthorizationHeader(headers: Headers) {
    if(localStorage.getItem("access-token")){
      headers.append('Authorization', 'bearer ' +
        localStorage.getItem("access-token")); 
      }
      else{
        headers.append('Authorization', 'bearer ' + this.guestUser);
      }
  }

  title = 'app';

  home: any = "/app-bcv-search";
  csv: string = "/csv-to-table";
  textValue: string;
  headers = new Headers();

  searchBCV() {
    if (this.textValue) {
      var formData = new FormData();
      formData.append("reference", this.textValue);
      this._http.post(this.ApiUrl.getBcvSearch, formData, {
        headers: this.headers
      })
        .subscribe(data => {
          let response: any = data;
          //this.display = false;
          //console.log(this.textValue);
          this.textValue = "";
          this.router.navigate(['/app-bcv-search/' + response.json()]);

        }, (error: Response) => {
          if (error.status === 400) {
            //this.display = false;
            //this.toastr.warning("Bad Request Error.")
          }
          else {
            //this.display = false;
            //this.toastr.error("An Unexpected Error Occured.")
          }

        })
    }
  }

  logout() {
    localStorage.getItem("access-token") ? localStorage.setItem("access-token", '') : localStorage.setItem("access-token", ''); 
    this.toastr.success('You are succesfully logged out')
    this.router.navigate(['../app-login'])
  }

  signin() {
    this.router.navigate(['../app-login'])
  }

  signup() {
    this.router.navigate(['../app-register'])
  }

}
