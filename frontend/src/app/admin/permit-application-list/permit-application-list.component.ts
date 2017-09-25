import { AlertService } from '../../_services/alert.service';
import { ApplicationService } from '../../_services/application.service';
import { Component, OnInit } from '@angular/core';
import { Injectable } from '@angular/core';
import * as moment from 'moment/moment';

@Component({
  providers: [],
  selector: 'app-permit-application-list',
  templateUrl: './permit-application-list.component.html'
})
@Injectable()
export class PermitApplicationListComponent implements OnInit {
  apiErrors: any;
  applications: any;
  errorMessage: string;
  successMessage: string;

  constructor(private applicationService: ApplicationService, private alertService: AlertService) {
    this.applications = [];
  }

  isApproachingBeginDateTime(startDateTime) {
    const now = moment();
    const deadline = moment(startDateTime, 'YYYY-MM-DDTHH:mm:ss').subtract(2, 'weeks');
    return now.isAfter(deadline);
  }

  isPastDate(dateTime) {
    const now = moment();
    const pastDate = moment(dateTime, 'YYYY-MM-DDTHH:mm:ss');
    return now.isAfter(pastDate);
  }

  isOverOneDayOld(submittedDateTime) {
    const now = moment();
    const deadline = moment(submittedDateTime, 'YYYY-MM-DDTHH:mm:ss').add(1, 'days');
    return now.isAfter(deadline);
  }

  isOverTwoDaysOld(submittedDateTime) {
    const now = moment();
    const deadline = moment(submittedDateTime, 'YYYY-MM-DDTHH:mm:ss').add(2, 'days');
    return now.isAfter(deadline);
  }

  isWeekAwayOrPast(dateTime) {
    const now = moment();
    const warning = moment(dateTime, 'YYYY-MM-DDTHH:mm:ss').subtract(1, 'weeks');
    return now.isAfter(warning);
  }

  showAttentionAlert() {
    let result = false;
    this.applications.forEach(application => {
      if (this.isOverTwoDaysOld(application.createdAt)) {
        result = true;
      }
    });
    return result;
  }

  getApplications() {
    this.applicationService.get().subscribe(
      (applications: any) => {
        this.applications = applications;
      },
      (e: any) => {
        this.applicationService.handleStatusCode(e[0]);
        this.apiErrors = e;
        window.scroll(0, 0);
      }
    );
  }

  ngOnInit() {
    this.getApplications();
    this.successMessage = this.alertService.getSuccessMessage();
    this.alertService.clear();
  }
}