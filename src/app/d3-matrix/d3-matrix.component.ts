import { Component, ElementRef, NgZone, OnDestroy, OnInit, Input, OnChanges, SimpleChanges, SimpleChange, HostListener, ViewChild } from '@angular/core';

import { FormControl, Validators } from '@angular/forms';

import {
    D3Service,
    D3,
    Axis,
    BrushBehavior,
    BrushSelection,
    D3BrushEvent,
    ScaleLinear,
    ScaleOrdinal,
    Selection,
    Transition
} from 'd3-ng2-service';

import { Http, Response, Headers } from '@angular/http';
import { Observable } from 'rxjs';

import 'rxjs/add/operator/map';
import { AlignerService } from '../aligner.service';
import { promise } from 'protractor';
import { ToastrService } from 'ngx-toastr';
import { GlobalUrl } from '../globalUrl';
import { HorizontalAlign } from '../horizontalAlign';
import { getHostElement } from '@angular/core/src/render3';
import { stringify } from '@angular/compiler/src/util';
import { saveAs } from 'file-saver/FileSaver';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { toDate } from '@angular/common/src/i18n/format_date';
import { Location } from '@angular/common';
import { OwlCarousel } from 'ngx-owl-carousel';

@Component({
    selector: 'app-d3-matrix',
    templateUrl: './d3-matrix.component.html',
    styleUrls: ['./d3-matrix.component.css']
})
export class D3MatrixComponent implements OnInit, OnChanges {

    mySlideOptions = { items: 1, dots: false, nav: false };

    display = false;
    d3: D3;
    serviceResult: any;
    positionalPairOfApi: any;
    rawPos: any;
    indPair = new Array();
    saveButtonFlag: boolean = true;
    lexiconData: string;
    greekPopUp: string[];
    @Input() BCV: any;
    @Input() BOOKNAME: any;
    @Input() Lang: any;
    @Input() trgLang: any;

    Statuses = new Array();
    Interlinear = "Interlinear";
    verticalORgrid = "Display Bilinear";
    gridDataJson: any;
    linear = false;
    interLinearflag = true;
    headers = new Headers();
    organisation: any;
    assignBook:any;
    assignLang:any;
    acrossVerseFlag: boolean = false;
    trgContent: any = '';
    TargetContent = [];
    carouselBcv: any;
    LidList: any;

    @ViewChild('owlElement') owlElement: OwlCarousel

    @HostListener('window:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        if (this.acrossVerseFlag == true) {
            if (event.key === 'ArrowRight') {
                this.owlElement.next([200]);
                if ((this.owlElement.$owlChild.currentSlideIndex - 4) < 5 && (this.owlElement.$owlChild.currentSlideIndex - 4) >= -4) {
                    this.carouselBcv = Number(this.BCV) + (this.owlElement.$owlChild.currentSlideIndex - 4);
                }
            }

            else if (event.key === 'ArrowLeft') {
                this.owlElement.previous([200]);
                if ((this.owlElement.$owlChild.currentSlideIndex - 4) <= 5 && (this.owlElement.$owlChild.currentSlideIndex - 4) >= -4) {
                    this.carouselBcv = Number(this.BCV) + (this.owlElement.$owlChild.currentSlideIndex - 4);
                }
            }
        }
    }


    prevContentOnClick() {
        if (this.acrossVerseFlag == true) {
            this.owlElement.previous([200]);
            if ((this.owlElement.$owlChild.currentSlideIndex - 4) <= 5 && (this.owlElement.$owlChild.currentSlideIndex - 4) >= -4) {
                this.carouselBcv = Number(this.BCV) + (this.owlElement.$owlChild.currentSlideIndex - 4);
            }
        }
    }

    nextContentOnClick() {
        if (this.acrossVerseFlag == true) {
            this.owlElement.next([200]);
            if ((this.owlElement.$owlChild.currentSlideIndex - 4) < 5 && (this.owlElement.$owlChild.currentSlideIndex - 4) >= -4) {
                this.carouselBcv = Number(this.BCV) + (this.owlElement.$owlChild.currentSlideIndex - 4);
            }
        }
    }


    constructor(public locations: Location, private activatedRoute: ActivatedRoute, public router: Router, private ApiUrl: GlobalUrl, private toastr: ToastrService, element: ElementRef, private ngZone: NgZone, d3Service: D3Service, private service: AlignerService, private _http: Http) {
        this.d3 = d3Service.getD3();
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
            //this.router.navigate(['../app-login']);
        }
    }

    autoRenew = new FormControl();

    onChange() {

        this.activatedRoute.params.subscribe((params: Params) => {
            if (params['AssignOrganisation'] && params['AssignLang'] && params['AssignBook']) {
                this.organisation = params['AssignOrganisation'];
                this.assignBook = params['AssignBook'];
                this.assignLang = params['AssignLang']
            }
        });

        this.acrossVerseFlag = this.autoRenew.value;
        if (this.organisation && this.assignBook && this.assignLang) {
            this.locations.go('/app-bcv-search/'  + this.assignLang + '/'+ this.assignBook  + '/'  + this.organisation)
        }
        else {
            this.locations.go('/app-bcv-search/' + this.BCV)
        }

        this.gridBind();
        this.Interlinear = "Interlinear"
        this.verticalORgrid = "Display Bilinear";
        this.linear = false;
        this.interLinearflag = true;
        //document.getElementById('verticalInterlinear').style.display = "none";
        document.getElementById('grid').style.display = "";
        (<HTMLInputElement>document.getElementById("usfmchkbox")).checked = false;
    }

    targetDrpDwnfunc(x: string) {
        //console.log(x)

        this.activatedRoute.params.subscribe((params: Params) => {
            if (params['AssignOrganisation'] && params['AssignLang'] && params['AssignBook']) {
                this.organisation = params['AssignOrganisation'];
                this.assignBook = params['AssignBook'];
                this.assignLang = params['AssignLang']
            }
        });

        this.acrossVerseFlag = this.autoRenew.value;
        this.trgContent = x;
        if (this.organisation && this.assignBook && this.assignLang) {
            this.locations.go('/app-bcv-search/' + this.assignLang + '/'+ this.assignBook  + '/'  + this.organisation)
        }
        else {
            this.locations.go('/app-bcv-search/' + this.BCV)
        }

        this.gridBind();
        this.Interlinear = "Interlinear"
        this.verticalORgrid = "Display Bilinear";
        this.linear = false;
        this.interLinearflag = true;
        //document.getElementById('verticalInterlinear').style.display = "none";
        document.getElementById('grid').style.display = "";
        (<HTMLInputElement>document.getElementById("usfmchkbox")).checked = false;
    }

    gridData(d: any, rawPoss: any) {
        var xpos = 200;
        var ypos = 100;
        var width = 25;
        var height = 25;
        var filled;
        var currentLid = d.lid;
        var Custompair = new Array();

        var rawpossCount = rawPoss.length;
        for (let index = 0; index < rawpossCount; index++) {

            //if (Object.keys(rawPoss[index]) == currentLid) {
            //console.log (String(Object.values(Object.values(rawPoss[index])[0]) ))

            //let rowPossseparatedPair: any = (String(Object.values(Object.values(rawPoss[index])[0]))).split('-');
            let rowPossseparatedPair: any = (String(rawPoss[index])).split('-');
            if (rowPossseparatedPair.length === 2) {

                if (Number(rowPossseparatedPair[0]) === 255) {
                    rowPossseparatedPair[0] = 0;
                }

                if (Number(rowPossseparatedPair[1]) === 255) {
                    rowPossseparatedPair[1] = 0;
                }
            }

            rawPoss[index] = rowPossseparatedPair[0] + "-" + rowPossseparatedPair[1];
            //((rawPoss[index])[currentLid])["pairs"] = rowPossseparatedPair[0] + "-" + rowPossseparatedPair[1];
            //console.log(((rawPoss[index])[currentLid])["pairs"] )
            //}
            //let getLid = String(Object.keys(rawPoss[index]));
            Custompair.push(rawPoss[index]);
        }

        // this.positionalPairOfApi = d.positionalPairs;

        this.positionalPairOfApi = {};
        let posObjLength = Object.keys(d.positionalPairs);
        for (let i = 0; i < posObjLength.length; i++) {
            this.positionalPairOfApi[posObjLength[i]] = d.positionalPairs[posObjLength[i]].pairs;
        }


        var positionalPairCount = d.positionalPairs[currentLid].pairs.length;
        let positionalPairOfApiDemo = d.positionalPairs[currentLid].pairs;
        for (let index = 0; index < positionalPairCount; index++) {

            //if (Object.keys(positionalPairOfApiDemo[index]) == currentLid) {
            let separatedPair: any = (String(positionalPairOfApiDemo[index])).split('-');
            if (separatedPair.length === 2) {


                if (Number(separatedPair[0]) === 0) {
                    separatedPair[0] = 100;
                }

                if (Number(separatedPair[0]) === 255) {
                    separatedPair[0] = 0;
                }

                if (Number(separatedPair[1]) === 0) {
                    separatedPair[1] = 100;
                }

                if (Number(separatedPair[1]) === 255) {
                    separatedPair[1] = 0;
                }


            }
            (positionalPairOfApiDemo[index]) = separatedPair[0] + "-" + separatedPair[1];
            //positionalPairOfApiDemo[index] = separatedPair[0] + "-" + separatedPair[1];
            //}
        }



        if (this.trgContent != 'strongs') {
            d.targetContent[currentLid].strongs.unshift('NULL');
        }

        let greekHorizontalWords;
        if (this.trgContent == '') {
            greekHorizontalWords = d.targetContent[currentLid].english;
            d.targetContent[currentLid].english.unshift('NULL');
        }
        else {
            greekHorizontalWords = d.targetContent[currentLid][this.trgContent];
            d.targetContent[currentLid][this.trgContent].unshift('NULL');
        }



        let greekHorizontalWord = d.targetContent[currentLid].strongs;
        Object.values(d.sourceContent[currentLid])[0].unshift('NULL');
        let hindiVerticalWords = Object.values(d.sourceContent[currentLid])[0];
        //let colorCode = d.colorCode;
        let colorCode = d.positionalPairs[currentLid].colorCode;

        var data = new Array();
        var rowcount = hindiVerticalWords.length;
        var columncount = greekHorizontalWords.length;
        for (var row = 0; row < rowcount; row++) {
            data.push(new Array());
            for (var column = 0; column < columncount; column++) {
                data[row].push({
                    x: xpos,
                    y: ypos,
                    width: width,
                    height: height,
                    filled: filled,
                    positionalPair: row + "-" + column,// column + "-" + row ,
                    positionalPairOfApi: this.positionalPairOfApi,
                    greekHorizontalWords: greekHorizontalWords,
                    greekHorizontalWord: greekHorizontalWord,
                    hindiVerticalWords: hindiVerticalWords,
                    colorCode: colorCode,
                    greekIndexWise: greekHorizontalWords[column] + column + 'column',
                    hindiIndexWise: hindiVerticalWords[row] + row + 'row',
                    rawPosss: rawPoss,
                    saveButtonFlag: this.saveButtonFlag,
                    organisation: this.organisation,
                    Language: this.Lang,
                    currentLid: currentLid,
                    Custompair: Custompair,
                    acrossLid: currentLid
                })
                xpos += width;

            }
            xpos = 200;
            ypos += height;

        }
        //console.log(data)
        return data;
    }

    gridNextData(d: any, rawPoss: any, res: any, flag: any, acrossLid) {
        var xpos = 200;
        var ypos = 100;
        var width = 25;
        var height = 25;
        var filled;
        var Custompair = new Array();

        var rawpossCount = rawPoss.length;
        for (let index = 0; index < rawpossCount; index++) {
            let rowPossseparatedPair = rawPoss[index].split('-');
            if (rowPossseparatedPair.length === 2) {

                if (Number(rowPossseparatedPair[0]) === 255) {
                    rowPossseparatedPair[0] = 0;
                }

                if (Number(rowPossseparatedPair[1]) === 255) {
                    rowPossseparatedPair[1] = 0;
                }
            }
            rawPoss[index] = rowPossseparatedPair[0] + "-" + rowPossseparatedPair[1];
            Custompair.push(rawPoss[index]);
        }

        //this.positionalPairOfApi = d.positionalPairs;

        if (d.positionalPairs[acrossLid]) {
            var positionalPairCount = d.positionalPairs[acrossLid].pairs.length;
            let positionalPairOfApiDemo = d.positionalPairs[acrossLid].pairs;
            for (let index = 0; index < positionalPairCount; index++) {
                let separatedPair = positionalPairOfApiDemo[index].split('-');
                if (separatedPair.length === 2) {


                    if (Number(separatedPair[0]) === 0) {
                        separatedPair[0] = 100;
                    }

                    if (Number(separatedPair[0]) === 255) {
                        separatedPair[0] = 0;
                    }

                    if (Number(separatedPair[1]) === 0) {
                        separatedPair[1] = 100;
                    }

                    if (Number(separatedPair[1]) === 255) {
                        separatedPair[1] = 0;
                    }


                }
                positionalPairOfApiDemo[index] = separatedPair[0] + "-" + separatedPair[1];
            }
        }

        let greekHorizontalWords;
        let greekHorizontalWord;

        // if (flag == 'prev') {

        //     d.prevFourStrongsList[res].unshift('NULL');
        //     d.prevFourEnglishWordsList[res].unshift('NULL');
        //     greekHorizontalWords = d.prevFourEnglishWordsList[res];
        //     greekHorizontalWord = d.prevFourStrongsList[res];
        // }

        // else if (flag == 'next') {

        //     d.nextFourStrongsList[res].unshift('NULL');
        //     d.nextFourEnglishWordsList[res].unshift('NULL');
        //     greekHorizontalWords = d.nextFourEnglishWordsList[res];
        //     greekHorizontalWord = d.nextFourStrongsList[res];
        // }

        if (this.trgContent != 'strongs') {
            d.targetContent[acrossLid].strongs.unshift('NULL');
        }


        if (this.trgContent == '') {
            d.targetContent[acrossLid].english.unshift('NULL');
            greekHorizontalWords = d.targetContent[acrossLid].english;
        }
        else {
            d.targetContent[acrossLid][this.trgContent].unshift('NULL');
            greekHorizontalWords = d.targetContent[acrossLid][this.trgContent];
        }


        greekHorizontalWord = d.targetContent[acrossLid].strongs;


        Object.values(d.sourceContent[d.lid])[0].unshift('NULL');
        let hindiVerticalWords = Object.values(d.sourceContent[d.lid])[0];

        let colorCode = [];
        if (d.positionalPairs[acrossLid]) {
            colorCode = d.positionalPairs[acrossLid].colorCode;
        }

        if (d.positionalPairs[acrossLid]) { d.positionalPairs[acrossLid].colorCode; };

        var data = new Array();
        var rowcount = hindiVerticalWords.length;
        var columncount = greekHorizontalWords.length;
        for (var row = 0; row < rowcount; row++) {
            data.push(new Array());
            for (var column = 0; column < columncount; column++) {
                data[row].push({
                    x: xpos,
                    y: ypos,
                    width: width,
                    height: height,
                    filled: filled,
                    positionalPair: row + "-" + column,// column + "-" + row ,
                    positionalPairOfApi: this.positionalPairOfApi,
                    greekHorizontalWords: greekHorizontalWords,
                    greekHorizontalWord: greekHorizontalWord,
                    hindiVerticalWords: hindiVerticalWords,
                    colorCode: colorCode,
                    greekIndexWise: greekHorizontalWords[column] + column + 'column',
                    hindiIndexWise: hindiVerticalWords[row] + row + 'row',
                    rawPosss: rawPoss,
                    saveButtonFlag: this.saveButtonFlag,
                    organisation: this.organisation,
                    Language: this.Lang,
                    acrossLid: acrossLid,
                    Custompair: Custompair
                })
                xpos += width;

            }
            xpos = 200;
            ypos += height;

        }

        return data;
    }

    saveOnClick() {

        this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));
        document.getElementById("grid").style.display = "none";
        var x: any = this.BCV;
        var y: any = this.positionalPairOfApi;
        var l: any = this.Lang;

        var z: number = y.length;

        for (let index = 0; index < z; index++) {
            let separatedPair = y[index].split('-');
            if (separatedPair.length === 2) {

                if (Number(separatedPair[0]) === 0) {
                    separatedPair[0] = 255;
                }

                if (Number(separatedPair[0]) === 100) {
                    separatedPair[0] = 0;
                }

                if (Number(separatedPair[1]) === 0) {
                    separatedPair[1] = 255;
                }

                if (Number(separatedPair[1]) === 100) {
                    separatedPair[1] = 0;
                }
            }
            y[index] = separatedPair[0] + "-" + separatedPair[1];
        }
        var data = { "bcv": x, "positional_pairs": y, "srclang": l, "trglang": "grk-ugnt", "organisation": this.organisation };
        this.display = true;
        this._http.post(this.ApiUrl.getnUpdateBCV, data, {
            headers: this.headers
        })
            .subscribe(data => {
                let response: any = data;
                this.display = false;
                //console.log(response._body);
                if (response.json().success === true) {
                    this.toastr.success(response.json().message);
                    document.getElementById("grid").style.display = "";
                    //this.gridBind();
                }
                else {
                    this.toastr.success(response.json().message);
                    document.getElementById("grid").style.display = "";
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

        document.getElementById('saveButton').style.display = 'none';
        localStorage.setItem("lastAlignments", this.rawPos);
    }

    discardOnClick() {
        this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));

        document.getElementById("grid").innerHTML = "";

        if (this.acrossVerseFlag == true) {
            document.getElementById("next8grid").innerHTML = "";
            document.getElementById("next7grid").innerHTML = "";
            document.getElementById("next6grid").innerHTML = "";
            document.getElementById("next5grid").innerHTML = "";
            document.getElementById("prev0grid").innerHTML = "";
            document.getElementById("prev1grid").innerHTML = "";
            document.getElementById("prev2grid").innerHTML = "";
            document.getElementById("prev3grid").innerHTML = "";
        }
        else {
            document.getElementById("next8grid").innerHTML = "No Data Available";
            document.getElementById("next7grid").innerHTML = "No Data Available";
            document.getElementById("next6grid").innerHTML = "No Data Available";
            document.getElementById("next5grid").innerHTML = "No Data Available";
            document.getElementById("prev0grid").innerHTML = "No Data Available";
            document.getElementById("prev1grid").innerHTML = "No Data Available";
            document.getElementById("prev2grid").innerHTML = "No Data Available";
            document.getElementById("prev3grid").innerHTML = "No Data Available";

        }

        if (localStorage.getItem("lastAlignments") !== "") {
            var x: any = this.BCV;
            var y: any = localStorage.getItem("lastAlignments").split(',');
            var l: any = this.Lang;
            //var y: any = this.positionalPairOfApi;

            var z: number = y.length;

            for (let index = 0; index < z; index++) {
                let separatedPair = y[index].split('-');
                if (separatedPair.length === 2) {

                    if (Number(separatedPair[0]) === 0) {
                        separatedPair[0] = 255;
                    }

                    if (Number(separatedPair[0]) === 100) {
                        separatedPair[0] = 0;
                    }

                    if (Number(separatedPair[1]) === 0) {
                        separatedPair[1] = 255;
                    }

                    if (Number(separatedPair[1]) === 100) {
                        separatedPair[1] = 0;
                    }
                }
                y[index] = separatedPair[0] + "-" + separatedPair[1];
            }
            var data = { "bcv": x, "positional_pairs": y, "srclang": l, "trglang": "grk-ugnt", "organisation": this.organisation };
            this.display = true;
            this._http.post(this.ApiUrl.getnUpdateBCV, data, {
                headers: this.headers
            })
                .subscribe(data => {
                    let response: any = data;
                    this.display = false;
                    //console.log(response._body);
                    if (response.json().success === true) {
                        this.toastr.success('Discarded the changes successfully.');
                        this.gridBind();
                        localStorage.setItem("lastAlignments", "");
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
            //console.log('1')
        }

        else {
            //console.log('2')
            this.gridBind();
        }
        this.indPair = [];
        document.getElementById('saveButton').style.display = 'none';
        document.getElementById('discardButton').style.display = 'none';
        document.getElementById('verticalInterlinear').style.display = "none";
    }


    interlinearOnClick() {
        if (this.Interlinear == "Interlinear") {
            this.linear = false;
            this.interLinearflag = true;
            this.Interlinear = "Reverse-Interlinear"
        }
        else {
            this.linear = false;
            this.interLinearflag = true;
            this.Interlinear = "Interlinear"
        }

        this.bindHorizontalAlign();
    }

    linearOnClick() {
        if (!this.linear) {
            this.linear = true;
            this.interLinearflag = false;
        }

    }

    verticalORgridOnClick() {
        // this.bilinearData = this.gridDataJson;
        // console.log(this.bilinearData)
        if (this.verticalORgrid == "Display Grid") {
            this.verticalORgrid = "Display Bilinear"
            document.getElementById('verticalInterlinear').style.display = "none";
            document.getElementById('grid').style.display = "";
        }
        else {
            this.verticalORgrid = "Display Grid"
            document.getElementById('verticalInterlinear').style.display = "";
            document.getElementById('grid').style.display = "none";
        }
    }

    bindHorizontalAlign() {
        if (this.Interlinear == "Interlinear") {
            // Code for horizontal alignment
            this.Statuses = [];
            for (var h = 0; h < Object.values(this.gridDataJson.sourceContent[this.gridDataJson.lid])[0].length; h++) {


                var greekPair = new Array();

                for (var g = 0; g < this.gridDataJson.positionalPairs[this.gridDataJson.lid].pairs.length; g++) {
                    let pair = (this.gridDataJson.positionalPairs[this.gridDataJson.lid].pairs)[g].split('-');
                    if (h == (Number(pair[0] - 1))) {
                        if (pair[1] == "255" || pair[1] == "0") {
                            greekPair.push("Null");
                        }
                        else {
                            greekPair.push(this.gridDataJson.targetContent[this.gridDataJson.lid].english[Number(pair[1] - 1)] + "(" + this.gridDataJson.targetContent[this.gridDataJson.lid].strongs[Number(pair[1] - 1)] + ")");
                        }
                    }
                }
                if (greekPair[0] == undefined) {
                    greekPair.push("NA");
                }
                this.Statuses.push(new HorizontalAlign(h, Object.values(this.gridDataJson.sourceContent[this.gridDataJson.lid])[0][h], greekPair))
            }
            //console.log(this.Statuses)
            // Ends Here
        }

        if (this.Interlinear == "Reverse-Interlinear") {
            // Code for horizontal alignment
            this.Statuses = [];
            for (var h = 0; h < this.gridDataJson.targetContent[this.gridDataJson.lid].strongs.length; h++) {


                var greekPair = new Array();

                for (var g = 0; g < this.gridDataJson.positionalPairs[this.gridDataJson.lid].pairs.length; g++) {
                    let pair = (this.gridDataJson.positionalPairs[this.gridDataJson.lid].pairs)[g].split('-');
                    if (h == (Number(pair[1] - 1))) {
                        if (pair[0] == "255" || pair[0] == "0") {
                            greekPair.push(this.gridDataJson.targetContent[this.gridDataJson.lid].english[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        }
                        else {
                            greekPair.push(this.gridDataJson.targetContent[this.gridDataJson.lid].english[Number(pair[1] - 1)] + "(" + Object.values(this.gridDataJson.sourceContent[this.gridDataJson.lid])[0][Number(pair[0] - 1)] + ")");
                        }
                    }
                }
                if (greekPair[0] == undefined) {
                    greekPair.push(this.gridDataJson.targetContent[this.gridDataJson.lid].english[h] + "(" + "NA" + ")");
                }
                this.Statuses.push(new HorizontalAlign(h, this.gridDataJson.targetContent[this.gridDataJson.lid].strongs[h], greekPair))
            }
            //console.log(this.Statuses)
            // Ends Here
        }
    }


    exportOnClick() {
        let flag = (<HTMLInputElement>document.getElementById("usfmchkbox")).checked;
        let usfmFlag = "";
        if (flag) {
            usfmFlag = "/true";
        }

        this.display = true;
        //console.log(this.display)
        this._http.get(this.ApiUrl.grkhin + "/" + this.Lang + "/grk-ugnt" + "/" + this.BOOKNAME + usfmFlag)
            .toPromise()
            .then(response => this.saveToFileSystem(response.json()))
            .catch((err) => {
                this.toastr.error(err)
                this.display = false;
            });
    }

    private saveToFileSystem(response) {
        const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
        saveAs(blob, this.Lang + '_' + this.BOOKNAME + '.json');
        this.display = false;
        //console.log(this.display)
    }


    ngOnInit() {
        this.activatedRoute.params.subscribe((params: Params) => {
            if (params['AssignOrganisation']) {
                this.organisation = params['AssignOrganisation'];
            }
        });
    }

    ngOnChanges(changes: SimpleChanges) {

        this.activatedRoute.params.subscribe((params: Params) => {
            if (params['AssignOrganisation'] && params['AssignLang'] && params['AssignBook']) {
                this.organisation = params['AssignOrganisation'];
                this.assignBook = params['AssignBook'];
                this.assignLang = params['AssignLang']
            }
        });

        const bookChapterVerse: SimpleChange = changes.BCV;
        this.BCV = bookChapterVerse.currentValue;
        this.carouselBcv = this.BCV;
        if (this.organisation && this.assignBook && this.assignLang) {
            this.locations.go('/app-bcv-search/'  + this.assignLang + '/'+ this.assignBook  + '/'  + this.organisation)
        }
        else {
            this.locations.go('/app-bcv-search/' + this.BCV)
        }

        this.gridBind();
        this.Interlinear = "Interlinear"
        this.verticalORgrid = "Display Bilinear";
        this.linear = false;
        this.interLinearflag = true;
        //document.getElementById('verticalInterlinear').style.display = "none";
        document.getElementById('grid').style.display = "";
        (<HTMLInputElement>document.getElementById("usfmchkbox")).checked = false;
        //document.getElementById("fixButton").style.display = "";
    }

    gridBind() {
        let bcv: any = this.BCV; //40001010;
        let firstBcvRes: any;
        //   var data = new FormData();
        //   data.append("bcv",bcv);
        this.display = true;

        document.getElementById("grid").innerHTML = "";
        if (this.acrossVerseFlag == true) {
            document.getElementById("next8grid").innerHTML = "";
            document.getElementById("next7grid").innerHTML = "";
            document.getElementById("next6grid").innerHTML = "";
            document.getElementById("next5grid").innerHTML = "";
            document.getElementById("prev0grid").innerHTML = "";
            document.getElementById("prev1grid").innerHTML = "";
            document.getElementById("prev2grid").innerHTML = "";
            document.getElementById("prev3grid").innerHTML = "";
        }
        else {
            document.getElementById("next8grid").innerHTML = "No Data Available";
            document.getElementById("next7grid").innerHTML = "No Data Available";
            document.getElementById("next6grid").innerHTML = "No Data Available";
            document.getElementById("next5grid").innerHTML = "No Data Available";
            document.getElementById("prev0grid").innerHTML = "No Data Available";
            document.getElementById("prev1grid").innerHTML = "No Data Available";
            document.getElementById("prev2grid").innerHTML = "No Data Available";
            document.getElementById("prev3grid").innerHTML = "No Data Available";

        }


        // this._http.get('http://localhost:4200/assets/CarouselJsonNewYear.json')

        //     .subscribe(data => {

                //         console.log(data.json().positionalPairs)
                // });

                this._http.get(this.ApiUrl.getnUpdateBCV + '/' + bcv + '/' + this.Lang + '/' + this.trgLang)

                    .subscribe(data => {
                // console.log(Object.keys( data.json().targetContent[data.json().lid]));
                this.TargetContent = Object.keys(data.json().targetContent[data.json().lid]);

                (<HTMLInputElement>document.getElementById("nxtbtn")).disabled = false;
                (<HTMLInputElement>document.getElementById("prebtn")).disabled = false;
                firstBcvRes = data;
                this.generateVisual(data)
                //console.log(data.json())

                // console.log(data.json().nextFourEnglishWordsList.length)

                if (this.acrossVerseFlag == true) {
                    // console.log(data.json().LidList.length)
                    // let nextFourEnglishListLength = Number(data.json().nextFourEnglishWordsList.length);
                    // let prevEnglishLength = Number(data.json().prevFourEnglishWordsList.length);

                    // for (let i = 0; i < prevEnglishLength; i++) {

                    //     this.generateNextBcvVisual(data, i, 'prev')
                    // }


                    // for (let i = 0; i < nextFourEnglishListLength; i++) {

                    //     this.generateNextBcvVisual(data, i, 'next')
                    // }

                    let acrossVerseLength = data.json().LidList.length;
                    this.LidList = data.json().LidList;

                    for (let i = 0; i < acrossVerseLength; i++) {

                        let flag;
                        if (i < 4 && i > -1) {
                            flag = 'prev';
                            this.generateNextBcvVisual(data, i, flag)
                        }
                        else if (i > 4 && i < 9) {
                            flag = 'next';
                            this.generateNextBcvVisual(data, i, flag)
                        }

                    }

                }
                this.owlElement.to([4]);

            }, (error: Response) => {
                if (error.status === 404 || error.status === 500) {
                    (<HTMLInputElement>document.getElementById("nxtbtn")).disabled = false;
                    (<HTMLInputElement>document.getElementById("prebtn")).disabled = false;
                    this.toastr.warning("Data not available")
                    this.display = false;
                }
                else {
                    (<HTMLInputElement>document.getElementById("nxtbtn")).disabled = false;
                    (<HTMLInputElement>document.getElementById("prebtn")).disabled = false;
                    this.toastr.error("An Unexpected Error Occured.")
                    this.display = false;
                }

            });
    }


    generateVisual(data) {

        let lidApi = data.json().lid;
        // console.log(data.json().lid)
        // console.log(data.json().positionalPairs)
        //console.log(data.json().positionalPairs[0][lidApi].pairs)

        this.gridDataJson = data.json();

        //Commented for the new json data
        //this.rawPos = data.json().positionalPairs;

        //Added as per the new json data
        this.rawPos = data.json().positionalPairs[lidApi].pairs;

        this.display = false;
        var that = this;
        let self = this;
        let d3 = this.d3;

        //document.getElementById("grid").innerHTML = "";
        var content = document.getElementById('grid');

        if (this.Interlinear == "Interlinear") {
            // Code for horizontal alignment
            this.Statuses = [];
            for (var h = 0; h < Object.values(data.json().sourceContent[data.json().lid])[0].length; h++) {


                var greekPair = new Array();

                for (var g = 0; g < data.json().positionalPairs[data.json().lid].pairs.length; g++) {
                    let pair = (data.json().positionalPairs[data.json().lid].pairs)[g].split('-');
                    if (h == (Number(pair[0] - 1))) {
                        if (pair[1] == "255" || pair[1] == "0") {
                            greekPair.push("Null");
                        }
                        else {
                            greekPair.push(data.json().targetContent[data.json().lid].english[Number(pair[1] - 1)] + "(" + data.json().targetContent[data.json().lid].strongs[Number(pair[1] - 1)] + ")");
                        }
                    }
                }
                if (greekPair[0] == undefined) {
                    greekPair.push("NA");
                }
                this.Statuses.push(new HorizontalAlign(h, Object.values(data.json().sourceContent[data.json().lid])[0][h], greekPair))
            }
            //console.log(this.Statuses)
            // Ends Here
        }

        if (this.Interlinear == "Reverse-Interlinear") {
            // Code for horizontal alignment
            //console.log(data.json())
            this.Statuses = [];
            for (var h = 0; h < data.json().targetContent[data.json().lid].strongs.length; h++) {


                var greekPair = new Array();

                for (var g = 0; g < data.json().positionalPairs[data.json().lid].pairs.length; g++) {
                    let pair = (data.json().positionalPairs[data.json().lid].pairs)[g].split('-');
                    if (h == (Number(pair[1] - 1))) {
                        if (pair[0] == "255") {
                            greekPair.push(data.json().targetContent[data.json().lid].english[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        }
                        else {
                            //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                            greekPair.push(data.json().targetContent[data.json().lid].english[Number(pair[1] - 1)] + "(" + Object.values(data.json().sourceContent[data.json().lid])[0][Number(pair[0] - 1)] + ")");
                        }
                    }
                }
                if (greekPair[0] == undefined) {
                    greekPair.push(data.json().targetContent[data.json().lid].english[h] + "(" + "NA" + ")");
                }
                this.Statuses.push(new HorizontalAlign(h, data.json().targetContent[data.json().lid].strongs[h], greekPair))
            }
            //console.log(this.Statuses)
            // Ends Here
        }

        var gridData = this.gridData(data.json(), this.rawPos);
        //console.log(gridData)

        var greekLexiconText = '';
        var greekArray = new Array();
        var greekVerticalArray = new Array();
        for (var l = 0; l < data.json().targetContent[lidApi].strongs.length; l++) {
            //self._http.get(self.ApiUrl.getLexicon + '/' + data.json().targetText[l])
            //.subscribe(data => {
            //console.log(data.json().targetText[l])
            //console.log (Object.keys(data.json().lexcanData).indexOf(data.json().targetText[l]));
            //var objIndex:any = Object.keys(data.json().lexcanData).indexOf(data.json().targetText[l]);
            //console.log(data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].targetword)

            if (data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]]) {
                greekArray.push("<b>English Word</b>:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexicanData[data.json().targetContent[lidApi].strongs[l]].transliteration);
            }
            //});

            //    console.log(greekArray)
        }


        if (this.Lang == 'grk-UGNT4') {
            for (var l = 0; l <  Object.values(data.json().sourceContent[lidApi])[0].length; l++) {

                greekVerticalArray.push("<b>English Word</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[lidApi])[0][l]].transliteration);

                //});

                //    console.log(greekArray)
            }
        }

        var grid = d3.select("#grid")
            .append("svg")
            .attr("id", "currentGrid")
            // .style("overflow", "auto")
            .style("margin-top", "10px")
        // .style("padding-left", "100px")

        var row = grid.selectAll(".rowd3")
            .data(gridData)
            .enter().append("g")
            .attr("class", "rowd3");


        var column = row.selectAll(".square")
            .data(function (d: any) { return d; })
            .enter().append("rect")
            .attr("id", function (d: any, i) { return "rect-" + d.y + i })

        var columnAttributes = column
            .attr("x", function (d: any) { return d.x; })
            .attr("y", function (d: any) { return d.y; })
            .attr("rx", "5")
            .attr("ry", "5")
            .attr("width", function (d: any) { return d.width })
            .attr("height", function (d: any) { return d.height })
            .attr("stroke", "#66a877")//"#acb7b7"
            .attr("fill",
                function (d: any) {
                    //console.log(d.positionalPair)
                    // console.log("i")
                    //for (var i = 0; i < d.positionalPairOfApi.length; i++) {
                    //console.log(((d.positionalPairOfApi[i])[d.currentLid])["pairs"])


                    // if  (((d.positionalPairOfApi[i])[d.currentLid])["pairs"] == d.positionalPair) {
                    //if (d.positionalPairOfApi.includes(d.positionalPair)) {
                    if (d.Custompair.includes(d.positionalPair)) {
                        d.filled = true;
                        //let index = d.positionalPairOfApi.indexOf(d.positionalPair)
                        let index = d.Custompair.indexOf(d.positionalPair)
                        //console.log("index")
                        // console.log(d.colorCode)
                        // console.log(d.positionalPairOfApi)
                        // console.log(d.positionalPair)
                        // console.log(d.colorCode[index])

                        if (d.colorCode[index] == '0') {
                            return "#007C80"
                        }
                        else if (d.colorCode[index] == '1') {
                            return '#023659'
                        }
                        else if (d.colorCode[index] == '2') {
                            return '#4695c9'
                        }
                    }
                    else {
                        d.filled = false;
                        return "#fff"
                    }
                }
                //}
            )
            .attr("class", function (d: any) {
                if (d.Custompair.includes(d.positionalPair)) {
                    return "filledsquare"
                }
                else {
                    return "square"
                }
            })
            .on('click', function (d: any, i) {
                if (localStorage.getItem('access-token') && d.organisation) {
                    if (!d.filled) {
                        d3.select(this)
                            .style("fill", "#023659")
                            .attr('class', "filledsquare");

                        //console.log(d)
                        if (!self.indPair.includes(d.positionalPair)) {
                            self.indPair.push(d.positionalPair);
                            //console.log(self.indPair)
                        }

                        //document.getElementById('rect-'+d.y+0).style.fill = "#fff";

                        var splilttedWord = d.positionalPair.split('-');
                        if (d.positionalPairOfApi[d.acrossLid].includes(splilttedWord[0] + "-0")) {
                            const index: number = d.positionalPairOfApi[d.acrossLid].indexOf(splilttedWord[0] + "-0");
                            if (index !== -1) {
                                d.positionalPairOfApi[d.acrossLid].splice(index, 1);
                            }
                            document.getElementById('rect-' + d.y + 0).style.fill = "#fff";

                        }

                        // console.log(splilttedWord)
                        if (d.positionalPairOfApi[d.acrossLid].includes("0-" + splilttedWord[1])) {
                            const indexs: number = d.positionalPairOfApi[d.acrossLid].indexOf("0-" + splilttedWord[1]);
                            if (indexs !== -1) {
                                d.positionalPairOfApi[d.acrossLid].splice(indexs, 1);
                            }
                            document.getElementById('rect-' + 100 + i).style.fill = "#fff";
                        }

                        d.filled = true;
                        d.positionalPairOfApi[d.acrossLid].push(d.positionalPair);

                        //console.log(d.positionalPairOfApi)
                        if (d.rawPosss != d.positionalPairOfApi[d.acrossLid]) {
                            document.getElementById("saveButton").style.display = "";
                            document.getElementById("discardButton").style.display = "";
                        }
                        else {
                            document.getElementById("saveButton").style.display = "none";
                            document.getElementById("discardButton").style.display = "none";
                        }

                        // if (self.Interlinear == "Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().sourceText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[0] - 1))) {
                        //                 if (pair[1] == "0") {
                        //                     greekPair.push("Null");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().greek[Number(pair[1] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().targetText[Number(pair[1] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push("NA");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().sourceText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }


                        // if (self.Interlinear == "Reverse-Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().targetText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[1] - 1))) {
                        //                 if (pair[0] == "0") {
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().sourceText[Number(pair[0] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push(data.json().englishWord[h] + "(" + "NA" + ")");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().targetText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }
                        self.gridDataJson.positionalPairs = d.positionalPairOfApi[d.acrossLid];
                    }
                    else {
                        d3.select(this)
                            .style("fill", "#fff")
                            .attr('class', "square")
                        d.filled = false;
                        var index = d.positionalPairOfApi[d.acrossLid].indexOf(d.positionalPair);
                        if (index > -1) {
                            d.positionalPairOfApi[d.acrossLid].splice(index, 1);
                            if (d.rawPosss != d.positionalPairOfApi[d.acrossLid]) {
                                //console.log('not matching')
                                document.getElementById("saveButton").style.display = "";
                                document.getElementById("discardButton").style.display = "";
                            }
                            else {
                                //console.log('matching')
                                document.getElementById("saveButton").style.display = "none";
                                document.getElementById("discardButton").style.display = "none";
                            }

                        }

                        // if (self.Interlinear == "Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().sourceText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[0] - 1))) {
                        //                 if (pair[1] == "0") {
                        //                     greekPair.push("Null");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().targetText[Number(pair[1] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().targetText[Number(pair[1] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push("NA");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().sourceText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }

                        // if (self.Interlinear == "Reverse-Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().targetText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[1] - 1))) {
                        //                 if (pair[0] == "0") {
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().sourceText[Number(pair[0] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push(data.json().englishWord[h] + "(" + "NA" + ")");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().targetText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }
                        self.gridDataJson.positionalPairs = d.positionalPairOfApi[d.acrossLid];
                    }
                    //console.log(d.positionalPairOfApi)
                    //console.log(self.indPair)
                }
                else {
                    if (!d.organisation && localStorage.getItem('access-token')) {
                        self.toastr.error('You are not under any organisation.')
                    }
                    else {
                        self.toastr.error('You are not a registered User. Sign In to make changes.')
                    }

                }
            })

            .on("mouseover", function (d: any, i) {
                var x = document.getElementById(d.greekIndexWise);
                var y = document.getElementById(d.hindiIndexWise);
                x.style.fontSize = "15px";
                x.style.fill = "#008000";
                y.style.fontSize = "17px";
                y.style.fill = "#008000";
                let xValue = d.x;

                xValue = xValue / 25 - 8;
                for (let m = xValue; m >= 0; m--) {

                    document.getElementById('rect-' + d.y + m.toString()).style.stroke = 'blue';
                    document.getElementById('rect-' + d.y + m.toString()).style.strokeWidth = '2px';
                }
                let yValue = d.y;
                for (let n = yValue; n >= 100; n = n - 25) {

                    document.getElementById('rect-' + n + xValue.toString()).style.stroke = 'blue';
                    document.getElementById('rect-' + n + xValue.toString()).style.strokeWidth = '2px';
                }

                div.style("left", d3.event.pageX + 10 + "px");
                div.style("top", d3.event.pageY - 25 + "px");
                div.style("display", "inline-block");
                div.style("text-align", "left")
                div.style("width", "150px")
                div.html(function () {
                    if (d.greekHorizontalWord[i] != 'NULL') {
                        // console.log(Number(d.greekHorizontalWords[i].substring(1,d.greekHorizontalWords[i].length)));
                        // let removeZero = Number(d.greekHorizontalWord[i].substring(1, d.greekHorizontalWord[i].length)).toString();
                        // if (removeZero.endsWith('0')) {
                        //     removeZero = removeZero.substring(0, removeZero.length - 1)
                        // }


                        //Added on 17 Oct for showing lexicon data as per new updates
                        let removeZero = Number(d.greekHorizontalWord[i]);
                        // Ended here on 17 Oct

                        // console.log(removeZero)
                        for (let count = 0; count < greekArray.length; count++) {
                            //console.log(greekArray[count])
                            if (greekArray[count].includes("strongs:- " + removeZero + " ")) {
                                //console.log(greekArray[count])
                                //return "<b>" + y.innerHTML + "</b>" + " => " + "<b>" + x.innerHTML + "</b>" + "<br/><br/>" + greekArray[count];
                                return "<b>" + y.innerHTML + "</b>" + " => " + "<b>" + x.innerHTML + "</b>";
                            }


                        }
                    }
                    else {
                        return y.innerHTML + " => " + x.innerHTML;
                    }
                });





            })

            .on("mouseout", function (d: any) {
                var x = document.getElementById(d.greekIndexWise);
                var y = document.getElementById(d.hindiIndexWise);
                x.style.fontSize = "14px";
                x.style.fill = "black";
                y.style.fontSize = "16px";
                y.style.fill = "black";
                div.style("display", "none");

                let xValue = d.x;

                xValue = xValue / 25 - 8;
                for (let m = xValue; m >= 0; m--) {

                    document.getElementById('rect-' + d.y + m.toString()).style.stroke = '';
                    document.getElementById('rect-' + d.y + m.toString()).style.strokeWidth = '';
                }
                let yValue = d.y;
                for (let n = yValue; n >= 100; n = n - 25) {

                    document.getElementById('rect-' + n + xValue.toString()).style.stroke = '';
                    document.getElementById('rect-' + n + xValue.toString()).style.strokeWidth = '';
                }

            })

        var upperColumn = row.selectAll(".upperColumn")
            .data(function (d: any) {
                return d;
            })
            .enter().append("text")


        // For making the svg matrix scrollable
        d3.select("#currentGrid")
            .data(gridData)
            .attr("width", function (d, i) {

                let len = d.length;
                len = (len * 35) + 215;  //140;
                //console.log(len)
                return len;
            })
            .attr("height", function (d, i) {
                let len = d[0].hindiVerticalWords.length;
                len = (len * 35) + 120;
                return len;
            })
            // .attr("width", "100%")
            .attr("viewBox", function (d, i) {
                let height = d[0].hindiVerticalWords.length;
                height = (height * 35) + 120;

                let width = d.length;
                width = (width * 35) + 215;  //140;
                return "0 0 " + width + " " + height;
            })
        //"0 0 400 400")
        // Ended Here

        var labell = d3.selectAll(".rowd3")
            .data(gridData)

        var label: any = labell.append("text")
            .attr("x", "36")
            .attr("y", function (d, i) {
                return d[0].y + 17;
            })
            .style("font-size", "16px")
            .attr("id", function (d, i) {
                return d[0].hindiIndexWise;
            })
            .attr("fill", function (d, i) {
                for (let l = 0; l < Object.keys(d[0].positionalPairOfApi).length; l++) {
                    if (Object.keys(d[0].positionalPairOfApi)[l] != d[0].acrossLid && d[0].positionalPairOfApi[Object.keys(d[0].positionalPairOfApi)[l]].length > 1) {
                        for (let n = 0; n < d[0].positionalPairOfApi[Object.keys(d[0].positionalPairOfApi)[l]].length; n++) {
                            if (d[0].positionalPairOfApi[Object.keys(d[0].positionalPairOfApi)[l]][n].split('-')[0] == i) {
                                return "green";
                            }
                        }
                    }
                }
                return "";
            })
            .text(function (d, i) {
                //console.log(d)
                return d[0].hindiVerticalWords[i];
            })


            .on("mouseout", function (d) {
                div.style("display", "none");
            })
            .on('mouseover', function (d: any, i) {
                if (d[i].Language == 'grk-UGNT4') {
                    div.style("left", d3.event.pageX + 10 + "px");
                    div.style("top", d3.event.pageY - 25 + "px");
                    div.style("display", "inline-block");
                    div.style("text-align", "left")
                    div.style("width", "400px")
                    div.html(function () {

                        //console.log(greekArray)
                        if (d[i].hindiVerticalWords[i] != 'NULL') {
                            // console.log(d.greekHorizontalWord[i]);

                            // let removeZero = Number(String(d.greekHorizontalWord[i]).substring(1, String(d.greekHorizontalWord[i]).length)).toString();
                            // if (removeZero.endsWith('0')) {
                            //     removeZero = removeZero.substring(0, removeZero.length - 1)
                            // }
                            // console.log(removeZero)
                            // console.log(greekArray)

                            //Added on 17 Oct for showing lexicon data as per new updates
                            let removeZero = Number(d[i].hindiVerticalWords[i]);
                            // Ended here on 17 Oct

                            for (let count = 0; count < greekVerticalArray.length; count++) {
                                //console.log(greekArray[count])
                                if (greekVerticalArray[count].includes("strongs:- " + removeZero + " ")) {
                                    //console.log(greekArray[count])
                                    return greekVerticalArray[count];
                                }


                            }
                        }
                        else {
                            return 'N/A';
                        }


                        //return  (d.greekHorizontalWords[i] == 'NULL') ? 'N/A':d.greekHorizontalWords[i]

                    });
                }
            })


        for (var i = 0; i < label.nodes().length; i++) {
            //console.log(  label.nodes()[i].getComputedTextLength());
            var textLen = label.nodes()[i].getComputedTextLength();
            label.nodes()[i].setAttribute('x', 175 - textLen)
        }

        // content.addEventListener('scroll', function (evt) {
        //     //console.log(  label.nodes()[1]);
        //     for (var i = 0; i < label.nodes().length; i++) {
        //         label.nodes()[i].setAttribute('x', 30 + this.scrollLeft);
        //     }
        // }, false)


        var labellll = grid.selectAll("svg")
            .data(gridData[0])
        var labelll = labellll.enter().append("g")
        var div = d3.select("body")
            .append("div")
            .attr("class", "toolTip")
            .attr("word-wrap", "break-word")
            ;

        var labelGreek = labelll.append("text")

            .attr("transform", function (d: any, i) {
                var xAxis = d.x + 14;
                return "translate(" + xAxis + ",95)rotate(300)";
            })
            .style("font-size", "14px")
            .attr("id", function (d: any, i) {
                return d.greekIndexWise;
            })
            .text(function (d: any, i) {
                return d.greekHorizontalWords[i];
            })

            .on("mouseout", function (d) {
                div.style("display", "none");
            })
            .on('mouseover', function (d: any, i) {
                div.style("left", d3.event.pageX + 10 + "px");
                div.style("top", d3.event.pageY - 25 + "px");
                div.style("display", "inline-block");
                div.style("text-align", "left")
                div.style("width", "400px")
                div.html(function () {
                    if (d.greekHorizontalWord[i] != 'NULL') {
                        // console.log(d.greekHorizontalWord[i]);

                        // let removeZero = Number(String(d.greekHorizontalWord[i]).substring(1, String(d.greekHorizontalWord[i]).length)).toString();
                        // if (removeZero.endsWith('0')) {
                        //     removeZero = removeZero.substring(0, removeZero.length - 1)
                        // }
                        // console.log(removeZero)
                        // console.log(greekArray)

                        //Added on 17 Oct for showing lexicon data as per new updates
                        let removeZero = Number(d.greekHorizontalWord[i]);
                        // Ended here on 17 Oct

                        for (let count = 0; count < greekArray.length; count++) {
                            //console.log(greekArray[count])
                            if (greekArray[count].includes("strongs:- " + removeZero + " ")) {
                                //console.log(greekArray[count])
                                return greekArray[count];
                            }


                        }
                    }
                    else {
                        return 'N/A';
                    }

                    //return  (d.greekHorizontalWords[i] == 'NULL') ? 'N/A':d.greekHorizontalWords[i]
                });
            })

        content.addEventListener('scroll', function (evt) {

            // var elms:any = document.querySelectorAll("[id='rect-100']");

            // for(var i = 0; i < elms.length; i++)
            //     elms[i].style.display='none';
            //console.log(labelGreek.nodes())

            for (var i = 0; i < labelGreek.nodes().length; i++) {
                let labelGreekData: any = gridData[0][i];
                var xi: any = labelGreekData.x + 14;
                (labelGreek.nodes()[i] as any).setAttribute("transform", "translate(" + xi + "," + (95 + this.scrollTop) + ")rotate(300)");
            }

            let count = 100;

            for (var h = 0; h < label.nodes().length; h++) {
                for (var i = 0; i < labelGreek.nodes().length; i++) {
                    let b: any = count + i.toString();
                    let a: any = 85 + this.scrollTop + i.toString();
                    // console.log(a)
                    // console.log(b)
                    if ((document.getElementById('rect-' + b) != null) && (Number(b) < Number(a))) {
                        //console.log('asdfsfd')
                        //console.log('rect-' + b + 'hindi'+ label.nodes()[h].id)
                        document.getElementById('rect-' + b).style.display = "none";
                        if (document.getElementById(label.nodes()[h].id) != null) {
                            document.getElementById(label.nodes()[h].id).style.display = "none";
                        }
                    }

                    if ((document.getElementById('rect-' + b) != null) && (Number(b) > Number(a))) {
                        //console.log('asdfsfd')
                        document.getElementById('rect-' + b).style.display = "";
                        if (document.getElementById(label.nodes()[h].id) != null) {
                            document.getElementById(label.nodes()[h].id).style.display = "";
                        }
                    }
                }
                count = count + 25;
            }
        }, false)

    }


    generateNextBcvVisual(data, res, flag) {

        this.gridDataJson = data.json();
        //this.rawPos = data.json().positionalPairs;
        this.display = false;
        var that = this;
        let self = this;
        let d3 = this.d3;
        let acrossLid = data.json().LidList[res];

        if (data.json().positionalPairs[acrossLid]) {
            this.rawPos = data.json().positionalPairs[acrossLid].pairs;
        }
        else {
            this.rawPos = [];
        }


        //document.getElementById("grid").innerHTML = "";
        var content = document.getElementById(flag + res + 'grid');


        if (this.Interlinear == "Interlinear") {
            // Code for horizontal alignment
            //this.Statuses = [];

            if (data.json().positionalPairs[acrossLid]) {
                for (var h = 0; h < Object.values(data.json().sourceContent[data.json().lid])[0].length; h++) {


                    var greekPair = new Array();

                    for (var g = 0; g < data.json().positionalPairs[acrossLid].pairs.length; g++) {
                        let pair = data.json().positionalPairs[acrossLid].pairs[g].split('-');
                        if (h == (Number(pair[0] - 1))) {
                            if (pair[1] == "255" || pair[1] == "0") {
                                greekPair.push("Null");
                            }
                            else {
                                greekPair.push(data.json().targetContent[acrossLid].english[Number(pair[1] - 1)] + "(" + data.json().targetContent[acrossLid].strongs[Number(pair[1] - 1)] + ")");
                            }
                        }
                    }
                    // if (greekPair[0] == undefined) {
                    //     greekPair.push("NA");
                    // }
                    if (greekPair[0] != undefined) {
                        this.Statuses.push(new HorizontalAlign(h, Object.values(data.json().sourceContent[data.json().lid])[0][h] + "(" + acrossLid + ")", greekPair))
                    }
                }
            }
            // Ends Here
        }

        if (this.Interlinear == "Reverse-Interlinear") {
            // Code for horizontal alignment
            //console.log(data.json())
            //this.Statuses = [];
                if (data.json().positionalPairs[acrossLid]) {
                    for (var h = 0; h < data.json().targetContent[acrossLid].strongs.length; h++) {

                        var greekPair = new Array();
                        for (var g = 0; g < data.json().positionalPairs[acrossLid].pairs.length; g++) {
                            let pair = data.json().positionalPairs[acrossLid].pairs[g].split('-');
                            if (h == (Number(pair[1] - 1))) {
                                if (pair[0] == "255") {
                                    greekPair.push(data.json().targetContent[acrossLid].english[Number(pair[1] - 1)] + "(" + "Null" + ")");
                                }
                                else {
                                    //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                                    greekPair.push(data.json().targetContent[acrossLid].english[Number(pair[1] - 1)] + "(" + Object.values(data.json().sourceContent[data.json().lid])[0][Number(pair[0] - 1)] + ")");
                                }
                            }
                        }
                        if (greekPair[0] != undefined) {
                            this.Statuses.push(new HorizontalAlign(h, data.json().targetContent[acrossLid].strongs[h]+ "(" + acrossLid + ")", greekPair))
                        }
                        
                    }
                }
                //console.log(this.Statuses)
                // Ends Here
            }
        

        let gridData = this.gridNextData(data.json(), this.rawPos, res, flag, acrossLid);
        //console.log(gridData)

        var greekLexiconText = '';
        var greekArray = new Array();
        var greekVerticalArray = new Array();

        // console.log(data.json().lexcanData[(data.json().prevFourStrongsList[0])[0]].targetword
        // + "hellooooo")

        // if (flag == 'prev') {
        //     for (var l = 0; l < data.json().prevFourStrongsList[res].length; l++) {
        //         if (data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]]) {
        //             greekArray.push("<b>English Word</b>:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexcanData[(data.json().prevFourStrongsList[res])[l]].transliteration);
        //         }
        //     }
        // }

        // else if (flag == 'next') {
        //     for (var l = 0; l < data.json().nextFourStrongsList[res].length; l++) {

        //         if (data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]]) {
        //             greekArray.push("<b>English Word</b>:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexcanData[(data.json().nextFourStrongsList[res])[l]].transliteration);

        //         }
        //     }
        // }


        for (var l = 0; l < data.json().targetContent[acrossLid].strongs.length; l++) {
            if (data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]]) {
                greekArray.push("<b>English Word</b>:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexicanData[(data.json().targetContent[acrossLid].strongs)[l]].transliteration);
            }
        }

        if (this.Lang == 'grk-UGNT4') {
            for (var l = 0; l < Object.values(data.json().sourceContent[data.json().lid])[0].length; l++) {

                greekVerticalArray.push("<b>English Word</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].targetword + "<br/><br/>" + "<b>Definition</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].definition + "<br/><br/>" + "<b>greek_word</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].sourceword + "<br/><br/>" + "<b>pronunciation</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].pronunciation + "<br/><br/>" + "strongs:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].strongs + " " + "<br/><br/>" + "<b>transliteration</b>:- " + data.json().lexicanData[Object.values(data.json().sourceContent[data.json().lid])[0][l]].transliteration);

                //});

                //    console.log(greekArray)
            }
        }


        var grid = d3.select("#" + flag + res + 'grid')
            .append("svg")
            .attr("id", function () { return "svg-" + res + flag })
            // .style("overflow", "auto")
            .style("margin-top", "10px")
        // .style("padding-left", "100px")

        var row = grid.selectAll(".rowd3" + flag + res + 'grid')
            .data(gridData)
            .enter().append("g")
            .attr("class", "rowd3" + flag + res + 'grid');


        var column = row.selectAll(".square")
            .data(function (d: any) { return d; })
            .enter().append("rect")
            .attr("id", function (d: any, i) { return "rect-next-" + res + flag + d.y + i })

        var columnAttributes = column
            .attr("x", function (d: any) { return d.x; })
            .attr("y", function (d: any) { return d.y; })
            .attr("rx", "5")
            .attr("ry", "5")
            .attr("width", function (d: any) { return d.width })
            .attr("height", function (d: any) { return d.height })
            .attr("stroke", "#66a877")//"#acb7b7"
            //.attr("fill", "#fff")
            .attr("fill",
                function (d: any) {
                    //console.log(d.positionalPairOfApi)
                    //console.log(d.positionalPair)
                    if (d.Custompair.includes(d.positionalPair)) {
                        d.filled = true;
                        let index = d.Custompair.indexOf(d.positionalPair)
                        // console.log(d.colorCode)
                        // console.log(d.positionalPairOfApi)
                        // console.log(d.positionalPair)
                        // console.log(d.colorCode[index])
                        if (d.colorCode[index] == '0') {
                            return "#007C80"
                        }
                        else if (d.colorCode[index] == '1') {
                            return '#023659'
                        }
                        else if (d.colorCode[index] == '2') {
                            return '#4695c9'
                        }
                    }
                    else {
                        d.filled = false;
                        return "#fff"
                    }
                }
            )
            .attr("class", function (d: any) {
                if (d.Custompair.includes(d.positionalPair)) {
                    return "filledsquare"
                }
                else {
                    return "square"
                }
            })
            .on('click', function (d: any, i) {
                //console.log(d)
                if (localStorage.getItem('access-token') && d.organisation) {
                    if (!d.filled) {
                        d3.select(this)
                            .style("fill", "#023659")
                            .attr('class', "filledsquare");

                        //console.log(d.positionalPairOfApi)
                        if (!self.indPair.includes(d.positionalPair)) {
                            self.indPair.push(d.positionalPair);
                            //console.log(self.indPair)
                        }

                        //document.getElementById('rect-'+d.y+0).style.fill = "#fff";

                        var splilttedWord = d.positionalPair.split('-');
                        if (d.positionalPairOfApi[d.acrossLid]) {
                            if (d.positionalPairOfApi[d.acrossLid].includes(splilttedWord[0] + "-0")) {
                                const index: number = d.positionalPairOfApi[d.acrossLid].indexOf(splilttedWord[0] + "-0");
                                if (index !== -1) {
                                    d.positionalPairOfApi[d.acrossLid].splice(index, 1);
                                }
                                document.getElementById('rect-next-' + res + flag + d.y + 0).style.fill = "#fff";

                            }

                            // console.log(splilttedWord)
                            if (d.positionalPairOfApi[d.acrossLid].includes("0-" + splilttedWord[1])) {
                                const indexs: number = d.positionalPairOfApi[d.acrossLid].indexOf("0-" + splilttedWord[1]);
                                if (indexs !== -1) {
                                    d.positionalPairOfApi[d.acrossLid].splice(indexs, 1);
                                }
                                document.getElementById('rect-next-' + res + flag + 100 + i).style.fill = "#fff";
                            }
                        }
                        d.filled = true;

                        if (d.positionalPairOfApi[d.acrossLid]) {
                            d.positionalPairOfApi[d.acrossLid].push(d.positionalPair);
                        }
                        else {
                            d.positionalPairOfApi[d.acrossLid] = [];
                            d.positionalPairOfApi[d.acrossLid].push(d.positionalPair);
                        }

                        //console.log(d.positionalPairOfApi)
                        if (d.rawPosss != d.positionalPairOfApi[d.acrossLid]) {
                            document.getElementById("saveButton").style.display = "";
                            document.getElementById("discardButton").style.display = "";
                        }
                        else {
                            document.getElementById("saveButton").style.display = "none";
                            document.getElementById("discardButton").style.display = "none";
                        }

                        // if (self.Interlinear == "Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().sourceText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[0] - 1))) {
                        //                 if (pair[1] == "0") {
                        //                     greekPair.push("Null");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().greek[Number(pair[1] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().targetText[Number(pair[1] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push("NA");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().sourceText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }


                        // if (self.Interlinear == "Reverse-Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().targetText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[1] - 1))) {
                        //                 if (pair[0] == "0") {
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().sourceText[Number(pair[0] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push(data.json().englishWord[h] + "(" + "NA" + ")");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().targetText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }
                        self.gridDataJson.positionalPairs = d.positionalPairOfApi[d.acrossLid];
                    }
                    else {
                        d3.select(this)
                            .style("fill", "#fff")
                            .attr('class', "square")
                        d.filled = false;
                        if (d.positionalPairOfApi[d.acrossLid]) {
                            var index = d.positionalPairOfApi[d.acrossLid].indexOf(d.positionalPair);
                            if (index > -1) {
                                d.positionalPairOfApi[d.acrossLid].splice(index, 1);
                                if (d.rawPosss != d.positionalPairOfApi[d.acrossLid]) {
                                    //console.log('not matching')
                                    document.getElementById("saveButton").style.display = "";
                                    document.getElementById("discardButton").style.display = "";
                                }
                                else {
                                    //console.log('matching')
                                    document.getElementById("saveButton").style.display = "none";
                                    document.getElementById("discardButton").style.display = "none";
                                }

                            }
                        }
                        // if (self.Interlinear == "Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().sourceText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[0] - 1))) {
                        //                 if (pair[1] == "0") {
                        //                     greekPair.push("Null");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().targetText[Number(pair[1] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().targetText[Number(pair[1] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push("NA");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().sourceText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }

                        // if (self.Interlinear == "Reverse-Interlinear") {
                        //     // Code for horizontal alignment

                        //     self.Statuses = [];
                        //     for (var h = 0; h < data.json().targetText.length; h++) {
                        //         var greekPair = new Array();

                        //         for (var g = 0; g < d.positionalPairOfApi.length; g++) {
                        //             let pair = d.positionalPairOfApi[g].split('-');
                        //             if (h == (Number(pair[1] - 1))) {
                        //                 if (pair[0] == "0") {
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + "Null" + ")");
                        //                 }
                        //                 else {
                        //                     //greekPair.push(data.json().sourceText[Number(pair[0] - 1)]);
                        //                     greekPair.push(data.json().englishWord[Number(pair[1] - 1)] + "(" + data.json().sourceText[Number(pair[0] - 1)] + ")");
                        //                 }
                        //             }
                        //         }
                        //         if (greekPair[0] == undefined) {
                        //             greekPair.push(data.json().englishWord[h] + "(" + "NA" + ")");
                        //         }
                        //         self.Statuses.push(new HorizontalAlign(h, data.json().targetText[h], greekPair))
                        //     }
                        //     // Ends Here
                        // }
                        self.gridDataJson.positionalPairs = d.positionalPairOfApi[d.acrossLid];
                    }
                    //console.log(d.positionalPairOfApi)
                    //console.log(self.indPair)
                }
                else {
                    if (!d.organisation && localStorage.getItem('access-token')) {
                        self.toastr.error('You are not under any organisation.')
                    }
                    else {
                        self.toastr.error('You are not a registered User. Sign In to make changes.')
                    }

                }
            })

            .on("mouseover", function (d: any, i) {
                //console.log(d)
                var x = document.getElementById(d.greekIndexWise + '-next' + flag + res);
                var y = document.getElementById(d.hindiIndexWise + '-next' + flag + res);
                x.style.fontSize = "15px";
                x.style.fill = "#008000";
                y.style.fontSize = "17px";
                y.style.fill = "#008000";
                let xValue = d.x;

                xValue = xValue / 25 - 8;
                for (let m = xValue; m >= 0; m--) {

                    document.getElementById('rect-next-' + res + flag + d.y + m.toString()).style.stroke = 'blue';
                    document.getElementById('rect-next-' + res + flag + d.y + m.toString()).style.strokeWidth = '2px';
                }
                let yValue = d.y;
                for (let n = yValue; n >= 100; n = n - 25) {

                    document.getElementById('rect-next-' + res + flag + n + xValue.toString()).style.stroke = 'blue';
                    document.getElementById('rect-next-' + res + flag + n + xValue.toString()).style.strokeWidth = '2px';
                }

                div.style("left", d3.event.pageX + 10 + "px");
                div.style("top", d3.event.pageY - 25 + "px");
                div.style("display", "inline-block");
                div.style("text-align", "left")
                div.style("width", "150px")
                div.html(function () {
                    return "<b>" + y.innerHTML + "</b>" + " => " + "<b>" + x.innerHTML + "</b>";
                });

            })

            .on("mouseout", function (d: any) {
                var x = document.getElementById(d.greekIndexWise + '-next' + flag + res);
                var y = document.getElementById(d.hindiIndexWise + '-next' + flag + res);
                x.style.fontSize = "14px";
                x.style.fill = "black";
                y.style.fontSize = "16px";
                y.style.fill = "black";
                div.style("display", "none");

                let xValue = d.x;

                xValue = xValue / 25 - 8;
                for (let m = xValue; m >= 0; m--) {

                    document.getElementById('rect-next-' + res + flag + d.y + m.toString()).style.stroke = '';
                    document.getElementById('rect-next-' + res + flag + d.y + m.toString()).style.strokeWidth = '';
                }
                let yValue = d.y;
                for (let n = yValue; n >= 100; n = n - 25) {

                    document.getElementById('rect-next-' + res + flag + n + xValue.toString()).style.stroke = '';
                    document.getElementById('rect-next-' + res + flag + n + xValue.toString()).style.strokeWidth = '';
                }

            })

        var upperColumn = row.selectAll(".upperColumn")
            .data(function (d: any) {
                return d;
            })
            .enter().append("text")


        // For making the svg matrix scrollable
        d3.select("#" + "svg-" + res + flag)
            .data(gridData)
            .attr("width", function (d, i) {
                let len = d.length;
                len = (len * 35) + 215;  //140;
                //console.log(len)
                return len;
            })
            .attr("height", function (d, i) {
                let len = d[0].hindiVerticalWords.length;
                len = (len * 35) + 120;
                return len;
            })
            // .attr("width", "100%")
            .attr("viewBox", function (d, i) {
                let height = d[0].hindiVerticalWords.length;
                height = (height * 35) + 120;

                let width = d.length;
                width = (width * 35) + 215;  //140;
                return "0 0 " + width + " " + height;
            })
        //"0 0 400 400")
        // Ended Here

        var labell = d3.selectAll(".rowd3" + flag + res + 'grid')
            .data(gridData)

        var label: any = labell.append("text")
            .attr("x", "36")
            .attr("y", function (d, i) {
                return d[0].y + 17;
            })
            .style("font-size", "16px")
            .attr("id", function (d, i) {
                return d[0].hindiIndexWise + "-next" + flag + res;
            })
            .text(function (d, i) {
                return d[0].hindiVerticalWords[i];
            })

            .on("mouseout", function (d) {
                div.style("display", "none");
            })
            .on('mouseover', function (d: any, i) {
                if (d[i].Language == 'grk-UGNT4') {
                    div.style("left", d3.event.pageX + 10 + "px");
                    div.style("top", d3.event.pageY - 25 + "px");
                    div.style("display", "inline-block");
                    div.style("text-align", "left")
                    div.style("width", "400px")
                    div.html(function () {

                        //console.log(greekArray)
                        if (d[i].hindiVerticalWords[i] != 'NULL') {
                            // console.log(d.greekHorizontalWord[i]);

                            // let removeZero = Number(String(d.greekHorizontalWord[i]).substring(1, String(d.greekHorizontalWord[i]).length)).toString();
                            // if (removeZero.endsWith('0')) {
                            //     removeZero = removeZero.substring(0, removeZero.length - 1)
                            // }
                            // console.log(removeZero)
                            // console.log(greekArray)

                            //Added on 17 Oct for showing lexicon data as per new updates
                            let removeZero = Number(d[i].hindiVerticalWords[i]);
                            // Ended here on 17 Oct

                            for (let count = 0; count < greekVerticalArray.length; count++) {
                                //console.log(greekArray[count])
                                if (greekVerticalArray[count].includes("strongs:- " + removeZero + " ")) {
                                    //console.log(greekArray[count])
                                    return greekVerticalArray[count];
                                }


                            }
                        }
                        else {
                            return 'N/A';
                        }


                        //return  (d.greekHorizontalWords[i] == 'NULL') ? 'N/A':d.greekHorizontalWords[i]

                    });
                }
            })


        for (var i = 0; i < label.nodes().length; i++) {
            //console.log(  label.nodes()[i].getComputedTextLength());
            var textLen = label.nodes()[i].getComputedTextLength();
            label.nodes()[i].setAttribute('x', 175 - textLen)
        }

        // content.addEventListener('scroll', function (evt) {
        //     //console.log(  label.nodes()[1]);
        //     for (var i = 0; i < label.nodes().length; i++) {
        //         label.nodes()[i].setAttribute('x', 30 + this.scrollLeft);
        //     }
        // }, false)


        var labellll = grid.selectAll("svg")
            .data(gridData[0])
        var labelll = labellll.enter().append("g")
        var div = d3.select("body")
            .append("div")
            .attr("class", "toolTip")
            .attr("word-wrap", "break-word")
            ;

        var labelGreek = labelll.append("text")

            .attr("transform", function (d: any, i) {
                var xAxis = d.x + 14;
                return "translate(" + xAxis + ",95)rotate(300)";
            })
            .style("font-size", "14px")
            .attr("id", function (d: any, i) {
                return d.greekIndexWise + "-next" + flag + res;
            })
            .text(function (d: any, i) {
                return d.greekHorizontalWords[i];
            })


            .on("mouseout", function (d) {
                div.style("display", "none");
            })
            .on('mouseover', function (d: any, i) {
                div.style("left", d3.event.pageX + 10 + "px");
                div.style("top", d3.event.pageY - 25 + "px");
                div.style("display", "inline-block");
                div.style("text-align", "left")
                div.style("width", "400px")
                div.html(function () {
                    if (d.greekHorizontalWord[i] != 'NULL') {
                        // console.log(d.greekHorizontalWord[i]);

                        // let removeZero = Number(String(d.greekHorizontalWord[i]).substring(1, String(d.greekHorizontalWord[i]).length)).toString();
                        // if (removeZero.endsWith('0')) {
                        //     removeZero = removeZero.substring(0, removeZero.length - 1)
                        // }
                        // console.log(removeZero)
                        // console.log(greekArray)

                        //Added on 17 Oct for showing lexicon data as per new updates
                        let removeZero = Number(d.greekHorizontalWord[i]);
                        // Ended here on 17 Oct

                        for (let count = 0; count < greekArray.length; count++) {
                            //console.log(greekArray[count])
                            if (greekArray[count].includes("strongs:- " + removeZero + " ")) {
                                //console.log(greekArray[count])
                                return greekArray[count];
                            }


                        }
                    }
                    else {
                        return 'N/A';
                    }

                    //return  (d.greekHorizontalWords[i] == 'NULL') ? 'N/A':d.greekHorizontalWords[i]
                });
            })

        content.addEventListener('scroll', function (evt) {

            // var elms:any = document.querySelectorAll("[id='rect-100']");

            // for(var i = 0; i < elms.length; i++)
            //     elms[i].style.display='none';
            //console.log(labelGreek.nodes())

            for (var i = 0; i < labelGreek.nodes().length; i++) {
                let labelGreekData: any = gridData[0][i];
                var xi: any = labelGreekData.x + 14;
                (labelGreek.nodes()[i] as any).setAttribute("transform", "translate(" + xi + "," + (95 + this.scrollTop) + ")rotate(300)");
            }

            let count = 100;
            for (var h = 0; h < label.nodes().length; h++) {
                for (var i = 0; i < labelGreek.nodes().length; i++) {
                    let b: any = count + i.toString();
                    let a: any = 85 + this.scrollTop + i.toString();
                    // console.log(a)
                    // console.log(b)
                    if ((document.getElementById('rect-next-' + res + flag + b) != null) && (Number(b) < Number(a))) {
                        //console.log('asdfsfd')
                        document.getElementById('rect-next-' + res + flag + b).style.display = "none";
                        if (document.getElementById(label.nodes()[h].id) != null) {
                            document.getElementById(label.nodes()[h].id).style.display = "none";
                        }
                    }

                    if ((document.getElementById('rect-next-' + res + flag + b) != null) && (Number(b) > Number(a))) {
                        //console.log('asdfsfd')
                        document.getElementById('rect-next-' + res + flag + b).style.display = "";
                        if (document.getElementById(label.nodes()[h].id) != null) {
                            document.getElementById(label.nodes()[h].id).style.display = "";
                        }
                    }
                }
                count = count + 25;
            }
        }, false)


    }

}