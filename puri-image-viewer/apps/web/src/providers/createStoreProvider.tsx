'use client';

import { createContext, useContext, useEffect, useRef } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { Mutate, StoreApi, StoreMutatorIdentifier } from 'zustand/vanilla';

/**
 * ストアが異なるリクエスト間で共有されないように、ストアのProviderコンポーネントを作成する関数.
 * RSC(React Server Components)からストアが利用できないように、ReactのContextを使ってProviderとuseStoreを提供する.
 *
 * @usage
 * ```
 * // create Provider and hooks.
 * const { StoreProvider: HogeStateProvider, useStoreContext: useHogeStore, useStore: useHoge } = createStoreProvider(createHogeStateStore);
 *
 * // init Provider.
 * <HogeStateProvider initialState={initialState}>
 *  {children}
 * </HogeStateProvider>
 *
 * // use hooks.
 * const fuga = useHoge((store) => store.fuga);
 * ```
 *
 * M:
 * [['zustand/subscribeWithSelector', never]]
 *
 * @see https://docs.pmnd.rs/zustand/guides/nextjs
 * @param createStore ストアの作成関数
 * @param onMount マウント時に呼ばれるコールバック関数
 * @returns
 */
export const createStoreProvider = <T, S, M extends [StoreMutatorIdentifier, unknown][] = []>(
    createStore: (initialState?: T) => Mutate<StoreApi<S>, M>,
    onMount?: (store: Mutate<StoreApi<S>, M>) => VoidFunction[]
) => {
    const StoreContext = createContext<Mutate<StoreApi<S>, M> | undefined>(undefined);
    const useStoreApi = () => {
        const store = useContext(StoreContext);
        if (!store) {
            throw new Error('useStoreContext must be used within a Provider');
        }
        return store;
    };

    const useStore = createUseStore(useStoreApi);

    const StoreProvider = ({
        children,
        initialState,
        onInit,
    }: {
        children: React.ReactNode;
        initialState?: T;
        onInit?: (store: Mutate<StoreApi<S>, M>) => void;
    }) => {
        const store = useRef<ReturnType<typeof createStore>>();
        if (!store.current) {
            store.current = createStore(initialState);
            onInit?.(store.current);
        }
        onMount &&
            useEffect(() => {
                if (!store.current) return;
                const disposables = onMount(store.current);
                return () => disposables.forEach((dispose) => dispose());
            }, []);
        return <StoreContext.Provider value={store.current}>{children}</StoreContext.Provider>;
    };

    return { StoreProvider, useStoreApi, useStore };
};

export type ExtractState<S> = S extends { getState: () => infer X } ? X : never;
const createUseStore = ((store) => (selector, equalityFn) =>
    useStoreWithEqualityFn(store(), selector, equalityFn || shallow)) as <S extends StoreApi<unknown>>(
    store: () => S
) => {
    (): ExtractState<S>;
    <T>(selector: (store: ExtractState<S>) => T, equalityFn?: (a: T, b: T) => boolean): T;
};
