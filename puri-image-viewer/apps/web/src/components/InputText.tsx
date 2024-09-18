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
