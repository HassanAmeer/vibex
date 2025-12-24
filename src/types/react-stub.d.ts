// Minimal React stub for TypeScript
export function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
export function useEffect(effect: () => (void | (() => void)), deps?: any[]): void;
export function useRef<T>(initialValue: T): { current: T };
export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
export function useMemo<T>(factory: () => T, deps: any[]): T;

export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement | null;
}

export type FC<P = {}> = FunctionComponent<P>;

export type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNodeArray;
export interface ReactNodeArray extends Array<ReactNode> { }

export interface ReactElement<P = any, T = any> {
    type: T;
    props: P;
    key: string | number | null;
}

export interface FormEvent<T = Element> {
    preventDefault(): void;
    stopPropagation(): void;
    target: EventTarget & T;
}

export interface ChangeEvent<T = Element> {
    target: EventTarget & T & { value: string; checked?: boolean };
}

export interface KeyboardEvent<T = Element> {
    key: string;
    shiftKey: boolean;
    preventDefault(): void;
}

export interface MouseEvent<T = Element> {
    preventDefault(): void;
    target: EventTarget & T;
}

export class Component<P = {}, S = {}> {
    props: P;
    state: S;
    setState(state: Partial<S>): void;
    render(): ReactNode;
}

export default {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
    Component
};
