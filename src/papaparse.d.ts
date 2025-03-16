declare module "papaparse" {
    export interface ParseResult<T> {
        data: T[];
        errors: any[];
        meta: any;
    }
    export function parse<T>(input: string, options?: any): ParseResult<T>;
    // Ajoutez d'autres méthodes ou types nécessaires ici
}
