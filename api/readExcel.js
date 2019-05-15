let tableData = [];
/*         let rowData = {
            category: "",
            level: "",
            count: "",
            condition: "",
            repairtime: "",
            explain: "",
            example: "",
            mark: ""
        }; */

let sheets = xlsx.parse(excelPath);


//第一种方法：循环读取所有sheets中的内容
sheets.forEach(function(sheet){
    console.log(`======sheet.name========`)
    console.log(sheet.name);
    for(let rowID in sheet['data']){
        console.log(`======rowID========`)
        console.log(rowID);
        let row = sheet['data'][rowID];
        console.log(row); 
    }
}); 

//第二种方法：读取第一张sheets中的内容
for (let rowID in sheets[0]['data']) {
    //let row = sheets[0]['data'][rowID];
    //console.log(row);
    let rowData = {};
    rowData.category = sheets[0]['data'][rowID][1];
    rowData.level = sheets[0]['data'][rowID][2];
    rowData.count = sheets[0]['data'][rowID][3];
    rowData.condition = sheets[0]['data'][rowID][4];
    rowData.repairtime = formatDate(sheets[0]['data'][rowID][5], '-');
    rowData.explain = sheets[0]['data'][rowID][6];
    rowData.example = sheets[0]['data'][rowID][7];
    rowData.mark = sheets[0]['data'][rowID][8];
    if (rowData.level)
        if (rowData.level.toLowerCase() == "critical" || rowData.level.toLowerCase() == "high" || rowData.level.toLowerCase() == "low") {
            console.log(rowData);
            // push方法实际上保存的是地址
            tableData.push(rowData);
        }

}
//console.log(tableData);
res.send(tableData);