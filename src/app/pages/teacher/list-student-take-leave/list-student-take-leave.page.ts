import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Component, OnDestroy } from "@angular/core";
import { ModalController, ViewDidEnter } from "@ionic/angular";
import { SharedService } from "src/app/shared/services/shared.service";
import { TeacherService } from "src/app/shared/services/teacher.service";
import { IStudentTakeLeave } from '../../../shared/defined/student.define';
import { FormDeninePage } from "./form-denine/form-denine.page";
import { ViewDetailComponent } from "src/app/components/view-detail/view-detail.component";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";
import { DomainAPI } from 'src/app/shared/class/domain.class';
@Component({
    selector: 'attendance-student-take-leave',
    templateUrl: 'list-student-take-leave.page.html',
    styleUrls: ['list-student-take-leave.page.scss']
})
export class ListStudentTakeLeavePage extends DomainAPI implements ViewDidEnter, OnDestroy {
    private options = {
        headers: new HttpHeaders({
            'Content-Type': 'application/x-www-form-urlencoded'
        })
    }

    deninePage: any = FormDeninePage;
    public studentTakeLeave: IStudentTakeLeave[];
    public stateLoadData: boolean = true;
    public fakes: any = Array(8);

    public subscription$: Subscription;
    constructor(
        private _router: Router,
        private _modalCtrl: ModalController,
        private _sharedService: SharedService,
        private _http: HttpClient,
        private readonly _teacherService: TeacherService,
    ) {
        super();
    }

    ionViewDidEnter() {
        this.init();
    }

    public async init() {
        let currentTime: string = this._sharedService.getDatetime();
        let listStudent = await this._teacherService.listStudentTakeLeave(currentTime);
        this.subscription$ = listStudent.subscribe((res: IStudentTakeLeave[]) => {
            if (res.length === 0) {
                this.stateLoadData = false;
                return this._sharedService.showToast('Không có sinh viên nào xin nghỉ!', 'danger');
            }
            this.studentTakeLeave = [...res];
            this.stateLoadData = false;
        });
    }

    public async onConfirm(student: IStudentTakeLeave, state: boolean, idx: number) {
        if (state) {
            await this._sharedService.showLoading('Xin chờ...');
            let url: string = `${this.domain}/mvc/public/leave/teacher_agree`;
            let take_leave_date: string = this._sharedService.convertDateToString(student.take_leave_date);
            let data = {
                student_id: student.student_id,
                subject_id: student.subject_id,
                take_leave_date,
                leave_reason: student.leave_reason,
                leave_id_leaves: student.leave_id_leaves
            };
            return await this._http.post(url, data, this.options).subscribe((res: any) => {
                this.studentTakeLeave.splice(idx, 1);
                this.setQueryParam(idx);
                this._sharedService.loading.dismiss();
            });
        }

        // Tu choi
        const modal = await this._modalCtrl.create({
            component: FormDeninePage
        });
        await modal.present();

        // nhan lai gia tri khi form denine quay lai (dismiss)
        const data = await modal.onDidDismiss();
        const denine_reason: string = data.data;
        if (denine_reason === 'cancel') {
            return;
        }
        if (denine_reason) {
            await this._sharedService.showLoading('Loading...');
            let url: string = `${this.domain}/mvc/public/leave/teacher_denine`;
            let take_leave_date: string = this._sharedService.convertDateToString(student.take_leave_date);
            let data = {
                student_id: student.student_id,
                subject_id: student.subject_id,
                take_leave_date,
                leave_reason: student.leave_reason,
                leave_id_leaves: student.leave_id_leaves,
                denine_reason
            };
            return await this._http.post(url, data, this.options).subscribe((res: any) => {
                this.setQueryParam(idx);
                const msg: string = `Từ chối sinh viên ${student.student_name} thành công!`;
                this.studentTakeLeave.splice(idx, 1);
                this._sharedService.loading.dismiss();
                this._sharedService.showToast(msg, 'success');
            });
        }
        return this._sharedService.showToast('Bạn phải nhập lý do từ chối trước');
    }

    private setQueryParam(value: number) {
        this._router.navigate([], {
            queryParams: { state: value }
        });
    }

    public async onShowDetail(student: IStudentTakeLeave) {
        const modal = await this._modalCtrl.create({
            component: ViewDetailComponent,
            componentProps: { student },
            cssClass: 'custom-view-detail-st'
        });
        return modal.present();
    }

    public onHandleNoData(ev: boolean) {
        if (ev) {
            this.init();
        }
    }

    public trackByFn(index: number, student: any): number {
        return student?.student_id;
    }

    ngOnDestroy() {
        this.subscription$.unsubscribe();
    }
}

