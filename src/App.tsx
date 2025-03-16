import React, { useState } from 'react';
import Papa from 'papaparse';
import { parse as parseOfx } from 'ofx-js';
import * as XLSX from 'xlsx';

// Types pour les données CSV
interface CSVData {
  Date?: string;
  Description?: string;
  Amount?: string;
  DTPOSTED?: string;
  MEMO?: string;
  TRNAMT?: string;
  [key: string]: string | undefined; // Permet des colonnes supplémentaires
}

// Types pour les données mappées
interface MappedData {
  date: string;
  description: string;
  amount: string;
}

const App: React.FC = () => {
  const [data, setData] = useState<CSVData[]>([]); // Données brutes
  const [mappedData, setMappedData] = useState<MappedData[]>([]); // Données mappées
  const [fileName, setFileName] = useState<string>(''); // Nom du fichier
  const [error, setError] = useState<string>(''); // Message d'erreur

  // Gestion de l'import de fichier
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name); // Stocke le nom du fichier
      setError(''); // Réinitialise l'erreur
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string | ArrayBuffer;
        try {
          let parsedData: CSVData[] = [];

          // Gestion des formats de fichier
          if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
            parsedData = parseCsvFile(text as string);
          } else if (file.name.endsWith('.ofx')) {
            parsedData = await parseOfxFile(text as string);
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
            throw new Error('Unsupported file type');
          }

          if (parsedData.length === 0) {
            throw new Error('No data found in the file');
          }

          setData(parsedData);
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Failed to parse file');
          setData([]);
        }
      };

      if (file.type.includes('text') || file.name.endsWith('.json') || file.name.endsWith('.xml')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    }
  };

  // Parser pour les fichiers CSV
  const parseCsvFile = (text: string): CSVData[] => {
    const result = Papa.parse<CSVData>(text, {
      header: true, // Utilise la première ligne comme en-têtes
      skipEmptyLines: true, // Ignore les lignes vides
      delimiter: ',', // Séparateur personnalisé
      quoteChar: '"', // Caractère de guillemet
      dynamicTyping: true, // Convertit automatiquement les nombres
    });
  
    if (result.errors.length > 0) {
      console.error('CSV parsing errors:', result.errors); // Affiche les erreurs de parsing
      throw new Error('Invalid CSV format');
    }
  
    return result.data;
  };

  // Parser pour les fichiers OFX
  const parseOfxFile = async (text: string): Promise<CSVData[]> => {
    const ofxData = await parseOfx(text);
    if (!ofxData.OFX?.BANKMSGSRSV1?.STMTTRNRS?.STMTRS?.BANKTRANLIST?.STMTTRN) {
      throw new Error('Invalid OFX format');
    }
    return ofxData.OFX.BANKMSGSRSV1.STMTTRNRS.STMTRS.BANKTRANLIST.STMTTRN;
  };

  // Parser pour les fichiers JSON
  const parseJsonFile = (text: string): CSVData[] => {
    try {
      const jsonData = JSON.parse(text);
      if (!Array.isArray(jsonData)) {
        throw new Error('JSON file must contain an array of objects');
      }
      return jsonData;
    } catch (err) {
      throw new Error('Invalid JSON format');
    }
  };

  // Parser pour les fichiers XML
  const parseXmlFile = (text: string): CSVData[] => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const rows = xmlDoc.getElementsByTagName('row'); // Exemple de structure XML
    if (rows.length === 0) {
      throw new Error('Invalid XML format');
    }
    return Array.from(rows).map((row) => {
      const obj: CSVData = {};
      Array.from(row.children).forEach((child) => {
        obj[child.tagName] = child.textContent || '';
      });
      return obj;
    });
  };

  // Parser pour les fichiers Excel
  const parseExcelFile = async (buffer: ArrayBuffer): Promise<CSVData[]> => {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    return jsonData as CSVData[];
  };

  // Mappage des données
  const mapData = () => {
    const newData: MappedData[] = data.map((item) => ({
      date: item.DTPOSTED || item.Date || '',
      description: item.MEMO || item.Description || '',
      amount: item.TRNAMT || item.Amount || '',
    }));
    setMappedData(newData);
  };

  // Export des données en CSV
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

      {/* Bouton pour importer un fichier */}
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

      {/* Prévisualisation des données brutes */}
      {data.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Raw Data Preview</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(data[0]).map((key) => (
                    <th key={key} className="p-2 border border-gray-300">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.values(row).map((value, i) => (
                      <td key={i} className="p-2 border border-gray-300">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Boutons pour mapper et exporter les données */}
      <div className="flex gap-4 my-4">
        <button
          onClick={mapData}
          disabled={data.length === 0}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-blue-300"
        >
          Map Data
        </button>
        <button
          onClick={exportToCSV}
          disabled={mappedData.length === 0}
          className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-green-300"
        >
          Export to CSV
        </button>
      </div>

      {/* Affichage des données mappées */}
      {mappedData.length > 0 && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Mapped Data</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border border-gray-300">Date</th>
                  <th className="p-2 border border-gray-300">Description</th>
                  <th className="p-2 border border-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody>
                {mappedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="p-2 border border-gray-300">{row.date}</td>
                    <td className="p-2 border border-gray-300">{row.description}</td>
                    <td className="p-2 border border-gray-300">{row.amount}</td>
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
