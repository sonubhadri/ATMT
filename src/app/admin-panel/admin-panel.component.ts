import { Component, OnInit, Inject, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatPaginator, MatTableDataSource } from '@angular/material';
import { GlobalUrl } from '../globalUrl';
import { Http, ResponseType, Response, Headers } from '@angular/http';
import { ToastrService } from 'ngx-toastr';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { FormControl } from '@angular/forms';


export interface DialogData {
  animal: string;
  name: string;
}


@Component({
  selector: 'admin-panel',
  templateUrl: './admin-panel.component.html',
  styleUrls: ['./admin-panel.component.css']
})


export class AdminPanelComponent implements OnInit {

  animal: string;
  name: string;
  headers = new Headers();
  projectList: any;
  organisation: string;

  constructor(public router: Router, private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl, public dialog: MatDialog) {
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

    this._http.get(this.ApiUrl.createProject, {
      headers: this.headers
    })
      .subscribe(data => {
        this.projectList = String(Object.values(data.json())).split(',');
        this.organisation = String(Object.keys(data.json()))
        //console.log('hello bye')
        //console.log(Object.values(this.projectList))
      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(AssignTaskDialog, {
      width: '1200px',
      data: { name: this.name, animal: this.animal },
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      //console.log('The dialog was closeddddd');
      this.animal = result;

      this._http.get(this.ApiUrl.createProject, {
        headers: this.headers
      })
        .subscribe(data => {
          this.projectList = String(Object.values(data.json())).split(',');
          this.organisation = String(Object.keys(data.json()))
          //console.log('hello bye')
          //console.log(Object.values(this.projectList))
        }, (error: Response) => {
          if (error.status === 404) {
            this.toastr.warning("Data not available")
          }
          else {
            this.toastr.error("An Unexpected Error Occured.")
          }

        })

    });
  }

  openUserListDialog(e): void {
    const userdialogRef = this.dialog.open(AssignTaskDialog, {
      width: '1000px',
      data: { name: this.name, animal: this.animal }
    });

    let instance = userdialogRef.componentInstance;
    instance.projectBook = e;

    userdialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
    });
  }

}

@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'dialog-overview-example-dialog.html',
})
export class DialogOverviewExampleDialog implements OnInit {

  LangArray: any;
  langFirstIndex: any;
  display: any = false;
  headers = new Headers();
  langParam: any;

  constructor(private API: GlobalUrl, public router: Router,
    private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl, public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
    dialogRef.disableClose = false;
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
    var timeDiff = Math.abs(new Date(dd * 1000).getTime() - new Date().getTime());
    if (Math.ceil(timeDiff / (1000 * 3600 * 24)) > 1) {
      localStorage.setItem("access-token", '');
      this.router.navigate(['../app-login']);
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  glLangChange(l) {
    this.langParam = l;
  }

  createProject() {
    this.decodeToken(String(JSON.parse(JSON.stringify(this.headers)).Authorization));

    this.display = true;
    this._http.post(this.API.createProject, { "language": this.langParam }, {
      headers: this.headers
    })
      .subscribe(Response => {
        //console.log(Response.json())
        if (Response.json().success == true) {
          this.display = false;
          this.toastr.success('Project created succesfully.')
        }
        else {
          this.display = false;
          this.toastr.error(Response.json().message)
        }
        this.display = false;
      }
      )
    this.langParam = "";
    this.dialogRef.close();
  }

  ngOnInit() {
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

}


export interface tableData {
  books: string;
  role: any;
  user: string;
}


@Component({
  selector: 'assign-task',
  templateUrl: 'assign-task.html',
})

export class AssignTaskDialog implements OnInit {

  ELEMENT_DATA: tableData[] = [];
  norecordFlag: boolean;

  displayedColumns: string[] = ['user', 'Language', 'books', 'role', 'Remove'];
  dataSource = new MatTableDataSource<tableData>(this.ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  display: any = false;
  headers = new Headers();
  userList: any;
  user: any;
  userIndex: any;
  bookIndex: any;
  bookControl = new FormControl();
  role: any;
  projectBook: any;
  projectBookviaCreate: any;
  LangArray: any;
  langFirstIndex: any;
  langParam: any;

  bookList: string[] = ["MAT", "MRK", "LUK", "JHN", "ACT", "ROM", "1CO", "2CO", "GAL", "EPH", "PHP", "COL", "1TH", "2TH", "1TI", "2TI", "TIT", "PHM", "HEB", "JAS", "1PE", "2PE", "1JN", "2JN", "3JN", "JUD", "REV", "GEN", "EXO", "LEV", "NUM", "DEU", "JOS", "JDG", "RUT", "1SA", "2SA", "1KI", "2KI", "1CH", "2CH", "EZR", "NEH", "EST", "JOB", "PSA", "PRO", "ECC", "SNG", "ISA", "JER", "LAM", "EZK", "DAN", "HOS", "JOL", "AMO", "OBA", "JON", "MIC", "NAM", "HAB", "ZEP", "HAG", "ZEC", "MAL"];


  bookSelected: string[];

  constructor(private API: GlobalUrl, public router: Router,
    private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl, public assigndialogRef: MatDialogRef<AssignTaskDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {
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
    var timeDiff = Math.abs(new Date(dd * 1000).getTime() - new Date().getTime());
    if (Math.ceil(timeDiff / (1000 * 3600 * 24)) > 1) {
      localStorage.setItem("access-token", '');
      this.router.navigate(['../app-login']);
    }
  }

  glLangChange(l) {
    this.projectBookviaCreate = l;
  }

  bookSelect(book) {
    this.bookSelected = book;
    console.log(this.bookSelected)
  }

  onNoClick(): void {
    this.assigndialogRef.close();
  }

  userChange(l) {
    this.user = l.key;
  }

  roleChange(m) {
    this.role = m;
  }

  onRemoveClick(email, language, role, books) {
    console.log(email + "     " + language + "     " + role + "     " + books)
    this._http.post(this.ApiUrl.assignments + "/delete", { "email": email, "language": language, "role": role, "books": books.split(',') }, {
      headers: this.headers
    })
      .subscribe(Response => {
        //console.log(Response.json())
        if (Response.json().success == true) {
          this.display = false;
          this.toastr.success('Task Deleted succesfully.')
        }
        else {
          this.display = false;
          this.toastr.error(Response.json().message)
        }
        this.display = false;
      })

    this.assigndialogRef.close();
  }

  onApproveClick() {

    if (this.projectBook) {
      this.projectBookviaCreate = this.projectBook;
    }
    this._http.post(this.ApiUrl.assignments + "/add", { "email": this.user, "language": this.projectBookviaCreate, "role": this.role, "books": this.bookSelected }, {
      headers: this.headers
    })
      .subscribe(Response => {
        //console.log(Response.json())
        if (Response.json().success == true) {
          this.display = false;
          this.toastr.success('Task assigned to the user succesfully.')
        }
        else {
          this.display = false;
          this.toastr.error(Response.json().message)
        }
        this.display = false;
      })

    this.assigndialogRef.close();
  }


  ngOnInit() {

    this.dataSource.paginator = this.paginator;

    this.bookSelected = [];

    this._http.get(this.ApiUrl.userList, {
      headers: this.headers
    })
      .subscribe(data => {
        this.userList = data.json();
      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Users data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })


    this._http.get(this.ApiUrl.userListProjectWise + "/" + this.projectBook, {
      headers: this.headers
    })
      .subscribe(data => {
        this.ELEMENT_DATA = data.json();
        this.dataSource = new MatTableDataSource<tableData>(this.ELEMENT_DATA);
        console.log(this.ELEMENT_DATA)
        if ((this.ELEMENT_DATA[0])["user"]) {
          this.norecordFlag = true;
        }
        else if (this.ELEMENT_DATA["success"] == false) {
          this.norecordFlag = false;
        }

      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })


    this._http.get(this.ApiUrl.getLang)
      .subscribe(data => {
        this.LangArray = data.json();
        console.log('hello i am open')
      }, (error: Response) => {
        if (error.status === 404) {
          this.toastr.warning("Language data not available")
        }
        else {
          this.toastr.error("An Unexpected Error Occured.")
        }

      })


  }

}
