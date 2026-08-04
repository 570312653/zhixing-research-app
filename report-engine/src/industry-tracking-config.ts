import type {
  CoreFocusConfig,
  DailyFocusCandidateConfig,
  ThemeConfig,
} from './industry-tracking.types.js';

export const CORE_FOCUS_CONFIG: CoreFocusConfig[] = [
  { focusId: 'ai_plus', displayName: '人工智能+', primaryIndustryTag: '计算机', industryTags: ['计算机', '电子', '传媒'] },
  { focusId: 'advanced_chips', displayName: '高端芯片', primaryIndustryTag: '电子', industryTags: ['电子', '计算机'] },
  { focusId: 'computing_network', displayName: '算力网', primaryIndustryTag: '计算机', industryTags: ['计算机', '通信', '电子'] },
  { focusId: 'data_elements', displayName: '数据要素', primaryIndustryTag: '计算机', industryTags: ['计算机', '传媒'] },
  { focusId: 'six_g', displayName: '6G 通信', primaryIndustryTag: '通信', industryTags: ['通信', '电子'] },
  { focusId: 'intelligent_connected_nev', displayName: '智能网联新能源车', primaryIndustryTag: '汽车', industryTags: ['汽车', '电子', '计算机'] },
  { focusId: 'new_energy_equipment', displayName: '新能源装备', primaryIndustryTag: '电力设备', industryTags: ['电力设备', '机械设备'] },
  { focusId: 'embodied_intelligence', displayName: '具身智能', primaryIndustryTag: '机械设备', industryTags: ['机械设备', '计算机', '电子'] },
];

export const DAILY_FOCUS_CANDIDATE_CONFIG: DailyFocusCandidateConfig[] = [
  { focusId: 'quantum_technology', displayName: '量子科技', primaryIndustryTag: '计算机', industryTags: ['计算机', '电子', '通信'] },
  { focusId: 'biomanufacturing', displayName: '生物制造', primaryIndustryTag: '基础化工', industryTags: ['基础化工', '医药生物'] },
  { focusId: 'brain_computer_interface', displayName: '脑机接口', primaryIndustryTag: '计算机', industryTags: ['计算机', '电子', '医药生物'] },
  { focusId: 'hydrogen_fusion', displayName: '氢能核聚变', primaryIndustryTag: '电力设备', industryTags: ['电力设备', '机械设备', '基础化工'] },
  { focusId: 'new_materials', displayName: '新材料', primaryIndustryTag: '基础化工', industryTags: ['基础化工', '电子'] },
  { focusId: 'robotics', displayName: '机器人', primaryIndustryTag: '机械设备', industryTags: ['机械设备', '计算机', '电子'] },
  { focusId: 'five_g_advanced', displayName: '5G-A', primaryIndustryTag: '通信', industryTags: ['通信', '电子'] },
  { focusId: 'satellite_internet', displayName: '卫星互联网', primaryIndustryTag: '通信', industryTags: ['通信', '电子', '国防军工'] },
];

export const THEME_CONFIG: ThemeConfig[] = [
  { themeId: 'ai_infrastructure', displayName: 'AI 基础设施', focusIds: ['ai_plus', 'advanced_chips', 'computing_network'], industryTags: ['计算机', '电子', '传媒', '通信'] },
  { themeId: 'intelligent_hardware_robotics', displayName: '智能硬件与机器人', focusIds: ['advanced_chips', 'embodied_intelligence', 'robotics', 'brain_computer_interface'], industryTags: ['电子', '计算机', '机械设备', '医药生物'] },
  { themeId: 'digital_infrastructure', displayName: '数字基础设施', focusIds: ['computing_network', 'data_elements', 'six_g', 'five_g_advanced', 'satellite_internet'], industryTags: ['计算机', '通信', '电子', '传媒', '国防军工'] },
  { themeId: 'green_mobility_new_energy_equipment', displayName: '绿色出行与新能源装备', focusIds: ['intelligent_connected_nev', 'new_energy_equipment', 'hydrogen_fusion'], industryTags: ['汽车', '电子', '计算机', '电力设备', '机械设备', '基础化工'] },
];
