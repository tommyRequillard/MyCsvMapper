declare module "papaparse" {
    export interface ParseResult<T> {
        data: T[];
        errors: any[];
        meta: any;
    }
    export function parse<T>(input: string, options?: any): ParseResult<T>;
    export function unparse(data: any[], options?: any): string; // Ajout de la méthode unparse
