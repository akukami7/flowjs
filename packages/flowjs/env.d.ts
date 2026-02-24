declare module "@flowjs/server" {
    export function createDevServer(options: any): Promise<void>;
    export function createProdServer(options: any): Promise<void>;
}

declare module "@flowjs/build" {
    export function build(options: any): Promise<void>;
}
