import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ChatAdapter } from 'ng-chat';
import { SignalRAdapter } from '../newAdapter';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  useNAme;
  title = 'chatProject';
  userId = 'c5324dd0-1c00-2b38-868a-39fe04b4ca26';
  constructor(public http: HttpClient) {}
  public adapter: ChatAdapter = new SignalRAdapter('Bader', this.http);
  ngOnInit(): void {
    this.useNAme = localStorage.getItem('userName');
  }
}
