import styles from './Button.module.scss';

type Props = {
  buttonName: string;
  onClick?: () => void;
};

export default function Button(props: Props) {
  return (
    <button className={styles.button} type='submit' onClick={props.onClick}>
      {props.buttonName}
    </button>
  );
}
