import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, ViewDidEnter } from '@ionic/angular';
import { App } from '@capacitor/app';
import { AccountService } from '../../../shared/services/account.service';
import { StudentService } from 'src/app/shared/services/student.service';
import { AttendanceService } from 'src/app/shared/services/attendance.service';
import { SharedService } from 'src/app/shared/services/shared.service';
import { DomainAPI } from 'src/app/shared/class/domain.class';
import { StorageService } from 'src/app/shared/services/storage.service';


@Component({
  selector: 'attendance-attendance',
  templateUrl: 'dashboard-student.page.html',
  styleUrls: ['dashboard-student.page.scss'],
})
export class DashboardStudentPage extends DomainAPI implements OnInit, ViewDidEnter {
  public student;
  public avatar: string;
  public infoAttendance: any[];
  public notifications: any[];
  public countNewNotify: number;
  constructor(
    private _router: Router,
    private _actionSheetController: ActionSheetController,
    private _storageService: StorageService,
    private _accountService: AccountService,
    private _attendanceService: AttendanceService,
    private _studentService: StudentService,
    private _sharedService: SharedService
  ) {
    super();
  }


  async ngOnInit() {
    await this.checkLogged();
  }

  ionViewDidEnter() {
    this.getInfoStudent();
    this.init();
  }

  public async init() {
    // //get notifications
    let notify$ = await this._studentService.notifications();
    notify$.subscribe((res: any) => {
      if (res) {
        this.notifications = [...res];
        this.countNewNotify = res.filter((notification: any) => {
          return notification?.is_seen == 0;
        }).length;
        return;
      }
      return this.notifications = [];
    });

    // load info attendance
    let currentDate: string = this._sharedService.getDatetime();
    const infoAttendance$ = await this._attendanceService.getInfoDetailsAttendance(currentDate);
    infoAttendance$
    .subscribe((res: any) => {
      if(res?.length !== 0) {
        this.infoAttendance = [...res];
      }      
    });
  }

  private async getInfoStudent() {
    const infoStudent$ = await this._studentService.infoStudent();
    infoStudent$
    .subscribe((res: any) => {
      if (res.length !== 0) {
        this.student = res[0];
        if(!this.student?.student_avatar) {
          return this.avatar = this.student?.student_gender == 1 ? 'assets/images/avatar-male.webp' : 'assets/images/avatar-female.webp';
        }
        return this.avatar = `${this.domain}/mvc/public/images/${this.student?.student_avatar}`;
      }
    });
  }

  //Attendance GPS
  async onAttendanceGPS() {
    let state$ = await this._attendanceService.isExistInRoom();
    state$.subscribe(async (res: any) => {
      if (res[0].state == 1) {
        return this._router.navigate(['student', 'attendance-gps']);
      }
      this._sharedService.showToast('Không có lớp học nào', 'danger');
    });
  }

  private async checkLogged() {
    let isLogged = await this._storageService.get('logged');
    if(!isLogged) {
      let msgAgree: string = `<strong>Bạn có muốn lưu mật khẩu?</strong><br> Lần vào ứng dụng kế tiếp sẽ không cần phải đăng nhập lại.`;
      let msgCancel: string = 'Không lưu mật khẩu!';
      const savePassword: Function = () => this._storageService.set('logged', 1);
      return this._sharedService.showAlert(msgAgree, 'Lưu mật khẩu', savePassword, msgCancel);
    }
  }

  public async openMenu() {
    const actionSheet = await this._actionSheetController.create({
      buttons: [{
        text: 'Đổi mật khẩu',
        icon: 'key-outline',
        handler: () => {
          this._sharedService.showToast('Đang phát triển', 'danger');
        }
      }, {
        text: 'Đăng Xuất',
        icon: 'log-out-outline',
        handler: () => this.onLogout()
      }, {
        text: 'Hủy',
        icon: 'close',
        role: 'cancel',
        handler: () => {
          console.log('Cancel clicked');
        }
      }]
    });
    return await actionSheet.present();
  }

  public onLogout() {
    this._accountService.logout();
  }
}
