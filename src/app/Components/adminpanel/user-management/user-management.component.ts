import { Component, OnInit } from '@angular/core';
import { UserListService } from 'src/app/Services/UserListService/user-list.service';
import { NotificationService } from 'src/app/Services/notification.service';
import { UserListModel } from 'src/app/Models/UserListModel';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})

export class UserManagementComponent implements OnInit {

  public Users: UserListModel[] = [];

  displayedColumns = ['id', 'firstName', 'secondName', 'thirdName', 'birthDate', 'email', 'statusName'];

  constructor(
    private _userListService: UserListService,
    private _notification: NotificationService,
    ) { }

  ngOnInit() {
    this._userListService.getUserList().subscribe((types: any) => {
      this.Users = types;
      this.Users = this._userListService.StatusConverter(this.Users);
    },
    error => {
      this._notification.error('Server error');
    });
  }

}
