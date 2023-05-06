import { _decorator, Component, Input, Node, Vec3 } from 'cc';
import Colyseus from 'db://colyseus-sdk/colyseus.js';
const { ccclass, property } = _decorator;


@ccclass('NetworkManager')
export class NetworkManager extends Component {

    @property({type: Node}) playerA: Node = null;
    @property({type: Node}) playerB: Node = null;

    @property hostname = "localhost";
    @property port = 2567;
    @property useSSL = false;

    client!: Colyseus.Client;
    room!: Colyseus.Room;

    start () {
        // Instantiate Colyseus Client
        // connects into (ws|wss)://hostname[:port]
        this.client = new Colyseus.Client(`${this.useSSL ? "wss" : "ws"}://${this.hostname}${([443, 80].includes(this.port) || this.useSSL) ? "" : `:${this.port}`}`);

        // // Connect into the room
        this.connect();

        // Move Node
        this.playerA.on(Input.EventType.TOUCH_MOVE, (touchMoveEvent)=>{
            let movePosition = touchMoveEvent.getUILocation();
            this.playerA.setWorldPosition(movePosition.x, movePosition.y, 0);
            this.sendMyUpdateToRoom("moveA", this.playerA.getWorldPosition());
        }, this);


        this.playerB.on(Input.EventType.TOUCH_MOVE, (touchMoveEvent)=>{
            let movePosition = touchMoveEvent.getUILocation();
            this.playerB.setWorldPosition(movePosition.x, movePosition.y, 0);
            this.sendMyUpdateToRoom("moveB", this.playerB.getWorldPosition());
        }, this);
    }

    async connect() {
        try {
            this.room = await this.client.joinOrCreate("my_room");

            console.log("joined successfully!");
            console.log("user's sessionId:", this.room.sessionId);

            this.room.state.playerA.onChange = (changes) => {
                
                let position = this.playerA.getWorldPosition();

                changes.forEach(change => {
                    const { field, value } = change;
                    switch (field) {
                        case 'x': {
                            position.x = value;
                            break;
                        }
                        case 'y': {
                            position.y = value;
                            break;
                        }
                    }
                });

                this.playerA.setWorldPosition(position);
            };

            this.room.state.playerB.onChange = (changes) => {
                
                let position = this.playerB.getWorldPosition();

                changes.forEach(change => {
                    const { field, value } = change;
                    switch (field) {
                        case 'x': {
                            position.x = value;
                            break;
                        }
                        case 'y': {
                            position.y = value;
                            break;
                        }
                    }
                });

                this.playerB.setWorldPosition(position);
            };


        } catch (e) {
            console.error("this is err: ", e);
        }
    }


    public sendMyUpdateToRoom(msg: string, position: Vec3) {
        this.room!.send(msg, {position});
        console.log("Sending My Update To Room!");
    }
}
