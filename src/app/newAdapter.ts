import {
  ChatAdapter,
  IChatGroupAdapter,
  User,
  Group,
  Message,
  ChatParticipantStatus,
  ParticipantResponse,
  ParticipantMetadata,
  ChatParticipantType,
  IChatParticipant,
} from 'ng-chat';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import * as signalR from '@aspnet/signalr';

export class SignalRAdapter extends ChatAdapter {
  public userId: string;
  public accessToken = localStorage.getItem('accesToken');

  private hubConnection: signalR.HubConnection;
  public static serverBaseUrl: string = 'http://192.168.1.56:7825/'; // Set this to 'https://localhost:5001/' if running locally

  constructor(private username: string, private http: HttpClient) {
    super();

    this.initializeConnection();
  }

  public initializeConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${SignalRAdapter.serverBaseUrl}chatHub`, {
        accessTokenFactory: () => this.accessToken,
      })
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('befor intializeListner');
        this.initializeListeners();
      })
      .catch((err) =>
        console.log(`Error while starting SignalR connection: ${err}`)
      );
  }

  private initializeListeners(): void {
    // this.hubConnection.on("generatedUserId", (userId) => {
    //   // With the userId set the chat will be rendered
    //   this.userId = userId;
    // });

    this.hubConnection.on('messageReceived', (participantId, msg) => {
      // Handle the received message to ng-chat
      let participant = {
        participantType: ChatParticipantType.User,
        id: participantId,
        displayName: '',
        avatar:
          'https://pbs.twimg.com/profile_images/3456602315/aad436e6fab77ef4098c7a5b86cac8e3.jpeg',
        status: ChatParticipantStatus.Busy,
      };
      let {
        author: fromId,
        body: message,
        correspondant: toId,
        time: dateSent,
      } = msg;
      this.onMessageReceived(participant, { fromId, message, toId, dateSent });
      console.log('message received ', message);
      console.log('message participant ', participant);
    });
    // this.hubConnection.on(
    //   'friendsListChanged',
    //   (participantsResponse: Array<ParticipantResponse>) => {
    //     // Handle the received response to ng-chat
    //     this.onFriendsListChanged(
    //       participantsResponse.filter((x) => x.participant.id != this.userId)
    //     );
    //   }
    // );
  }

  // joinRoom(): void {
  //   if (this.hubConnection && this.hubConnection.state == signalR.HubConnectionState.Connected) {
  //     this.hubConnection.send("join", this.username);
  //   }
  // }

  listFriends(): Observable<any> {
    // List connected users to show in the friends list
    // Sending the userId from the request body as this is just a demo
    return this.http
      .get(`${SignalRAdapter.serverBaseUrl}api/app/chat/myContact`)
      .pipe(
        map((res: any) => {
          let users = res.items;
          let participantResponses: ParticipantResponse[] = [];
          users.forEach((user) => {
            let participant = {
              participantType: ChatParticipantType.User,
              id: user.id,
              displayName: user.value,
              avatar:
                'https://pbs.twimg.com/profile_images/3456602315/aad436e6fab77ef4098c7a5b86cac8e3.jpeg',
              status: ChatParticipantStatus.Busy,
            };
            let participantResponse = new ParticipantResponse();

            participantResponse.participant = participant;
            participantResponse.metadata = {
              totalUnreadMessages: Math.floor(Math.random() * 10),
            };
            participantResponses.push(participantResponse);
          });
          console.log('participantResponses', participantResponses);
          return participantResponses;
        }),
        catchError((error: any) =>
          Observable.throw(error.error || 'Server error')
        )
      );
  }

  getMessageHistory(destinataryId: any): Observable<Message[]> {
    // This could be an API call to your web application that would go to the database
    // and retrieve a N amount of history messages between the users.
    return this.http
      .get(
        `${SignalRAdapter.serverBaseUrl}api/app/chat/getMessageHistory/${destinataryId}`
      )
      .pipe(
        map((res: any) => {
          let messages: Message[] = [];
          res.items.forEach((element) => {
            let message = {
              fromId: element.author,
              toId: element.correspondant,
              message: element.body,
              dateSent: new Date(element.time),
            };
            messages.push(message);
          });
          messages.reverse();
          return messages;
        }),
        catchError((error: any) =>
          Observable.throw(error.error || 'Server error')
        )
      );
  }
  // && this.hubConnection.state == signalR.HubConnectionState.Connected
  sendMessage(message: Message): void {
    let newMessage = {
      body: message.message,
      correspondantId: message.toId,
    };

    if (this.hubConnection) {
      console.log('condition is true');

      this.hubConnection.invoke('sendMessage', newMessage);
    }
  }
}
