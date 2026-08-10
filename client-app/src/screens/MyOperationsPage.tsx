import './MyOperationsPage.css'

type DisabledFutureActionProps = {
  label: string
  reasonId: string
}

const disabledReason = '需要未来可信服务端；离线固定样例不会发起请求或模拟成功。'

const tasks = [
  { name: '早盘扫描', state: '已完成', detail: '固定样例 · v1.0', tone: 'done', icon: '✓' },
  { name: '午间复盘', state: '已完成', detail: '固定样例 · v1.0', tone: 'done', icon: '✓' },
  { name: '每日复盘', state: '失败', detail: '错误码 DATA_INCOMPLETE · 已脱敏', tone: 'failed', icon: '!' },
  { name: '行业跟踪', state: '未到时间', detail: '固定样例状态', tone: 'waiting', icon: '◷' },
] as const

function DisabledFutureAction({ label, reasonId }: DisabledFutureActionProps) {
  return (
    <div className="my-operations__disabled-action">
      <button
        type="button"
        disabled
        aria-describedby={reasonId}
        aria-label={`${label}（当前不可用）`}
      >
        {label}
      </button>
      <p className="my-operations__reason" id={reasonId}>{disabledReason}</p>
    </div>
  )
}

export function MyOperationsPage() {
  return (
    <article className="my-operations">
      <header className="my-operations__header">
        <div>
          <h1>我的</h1>
          <p>个人操作与离线运行状态</p>
        </div>
        <span className="my-operations__mode">固定样例</span>
      </header>

      <section className="my-operations__owner" aria-label="所有者状态">
        <div className="my-operations__owner-top">
          <div>
            <strong>个人研究空间</strong>
            <small>仅限所有者本人访问</small>
          </div>
          <span className="my-operations__mode"><span aria-hidden="true">◌</span>本地样例模式</span>
        </div>
        <p>访问状态：云端认证待接入</p>
        <p>最后同步：2099-06-18 20:18（固定样例）</p>
      </section>

      <section className="my-operations__section" aria-labelledby="sync-heading">
        <div className="my-operations__row">
          <div>
            <h2 id="sync-heading">内容同步</h2>
            <p>刷新未来只同步索引、任务状态和已归档内容，不触发报告生成。</p>
          </div>
          <DisabledFutureAction label="刷新内容" reasonId="refresh-disabled-reason" />
        </div>
      </section>

      <section className="my-operations__section" aria-labelledby="tasks-heading">
        <div className="my-operations__section-heading">
          <h2 id="tasks-heading">今日任务</h2>
          <p>2 完成 · 1 失败 · 1 未到时间</p>
        </div>
        <ul className="my-operations__tasks" aria-label="今日四类报告任务">
          {tasks.map((task) => (
            <li className="my-operations__task" key={task.name}>
              <div className="my-operations__task-heading">
                <strong>{task.name}</strong>
                <span className={`my-operations__status my-operations__status--${task.tone}`}>
                  <span aria-hidden="true">{task.icon}</span>{task.state}
                </span>
              </div>
              <p>{task.detail}</p>
            </li>
          ))}
        </ul>
        <div className="my-operations__panel">
          <div className="my-operations__row">
            <div>
              <h3><span aria-hidden="true">⚠ </span>每日复盘任务失败</h3>
              <p>固定样例的数据完整性校验未通过；未归档，也不会自动发布。</p>
            </div>
            <DisabledFutureAction label="重试失败任务" reasonId="retry-disabled-reason" />
          </div>
        </div>
      </section>

      <section className="my-operations__section" aria-labelledby="cache-heading">
        <div className="my-operations__section-heading">
          <h2 id="cache-heading">本机缓存</h2>
          <p>只读展示手机副本</p>
        </div>
        <div className="my-operations__row">
          <div>
            <h3>离线报告缓存</h3>
            <p>9 份去敏固定样例 · 仅用于本机阅读验证</p>
          </div>
          <span className="my-operations__status"><span aria-hidden="true">▤</span>可离线阅读</span>
        </div>
        <div className="my-operations__row">
          <div>
            <h3>未缓存 PDF</h3>
            <p>当前切片不包含真实 PDF 文件或下载地址。</p>
          </div>
          <DisabledFutureAction label="下载未缓存 PDF" reasonId="pdf-disabled-reason" />
        </div>
      </section>

      <section className="my-operations__section" aria-labelledby="diagnostics-heading">
        <div className="my-operations__section-heading">
          <h2 id="diagnostics-heading">脱敏诊断</h2>
          <p>仅展示排查所需的最小信息</p>
        </div>
        <div className="my-operations__panel">
          <dl className="my-operations__diagnostic-list">
            <div><dt>错误码</dt><dd>DATA_INCOMPLETE</dd></div>
            <div><dt>发生时间</dt><dd>2099-06-18 17:32</dd></div>
            <div><dt>最后同步</dt><dd>2099-06-18 20:18</dd></div>
            <div><dt>诊断编号</dt><dd>LOCAL-DEMO-001</dd></div>
          </dl>
        </div>
      </section>

      <section className="my-operations__section" aria-labelledby="version-heading">
        <div className="my-operations__row">
          <div>
            <h2 id="version-heading">客户端版本 v0.1.0</h2>
            <p>调试固定样例 · 私有 APK 更新服务尚未接入</p>
          </div>
          <DisabledFutureAction label="检查更新" reasonId="update-disabled-reason" />
        </div>
      </section>

      <p className="my-operations__boundary" role="status">
        <span aria-hidden="true">ⓘ </span>
        当前没有认证、云端任务、正式更新或 PDF 下载服务；所有在线操作保持禁用。
      </p>
    </article>
  )
}
