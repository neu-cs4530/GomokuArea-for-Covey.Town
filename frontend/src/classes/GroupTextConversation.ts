import { nanoid } from 'nanoid';
import { ChatRoomMessage } from '../types/CoveyTownSocket';
import TownController from './TownController';

// Assuming ChatMessage now includes a roomID
type MessageCallback = (message: ChatRoomMessage) => void;

export default class GroupTextConversation {
  private _coveyTownController: TownController;
  private _callbacks: Record<string, MessageCallback[]> = {};
  private _authorName: string;

  public constructor(coveyTownController: TownController) {
    this._coveyTownController = coveyTownController;
    this._authorName = coveyTownController.userName;
    this._coveyTownController.addListener('ChatRoomMessage', (message: ChatRoomMessage) => {
      message.dateCreated = new Date(message.dateCreated);
      this._onChatRoomMessage(message);
    });
  }

  private _onChatRoomMessage(message: ChatRoomMessage) {
    // Assuming message includes roomID
    const callbacks = this._callbacks[message.roomID];
    if (callbacks) {
      callbacks.forEach(cb => cb(message));
    }
  }

  public sendMessage(roomID: string, message: string) {
    const msg: ChatRoomMessage = {
      sid: nanoid(),
      body: message,
      author: this._authorName,
      dateCreated: new Date(),
      roomID, // Include roomID in the message
    };
    this._coveyTownController.emitChatMessage(msg);
  }

  public onMessageAdded(roomID: string, cb: MessageCallback) {
    if (!this._callbacks[roomID]) {
      this._callbacks[roomID] = [];
    }
    this._callbacks[roomID].push(cb);
  }

  public offMessageAdded(roomID: string, cb: MessageCallback) {
    this._callbacks[roomID] = this._callbacks[roomID].filter(_cb => _cb !== cb);
  }

  public close(): void {
    this._coveyTownController.removeAllListeners('chatMessage');
  }
}
