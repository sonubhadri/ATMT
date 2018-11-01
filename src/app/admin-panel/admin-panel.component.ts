import { Component, OnInit,Inject } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';
import { Http, Response,Headers } from '@angular/http';
import { ToastrService } from 'ngx-toastr';
import { GlobalUrl } from '../globalUrl';


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

  constructor(private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl,public dialog: MatDialog) { }

  ngOnInit() { }

  openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      width: '250px',
      data: {name: this.name, animal: this.animal}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      this.animal = result;
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
  constructor(
    private toastr: ToastrService, private _http: Http, private ApiUrl: GlobalUrl,public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onNoClick(): void {
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
