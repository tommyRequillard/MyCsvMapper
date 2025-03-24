import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import ColumnMapper from './components/ColumnMapper';

interface CSVData {
  [key: string]: string | undefined;
}

type MappedRow = Record<string, string>;

const App: React.FC = () => {
  const [data, setData] = useState<CSVData[]>([]);
  const [mappedData, setMappedData] = useState<MappedRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const mappedDataRef = useRef<HTMLDivElement>(null);

  const resetFields = () => {
    setData([]);
    setMappedData([]);
    setFileName('');
    setError('');
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
  
    resetFields();
    setFileName(file.name);
    setError('');
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string | ArrayBuffer;
  
        let parsedData: CSVData[] = [];
        if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
          parsedData = parseCsvFile(text as string);
        } else if (file.name.endsWith('.ofx')) {
          parsedData = await parseOfxFile(text); // Utiliser le parser personnalisé
        } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
          parsedData = parseJsonFile(text as string);
        } else if (file.type === 'text/xml' || file.name.endsWith('.xml')) {
          parsedData = parseXmlFile(text as string);
        } else if (
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.xlsx')
        ) {
          parsedData = await parseExcelFile(text as ArrayBuffer);
        } else {
          throw new Error('Type de fichier non supporté');
        }
  
        if (parsedData.length === 0) {
          throw new Error('Aucune donnée trouvée dans le fichier');
        }
  
        setData(parsedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors de l\'import du fichier');
        setData([]);
      }
    };
  
    // Toujours lire le fichier en texte brut pour les formats OFX
    if (file.name.endsWith('.ofx') || file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.xml')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file); // Pour Excel et autres formats binaires
    }
  };
  

  const parseCsvFile = (text: string): CSVData[] => {
    const result = Papa.parse<CSVData>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: ',',
      quoteChar: '"',
      dynamicTyping: true,
    });
    if (result.errors.length > 0) {
      console.error('Erreurs lors de l\'analyse CSV :', result.errors);
      throw new Error('Format CSV invalide');
    }
    return result.data;
  };

  const parseOfxFile = async (fileContent: string | ArrayBuffer): Promise<CSVData[]> => {
    try {
      // Convertir le fichier en texte brut si nécessaire
      const text = fileContent instanceof ArrayBuffer ? new TextDecoder().decode(fileContent) : fileContent;
  
      // Convertir SGML en XML si nécessaire
      const xmlText = isXml(text) ? text : convertSgmlToXml(text);
  
      // Extraire les transactions du fichier OFX
      const transactions = extractOfxTransactions(xmlText);
      if (transactions.length === 0) {
        throw new Error('Aucune transaction trouvée dans le fichier OFX');
      }
  
      // Convertir les transactions en tableau d'objets
      return transactions.map((transaction) => ({
        Date: transaction.DTPOSTED || '',
        Type: transaction.TRNTYPE || '',
        Amount: transaction.TRNAMT || '',
        Description: transaction.NAME || '',
        ID: transaction.FITID || '',
      }));
    } catch (err) {
      throw new Error('Erreur lors du parsing du fichier OFX : ' + (err instanceof Error ? err.message : 'Format invalide'));
    }
  };
  
  const extractOfxTransactions = (xmlText: string): Array<Record<string, string>> => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
    // Trouver les transactions
    const transactions = xmlDoc.getElementsByTagName('STMTTRN');
    if (transactions.length === 0) {
      throw new Error('Aucune transaction trouvée dans le fichier OFX');
    }
  
    // Convertir les transactions en tableau d'objets
    return Array.from(transactions).map((transaction) => {
      const obj: Record<string, string> = {};
      Array.from(transaction.children).forEach((child) => {
        obj[child.tagName] = child.textContent || '';
      });
      return obj;
    });
  };
  
  // Vérifier si le texte est déjà en XML
  const isXml = (text: string): boolean => /<\w+>[^<]+<\/\w+>/.test(text);
  
  // Convertir SGML en XML
  const convertSgmlToXml = (text: string): string => {
    return text
      .replace(/(<\w+>)([^<]+)/g, '$1$2</$1>') // Fermer les balises
      .replace(/<\/\w+>/g, '$&'); // Supprimer les doublons
  };

  const parseJsonFile = (text: string): CSVData[] => {
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

  const parseXmlFile = (text: string): CSVData[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('row');
    if (rows.length === 0) {
      throw new Error('Format XML invalide');
    }
    return Array.from(rows).map((row) => {
      const obj: CSVData = {};
      Array.from(row.children).forEach((child) => {
        obj[child.tagName] = child.textContent || '';
      });
      return obj;
    });
  };

  const parseExcelFile = async (buffer: ArrayBuffer): Promise<CSVData[]> => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData as CSVData[];
  };

  const handleMappingComplete = (mapping: Record<string, string>) => {
    const newData = data.map((item) => {
      const mappedRow: MappedRow = {};
      for (const customColumn in mapping) {
        mappedRow[customColumn] = item[mapping[customColumn]] || '';
      }
      return mappedRow;
    });
    setMappedData(newData);
  
    if (mappedDataRef.current) {
      mappedDataRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const exportToCSV = () => {
    const csv = Papa.unparse(mappedData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mapped_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-center text-blue-500">CSV Mapper</h1>

      <div className="flex flex-col gap-4 mb-4">
        <label className="bg-purple-500 text-white px-4 py-2 rounded text-center cursor-pointer">
          Import File
          <input
            type="file"
            accept=".csv,.ofx,.json,.xml,.xlsx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        {fileName && <p className="text-center">File selected: {fileName}</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>

      {data.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Aperçu des 3 premières lignes (Données brutes)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="p-2 border border-gray-300">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.slice(0, 3).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2 border border-gray-300">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length > 0 && (
        <ColumnMapper
          csvColumns={Object.keys(data[0])}
          onMappingComplete={handleMappingComplete}
          resetTrigger={data.length > 0 && mappedData.length === 0}
        />
      )}

      {mappedData.length > 0 && (
        <div ref={mappedDataRef}>
          <h2 className="text-xl font-bold mb-2">Aperçu des 3 premières lignes (Données mappées)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(mappedData[0]).map((column) => (
                    <th key={column} className="p-2 border border-gray-300">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappedData.slice(0,3).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2 border border-gray-300">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
