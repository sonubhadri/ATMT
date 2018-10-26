import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Http, Response, Headers } from '@angular/http';
import { GlobalUrl } from '../globalUrl';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'combo',
  templateUrl: './combo.component.html',
  styleUrls: ['./combo.component.css']
})
export class ComboComponent implements OnInit {

  BCV: any;
  Strong: any;
  langWord: any;
  linearCard: any;
  sourcetext;
  targettext;
  englishword;
  englishSourceArray = new Array();
  display: boolean;
  headers = new Headers();
  constructor(public router: Router, private toastr: ToastrService, private activatedRoute: ActivatedRoute, private _http: Http, private ApiUrl: GlobalUrl) {
    this.toastr.toastrConfig.positionClass = "toast-top-center"
    this.toastr.toastrConfig.closeButton = true;
    this.toastr.toastrConfig.progressBar = true;
    this.toastr.toastrConfig.timeOut = 1200;

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
    var timeDiff = Math.abs(new Date(dd * 1000).getTime() - new Date().getTime());
    if (Math.ceil(timeDiff / (1000 * 3600 * 24)) > 1) {
      localStorage.setItem("access-token", '');
      this.router.navigate(['../app-login']);
    }
  }

  ngOnInit() {

    this.activatedRoute.params.subscribe((params: Params) => {

      if (params['BCV']) {
        this.BCV = params['BCV'].split('-')[0];
        this.Strong = params['BCV'].split('-')[1];
        this.langWord = params['BCV'].split('-')[2];
        var x: any = this.BCV;
        var l: any = 'grkhin'; //this.Lang;
        //console.log(x)

        this.display = true;
        this._http.get(this.ApiUrl.getnUpdateBCV + '/' + x + '/' + l)
          .subscribe(data => {

            this.linearCard = data.json();
            //console.log(data.json())
            this.sourcetext = this.linearCard.sourcetext;
            this.targettext = this.linearCard.targettext;
            this.englishword = this.linearCard.englishword;

            if (this.sourcetext.length == this.englishword.length) {

              for (let i = 0; i < this.sourcetext.length; i++) {
                this.englishSourceArray.push(this.englishword[i] + '<' + this.sourcetext[i] + '>');
              }
            }
            //console.log('G' + params['Strong'] + '0')

            //let response: any = data;
            this.display = false;
            //console.log(this.linearCard.positionalpairs)
          }, (error: Response) => {
            if (error.status === 400) {
              this.display = false;
              // this.toastr.warning("Bad Request Error.")
            }
            else {
              this.display = false;
              // this.toastr.error("An Unexpected Error Occured.")
            }

          })
      }
    });

  }

  ngAfterViewChecked() {
    if (document.getElementById(this.Strong) && document.getElementById(this.langWord)) {
      document.getElementById(this.Strong).style.background = 'yellow';

      if (this.targettext.includes(this.langWord) && this.sourcetext.includes(Number(this.Strong))) {
        //console.log(Number(this.targettext.indexOf(e) + 1))
        let left = Number(this.targettext.indexOf(this.langWord) + 1);
        let right = Number(this.sourcetext.indexOf(Number(this.Strong)) + 1);

        if (this.linearCard.positionalpairs.includes(left + "-" + right)) {
          const index: number = this.linearCard.positionalpairs.indexOf(left + "-" + right);
          if (index !== -1) {
            console.log("ngview")
            document.getElementById(this.langWord).style.background = 'black';
          }
        }
      }
    }
  }

  targetClick(e) {
    console.log(this.linearCard.positionalpairs)
    if (this.targettext.includes(e) && this.sourcetext.includes(Number(this.Strong))) {
      //console.log(Number(this.targettext.indexOf(e) + 1))
      let left = Number(this.targettext.indexOf(e) + 1);
      let right = Number(this.sourcetext.indexOf(Number(this.Strong)) + 1);
      console.log(left + "-" + right)

      if (this.linearCard.positionalpairs.includes(left + "-" + right)) {

        const index: number = this.linearCard.positionalpairs.indexOf(left + "-" + right);
        if (index !== -1) {
          this.linearCard.positionalpairs.splice(index, 1);
          console.log("splice")
          document.getElementById(e).style.background = '';
        }
      }
      else {
        this.linearCard.positionalpairs.push(left + "-" + right);

        document.getElementById(e).style.background = "black";
      }
    }
    console.log(this.linearCard.positionalpairs)
  }

  saveOnClick() {
    if (localStorage.getItem('access-token')) {
      this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));
      var x: any = this.BCV;
      var y: any = this.linearCard.positionalpairs;
      var l: any = 'grkhin'; //this.Lang;


      var data = { "bcv": x, "positional_pairs": y, "lang": l };
      this.display = true;
      this._http.post(this.ApiUrl.getnUpdateBCV, data, {
        headers: this.headers
      })
        .subscribe(data => {
          let response: any = data;
          this.display = false;
          //console.log(response._body);
          if (response._body === 'Saved') {
            this.toastr.success('Updation has been done successfully.');
          }
        }, (error: Response) => {
          if (error.status === 400) {
            this.display = false;
            this.toastr.warning("Bad Request Error.")
          }
          else {
            this.display = false;
            this.toastr.error("An Unexpected Error Occured.")
          }

        })
    }
    else {
      this.toastr.error('You are not a registered User. Sign In to make changes.')
    }
  }



}
