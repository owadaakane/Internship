import { Buffer } from 'buffer';

export class IDToken {
    static from(raw: string): IDToken {
        const splitted = raw.split(".");
        if (splitted.length !== 3) { 
            throw new Error("Invalid IDToken.");
        }

        const decode = (part: string) => {
            const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
            const decoded = Buffer.from(base64, 'base64').toString('utf8');
            try {
                return JSON.parse(decoded);
            } catch (e) {
                throw new Error("Invalid IDToken.");
            }
        }

        return new IDToken(
            decode(splitted[0] || ''),
            decode(splitted[1] || ''),
            splitted[2] || '',
            raw,
        );
    }

    static create(header: Header, payload: Payload, signature: Signature): IDToken {
        return new IDToken(
            header, 
            payload, 
            signature, 
            `${Buffer.from(JSON.stringify(header)).toString('base64')}.${Buffer.from(JSON.stringify(payload)).toString('base64')}.${signature}`
        );
    }

    get expired(): boolean {
        const expEpocMillis = this.payload.exp * 1000;
        return expEpocMillis <= Date.now();
    }

    readonly raw: string;
    readonly header: Header;
    readonly payload: Payload;
    readonly signature: Signature;

    private constructor(header: Header, payload: Payload, signature: Signature, raw: string) {
        this.payload = payload;
        this.header = header;
        this.signature = signature;
        this.raw = raw;
    }
}

export interface Header {
    readonly alg: string;
    readonly kid: string;
}

export interface Payload {
    readonly jti: string;
    readonly iss: string;
    readonly sub: string;
    readonly aud: string;
    readonly exp: number;
    readonly iat: number;
    readonly auth_time: number;
    readonly nonce?: string;
}

export type Signature = string;
