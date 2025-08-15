/**
 * Configuration management for Gemini-Gmail Bridge
 */
import { AppConfig, GeminiConfig, MCPConfig } from '../types';
declare class Config {
    private config;
    constructor();
    private loadConfig;
    getConfig(): AppConfig;
    getGeminiConfig(): GeminiConfig;
    getMCPConfig(): MCPConfig;
    isDebug(): boolean;
    getLogLevel(): string;
    validate(): boolean;
    printConfig(): void;
}
export declare const config: Config;
export {};
//# sourceMappingURL=index.d.ts.map