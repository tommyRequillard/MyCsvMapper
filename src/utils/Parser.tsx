import Papa from 'papaparse';
import * as XLSX from 'xlsx';

interface CSVData {
    [key: string]: string | undefined;
}

export const parseCsvFile = (text: string): CSVData[] => {
    const result = Papa.parse<CSVData>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        transformHeader: (header) => {
            header = header.trim();
            if (!header) throw new Error('En-tête mal formaté dans le fichier CSV');
            return header;
        },
    });

    if (result.errors.length > 0) {
        throw new Error('Format CSV invalide');
    }

    if (result.data.length === 0) {
        throw new Error('Le fichier CSV ne contient aucune donnée valide');
    }

    return result.data;
};


export const parseOfxFile = async (text: string): Promise<CSVData[]> => {
    try {
        // Convertir SGML en XML (en fermant uniquement les balises nécessaires)
        const xmlText = convertSgmlToXml(text);
        console.log('Contenu converti en XML :', xmlText);

        // Parser le XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        // Extraire les transactions
        const transactions = xmlDoc.getElementsByTagName('STMTTRN');
        if (transactions.length === 0) {
            throw new Error('Aucune transaction trouvée dans le fichier OFX');
        }

        return Array.from(transactions).map((transaction) => {
            const obj: Record<string, string> = {};
            Array.from(transaction.children).forEach((child) => {
                if (child.textContent) {
                    obj[child.tagName] = child.textContent.trim();
                }
            });
            return obj;
        });
    } catch (error) {
        throw new Error(`Erreur lors du parsing du fichier OFX : ${error.message}`);
    }
};

const convertSgmlToXml = (text: string): string => {
    // Trouver le début de la section XML/SGML (à partir de <OFX>)
    const ofxStartIndex = text.indexOf('<OFX>');
    if (ofxStartIndex === -1) {
        throw new Error('Balise <OFX> non trouvée dans le fichier.');
    }

    // Extraire la partie XML/SGML
    let xmlPart = text.slice(ofxStartIndex);

    // Expression régulière pour détecter les balises non fermées
    const regex = /<(\w+)([^>]*)>([^<]+)(?!<\/\1>)/g;

    // Fonction pour fermer les balises non fermées une seule fois
    const processTags = (input: string): string => {
        return input.replace(regex, (match, tagName, attributes, content) => {
            // Vérifier si la balise est déjà fermée
            const closingTag = `</${tagName}>`;
            if (input.includes(closingTag)) {
                return match; // La balise est déjà fermée, on ne fait rien
            }
            // Si la balise n'est pas déjà fermée, on la ferme
            return `<${tagName}${attributes}>${content}${closingTag}`;
        });
    };

    // Appliquer la fonction une seule fois (pas besoin de boucle)
    return processTags(xmlPart);
};



export const extractOfxTransactions = (xmlText: string): CSVData[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    const transactions = xmlDoc.getElementsByTagName('STMTTRN');
    if (transactions.length === 0) {
        throw new Error('Aucune transaction trouvée dans le fichier OFX');
    }

    return Array.from(transactions).map((transaction) => {
        const obj: Record<string, string> = {};
        Array.from(transaction.children).forEach((child) => {
            if (child.textContent) {
                obj[child.tagName] = child.textContent.trim();
            }
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
