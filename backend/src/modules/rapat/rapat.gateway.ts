import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/rapat',
})
export class RapatGateway {
  @WebSocketServer()
  server: Server;

  /** Admin joins a room for a specific rapat */
  @SubscribeMessage('join_rapat')
  handleJoin(
    @MessageBody() data: { rapatId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`rapat:${data.rapatId}`);
    return { event: 'joined', data: { rapatId: data.rapatId } };
  }

  /** Called by RapatService after successful attendance */
  emitNewAttendee(rapatId: string, attendee: any) {
    this.server.to(`rapat:${rapatId}`).emit('new_attendee', attendee);
  }

  /** Called when rapat status changes */
  emitStatusChange(rapatId: string, status: string) {
    this.server.to(`rapat:${rapatId}`).emit('status_changed', { status });
  }
}
