import { Injectable } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@aspnet/signalr';
import { Observable, BehaviorSubject } from 'rxjs';
import { HOST_URL, RESTART_TIME, HUB_CONNECTION,
         NOTIFICATIONS_GET, NOTIFICATIONS_CHANGE, NOTIFICATIONS_CHACK_ALL,
         NOTIFICATION_NOTIFY, NOTIFICATION_ONLOAD, AUDIO } from '../config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TokenService } from './token.service';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    hubConnection: HubConnection;
    audio = new Audio();
    reconnect = false;

    constructor(private http: HttpClient, private tokenService: TokenService) {
        this.audio.src = AUDIO;
        this.audio.load();
        this.createConnection();
        this.registerOnServerEvents();
    }

    /* Observable items */
    private ifUnreadMessage = new BehaviorSubject<boolean>(false);
    private unReadMessages = new BehaviorSubject<number>(0);

    ifUnread(): Observable<boolean> {
        return this.ifUnreadMessage.asObservable();
    }

    unreadCount(): Observable<number> {
        return this.unReadMessages.asObservable();
    }

    /* Work with API*/
    getNotifications(page: number, count: number) {
        const params = new HttpParams()
        .set('page', page.toString())
        .set('pagecount', count.toString());
        return this.http.get(HOST_URL + NOTIFICATIONS_GET, { params: params });
    }

    changeStatus(id: number) {
        return this.http.patch(HOST_URL + NOTIFICATIONS_CHANGE, id);
    }

    checkAllNotifications() {
        return this.http.post(HOST_URL + NOTIFICATIONS_CHACK_ALL, {});
    }

    /* SignalR settings */
    private createConnection() {
        this.hubConnection = new HubConnectionBuilder()
            .withUrl(HOST_URL + HUB_CONNECTION, { accessTokenFactory: () => this.tokenService.getAuthToken() })
            .build();
    }

    private registerOnServerEvents(): void {
        this.hubConnection.on(NOTIFICATION_NOTIFY, (count: number) => {
            this.audio.play();
            this.displayNotification(count);
        });
        this.hubConnection.on(NOTIFICATION_ONLOAD, (count: number) => {
            this.displayNotification(count);
        });
        this.hubConnection.onclose((e) => {
            this.ifUnreadMessage.next(false);
            this.unReadMessages.next(0);
            // if connection wasn't closed properly we try to restart connection
            if (e !== undefined) {
                this.reconnect = true;
                this.restartConnection();
            }
        });
    }

    displayNotification(count: number) {
        if (count > 0) {
            this.ifUnreadMessage.next(true);
            this.unReadMessages.next(count);
        } else {
            this.ifUnreadMessage.next(false);
            this.unReadMessages.next(0);
        }
    }

    startConnection() {
        this.hubConnection
            .start()
            .then(() => {
                this.reconnect = false;
            })
            .catch(err => {
                this.errorHandler(err);
            });
    }

    stopConnection() {
        this.reconnect = false;
        this.hubConnection.stop();
    }

    private errorHandler(err: any) {
        if (err.statusCode === 401) {
            // if Unauthorized error we try to referesh our access token
            this.getNotifications(1, 1).subscribe(() => this.startConnection());
        } else {
            // if another error we try to restart connection
            this.reconnect = true;
            this.restartConnection();
        }
    }

    private restartConnection() {
        setTimeout(() => {
            if (this.reconnect) {
                this.startConnection();
            }
        }, RESTART_TIME);
    }
}
