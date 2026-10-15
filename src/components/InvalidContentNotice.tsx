import { Link } from 'react-router-dom';

type InvalidContentNoticeProps = { title: string; action: '表示' | '開始' };

export default function InvalidContentNotice({ title, action }: InvalidContentNoticeProps) {
  return (
    <>
      <h2>{title}</h2>
      <p role="alert">教材データにエラーがあるため{action}できません。<Link to="/">ホーム</Link>で検証結果を確認してください。</p>
    </>
  );
}
