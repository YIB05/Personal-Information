const ColorThief = require('colorthief');
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

const EXPORT_DIR = 'E:/11照片/2026花盆/导出';
const BRIDGE_FILE = 'E:/11照片/2026花盆/导出/.BridgeSort';
const OUTPUT_FILE = 'E:/11照片/2026花盆/2026伟达花盆产品图_新版.xlsx';
const JSON_OUTPUT = 'E:/11照片/2026花盆/analysis_results.json';

// Color name mapping
const COLOR_MAP = [
  { name: '白色', r: 255, g: 255, b: 255 },
  { name: '米白色', r: 245, g: 240, b: 230 },
  { name: '浅灰', r: 200, g: 200, b: 200 },
  { name: '灰色', r: 128, g: 128, b: 128 },
  { name: '深灰', r: 80, g: 80, b: 80 },
  { name: '黑色', r: 30, g: 30, b: 30 },
  { name: '浅棕', r: 210, g: 180, b: 140 },
  { name: '棕色', r: 150, g: 110, b: 70 },
  { name: '深棕', r: 100, g: 60, b: 30 },
  { name: '咖啡色', r: 140, g: 100, b: 60 },
  { name: '米色', r: 230, g: 215, b: 180 },
  { name: '浅蓝', r: 173, g: 216, b: 230 },
  { name: '蓝色', r: 70, g: 130, b: 180 },
  { name: '深蓝', r: 30, g: 60, b: 120 },
  { name: '绿色', r: 80, g: 160, b: 80 },
  { name: '深绿', r: 30, g: 100, b: 50 },
  { name: '浅绿', r: 150, g: 210, b: 150 },
  { name: '橄榄绿', r: 128, g: 128, b: 0 },
  { name: '卡其色', r: 195, g: 176, b: 145 },
  { name: '军绿色', r: 85, g: 107, b: 47 },
  { name: '浅黄', r: 255, g: 255, b: 200 },
  { name: '黄色', r: 255, g: 220, b: 60 },
  { name: '红色', r: 200, g: 50, b: 50 },
  { name: '暗红', r: 140, g: 40, b: 40 },
  { name: '粉色', r: 255, g: 180, b: 190 },
  { name: '橙色', r: 255, g: 140, b: 40 },
  { name: '陶土色', r: 200, g: 120, b: 80 },
  { name: '砖红色', r: 178, g: 80, b: 50 },
  { name: '暖灰色', r: 160, g: 150, b: 140 },
  { name: '水泥灰', r: 180, g: 180, b: 180 },
  { name: '象牙白', r: 250, g: 245, b: 235 },
  { name: '淡绿', r: 180, g: 200, b: 170 },
  { name: '蓝灰', r: 120, g: 140, b: 160 },
  { name: '青灰色', r: 140, g: 160, b: 150 },
  { name: '灰绿', r: 140, g: 160, b: 130 },
  { name: '灰蓝', r: 110, g: 130, b: 155 },
  { name: '墨绿', r: 40, g: 80, b: 40 },
  { name: '杏色', r: 240, g: 210, b: 180 },
  { name: '驼色', r: 190, g: 150, b: 110 },
];

function colorDistance(c1, c2) {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(2 * dr * dr + 4 * dg * dg + 3 * db * db);
}

function rgbToName(r, g, b) {
  let bestName = '其他';
  let bestDist = Infinity;
  for (const cm of COLOR_MAP) {
    const dist = colorDistance({ r, g, b }, cm);
    if (dist < bestDist) {
      bestDist = dist;
      bestName = cm.name;
    }
  }
  return bestName;
}

function getDominantColor(palette) {
  let bestColor = palette[0];
  let adjustedPop = 0;

  for (const c of palette) {
    const r = c._r, g = c._g, b = c._b;
    const brightness = (r + g + b) / 3;
    let penalty = 1;
    if (brightness > 230) penalty = 0.3;
    else if (brightness > 200) penalty = 0.6;
    else if (brightness < 30) penalty = 0.3;
    else if (brightness < 50) penalty = 0.6;

    const adjusted = c.population * penalty;
    if (adjusted > adjustedPop) {
      adjustedPop = adjusted;
      bestColor = c;
    }
  }

  if (!bestColor || adjustedPop === 0) bestColor = palette[0];
  return { r: bestColor._r, g: bestColor._g, b: bestColor._b };
}

function parseBridgeSort(xml) {
  const stacks = [];
  const stackRegex = /<stack[^>]*>([\s\S]*?)<\/stack>/g;
  let match;
  while ((match = stackRegex.exec(xml)) !== null) {
    const items = [];
    const itemRegex = /key='([^']+)'/g;
    let im;
    while ((im = itemRegex.exec(match[1])) !== null) {
      const filename = im[1].replace(/(\d{14})$/, '');
      items.push(filename);
    }
    stacks.push(items);
  }
  return stacks;
}

function rgbToHex(r, g, b) {
  return [r, g, b].map(x => x.toString(16).padStart(2, '0').toUpperCase()).join('');
}

async function analyzePhotos(stacks) {
  console.log('分析照片颜色...');
  const results = [];

  for (let si = 0; si < stacks.length; si++) {
    const stack = stacks[si];
    const productName = '产品 ' + (si + 1);
    console.log('  Stack ' + (si + 1) + '/' + stacks.length + ' (' + stack.length + ' photos)...');

    for (const filename of stack) {
      const filepath = path.join(EXPORT_DIR, filename);
      if (!fs.existsSync(filepath)) {
        console.log('    文件不存在: ' + filename);
        continue;
      }

      try {
        const palette = await ColorThief.getPalette(filepath, 5);
        const dominant = getDominantColor(palette);
        const colorName = rgbToName(dominant.r, dominant.g, dominant.b);

        results.push({
          stackIndex: si,
          productName: productName,
          filename: filename,
          filepath: filepath,
          colorR: dominant.r,
          colorG: dominant.g,
          colorB: dominant.b,
          colorName: colorName,
        });
      } catch (e) {
        console.log('    分析失败 ' + filename + ': ' + e.message);
      }
    }
  }

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(results, null, 2), 'utf8');
  console.log('分析完成，共 ' + results.length + ' 张照片，已保存到 ' + JSON_OUTPUT);
  return results;
}

async function generateExcel(results) {
  const workbook = new ExcelJS.Workbook();

  // Read existing template for column structure
  let templateColumns;
  try {
    const templateWb = new ExcelJS.Workbook();
    await templateWb.xlsx.readFile('E:/11照片/2026花盆/2026伟达花盆产品图.xlsx');
    const templateWs = templateWb.worksheets[0];
    const headerRow = templateWs.getRow(1);
    templateColumns = [];
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      templateColumns.push({ header: cell.value, key: cell.value, width: 16 });
    });
    console.log('  使用现有模板列: ' + templateColumns.map(c => c.header).join(', '));
  } catch (e) {
    console.log('  无法读取模板，使用默认列');
    templateColumns = [
      { header: '序号', key: 'seq', width: 8 },
      { header: '产品照片', key: 'photo', width: 22 },
      { header: '颜色', key: 'color', width: 14 },
      { header: '规格', key: 'spec', width: 14 },
      { header: '材质', key: 'material', width: 14 },
      { header: '单价', key: 'price', width: 12 },
      { header: '数量', key: 'qty', width: 10 },
    ];
  }

  const ws = workbook.addWorksheet('产品图');
  ws.columns = templateColumns;

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.font = { name: '微软雅黑', size: 12, bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
    cell.border = {
      top: { style: 'thin' }, bottom: { style: 'thin' },
      left: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Group results by stack
  const groups = {};
  for (const r of results) {
    if (!groups[r.stackIndex]) groups[r.stackIndex] = [];
    groups[r.stackIndex].push(r);
  }

  let rowNum = 2;
  let seqNum = 1;
  const ROW_HEIGHT = 130;

  for (let si = 0; si < Object.keys(groups).length; si++) {
    const group = groups[si];
    if (!group) continue;

    for (const item of group) {
      let imageId;
      try {
        imageId = workbook.addImage({
          filename: item.filepath,
          extension: 'jpeg',
        });
      } catch (e) {
        console.log('    图片加载失败: ' + item.filename + ' - ' + e.message);
      }

      const row = ws.getRow(rowNum);
      row.height = ROW_HEIGHT;

      // 序号
      row.getCell(1).value = seqNum;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(1).font = { name: '微软雅黑', size: 11 };

      // 产品照片 - embed image + filename
      if (imageId) {
        ws.addImage(imageId, {
          tl: { col: 1, row: rowNum - 1 },
          br: { col: 1.95, row: rowNum - 0.05 },
          editAs: 'oneCell'
        });
      }
      row.getCell(2).value = item.filename;
      row.getCell(2).alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      row.getCell(2).font = { name: '微软雅黑', size: 9, color: { argb: 'FF888888' } };

      // 颜色
      const colorHex = rgbToHex(item.colorR, item.colorG, item.colorB);
      row.getCell(3).value = item.colorName;
      row.getCell(3).alignment = { vertical: 'middle', horizontal: 'center' };
      const brightness = (item.colorR + item.colorG + item.colorB) / 3;
      if (brightness < 100) {
        row.getCell(3).font = { name: '微软雅黑', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      } else {
        row.getCell(3).font = { name: '微软雅黑', size: 11, bold: true };
      }
      row.getCell(3).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF' + colorHex }
      };

      // Remaining columns - leave empty
      for (let c = 4; c <= templateColumns.length; c++) {
        row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(c).font = { name: '微软雅黑', size: 11 };
      }

      // Borders
      for (let c = 1; c <= templateColumns.length; c++) {
        row.getCell(c).border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' }
        };
      }

      rowNum++;
      seqNum++;
    }

    // Separator row between products
    if (si < Object.keys(groups).length - 1) {
      const sepRow = ws.getRow(rowNum);
      sepRow.height = 6;
      for (let c = 1; c <= templateColumns.length; c++) {
        sepRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } };
      }
      rowNum++;
    }
  }

  // Summary sheet
  const summarySheet = workbook.addWorksheet('编组说明');
  summarySheet.columns = [
    { header: '产品编号', key: 'name', width: 14 },
    { header: '图片数量', key: 'count', width: 12 },
    { header: '颜色（分析结果）', key: 'colors', width: 40 },
    { header: '文件夹来源', key: 'folder', width: 16 },
  ];
  const shRow = summarySheet.getRow(1);
  shRow.font = { name: '微软雅黑', size: 11, bold: true };
  shRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
  shRow.eachCell(c => { c.alignment = { vertical: 'middle', horizontal: 'center' }; });

  // Get all source folders
  const sourceDirs = fs.readdirSync('E:/11照片/2026花盆').filter(f => {
    const p = path.join('E:/11照片/2026花盆', f);
    return fs.statSync(p).isDirectory();
  });

  for (let si = 0; si < Object.keys(groups).length; si++) {
    const group = groups[si];
    if (!group) continue;
    const row = summarySheet.getRow(si + 2);
    row.getCell(1).value = '产品 ' + (si + 1);
    row.getCell(2).value = group.length;
    const colors = [...new Set(group.map(g => g.colorName))];
    row.getCell(3).value = colors.join('、');

    // Find source folder
    const firstFile = group[0].filename.replace('.jpg', '').replace('.JPG', '');
    let sourceFolder = '';
    for (const d of sourceDirs) {
      const fullPath = path.join('E:/11照片/2026花盆', d);
      const contents = fs.readdirSync(fullPath).map(c => c.toUpperCase());
      if (contents.some(c => c.startsWith(firstFile.toUpperCase()))) {
        sourceFolder = d;
        break;
      }
    }
    row.getCell(4).value = sourceFolder;

    for (let c = 1; c <= 4; c++) {
      row.getCell(c).font = { name: '微软雅黑', size: 10 };
      row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  await workbook.xlsx.writeFile(OUTPUT_FILE);
}

async function main() {
  console.log('解析 Bridge 编组...');
  const xml = fs.readFileSync(BRIDGE_FILE, 'utf8');
  const stacks = parseBridgeSort(xml);
  console.log('找到 ' + stacks.length + ' 个编组');

  // Use cached results or analyze
  let results;
  if (fs.existsSync(JSON_OUTPUT)) {
    console.log('使用缓存的颜色分析结果...');
    results = JSON.parse(fs.readFileSync(JSON_OUTPUT, 'utf8'));
    console.log('已加载 ' + results.length + ' 条分析记录');
  } else {
    results = await analyzePhotos(stacks);
  }

  console.log('生成 Excel 表格...');
  await generateExcel(results);

  console.log('完成！输出文件: ' + OUTPUT_FILE);
}

main().catch(e => { console.error('错误:', e.message); process.exit(1); });
