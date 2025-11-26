// Word 合同生成 API - 基于原模版文件替换占位符
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  // 设置 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持 POST 请求' });
  }

  const formData = req.body;

  // 验证必填字段
  const requiredFields = ['internName', 'internPosition', 'startDate', 'endDate', 'dailyAllowance'];
  for (const field of requiredFields) {
    if (!formData[field]) {
      return res.status(400).json({ error: `缺少必填字段: ${field}` });
    }
  }

  try {
    const docBuffer = await generateContract(formData);

    // 生成文件名
    const filename = `酷爱科技-实习协议-${formData.internName}-${formData.startDate}.docx`;
    const encodedFilename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodedFilename}`);
    res.setHeader('Content-Length', docBuffer.length);

    return res.send(docBuffer);
  } catch (error) {
    console.error('Generate error:', error);
    return res.status(500).json({
      error: error.message || '合同生成失败，请稍后重试'
    });
  }
}

async function generateContract(data) {
  // 模版文件路径 - 在项目根目录
  const templatePath = path.resolve(__dirname, '..', 'template.docx');

  // 检查模版文件是否存在
  if (!fs.existsSync(templatePath)) {
    throw new Error('模版文件不存在，请确保 template.docx 在项目根目录');
  }

  // 读取模版文件
  const templateContent = fs.readFileSync(templatePath, 'binary');

  // 创建 PizZip 实例
  const zip = new PizZip(templateContent);

  // 创建 Docxtemplater 实例
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: {
      start: '{{',
      end: '}}'
    }
  });

  // 解析日期
  const signDate = parseDate(data.signDate || new Date().toISOString().split('T')[0]);
  const startDate = parseDate(data.startDate);
  const endDate = parseDate(data.endDate);

  // 准备替换数据
  const templateData = {
    // 签订日期
    签订年: signDate.year,
    签订月: signDate.month,
    签订日: signDate.day,

    // 乙方信息
    姓名: data.internName || '',
    学校: data.school || '',
    电话: data.phone || '',
    邮箱: data.email || '',
    身份证号: data.idNumber || '',

    // 实习信息
    岗位: data.internPosition || '',

    // 实习期限
    开始年: startDate.year,
    开始月: startDate.month,
    开始日: startDate.day,
    结束年: endDate.year,
    结束月: endDate.month,
    结束日: endDate.day,

    // 补贴
    补贴: data.dailyAllowance || ''
  };

  // 执行替换
  doc.render(templateData);

  // 生成文档
  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE'
  });

  return buf;
}

function parseDate(dateStr) {
  if (!dateStr) {
    const now = new Date();
    return {
      year: now.getFullYear().toString(),
      month: (now.getMonth() + 1).toString(),
      day: now.getDate().toString()
    };
  }

  // YYYY-MM-DD 格式
  const match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return {
      year: match[1],
      month: parseInt(match[2]).toString(),
      day: parseInt(match[3]).toString()
    };
  }

  // 中文格式
  const chMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (chMatch) {
    return {
      year: chMatch[1],
      month: chMatch[2],
      day: chMatch[3]
    };
  }

  return {
    year: dateStr,
    month: '',
    day: ''
  };
}
