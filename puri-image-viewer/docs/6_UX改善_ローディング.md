# 6. UX改善: ローディング
Webアプリケーションの要件を満たす最低限の機能は作成できました。  
時間がある場合は、UX（ユーザー体験）を向上させるために、ローディング表示を作成してみましょう。

## ローディングインジケーター
[puri-image-viewer/apps/web/public/loading.svg](./puri-image-viewer/apps/web/src/app/components/loading.svg)によく見るローディングインジケーターをSVGで用意しています。  
この画像を用いて、ログイン中や画像検索中にローディング表示を実装してみましょう。  
複数箇所で利用したいため、`components`ディレクトリに汎用的なUIコンポーネントとして作成します。

>**SVG:**  
>SVGは、Scalable Vector Graphicsの略で、ベクター形式の画像ファイルです。  
>ベクター形式は、画像のサイズを変更しても画像がぼやけないという特徴があります。

>**UIコンポーネント:**  
>UIを構成する部品です。  
>UIコンポーネントは、再利用可能な部品として作成され、デザインや機能の一貫性を保つために使用されます。

`puri-image-viewer/apps/web/src/components/Loading.tsx`と`puri-image-viewer/apps/web/src/components/Loading.module.scss`を以下のように作成してください。 

**Loading.tsx**
```tsx
import styles from './Loading.module.scss';

const Loading = () => {
    return (
        <div className={styles.container}>
            <img className={styles.img} src="/loading.svg" alt="Loading..." />
        </div>
    );
};

export default Loading;

```

**Loading.module.scss**
```scss
.container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
    z-index: 1000;
    position: fixed;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
}

.img {
    width: 4rem;
    height: 4rem;
}

```

汎用的なローディングコンポーネントを作成しました。  
このコンポーネントをログインページや画像検索ページで利用してみましょう。

## ログイン時のローディング

ローディングを表示するために、まずはローディング中であることを示す状態を`authStore`に追加します。  
`authStore`を以下の実装を追加します。

**authStore.ts**
```ts
// 省略
interface AuthStore {
    readonly idToken?: IDToken;
    // ログイン中かどうかを示す状態
    readonly isLoggingIn: boolean;

    login: (username: string, password: string) => Promise<IDToken | undefined>;
}

const authStoreCreator: StateCreator<AuthStore> = (set) => ({
    // 初期値は設定.
    isLoggingIn: false,

    login: async (username, password) => {
        // loginが呼ばれた際に、ログイン中であることを示す状態をtrueにする.
        set({ isLoggingIn: true });

        const response = await fetch(`${API_BASE_URL}/auth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            // ログインが終了したため、ログイン中であることを示す状態をfalseにする.
            set({ idToken: undefined, isLoggingIn: false });
            return undefined;
        }
        const result = await response.json();
        const idToken = IDToken.from(result.idToken);
        // ログインが終了したため、ログイン中であることを示す状態をfalseにする
        set({ idToken, isLoggingIn: false });

        return idToken;
    },
});

const authStore = createStore(persist(authStoreCreator, { name: 'auth' }));
export default authStore;

```

次に、ログインページで`isLoggingIn`の状態をフックして、ローディング表示を行います。
`puri-image-viewer/apps/web/src/app/login/page.tsx`を以下のように変更します。  

**app/login/page.tsx**
```tsx
// 省略
// Loadingコンポーネントをインポート.
import Loading from "@web/components/Loading";

export default function Page() {
    //　省略
    const login = useStore(authStore, (state) => state.login);
    // ログイン中であることを示す状態をフックする.
    const isLoggingIn = useStore(authStore, (state) => state.isLoggingIn);

    // 省略
    return (
        <>
            {/* `isLoggingIn`がtrueの場合、ローディング表示を行う. */}
            {isLoggingIn && <Loading />}
            <div className={styles.container}>
                <div className={styles.content}>
                    {/* 省略 */}
                </div>
            </div>
        </>
    );
}

```

これでログイン中は画面全体にローディングがオーバーレイされるようになりました。
次は、画像検索ページでローディング表示を行います。

## （**チャレンジ**）画像検索時のローディング

ここからはチャレンジということで、実装手順書なしで画像検索中にローディング表示を実装してみましょう。
`useState`を使うと、ローディング中であることを示す状態を管理できます。  

実装が完了し、ローカルサーバーで確認ができたら、[デプロイ](./5_デプロイメント.md#デプロイ)して、スマートフォンでも確認してみましょう。

## （**チャレンジ**）エラー表示

ログイン中にエラーが発生した場合に、`alert`関数ではなく、ラベルでエラーを表示するようにしてみましょう。
Submitボタンの上部に表示すると、ユーザーがログインに失敗したことがわかりやすく、ユーザー操作を妨げないでしょう。

## Next

さらに時間があれば、[7. リファクタリング: コンポーネント化](./7_リファクタリング_コンポーネント化.md)へ。
