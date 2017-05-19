import {Component, OnInit, OnDestroy, ViewContainerRef} from '@angular/core';
import * as sio from 'socket.io-client';
import {DataService} from './services/data.service';
import {AuthService} from './services/auth.service';
import {FormGroup, FormControl, Validators, FormBuilder} from '@angular/forms';
import{Router} from '@angular/router';
import {ToastyService, ToastyConfig, ToastOptions, ToastData} from 'ng2-toasty';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  private loginUser: FormGroup;
  private loginAndSocket;
  private email = new FormControl('', Validators.required);
  private password = new FormControl('', Validators.required);
  user;
  socket: SocketIOClient.Socket;

  constructor(public auth: AuthService, private toastyService: ToastyService, private toastyConfig: ToastyConfig, private data: DataService, private addUserForm: FormBuilder, private router: Router, vcr: ViewContainerRef) {
    this.toastyConfig.theme = 'material';

  }

  getMessage(){

  }

  ngOnInit() {
    this.socket = sio({
      path: '/socket.io'
    });
    this.loginUser = this.addUserForm.group({
      email: this.email,
      password: this.password,
      socketId: this.socket.id
    });

    if (this.loggedIn()) {
      this.auth.callRefreshUserData()

    }
  }

  ngOnDestroy() {

  }


  loginAccount() {
    this.loginAndSocket = this.loginUser.value;
    this.loginAndSocket.socketId = this.socket.id;
    this.auth.loginAccount(this.loginAndSocket).subscribe(
      data => {
        console.log(data);
        this.router.navigate(['./']);
      },
      err => {
        if (typeof err.json() == 'string') {
          this.toastyService.error(err.json())
        } else {
          if (Array.isArray(err.json())) {
            this.toastyService.error(err.json()[0].msg)
          } else {
            this.toastyService.error(err.json().msg)
          }
        }
      });
  }

  logOut() {
    console.log("click sur logout avec socket");
    this.data.logOut(this.auth.user._id).subscribe(res => {
      console.log(res);
      localStorage.clear();
      this.router.navigate(['./']);
      var toastOptions: ToastOptions = {
        title: "Deconnection",
        msg: "See you soon !",
        showClose: true,
        timeout: 5000,
        theme: 'material',
        onAdd: (toast: ToastData) => {
          console.log('Toast ' + toast.id + ' has been added!');
        },
        onRemove: function (toast: ToastData) {
          console.log('Toast ' + toast.id + ' has been removed!');
        }
      };
      this.toastyService.info(toastOptions);
    })
  }

  loggedIn() {
    return this.auth.loggedIn()
  }
}
