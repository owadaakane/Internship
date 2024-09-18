/* eslint-disable no-unused-vars */
/**
 * 非同期データを表現するためのインタフェース.
 *
 * Flutter riverpodのAsyncValueを参考にしている.
 * @see: https://pub.dev/documentation/hooks_riverpod/latest/hooks_riverpod/AsyncValue-class.html
 */
interface AsyncValue<T, E extends Error = Error> {
    /**
     * ローディング状態かどうか.
     */
    readonly isLoading: boolean;
    /**
     * 値を持っているかどうか.
     */
    readonly hasValue: boolean;
    /**
     * 実値.
     */
    readonly value: T | undefined;
    /**
     * エラー.
     */
    readonly error: E | undefined;

    /**
     * {@link AsyncValue}の状態に基づいて何らかのアクションを実行する.
     * 主に値やエラーの変換に利用する.
     *
     * @param onValue
     * @param onError
     */
    map<NT = T, NE extends Error = E>(fs: {
        onValue?: (value: T) => NT;
        onError?: (error: E) => NE;
    }): AsyncValue<NT, NE>;

    /**
     * 非同期データの状態に基づいて、何らかのアクションを実行する.
     *
     * @param fs
     */
    when<U>(fs: {
        onValue?: (value: T) => U;
        onError?: (error: E) => U;
        onLoading?: () => U;
        onNone?: () => U;
    }): U | undefined;
}

/**
 * {@link AsyncValue}の値が存在する状態を表現するオブジェクトを生成する.
 *
 * @param value
 * @returns
 */
const AsyncData = <T, E extends Error>(value: T): AsyncValue<T, E> => ({
    isLoading: false,
    hasValue: value !== undefined,
    value: value,
    error: undefined,

    map: <NT = T>({ onValue = (value) => value as unknown as NT }: { onValue?: (value: T) => NT }) =>
        AsyncData(onValue(value)),

    when: <U>({ onValue }: { onValue?: (value: T) => U }) => onValue ? onValue(value) : undefined as unknown as U,
});

/**
 * {@link AsyncValue}のエラーが発生した状態を表現するオブジェクトを生成する
 *
 * @param error
 * @returns
 */
const AsyncError = <T, E extends Error>(error: E): AsyncValue<T, E> => ({
    isLoading: false,
    hasValue: false,
    value: undefined,
    error: error,

    map: <NT = T, NE extends Error = E>({
        onError = (error) => error as unknown as NE,
    }: {
        onError?: (error: E) => NE;
    }) => AsyncError<NT, NE>(onError(error)),

    when: <U>({ onError }: { onError?: (error: E) => U }) => onError ? onError(error) : undefined as unknown as U,
});

/**
 * {@link AsyncValue}のローディング状態を表現するオブジェクト.
 */
const AsyncLoading: AsyncValue<any, any> = {
    isLoading: true,
    hasValue: false,
    value: undefined,
    error: undefined,

    map: () => AsyncLoading,
    when: <U>({ onLoading }: { onLoading?: () => U }) => onLoading ? onLoading() : undefined as unknown as U,
};

/**
 * {@link AsyncValue}の値が存在しない状態を表すオブジェクト.
 */
const AsyncNone: AsyncValue<any, any> = {
    isLoading: false,
    hasValue: false,
    value: undefined,
    error: undefined,

    map: () => AsyncNone,
    when: <U>({ onNone }: { onNone?: () => U }) => onNone ? onNone() : undefined as unknown as U,
};

/**
 * 引数で渡した関数:{@link f}の結果を元に{@link AsyncValue}を返却する.
 * `try/catch`の代わりに利用する.
 *
 * @param f
 * @param test 一致しないErrorはそのままthrowする.
 * @returns
 */
const guard = async <T, E extends Error = Error>(
    f: () => Promise<T>,
    test: (error: unknown) => boolean = (error) => error instanceof Error
): Promise<AsyncValue<T, E>> => {
    try {
        return AsyncData(await f());
    } catch (error) {
        if (test(error)) {
            return AsyncError(error as E);
        }
        throw error;
    }
};

export default AsyncValue;
export { AsyncData, AsyncError, AsyncLoading, AsyncNone, guard };
