import {zipSync,strToU8} from 'fflate';
const ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const col=n=>String.fromCharCode(64+n);
const escape=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
export function workbook({rowOffset=0,columnOffset=0,extra={},changeSheet=xml=>xml,zipOptions={}}={}){
 const data=[['Account','Kind','Hierarchy','Original','Revised','Actuals','Open POs','ETC','EFC'],['1100','detail','1000/1100','100.00','110.00','55.25','10.00','44.75','110.00'],['1200','detail','1000/1200','50.00','45.00','-5.25','5.00','45.25','45.00'],['','total','','150.00','155.00','50.00','15.00','90.00','155.00']];
 const sheet=`<worksheet xmlns="${ns}"><dimension ref="${col(columnOffset+1)}${rowOffset+1}:${col(columnOffset+9)}${rowOffset+4}"/><sheetData>${data.map((row,i)=>`<row r="${i+rowOffset+1}">${row.map((value,j)=>`<c r="${col(j+columnOffset+1)}${i+rowOffset+1}"${i&&j>2?'':' t="inlineStr"'}>${i&&j>2?`<v>${value}</v>`:`<is><t>${escape(value)}</t></is>`}</c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
 const files={
  '[Content_Types].xml':'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
  '_rels/.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
  'xl/workbook.xml':`<workbook xmlns="${ns}" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Synthetic costs" sheetId="1" r:id="rId1"/></sheets></workbook>`,
  'xl/_rels/workbook.xml.rels':'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
  'xl/worksheets/sheet1.xml':changeSheet(sheet),...extra};
 return Buffer.from(zipSync(Object.fromEntries(Object.entries(files).map(([path,text])=>[path,strToU8(text)])),zipOptions));
}
