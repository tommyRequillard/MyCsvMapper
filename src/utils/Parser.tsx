import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CSVData {
    [key: string]: string | undefined;
}

export const parseCsvFile = (text: string): CSVData[] => {
    const result = Papa.parse<CSVData>(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: ',',
        quoteChar: '"',
        dynamicTyping: true,
    });
    if (result.errors.length > 0) {
        throw new Error('Format CSV invalide');
    }
    return result.data;
};

export const parseOfxFile = async (fileContent: string): Promise<CSVData[]> => {
    try {
        // Convertir SGML en XML si nécessaire
        const xmlText = isXml(fileContent) ? fileContent : convertSgmlToXml(fileContent);

        // Extraire les transactions du fichier OFX
        const transactions = extractOfxTransactions(xmlText);
        if (transactions.length === 0) {
            throw new Error('Aucune transaction trouvée dans le fichier OFX');
        }

        return transactions;
    } catch (err) {
        throw new Error('Erreur lors du parsing du fichier OFX');
    }
};

const isXml = (text: string): boolean => /<\w+>[^<]+<\/\w+>/.test(text);

const convertSgmlToXml = (text: string): string => {
    return text
        .replace(/(<\w+>)([^<]+)/g, '$1$2</$1>')
        .replace(/<\/\w+>/g, '$&');
};

const extractOfxTransactions = (xmlText: string): CSVData[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const transactions = xmlDoc.getElementsByTagName('STMTTRN');
    if (transactions.length === 0) {
        throw new Error('Aucune transaction trouvée dans le fichier OFX');
    }

    return Array.from(transactions).map((transaction) => {
        const obj: Record<string, string> = {};
        Array.from(transaction.children).forEach((child) => {
            obj[child.tagName] = child.textContent || '';
        });
        return obj;
    });
};

export const parseJsonFile = (text: string): CSVData[] => {
    try {
        const jsonData = JSON.parse(text);
        if (!Array.isArray(jsonData)) {
            throw new Error('Le fichier JSON doit contenir un tableau d\'objets');
        }
        return jsonData;
    } catch (err) {
        throw new Error('Format JSON invalide');
    }
};

export const parseXmlFile = (text: string): CSVData[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('row');
    if (rows.length === 0) {
        throw new Error('Format XML invalide');
    }
    return Array.from(rows).map((row) => {
        const obj: Record<string, string> = {};
        Array.from(row.children).forEach((child) => {
            obj[child.tagName] = child.textContent || '';
        });
        return obj;
    });
};

export const parseExcelFile = async (buffer: ArrayBuffer): Promise<CSVData[]> => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData as CSVData[];
};
