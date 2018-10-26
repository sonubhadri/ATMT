import { Router, ActivatedRoute, Params } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { Http, ResponseType } from '@angular/http';
import { ToastrService } from 'ngx-toastr';
import { FormControl, Validators } from '@angular/forms';
import {GlobalUrl} from '../globalUrl'

@Component({
  selector: 'strongpage',
  templateUrl: './strongpage.component.html',
  styleUrls: ['./strongpage.component.css']
})
export class StrongpageComponent implements OnInit {

  strongNo : any;
  display = false;
  apiData:any;
  lexicon:any;
  definition:any;
  pronunciation:any;
  sourceword:any;
  strongs:any;
  targetword:any;
  transliteration:any;
  objlen:Number;
  objLenArr:any = [];
  objCountArr:any = [];
  objLangWordArr:any = [];
  objBcvArr:any = [];

  constructor(private toastr: ToastrService,private ApiUrl: GlobalUrl, private _http: Http,public router: Router,private activatedRoute: ActivatedRoute) { }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params: Params) => {
      if (params['Strong']) {
        this.strongNo = params['Strong'];
      }
    });

    this._http.get(this.ApiUrl.strongslist + '/grkhin/' + this.strongNo)
    .subscribe(data => {
      this.display = true;
      this.apiData = data.json();
      this.objlen = Object.keys(this.apiData).length;
      this.createObjArr();
      // console.log(Object.keys(this.apiData).length)
       //console.log((Object.keys(this.apiData)))
      //  console.log((Object.values(this.apiData)[0]))
       //console.log(this.apiData)
      this.display = false;
    }, (error: Response) => {
      if (error.status === 404) {
        this.toastr.warning("Strongs data not available")
      }
      else {
        this.toastr.error("An Unexpected Error Occured.")
      }

    })

    this._http.get(this.ApiUrl.strongLexicon + '/' +this.strongNo)
    .subscribe(data => {
      this.display = true;
      this.lexicon = data.json();
      this.definition = Object.values(this.lexicon)[0];
      this.pronunciation = Object.values(this.lexicon)[1];
      this.sourceword = Object.values(this.lexicon)[2];
      this.targetword = Object.values(this.lexicon)[4];
      this.transliteration = Object.values(this.lexicon)[5];
      // this.apiData = data.json();
      // this.objlen = Object.keys(this.apiData).length;
      // this.createObjArr();
      // console.log(Object.keys(this.apiData).length)
       //console.log((Object.keys(this.apiData)))
      //  console.log((Object.values(this.apiData)[0]))
       //console.log(this.lexicon)
      this.display = false;
    }, (error: Response) => {
      if (error.status === 404) {
        this.toastr.warning("Lexicon data not available")
      }
      else {
        this.toastr.error("An Unexpected Error Occured.")
      }

    })
  }

  createObjArr(){
       for(let i=0; i < this.objlen; i++){
         this.objLenArr.push(i);
         this.objCountArr.push(Object.values(this.apiData)[i]["count"]);
         this.objLangWordArr.push(Object.keys(this.apiData)[i]);
         this.objBcvArr.push(Object.values(this.apiData)[i]["references"]);
       }
  }

}
