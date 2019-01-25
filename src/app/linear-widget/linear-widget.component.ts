import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'linear-widget',
  templateUrl: './linear-widget.component.html',
  styleUrls: ['./linear-widget.component.css']
})
export class LinearWidgetComponent implements OnInit {

  @Input() linearCard: any;
   sourcetext;
   targettext;
   englishword;
   englishSourceArray = new Array();

  constructor() { }

  ngOnInit() {
    //console.log(this.linearCard)
    this.sourcetext =  this.linearCard.targetContent[this.linearCard.lid].strongs;
    this.targettext = this.linearCard.sourceContent[this.linearCard.lid].hin_text;
    this.englishword = this.linearCard.targetContent[this.linearCard.lid].english;

    if(this.sourcetext.length ==  this.englishword.length){
      
      for(let i = 0 ; i < this.sourcetext.length; i ++){
              this.englishSourceArray.push(this.englishword[i] + '<' + this.sourcetext[i] + '>');
      }
    }
  }

}
