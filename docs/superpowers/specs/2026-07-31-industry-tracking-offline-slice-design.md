# 行业跟踪报告离线切片设计

> 状态：核心清单、每日特别关注候选、标签映射和离线样例已确认；等待用户审阅本次最终稿后，才可进入实施计划。
>
> 日期：2026-07-31

## 1. 目标、用户场景与非目标

`industry_tracking` 是面向 A 股研究阅读者的一份日度行业汇总报告。它帮助读者在有限时间内了解：当日重点行业发生了什么变化、趋势是否有可追溯的变化、证据是否足够，以及下一交易日还应观察什么。它不是申万一级行业全量排行榜，也不是按行业拆开的多份报告。

每个 A 股实际交易日的未来目标是只生成 **1 份** `industry_tracking`，覆盖当日配置中的全部重点关注单元。每个关注单元都有独立章节、稳定标识、申万一级行业标签和主题标签，因此同一报告未来可以从多个行业和主题入口归档、筛选与阅读。候选赛道名称不等于申万一级行业标签：一个赛道可以映射到一个或多个申万一级行业，也可以关联跨行业主题。

本设计只定义本地固定样例切片。该切片不接入真实数据、网络、模型、环境变量、Coze、Vercel、Supabase、交易日历、用户、发布、通知、真实 PDF 或调度。所有内容均由调用方以内存中的固定夹具显式传入；不得读取历史文件、此前运行结果或外部服务，也不得将夹具解释为真实市场事实。

本切片不实现：

- 真实 A 股交易日判断、20:00 调度或非交易日合并逻辑；
- 行业配置后台、生产归档、管理员审核、通知与多入口检索；
- 核心关注标的池的更新；
- `industry_research` 深度报告的生成、修订或审核；
- 正式 PDF 文件、`generatedAt` 字段、网页外部访问或任何凭证处理。

## 2. 方案比较与推荐

| 方案 | 做法 | 优点 | 风险与代价 |
|---|---|---|---|
| A. 每行业单独生成一份报告 | 每个重点行业每日各生成一份 `industry_tracking`。 | 单个报告短、结构简单。 | 与“一日一份汇总报告”决策冲突；通知、归档和阅读碎片化。 |
| B. 单报告 + 结构化多行业章节 + 双层输出（采用） | 一份报告包含核心行业与每日特别关注行业章节，同时输出行业结构化数据和 `contentHtml`。 | 可按多个行业归档；阅读集中；复用现有共享视觉模板；可测试行业级降级。 | 请求与输出对象较大，需要严格校验标签、章节和来源的一一对应。 |
| C. 只输出 HTML | 用固定 HTML 展示所有行业。 | 初期实现表面上最少。 | 无法可靠归档、筛选、历史比较或校验每个行业的来源和状态。 |

采用 B。它以结构化字段保存未来归档和审计所需的信息，以受控 HTML 提供当前阅读体验；二者由同一已校验输入生成，不能只交付 HTML。

## 3. 报告定位与 `industry_research` 边界

`industry_tracking` 是每日增量跟踪，回答“今天有什么变化、趋势是否变化、下一步看什么”。每个核心行业至少有标准跟踪卡；每日特别关注行业在此基础上增加政策、产业链、驱动因素和 A 股相关观察。

`industry_research` 是不定期的深度研究，回答特定产业或主题的中短期研究问题，覆盖产业逻辑、产业链、竞争格局、长期驱动、反例与风险。行业跟踪可以引用已有深度报告的 ID 和版本，但不重复其基础研究；发现结构变化时，只提示“建议更新深度研究”，不得冒充新的深度报告。

没有重要变化时，行业跟踪必须明确写“今日无重要新增”或“无新增深度结论”，不得用重复长文填充版面。

## 4. 重点关注单元模型

### 4.1 核心与每日特别关注单元

重点行业由两组组成：

- **固定核心关注单元**：由独立配置提供，不得硬编码在报告生成逻辑中。每项以 `focusId`、`displayName` 和一个或多个 `industryTags` 为主；未来生产环境由受控配置管理，当前离线夹具显式传入配置副本，便于验证而不建立配置系统。
- **每日特别关注单元**：每天最多 3 个，可以为空。未来上游分析流程必须显式提供选择原因和来源证据；引擎不补足数量、不自动选择，也不从历史记忆推断。

每个交易日都要重新评估每日特别关注单元。连续入选时，上游显式提供首次入选日和连续天数；退出时，上游显式提供“信号减弱”“证据不足”或“被替代”等退出原因。引擎仅校验并展示这些字段，不能自行推算连续天数、自动沿用或自动判定退出。

同一关注单元在同一份报告中只能出现一次。若核心关注单元同时成为当日突出观察对象，它保持 `core` 身份，并可填写 `highlightReason`；不得复制为第二个 `daily_focus` 章节。

### 4.2 已确认的固定核心关注单元（首版 8 项）

以下 8 项是首版固定核心关注单元。每个交易日报告都覆盖它们；未来调整必须走受控配置审阅，不能由生成逻辑临时新增或删除。

| `focusId` | 展示名 | 主归档申万一级行业 | 辅助申万一级行业 |
|---|---|---|---|
| `ai_plus` | 人工智能+ | 计算机 | 电子、传媒 |
| `advanced_chips` | 高端芯片 | 电子 | 计算机 |
| `computing_network` | 算力网 | 计算机 | 通信、电子 |
| `data_elements` | 数据要素 | 计算机 | 传媒 |
| `six_g` | 6G 通信 | 通信 | 电子 |
| `intelligent_connected_nev` | 智能网联新能源车 | 汽车 | 电子、计算机 |
| `new_energy_equipment` | 新能源装备 | 电力设备 | 机械设备 |
| `embodied_intelligence` | 具身智能 | 机械设备 | 计算机、电子 |

### 4.3 每日特别关注候选池（首版 8 项）

当日特别关注从下列固定候选池中选取，最多 3 项、允许为空；不得在 V1 中临时加入候选池外的新赛道。未来若需新增赛道，先修改受控配置并完成审阅，再进入报告输入。

| `focusId` | 展示名 | 主归档申万一级行业 | 辅助申万一级行业 |
|---|---|---|---|
| `quantum_technology` | 量子科技 | 计算机 | 电子、通信 |
| `biomanufacturing` | 生物制造 | 基础化工 | 医药生物 |
| `brain_computer_interface` | 脑机接口 | 计算机 | 电子、医药生物 |
| `hydrogen_fusion` | 氢能核聚变 | 电力设备 | 机械设备、基础化工 |
| `new_materials` | 新材料 | 基础化工 | 电子 |
| `robotics` | 机器人 | 机械设备 | 计算机、电子 |
| `five_g_advanced` | 5G-A | 通信 | 电子 |
| `satellite_internet` | 卫星互联网 | 通信 | 电子、国防军工 |

### 4.4 固定主题库

主题是跨行业阅读和归档入口，不替代申万一级行业标签。主题库固定，但每日仅选择有明确证据关联的主题展示；没有关联时可以为空。

| `themeId` | 展示名 | 初始关联关注单元 | 关联申万一级行业 |
|---|---|---|---|
| `ai_infrastructure` | AI 基础设施 | 人工智能+、高端芯片、算力网 | 计算机、电子、传媒、通信 |
| `intelligent_hardware_robotics` | 智能硬件与机器人 | 高端芯片、具身智能、机器人、脑机接口 | 电子、计算机、机械设备、医药生物 |
| `digital_infrastructure` | 数字基础设施 | 算力网、数据要素、6G 通信、5G-A、卫星互联网 | 计算机、通信、电子、传媒、国防军工 |
| `green_mobility_new_energy_equipment` | 绿色出行与新能源装备 | 智能网联新能源车、新能源装备、氢能核聚变 | 汽车、电子、计算机、电力设备、机械设备、基础化工 |

上述申万标签映射是本项目的首版设计配置，不是对任何数据供应商当前标签字典的事实断言。进入真实数据阶段前，必须以已选数据供应商的实际可用标签逐项复核；名称不一致时更新配置和本文件，不得在运行时猜测或静默改写。

旧交接文档中的操作建议、持仓描述、Coze Skill 或 Coze 调用路径均不进入本规范、固定夹具或未来正式依赖。

### 4.5 标识与标签规则

- 每个关注单元有稳定、报告内唯一的 `focusId` 和可展示的 `displayName`；候选赛道名称只能作为 `displayName` 的候选来源，不能替代稳定标识。
- `industryTags` 只使用申万一级行业，承担稳定归档和筛选；每个关注单元必须映射至少一个申万一级行业。
- `themeId` 是固定主题库的稳定标识；`selectedThemeIds` 是请求中唯一的主题选择来源，使用去重后的 `themeId`，可为空。它不是展示文案，展示文案只能从固定主题库的 `displayName` 解析。
- 章节 `themeIds` 只记录其已选主题关联，必须由 `selectedThemeIds` 与固定主题库的 `focusIds` 映射得出；章节不得自行选择、补充或展示未选主题。
- 每个主题配置必须至少关联一个 `industryTag`；不允许只有主题而没有申万一级行业入口。
- 每个章节保存 `role: 'core' | 'daily_focus'`，使归档层能追溯其当日身份。报告级 `industryTags` 取全部章节申万标签的去重并集；报告级 `themes` 只由 `selectedThemeIds` 与固定主题库单向派生，不得从未选主题中补充。

## 5. 输入契约草案

以下类型是设计层契约，不代表本次写入任何实现代码。所有数组和对象均由调用方显式传入；没有隐式数据库、文件、网络或系统时间输入。

```ts
type IndustryRole = 'core' | 'daily_focus';

type IndustryOverallStatus =
  | 'warming'
  | 'continuing'
  | 'diverging'
  | 'cooling'
  | 'insufficient';

type EvidenceQuality = 'complete' | 'partial' | 'insufficient';
type SignalConsistency = 'consistent' | 'partially_consistent' | 'diverging';

type ComparisonWindow =
  | 'previous_trading_day'
  | 'trailing_5_trading_days'
  | 'trailing_20_trading_days'
  | 'disclosure_period';

type IndustryDimension =
  | 'market_relative_strength'
  | 'trading_activity'
  | 'industry_fundamentals'
  | 'policy_technology_events'
  | 'representative_breadth'
  | 'risk_reverse_signals';

type SourceEvidence = {
  sourceId: string; // 例如 S03；同一报告内唯一
  title: string;
  publisher: string;
  publishedAt: string; // 带时区 ISO-8601
  dataAsOf: string; // 带时区 ISO-8601
  url: string; // 无凭证 HTTPS 链接
  linkStatus: 'valid' | 'expired';
  context: string;
};

type IndicatorChange = {
  metricName: string;
  currentValue?: string;
  comparisonValue?: string;
  unit?: string;
  changeDirection: 'up' | 'down' | 'flat' | 'mixed' | 'not_quantified';
  comparisonWindow: ComparisonWindow;
  evidenceIds: string[];
  qualitativeObservation?: string;
};

type AvailableDimensionAssessment = {
  dimension: IndustryDimension;
  status: 'available';
  conclusion: string;
  indicatorChanges: IndicatorChange[];
};

type DataInsufficientDimensionAssessment = {
  dimension: IndustryDimension;
  status: 'data_insufficient';
  missingReason: string;
  conclusion?: never;
  indicatorChanges?: never;
};

type DimensionAssessment =
  | AvailableDimensionAssessment
  | DataInsufficientDimensionAssessment;

type FocusUnitRef = {
  focusId: string;
  displayName: string;
  industryTags: string[]; // 一个或多个申万一级行业
};

type CoreFocusConfig = FocusUnitRef & {
  primaryIndustryTag: string; // 必须同时存在于 industryTags
};

type DailyFocusCandidateConfig = FocusUnitRef & {
  primaryIndustryTag: string; // 必须同时存在于 industryTags
};

type ThemeConfig = {
  themeId: string;
  displayName: string;
  focusIds: string[];
  industryTags: string[];
};

type ThemeOutput = {
  themeId: string;
  displayName: string;
  focusIds: string[]; // 当前报告中与该主题关联的关注单元
  industryTags: string[]; // 上述当前关注单元的 industryTags 去重并集
};

type DailyFocusSelection = FocusUnitRef & {
  selectionReason: string;
  selectionEvidenceIds: string[];
  firstSelectedDate: string;
  consecutiveSelectionDays: number;
};

type DailyFocusExitRecord = {
  focusId: string;
  displayName: string;
  exitReason: 'signal_weakened' | 'evidence_insufficient' | 'replaced';
  evidenceIds: string[];
};

type PriorJudgementAudit = {
  reportId: string;
  reportDate: string;
  reportType: 'morning_scan' | 'midday_review' | 'daily_review' | 'industry_tracking';
  originalJudgement: string;
  auditNote: string;
  evidenceIds: string[];
};

type IndustrySectionInput = {
  focusId: string;
  displayName: string;
  role: IndustryRole;
  industryTags: string[];
  themeIds: string[];
  highlightReason?: string;
  dimensions: DimensionAssessment[];
  overallStatus: IndustryOverallStatus;
  evidenceQuality: EvidenceQuality;
  signalConsistency: SignalConsistency;
  keyChanges: string[];
  catalysts: string[];
  risks: string[];
  nextObservations: string[];
  stockObservations: Array<{
    securityCode: string;
    securityName: string;
    industryRelation: string;
    evidenceIds: string[];
    riskNote: string;
  }>;
  deepResearchUpdate:
    | { kind: 'no_new_deep_conclusion' }
    | {
        kind: 'referenced_update';
        reportId: string;
        version: string;
        evidenceIds: string[];
        updateNotice: string;
      }
    | {
        kind: 'structural_change_detected';
        evidenceIds: string[];
        updateNotice: string;
      };
  priorJudgementAudits?: PriorJudgementAudit[];
};

type IndustryTrackingRequest = {
  reportType: 'industry_tracking';
  reportDate: string; // YYYY-MM-DD，仅校验公历日期存在性
  dataAsOf: string; // 带时区 ISO-8601，且与 reportDate 同一上海自然日
  coreFocusConfig: CoreFocusConfig[];
  dailyFocusCandidateConfig: DailyFocusCandidateConfig[];
  dailyFocusSelections: DailyFocusSelection[];
  exitedDailyFocus: DailyFocusExitRecord[];
  themeConfig: ThemeConfig[];
  selectedThemeIds: string[];
  industries: IndustrySectionInput[];
  sources: SourceEvidence[];
};
```

### 5.1 输入校验语义

- `coreFocusConfig` 非空，`focusId` 唯一；每项必须有非空 `displayName`、一个主归档 `primaryIndustryTag` 和至少一个申万一级 `industryTags`，且主归档标签必须属于该项标签集合。
- `dailyFocusCandidateConfig` 是受控的每日特别关注候选池，首版必须与第 4.3 节的 8 项一致；其 `focusId` 唯一，且不得与固定核心关注单元重复。
- `dailyFocusSelections` 最多 3 个、可为空；其 `focusId` 必须存在于 `dailyFocusCandidateConfig`，不得与核心关注单元或其他每日特别关注单元重复。核心关注单元当日突出时只能填写 `highlightReason`，不能创建重复的 `daily_focus` 章节。
- 每个核心关注单元必须恰好有一个 `role: 'core'` 的章节；每个每日特别关注单元必须恰好有一个 `role: 'daily_focus'` 的章节。章节的 `focusId`、`displayName` 和 `industryTags` 必须与相应配置或选择对象一致。
- 每个每日特别关注单元都必须有选择原因、至少一个选择证据、首次入选日和正整数连续天数。
- `exitedDailyFocus` 只在请求级保存；每项必须引用当日未继续入选的 `focusId`、展示名、退出原因和至少一个来源。它不得出现在单个行业章节内。
- `themeConfig` 只能包含第 4.4 节固定主题库中的主题，`themeId` 唯一，且每项必须同时提供 `displayName`、`focusIds` 与 `industryTags`；`selectedThemeIds` 必须去重且只能引用该配置中的主题，是唯一主题选择来源。每个选中主题至少关联一个当前报告关注单元，并通过该单元关联至少一个申万一级行业；主题不能脱离行业独立存在。
- 每个章节的 `themeIds` 必须恰好等于“`selectedThemeIds` 中、其 `ThemeConfig.focusIds` 包含该章节 `focusId` 的主题 ID”按 `selectedThemeIds` 顺序得到的结果；不得将未选主题写入章节，也不得以章节字段反向新增主题选择。
- `SourceEvidence.sourceId` 在报告内唯一；标题、发布方、上下文和无凭证 HTTPS URL 均为非空；`linkStatus: 'expired'`、HTTP 链接、带用户名或密码的 URL 均拒绝。当前离线切片只校验夹具提供的链接状态与 URL 结构，不发起网络请求验证可达性。
- 行业章节中的所有 `evidenceIds` 必须指向当前报告的有效来源；同一来源可服务多个行业，但文末来源表只列一次。
- `dataAsOf` 必须为带时区 ISO-8601，且来源的 `publishedAt` 与 `dataAsOf` 不得晚于报告截至时间。
- `industry_tracking` 不接受 `draftHtml` 或调用方提供的任意 HTML；正文只由固定模板生成。
- `IndicatorChange` 必须同时给出 `currentValue` 与 `comparisonValue`，或给出非空 `qualitativeObservation`；两类信息不能同时缺失。每项必须有比较窗口、方向和至少一个来源编号。
- `DimensionAssessment.status === 'available'` 时，`conclusion` 和至少一条合格 `indicatorChanges` 必填；`status === 'data_insufficient'` 时，`missingReason` 必填，且不得生成 `conclusion` 或指标变化。
- `priorJudgementAudits` 可为空或缺失；若提供，只能用于审计和复核展示，不能参与趋势状态、证据质量或信号一致性的权威判断。引擎不得读取历史文件来补造该字段。

## 6. 趋势判断与行业级降级

趋势主要根据“当期数据与对比期数据”的显式比较结果得出。前期报告仅用于审计和复核，不能成为趋势权威来源、替代当期证据或参与趋势归纳。上游必须显式提供指标变化、比较窗口和来源编号；当前离线 fixture 已提供比较结果，引擎只校验字段完整性、来源引用和内部一致性，并进行固定编排，不从原始市场数据、历史报告、内存或模型中自行计算或补写。

### 6.1 比较窗口与维度

- 市场表现、相对强弱、交易活跃度、资金特征、代表标的广度与一致性使用：相对上一交易日、近 5 个交易日或近 20 个交易日。
- 基本面、政策、技术和公司事件使用实际披露周期，标记为 `disclosure_period`，不得强行套用交易日窗口。
- 每个可用维度展示结论、结构化指标变化、比较窗口和来源。缺失维度必须标记 `data_insufficient` 并写明缺失原因，不生成趋势结论，也不参与综合判断。

### 6.2 状态与证据表达

- 行业总体状态只使用 `warming`、`continuing`、`diverging`、`cooling`、`insufficient`。
- 若不同窗口或维度相互冲突，`signalConsistency` 必须为 `diverging`，总体状态应为 `diverging`；不得强行写成升温或降温。
- 若所有有效维度均缺失，或没有任何可用维度，`evidenceQuality` 和总体状态必须为 `insufficient`；不得凭空生成 `warming`、`continuing`、`diverging` 或 `cooling`。
- `evidenceQuality` 只使用 `complete`、`partial`、`insufficient`；`signalConsistency` 只使用 `consistent`、`partially_consistent`、`diverging`。
- 不使用黑箱分数、综合百分比置信度、投资价值排名、“最值得买”或“优选行业”等表述。

### 6.3 行业级降级与报告级失败

| 情况 | 行为 | 可测试结果 |
|---|---|---|
| 某核心关注单元某个维度缺数据 | 保留该章节；该维度标 `data_insufficient`、写明原因、排除综合判断。 | 成功报告，章节 `evidenceQuality` 为 `partial` 或 `insufficient`。 |
| 某核心行业没有足够证据形成趋势 | 保留章节，整体状态为 `insufficient`，明确“证据不足/无法判断”。 | 成功报告，不生成 warming/continuing/diverging/cooling 结论。 |
| 每日特别关注行业无重要新增 | 保留章节，写明“今日无重要新增”，不扩写重复内容。 | 成功报告，`deepResearchUpdate.kind` 为 `no_new_deep_conclusion`。 |
| 遗漏任一核心行业章节 | 整份报告失败关闭。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |
| 任一来源结构、URL 或链接状态无效 | 整份报告失败关闭。 | `SOURCE_EVIDENCE_INSUFFICIENT`。 |
| 整份报告没有任何有效行业证据 | 整份报告失败关闭。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |

行业级降级不能隐瞒来源不足；报告级失败不能用空行业列表、通用文案或模型猜测替代。

## 7. 固定 HTML 栏目与标的边界

`contentHtml` 复用既有共享视觉渲染器：正文保持语义 HTML，完整页面、桌面样式、手机卡片和 A4 打印 CSS 仍由 `renderReportDocument` 的应用控制外壳提供。正文不得获得任意 `class`、`style`、脚本、事件属性或动态 URL 拼接能力。复杂表格只使用现有受控的 `td[data-label]` 规则。

固定栏目按以下顺序生成：

1. 今日行业总览：按总体状态分组，说明跨行业共性和主要风险。
2. 每日特别关注：最多 3 个关注单元，展示入选依据、首次入选日、连续天数、多窗口变化与来源。
3. 核心行业跟踪：覆盖全部当前配置核心关注单元；每章包含趋势、重要变化、关键证据、风险和下一观察项。
4. 主题线索观察：按 `selectedThemeIds` 从固定主题库派生 `themes`，以 `displayName` 展示跨行业关联，并标明关联的申万一级行业。
5. A 股相关标的观察：仅说明产业关联、公开证据和风险。
6. 深度研究更新提示：引用既有深度报告 ID/版本，或明确“无新增深度结论”/“建议更新深度研究”；可选前期判断审计只作为复核说明，不参与趋势结论。
7. 下一交易日观察清单：列出待验证的公开事件、数据、行业变量或风险。
8. 数据截至时间、公开来源与固定风险提示“仅供信息参考，不构成投资建议”。

标的观察只服务于产业研究说明，不得出现买卖指令、目标价、仓位、止损、个人持仓、收益承诺或“荐股池”表述。该报告不得更新核心关注标的池；只有未来独立 `watchlist_snapshot` 能更新标的池及其历史轨迹。

## 8. 双层输出与未来发布目标

```ts
type IndustryTrackingReport = {
  reportType: 'industry_tracking';
  reportDate: string;
  title: string; // 行业跟踪｜YYYY-MM-DD｜v1.0
  version: 'v1.0';
  dataAsOf: string;
  marketScopes: ['cn_a'];
  industryTags: string[]; // 所有关注单元 industryTags 的去重并集
  themes: ThemeOutput[]; // 仅由 selectedThemeIds + themeConfig 单向派生
  coreFocusIds: string[];
  dailyFocusIds: string[];
  industries: IndustrySectionInput[];
  sources: SourceEvidence[];
  contentHtml: string;
};
```

结构化关注单元数据用于未来的多行业归档、筛选、历史比较和审计；`contentHtml` 只承担阅读呈现。输出校验必须同时验证二者：`focusId` 与章节对应、报告级申万标签确为章节标签的去重并集、`themes` 确为 `selectedThemeIds` 与 `themeConfig` 的单向派生结果（每项的 `focusIds` 与 `industryTags` 只保留当前报告关联范围）、来源编号可追溯、核心关注单元完整、固定栏目完整、HTML 以 `displayName` 展示主题且安全、风险提示存在且不含违规表述。

未来目标是在 A 股实际交易日完成 20:00 的生成；非交易日行业信息归入 `holiday_digest`。20:00 是目标生成完成时间，不等于未经审核立即推送。灰度阶段先由管理员审核发布，稳定后才讨论自动发布；发布后进入“今日报告”和产业页的多行业/主题归档。未来可提供独立站内通知开关，新用户默认关闭；开启后每交易日最多一条汇总通知，不按行业逐条发送。本切片不实现这些目标。

## 9. 建议模块边界与数据流

```text
显式固定夹具 / 未来受控上游输入
  → 关注单元配置与每日特别关注校验
  → 来源与时间校验
  → 维度比较、证据质量与信号一致性校验
  → 行业级降级或报告级失败判定
  → 结构化 IndustryTrackingReport
  → 固定语义 contentHtml
  → 既有 renderReportDocument 视觉外壳
  → 本地 HTML 预览
```

建议逻辑边界如下：

- **配置解析器**：只接收核心关注单元配置、每日特别关注候选池、每日特别关注选择与固定主题库，校验 `focusId`、主归档行业、行业/主题映射、去重、上限、角色和请求级退出记录。
- **来源校验器**：只验证来源结构、编号、时间、HTTPS 与无凭证链接；不联网探测。
- **趋势一致性校验器**：只校验显式当期/对比期比较结果、状态、来源和降级是否一致，不读取历史、不调用模型、不从原始数据计算趋势、不产生分数。
- **行业报告编排器**：按固定栏目形成结构化行业章节与受控 HTML。
- **输出契约与视觉渲染器**：先校验结构化输出，再复用现有完整 HTML 外壳；不改变既有三类报告的行为。

## 10. 代表性离线 fixture

本切片只使用一组代表性组合，不代表真实市场结论：

- 固定核心关注单元完整覆盖第 4.2 节的 8 项：`ai_plus`（人工智能+）为 `warming`、`advanced_chips`（高端芯片）为 `diverging`、`new_energy_equipment`（新能源装备）为 `insufficient`、`embodied_intelligence`（具身智能）为 `continuing`；`computing_network`（算力网）、`data_elements`（数据要素）、`six_g`（6G 通信）与 `intelligent_connected_nev`（智能网联新能源车）均可为合规的 `insufficient`。全部都只是离线夹具状态，不能解释为市场结论；
- 每日特别关注单元固定为候选池中的 `robotics`（机器人），带选择原因、首次入选日、连续天数和来源编号；它不得与任一核心关注单元重复，可使用合规的 `insufficient` 状态。
- `selectedThemeIds` 至少选择 `ai_infrastructure`；由 `themeConfig` 派生的 `themes` 必须覆盖当前报告中的人工智能+、高端芯片和算力网，并给出相应申万一级行业，HTML 只展示其 `displayName`；
- 恰好 1 条 `PriorJudgementAudit`，仅用于审计展示，不能影响趋势判断；
- 1 组 A 股相关标的观察，仅含产业关联、证据和风险；
- 完整的 `S01`、`S02`、`S03` 等来源编号、文末来源表和固定风险提示。

fixture 的选择原则是覆盖 8 个核心关注单元加 1 个每日特别关注单元的单报告汇总、赛道与申万标签映射、主题 ID 到展示主题的单向派生、角色区分、窗口冲突、行业级降级、来源复用和手机表格卡片，而不是模拟真实行业热度或未来生产配置。后续正式输入必须动态覆盖第 4.2 节的全部 8 个核心关注单元。

## 11. 验收标准与测试矩阵

| 场景 | 输入条件 | 预期结果 |
|---|---|---|
| 正常多行业汇总 | 第 4.2 节全部 8 个核心关注单元、候选池中的 `robotics` 作为 1 个每日特别关注单元、有效来源和完整章节；`selectedThemeIds` 至少含 `ai_infrastructure`。 | 生成 1 份报告；核心/特别关注分区、结构化标签、由主题选择单向派生的 `themes`、HTML 和来源表完整。 |
| 每日特别关注为空 | 仅传入全部核心关注单元。 | 成功；“每日特别关注”明确为空，不补足单元。 |
| 空核心配置 | `coreFocusConfig` 为空。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |
| 核心关注单元缺一个章节 | 配置存在但 `industries` 缺少对应 `core` 项。 | `INDUSTRY_TRACKING_INSUFFICIENT`，不返回部分报告。 |
| core 与 daily focus 重复 | 同一 `focusId` 同时进入两组或出现两个章节。 | `INDUSTRY_TRACKING_INSUFFICIENT`；必须改为单一 core 章节加 `highlightReason`。 |
| 非法报告日期 | `reportDate` 不是实际存在的 YYYY-MM-DD 日期。 | `INVALID_REPORT_DATE`。 |
| 非法数据截至时间 | `dataAsOf` 缺失、非 ISO-8601 或不在报告日的上海自然日。 | `INVALID_REQUEST`。 |
| 单行业缺维度证据 | 某维度为 `data_insufficient` 并给出原因。 | 成功；该维度不参与综合判断，行业状态可为 `insufficient`。 |
| 多窗口冲突 | 不同窗口结论相反。 | 成功；行业状态和 `signalConsistency` 为 `diverging`。 |
| 所有有效维度缺失 | 某关注单元全部维度均为 `data_insufficient`。 | 成功；该单元 `evidenceQuality` 和总体状态为 `insufficient`。 |
| 无任何有效行业证据 | 所有行业均无有效来源。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |
| 来源字段或链接非法 | 空编号、重复编号、HTTP、带凭证 URL 或 `expired` 链接。 | `SOURCE_EVIDENCE_INSUFFICIENT`。 |
| 来源引用不存在 | 章节、指标、选择或审计记录引用不存在的 `sourceId`。 | `SOURCE_EVIDENCE_INSUFFICIENT`。 |
| 每日特别关注不合格 | 超过 3 个、重复、无选择原因、无选择证据或连续天数非法。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |
| 每日特别关注不在候选池 | `dailyFocusSelections.focusId` 不在 `dailyFocusCandidateConfig`。 | `INDUSTRY_TRACKING_INSUFFICIENT`。 |
| 主题脱离行业或语义不一致 | `selectedThemeIds` 重复或引用未配置主题、主题没关联当前报告关注单元、章节 `themeIds` 不是已选主题的映射结果，或输出 `themes` 不能由选择和配置单向派生。 | `INDUSTRY_TRACKING_INSUFFICIENT` 或 `OUTPUT_CONTRACT_VIOLATION`，且不返回报告。 |
| 标的违规表达 | 出现买卖、目标价、仓位、止损、收益承诺或个人化表述。 | `COMPLIANCE_VIOLATION`。 |
| 输出或 HTML 不合格 | 缺少固定栏目、风险提示、标签，或含危险标签/属性。 | `OUTPUT_CONTRACT_VIOLATION` 或 `UNSAFE_HTML`。 |
| 外部能力未触发 | 扫描源码、测试、夹具和预览脚本。 | 不出现网络请求、环境变量、Coze、Vercel、Supabase、模型、调度或 PDF 渲染调用。 |
| 通知与发布未触发 | 运行固定 fixture。 | 不创建通知、用户、归档、发布或外部副作用。 |

### 11.1 成功标准

- 单次请求只生成 1 份 `industry_tracking`，不按关注单元拆分多份报告。
- 全部核心关注单元均有且仅有一个对应章节；每日特别关注单元可为空且最多 3 个。
- 结构化输出与 HTML 一致：相同的章节、角色、来源编号、申万 `industryTags`、章节 `themeIds`、报告级 `themes`、风险提示和状态均可互相追溯；HTML 主题文案只使用 `ThemeOutput.displayName`。
- 报告级 `industryTags` 是全部章节申万标签的去重并集；报告级 `themes` 是由去重后的 `selectedThemeIds` 与固定 `themeConfig` 单向派生的结构化结果，赛道展示名不被误作申万行业标签。
- 生成过程没有网络、模型、环境变量、文件读取、通知、用户、归档、发布、调度或其他外部副作用。
- 现有 `morning_scan`、`midday_review`、`daily_review` 与共享视觉渲染器的已验收行为保持不变。

固定样例只校验公历日期与字段关系，不能宣称已完成 A 股交易日校验。

## 12. 文档一致性影响与显式审阅门槛

后续获得实施授权时，应同步检查和更新：

- `docs/report-engine-architecture.md`：记录 `industry_tracking` 的离线实现、行业级降级与未接入边界。
- `docs/coze-report-output-standard.md`：确认第 5.4 节与本设计的核心/特别关注分层、趋势字段和来源编号语义一致；不得恢复 Coze 为正式依赖。
- `docs/current-status.md`：更新完成切片、实际测试结果与下一候选。
- 对应实施计划与项目级 `_system/` 恢复摘要：只在实际实现与验收完成后记录结果。

本次只创建本设计文件，不修改上述文档，不创建实施计划，不写代码。

用户最终审阅本稿时，应重点确认：

1. 第 4.2 节固定核心 8 项、主/辅助申万标签与第 4.3 节每日特别关注候选 8 项的分层没有遗漏或误归类。
2. 每日特别关注最多 3 项、仅从候选池选择；核心关注单元出现突出信号时保持 `core` 身份并填写 `highlightReason`，不重复生成 `daily_focus` 章节。
3. 第 4.4 节固定主题库中每项的 `themeId`、`displayName`、`focusIds` 与 `industryTags` 映射正确；`selectedThemeIds` 是唯一选择来源，章节 `themeIds` 与输出 `themes` 均只能单向派生，主题不脱离关注单元/申万标签。
4. 第 10 节的 8 个核心关注单元、候选池中的 `robotics` 每日特别关注、指定状态和 1 条审计记录只用于测试，不被误认为真实市场结论。
5. 进入真实数据阶段前，必须基于数据供应商实际标签字典复核本稿申万映射；本次不进行该验证。

在该显式审阅门槛通过前，不写实施代码、不接真实数据或外部服务；任何固定夹具都必须标注为代表性测试组合。
