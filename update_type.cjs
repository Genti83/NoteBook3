const fs = require('fs');
let code = fs.readFileSync('src/components/Notepad.tsx', 'utf8');

const targetType = `type GridDocument = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  headers: string[];
  columnWidths?: number[];
  rows: GridRow[];
};`;

const replacementType = `type GridDocument = {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  headers: string[];
  columnWidths?: number[];
  rows: GridRow[];
  tags?: string[];
};`;

code = code.replace(targetType, replacementType);
fs.writeFileSync('src/components/Notepad.tsx', code);
