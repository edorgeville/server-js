import examples from "@open-rpc/examples";
import { parseOpenRPCDocument } from "@open-rpc/schema-utils-js";
import { Router } from "../router";
import fetch from "node-fetch";
import * as fs from "fs";
import { promisify } from "util";
import HTTPTransport from "./https";
const readFile = promisify(fs.readFile);
import https from "https";
import cors from "cors";
import { json as jsonParser } from "body-parser";
import { HandleFunction } from "connect";

const agent = new https.Agent({ rejectUnauthorized: false });

describe("https transport", () => {
  it("can start an https server that works", async () => {
    const simpleMathExample = await parseOpenRPCDocument(examples.simpleMath);

    const corsOptions = { origin: "*" } as cors.CorsOptions;

    const httpsTransport = new HTTPTransport({
      cert: await readFile(`${process.cwd()}/test-cert/server.cert`),
      key: await readFile(`${process.cwd()}/test-cert/server.key`),
      middleware: [
        cors(corsOptions) as HandleFunction,
        jsonParser(),
      ],
      port: 9697,
    });

    const router = new Router(simpleMathExample, { mockMode: true });

    httpsTransport.addRouter(router);

    httpsTransport.start();
    console.log("started");

    const { result } = await fetch("https://localhost:9697", {
      agent,
      body: JSON.stringify({
        id: "0",
        jsonrpc: "2.0",
        method: "addition",
        params: [2, 2],
      }),
      headers: { "Content-Type": "application/json" },
      method: "post",
    }).then((res) => res.json());

    expect(result).toBe(4);
  });
});
