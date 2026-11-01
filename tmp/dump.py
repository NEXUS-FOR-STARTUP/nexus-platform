import openpyxl,sys
p=sys.argv[1]
wb=openpyxl.load_workbook(p); wv=openpyxl.load_workbook(p,data_only=True)
print(wb.sheetnames)
for ws in wb:
    if ws.max_row<5: continue
    print('==',ws.title,ws.dimensions)
    for r in ws.iter_rows():
        for c in r:
            if c.value is not None: print(c.coordinate,repr(c.value),'|',repr(wv[ws.title][c.coordinate].value))
