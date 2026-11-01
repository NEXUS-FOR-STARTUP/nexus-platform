import openpyxl
from openpyxl.utils import get_column_letter as L
p='apps/web-1/public/templates/finance-template.xlsx'
wb=openpyxl.load_workbook(p)
ws=wb['Profit and Loss (P&L) Statement']
rows={str(ws.cell(r,1).value).strip():r for r in range(1,ws.max_row+1) if ws.cell(r,1).value}
rev=rows['Total Net Revenue']
cols=[c for c in range(2,ws.max_column+1) if ws.cell(4,c).value]
for c in cols:
    x=L(c)
    for r in list(range(5,8))+list(range(10,11))+list(range(15,27))+[31,32]:
        if ws.cell(r,c).value is None and not str(ws.cell(r,1).value or '').startswith(('Gross','Total')): ws.cell(r,c).value=0
    ws.cell(33,c).value=f'={x}31*{x}32'
    ws.cell(37,c).value=f'=IF({x}34>0,{x}34*20%,0)'
    for r,n in ((12,11),(29,28),(35,34)):
        ws.cell(r,c).value=f'=IF({x}{rev}=0,"",{x}{n}/{x}{rev})'
for n in ['Revenue','COGS','Expense','Valuation & Fuundraising']: del wb[n]
wb.save(p)
