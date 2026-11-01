import ExcelJS from "exceljs";
const wb=new ExcelJS.Workbook(); await wb.xlsx.readFile("../../tmp/orig.xlsx");
const c=wb.worksheets[0]!.getCell("B33"); console.log(JSON.stringify(c.value), c.type);
