import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { app } from 'electron';
import { WebSocketServer, type WebSocket } from 'ws';
import { sendAgentLog } from './index';

const DEFAULT_PORT = 17777;
const STATE_FILE = 'extension-bridge.json';

export type BridgeStatus = {
    port: number;
    deviceId: string;
    pairCode: string;
    paired: boolean;
    connectedExtensions: number;
    lastSeenAt?: number | null;
};

type BridgeState = {
    deviceId: string;
    pairCode: string;
    token?: string;
    pairedAt?: number;
    lastSeenAt?: number;
};

type BridgeClient = {
    id: string;
    socket: WebSocket;
    authed: boolean;
    extensionId?: string;
};

type PendingRpc = {
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    timeout: NodeJS.Timeout;
};

function generateId(length = 16): string {
    return randomBytes(length).toString('hex');
}

function generatePairCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function loadState(storagePath: string): BridgeState {
    try {
        if (existsSync(storagePath)) {
            const raw = readFileSync(storagePath, 'utf-8');
            const parsed = JSON.parse(raw) as BridgeState;
            if (parsed.deviceId && parsed.pairCode) {
                return parsed;
            }
        }
    } catch (error) {
        console.warn('[ExtensionBridge] Failed to load state:', error);
    }

    return {
        deviceId: generateId(12),
        pairCode: generatePairCode(),
    };
}

function saveState(storagePath: string, state: BridgeState) {
    try {
        const dir = dirname(storagePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        writeFileSync(storagePath, JSON.stringify(state, null, 2));
    } catch (error) {
        console.warn('[ExtensionBridge] Failed to save state:', error);
    }
}

function parseJsonBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk.toString('utf-8');
        });
        req.on('end', () => {
            if (!data) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(data));
            } catch (error) {
                reject(error);
            }
        });
    });
}

export class ExtensionBridge {
    private server?: http.Server;
    private wss?: WebSocketServer;
    private clients = new Map<string, BridgeClient>();
    private pendingRpcs = new Map<string, PendingRpc>();
    private state: BridgeState;
    private port: number;
    private storagePath: string;

    constructor() {
        this.port = Number(process.env.ANORHA_EXTENSION_BRIDGE_PORT || DEFAULT_PORT);
        this.storagePath = '';
        this.state = {
            deviceId: generateId(12),
            pairCode: generatePairCode(),
        };
    }

    start() {
        if (this.server) return;

        if (!this.storagePath) {
            this.storagePath = join(app.getPath('userData'), STATE_FILE);
            this.state = loadState(this.storagePath);
            saveState(this.storagePath, this.state);
        }

        this.server = http.createServer((req, res) => {
            this.handleHttp(req, res).catch((error) => {
                console.error('[ExtensionBridge] HTTP error:', error);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'internal_error' }));
            });
        });

        this.wss = new WebSocketServer({ server: this.server, path: '/ws' });
        this.wss.on('connection', (socket) => this.handleSocket(socket));

        this.server.listen(this.port, '127.0.0.1', () => {
            console.log(`[ExtensionBridge] Listening on http://127.0.0.1:${this.port}`);
            sendAgentLog(`[ExtensionBridge] Listening on 127.0.0.1:${this.port}`, 'success');
        });
    }

    getStatus(): BridgeStatus {
        return {
            port: this.port,
            deviceId: this.state.deviceId,
            pairCode: this.state.pairCode,
            paired: Boolean(this.state.token),
            connectedExtensions: [...this.clients.values()].filter((c) => c.authed).length,
            lastSeenAt: this.state.lastSeenAt ?? null,
        };
    }

    rotatePairCode(): BridgeStatus {
        this.state.pairCode = generatePairCode();
        saveState(this.storagePath, this.state);
        return this.getStatus();
    }

    unpair(): BridgeStatus {
        this.state.token = undefined;
        this.state.pairedAt = undefined;
        this.state.lastSeenAt = undefined;
        this.rotatePairCode();
        this.clients.forEach((client) => {
            try {
                client.socket.close(4001, 'unpaired');
            } catch (error) {
                console.warn('[ExtensionBridge] Failed to close socket:', error);
            }
        });
        return this.getStatus();
    }

    async sendRpc<T = any>(method: string, params: any): Promise<T> {
        const client = [...this.clients.values()].find((c) => c.authed);
        if (!client) {
            throw new Error('No paired extension connected. Open the extension and pair first.');
        }

        const rpcId = generateId(8);
        const payload = JSON.stringify({
            type: 'rpc',
            id: rpcId,
            method,
            params,
        });

        return new Promise<T>((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRpcs.delete(rpcId);
                reject(new Error(`Extension RPC timeout for ${method}`));
            }, 15_000);

            this.pendingRpcs.set(rpcId, { resolve, reject, timeout });

            try {
                client.socket.send(payload);
            } catch (error) {
                clearTimeout(timeout);
                this.pendingRpcs.delete(rpcId);
                reject(error);
            }
        });
    }

    private async handleHttp(req: http.IncomingMessage, res: http.ServerResponse) {
        if (!req.url) {
            res.writeHead(404);
            res.end();
            return;
        }

        const url = new URL(req.url, `http://127.0.0.1:${this.port}`);
        if (req.method === 'GET' && url.pathname === '/status') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(this.getStatus()));
            return;
        }

        if (req.method === 'POST' && url.pathname === '/pair') {
            const body = await parseJsonBody(req);
            if (!body?.code || String(body.code) !== this.state.pairCode) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'invalid_code' }));
                return;
            }

            if (!this.state.token) {
                this.state.token = generateId(24);
                this.state.pairedAt = Date.now();
            }

            this.state.lastSeenAt = Date.now();
            saveState(this.storagePath, this.state);

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    token: this.state.token,
                    deviceId: this.state.deviceId,
                    pairedAt: this.state.pairedAt,
                })
            );
            return;
        }

        if (req.method === 'POST' && url.pathname === '/unpair') {
            const authHeader = req.headers.authorization || '';
            if (!this.state.token || authHeader !== `Bearer ${this.state.token}`) {
                res.writeHead(401, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'unauthorized' }));
                return;
            }
            const status = this.unpair();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(status));
            return;
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'not_found' }));
    }

    private handleSocket(socket: WebSocket) {
        const clientId = generateId(8);
        const client: BridgeClient = {
            id: clientId,
            socket,
            authed: false,
        };
        this.clients.set(clientId, client);

        socket.on('message', (raw) => {
            try {
                const message = JSON.parse(raw.toString());
                this.handleSocketMessage(client, message);
            } catch (error) {
                console.warn('[ExtensionBridge] Invalid socket message:', error);
            }
        });

        socket.on('close', () => {
            this.clients.delete(clientId);
        });
    }

    private handleSocketMessage(client: BridgeClient, message: any) {
        if (!message?.type) return;

        if (message.type === 'hello') {
            const token = message.token as string | undefined;
            if (token && this.state.token && token === this.state.token) {
                client.authed = true;
                client.extensionId = message.extensionId;
                this.state.lastSeenAt = Date.now();
                saveState(this.storagePath, this.state);
            }

            client.socket.send(
                JSON.stringify({
                    type: 'status',
                    payload: this.getStatus(),
                    authed: client.authed,
                })
            );
            return;
        }

        if (message.type === 'pair_request') {
            if (String(message.code) !== this.state.pairCode) {
                client.socket.send(JSON.stringify({ type: 'pair_result', ok: false }));
                return;
            }

            if (!this.state.token) {
                this.state.token = generateId(24);
                this.state.pairedAt = Date.now();
            }

            this.state.lastSeenAt = Date.now();
            saveState(this.storagePath, this.state);

            client.authed = true;
            client.extensionId = message.extensionId;

            client.socket.send(
                JSON.stringify({
                    type: 'pair_result',
                    ok: true,
                    token: this.state.token,
                    deviceId: this.state.deviceId,
                })
            );
            return;
        }

        if (message.type === 'rpc_response') {
            const pending = this.pendingRpcs.get(message.id);
            if (!pending) return;
            clearTimeout(pending.timeout);
            this.pendingRpcs.delete(message.id);
            if (message.error) {
                pending.reject(new Error(message.error));
            } else {
                pending.resolve(message.result);
            }
        }
    }
}

export const extensionBridge = new ExtensionBridge();
