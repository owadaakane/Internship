/**
 * ラベル付きの入力フィールドをレンダリングする。
 *
 * @component
 * @param {Object} props - コンポーネントのプロパティ。
 * @param {string} props.title - 入力フィールドのラベルテキスト。
 * @param {string} props.id - 入力要素のid属性。
 * @param {string} props.type - 入力要素のtype属性。
 * @param {string} props.placeholder - 入力要素のプレースホルダーテキスト。
 * @param {function} props.onChange - 入力変更を処理するコールバック関数。
 * @returns {JSX.Element} レンダリングされたInputTextコンポーネント。
 */

type Props = {
  title: string;
  id: string;
  type: string;
  placeholder: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputText(props: Props) {
  return (
    <div>
      <label>{props.title}</label>
      <input
        id={props.id}
        type={props.type}
        placeholder={props.placeholder}
        onChange={props.onChange}
      />
    </div>
  );
}
