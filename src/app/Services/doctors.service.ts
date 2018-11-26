import { Injectable } from '@angular/core';
import { HOST_URL, API_DOCTORS } from '../config';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Doctor } from '../Models/Doctors';
import { PaginationService } from './pagination.service';
import { Specialization } from '../Models/Specialization';
import { FormGroup } from '@angular/forms';
import { IllnessHistory } from '../Models/IllnessHistory';
import { DatePipe } from '@angular/common';

const searchbyname = 'searchbyname';
const searchbyspecialization = 'searchbyspecialization';

@Injectable({
  providedIn: 'root'
})
export class DoctorsService {
  doctorsList: Doctor[];
  specializations: Specialization[];
  doctorsAmount: number;

  url = HOST_URL + API_DOCTORS;

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    }),
    params: new HttpParams()
      .set('page', this.paginationService.pageIndex.toString())
      .set('pagecount', this.paginationService.pageSize.toString())
  };

  getDoctor(id: number) {
    const doctorsUrl = `${this.url}/${id}`;
    return this.http.get(doctorsUrl, this.httpOptions);
  }

  constructor(private http: HttpClient,
    private paginationService: PaginationService,
    private datePipe: DatePipe) { }

  getDoctors(name?: string, specialization?: number) {
    const doctorsUrl = this.url;
    if (name != null && name !== '') {
      this.httpOptions.params =  this.httpOptions.params.set(searchbyname, name);
    } else {
      this.httpOptions.params = this.httpOptions.params.delete(searchbyname);
    }

    if (specialization !== 0 && !isNaN(specialization)) {
      this.httpOptions.params =  this.httpOptions.params.set(searchbyspecialization, specialization.toString());
    } else {
      this.httpOptions.params = this.httpOptions.params.delete(searchbyspecialization);
    }

    this.http.get(doctorsUrl, this.httpOptions)
    .subscribe((result: any) => {
      this.doctorsList = result.doctors;
      this.doctorsAmount = result.totalDoctors;
  });
  }

  getSpecializations() {
    const specUrl = this.url + '/specializations';
    this.http.get<Specialization[]>(specUrl)
      .subscribe(data => this.specializations = data);
  }

  fillIllness(form: FormGroup, appointmentId: number) {
    // this.illnessHistory = new IllnessHistory(this.form.value);
    let illnessHistory = new IllnessHistory();
    illnessHistory = form.value;
    illnessHistory.AppointmentId = appointmentId;
    console.log('ds1' + illnessHistory.FinishAppointmentTime);
    illnessHistory.FinishAppointmentTime = new Date();
    console.log('ds2' + illnessHistory.FinishAppointmentTime);
    illnessHistory.FinishAppointmentTime.setUTCHours(illnessHistory.FinishAppointmentTime.getUTCHours() + 1);
    illnessHistory.FinishAppointmentTime = new Date(this.datePipe.transform(illnessHistory.FinishAppointmentTime, 'short'));
    console.log('ds3' + illnessHistory.FinishAppointmentTime);
    const url = HOST_URL + '/api/Doctors/illnesshistory';
    return this.http.post(url, illnessHistory);
  }
}
