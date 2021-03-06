import { Component, OnInit, ViewChild } from '@angular/core';
import { ModeratorService } from '../../Services/moderator.service';
import { UsersEditProfileModel } from '../../../../Models/UsersEditProfileModel';
import { UsersEditProfileList } from '../../../../Models/UsersEditProfileList';
import { MatPaginator, MatSort, MatDialog } from '@angular/material';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { catchError, map, startWith, switchMap } from 'rxjs/operators';
import { merge, of as observableOf } from 'rxjs';
import { DialogService } from 'src/app/Services/dialog.service';
import { HOST_URL} from '../../../../config';
import { NotificationService } from '../../../../Services/notification.service';
import { ImageModalComponent } from '../data-approve/image-modal/image-modal.component';

const DEFAULT_AMOUNT_OF_PATIENT_ON_PAGE = 5;

@Component({
  selector: 'app-registration-confirm',
  templateUrl: './registration-confirm.component.html',
  styleUrls: ['./registration-confirm.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ])
  ]
})
export class RegistrationConfirmComponent implements OnInit {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  hostUrl = HOST_URL;
  usersAmount = 0;
  usersEditProfileModels: UsersEditProfileModel[] = [];
  columnsToDisplay: string[] = ['email', 'requestTime', 'type'];
  expandedElement: UsersEditProfileModel | null;
  isLoadingResults = true;
  constructor(private service: ModeratorService, public dialog: MatDialog,
              private dialogService: DialogService,
              private notification: NotificationService) { }

  ngOnInit() {
    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);
    this.paginator.pageSize = DEFAULT_AMOUNT_OF_PATIENT_ON_PAGE;
      this.paginator.page
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.service.getEditProfileRequest(this.paginator.pageIndex, this.paginator.pageSize);
        }),
        map((data: UsersEditProfileList) => {
          this.isLoadingResults = false;
          this.usersAmount = data.entityAmount;
          return data.entities;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          return observableOf([]);
        })
      ).subscribe(data => {
          this.usersEditProfileModels = data;
        });
  }

  openDialog(id: number, isApproved: boolean) {
    this.dialogService.openConfirmDialog('Are you sure to commit this action?')
    .afterClosed().subscribe(res => {
      if (res) {
        this.service.handleEditUserProfile(id, isApproved)
        .subscribe(() => {
          this.notification.success('User have been successfully approved!');
        },
        error => {
          this.notification.error(error);
        });
      }
    });
  }

  openImageDialog(imagePath: string): void {
    const dialogRef = this.dialog.open(ImageModalComponent, {
      data: { image: imagePath }
    });
  }

}
