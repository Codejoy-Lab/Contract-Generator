// 合同模版配置 - 定义需要填充的字段
module.exports = {
  // 公司固定信息（甲方）
  company: {
    name: "酷爱教育科技（上海）有限公司",
    address: "上海市徐汇区龙台路180号（模速空间）B座303",
    legalRepresentative: "张佳维",
    email: "eric@codejoy.ai"
  },

  // 需要从邮件中提取的字段
  extractFields: [
    "internName",        // 实习生姓名
    "internPosition",    // 实习岗位
    "startDate",         // 实习开始日期
    "endDate",           // 实习结束日期
    "dailyAllowance",    // 每日补贴金额
    "supervisor",        // 实习导师
    "workLocation",      // 工作地点备注（如"线下+线上"）
    "workTime"           // 工作时间描述
  ],

  // 需要HR手动填写的字段
  manualFields: [
    "school",            // 就读学校
    "phone",             // 联系电话
    "email",             // 电子邮件
    "idNumber"           // 身份证号
  ],

  // 字段中文映射
  fieldLabels: {
    internName: "实习生姓名",
    internPosition: "实习岗位",
    startDate: "实习开始日期",
    endDate: "实习结束日期",
    dailyAllowance: "每日补贴(元/天)",
    supervisor: "实习导师",
    workLocation: "工作地点备注",
    workTime: "工作时间",
    school: "就读学校",
    phone: "联系电话",
    email: "电子邮件",
    idNumber: "身份证号",
    signDate: "签署日期"
  }
};
