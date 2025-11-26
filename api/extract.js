// 邮件信息提取 API - 使用 DeepSeek 大模型

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

  const { emailContent } = req.body;

  if (!emailContent || typeof emailContent !== 'string') {
    return res.status(400).json({ error: '请提供邮件内容' });
  }

  if (emailContent.trim().length < 50) {
    return res.status(400).json({ error: '邮件内容太短，请粘贴完整的录用通知邮件' });
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    console.error('DEEPSEEK_API_KEY not configured');
    return res.status(500).json({ error: '服务配置错误，请联系管理员' });
  }

  try {
    const extractedData = await extractWithDeepSeek(emailContent, apiKey);
    return res.status(200).json({
      success: true,
      data: extractedData
    });
  } catch (error) {
    console.error('Extraction error:', error);
    return res.status(500).json({
      error: error.message || '信息提取失败，请稍后重试'
    });
  }
}

async function extractWithDeepSeek(emailContent, apiKey) {
  const systemPrompt = `你是一个专业的信息提取助手。你的任务是从实习录用通知邮件中提取所有可能的关键信息。

邮件内容可能包含邮件头部信息（发件人、收件人、主题等）和正文内容。请尽可能从中提取以下所有字段。

请严格按照以下JSON格式返回提取的信息，不要包含任何其他文字：

{
  "internName": "实习生姓名",
  "internPosition": "实习岗位名称",
  "startDate": "实习开始日期（格式：YYYY-MM-DD）",
  "endDate": "实习结束日期（格式：YYYY-MM-DD）",
  "dailyAllowance": "每日补贴金额（只填数字）",
  "supervisor": "实习导师姓名",
  "workLocation": "工作地点描述",
  "workTime": "工作时间描述",
  "email": "实习生邮箱地址",
  "school": "就读学校",
  "phone": "联系电话",
  "idNumber": "身份证号"
}

提取规则：
1. 实习生姓名：从正文称呼（如"王舒惠同学"）或邮件主题中提取，去掉"同学"、"女士"、"先生"等后缀
2. 实习生邮箱：从"收件人"字段提取，如"收件人：2962034821@qq.com"则提取"2962034821@qq.com"
3. 日期必须转换为 YYYY-MM-DD 格式，例如"2025年12月1日"应转为"2025-12-01"
4. 补贴金额只提取数字，例如"250元/天"只填"250"
5. 导师姓名去掉@符号，如"@林文婷"提取为"林文婷"
6. 如果某个字段在邮件中确实找不到，填空字符串""
7. 不要猜测或编造信息，只提取邮件中明确存在的内容`;

  const userPrompt = `请从以下实习录用通知邮件中提取所有可用信息：

${emailContent}`;

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error:', response.status, errorText);
    throw new Error('AI 服务暂时不可用，请稍后重试');
  }

  const result = await response.json();

  if (!result.choices || !result.choices[0] || !result.choices[0].message) {
    throw new Error('AI 返回格式异常');
  }

  const content = result.choices[0].message.content.trim();

  // 尝试解析 JSON
  let extractedData;
  try {
    // 处理可能被 markdown 代码块包裹的情况
    let jsonStr = content;
    if (content.includes('```json')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (content.includes('```')) {
      jsonStr = content.replace(/```\n?/g, '');
    }

    extractedData = JSON.parse(jsonStr.trim());
  } catch (parseError) {
    console.error('JSON parse error:', parseError, 'Content:', content);
    throw new Error('信息解析失败，请检查邮件格式');
  }

  // 验证和清理数据
  const cleanedData = {
    internName: cleanString(extractedData.internName),
    internPosition: cleanString(extractedData.internPosition),
    startDate: formatDate(extractedData.startDate),
    endDate: formatDate(extractedData.endDate),
    dailyAllowance: cleanNumber(extractedData.dailyAllowance),
    supervisor: cleanString(extractedData.supervisor),
    workLocation: cleanString(extractedData.workLocation),
    workTime: cleanString(extractedData.workTime),
    email: cleanString(extractedData.email),
    school: cleanString(extractedData.school),
    phone: cleanString(extractedData.phone),
    idNumber: cleanString(extractedData.idNumber)
  };

  return cleanedData;
}

function cleanString(str) {
  if (!str) return '';
  return String(str).trim();
}

function cleanNumber(val) {
  if (!val) return '';
  // 提取数字
  const match = String(val).match(/\d+/);
  return match ? match[0] : '';
}

function formatDate(dateStr) {
  if (!dateStr) return '';

  // 已经是正确格式
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // 尝试解析中文日期格式 如 "2025年12月1日"
  const chineseMatch = dateStr.match(/(\d{4})年(\d{1,2})月(\d{1,2})日?/);
  if (chineseMatch) {
    const year = chineseMatch[1];
    const month = chineseMatch[2].padStart(2, '0');
    const day = chineseMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 尝试其他格式
  const slashMatch = dateStr.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (slashMatch) {
    const year = slashMatch[1];
    const month = slashMatch[2].padStart(2, '0');
    const day = slashMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return dateStr;
}
