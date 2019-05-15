import cors from "cors";
import { json as jsonParser } from "body-parser";
import connect, { HandleFunction } from "connect";
import http2, { ServerOptions, Http2SecureServer, SecureServerOptions } from "http2";
import ServerTransport from "./server-transport";
import { IncomingMessage } from "http";
import WebSocket from "ws";
import { Server } from "https";
import * as ipc from "node-ipc";
import _ from "lodash";

export type TIPCServerTransportOptions = { id: string; port: number; udp: boolean; ipv6: boolean; }; //tslint:disable-line

type UdpType = "udp4" | "udp6" | undefined;

export default class IPCServerTransport extends ServerTransport {
  private server: any;

  constructor(private options: TIPCServerTransportOptions) {
    super();

    const udpOption = (options.udp) ? `udp${(options.ipv6) ? "6" : "4"}` : undefined;
    ipc.config.id = options.id;
    ipc.config.logger = () => { _.noop(); };

    ipc.serveNet(
      undefined,
      options.port as number,
      udpOption as UdpType,
      () => {
        ipc.server.on("message", (data, socket) => {
          const req = JSON.parse(data);

          this.ipcRouterHandler(req, (result: string) => {
            ipc.server.emit(
              socket,
              "message",
              result,
            );
          });
        });
      },
    );

    this.server = ipc.server;
  }

  public start() {
    this.server.start(this.options.port);
  }

  private async ipcRouterHandler(req: any, respondWith: any) {
    const result = await super.routerHandler(req.id, req.method, req.params);
    respondWith(JSON.stringify(result));
  }
}
