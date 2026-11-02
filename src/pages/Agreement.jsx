import { Link } from 'react-router-dom'

export function AgreementPage() {
  return (
    <section className="stack legal">
      <h1>用户协议</h1>
      <p>使用开心消消乐，就表示你同意下面这些约定。</p>
      <p>账号可以是用户名、手机号、游客或微信。请保管好自己的密码。游客账号只存在于这台设备的登录状态里，清除数据后可能找不回来。</p>
      <p>金币、钻石、体力和道具只在游戏里使用，不能兑换成现金，也不能转让给别人。关卡成绩、星星和排行以服务器记录为准。</p>
      <p>请不要用脚本、外挂或别人的账号来玩。发现异常时，对应账号的成绩和道具可以被清掉。</p>
      <p>
        个人信息怎么收集和使用，写在<Link to="/privacy">隐私政策</Link>里。
      </p>
    </section>
  )
}
