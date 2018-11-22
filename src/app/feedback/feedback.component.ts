import { Component, OnInit } from '@angular/core';
import { GlobalUrl } from '../globalUrl';
import { Http, ResponseType, Response, Headers } from '@angular/http';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute, Params } from '@angular/router';

@Component({
  selector: 'app-feedback',
  templateUrl: './feedback.component.html',
  styleUrls: ['./feedback.component.css']
})
export class FeedbackComponent implements OnInit {

  subject: any;
  email: any;
  suggestion: any;
  display: any = false;
  headers = new Headers();

  constructor(public router: Router, private toastr: ToastrService, private _http: Http, private API: GlobalUrl) {
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
    let dd = Number(playload.exp)
    this.email = playload.sub;
    var timeDiff = Math.abs(new Date(dd * 1000).getTime() - new Date().getTime());
    if (Math.ceil(timeDiff / (1000 * 3600 * 24)) > 1) {
      localStorage.setItem("access-token", '');
      this.router.navigate(['../']);
    }
  }


  ngOnInit() {
  }

  submit() {

    this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));

    this.display = true;
    
    this._http.post(this.API.feedbackForm, { "email": this.email?this.email:"test@gmail.com", "subject": this.subject?this.subject:"No Subject", "feedback": this.suggestion?this.suggestion:"No Suggestion" })
      .subscribe(Response => {
        //console.log(Response.json())
        if (Response.json().success == true) {
          this.display = false;
          this.toastr.success('Suggestion Sent to admin.')
        }
        else {
          this.display = false;
          this.toastr.error(Response.json().message)
        }
        this.display = false;
      }
      )

  }

}