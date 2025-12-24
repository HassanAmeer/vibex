// Global React type declarations
// This makes React available globally without node_modules

declare global {
    namespace React {
        // Core types
        type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNodeArray;
        interface ReactNodeArray extends Array<ReactNode> { }

        type Key = string | number;

        interface ReactElement<P = any, T = any> {
            type: T;
            props: P;
            key: Key | null;
        }

        // Functional Component
        interface FunctionComponent<P = {}> {
            (props: P & { children?: ReactNode }): ReactElement | null;
            displayName?: string;
        }

        type FC<P = {}> = FunctionComponent<P>;

        // Hooks
        function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
        function useEffect(effect: () => (void | (() => void)), deps?: any[]): void;
        function useRef<T>(initialValue: T): { current: T };
        function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
        function useMemo<T>(factory: () => T, deps: any[]): T;

        // Events
        interface SyntheticEvent<T = Element> {
            preventDefault(): void;
            stopPropagation(): void;
            target: EventTarget & T;
            currentTarget: EventTarget & T;
        }

        interface FormEvent<T = Element> extends SyntheticEvent<T> { }
        interface ChangeEvent<T = Element> extends SyntheticEvent<T> {
            target: EventTarget & T & { value: string; checked?: boolean };
        }
        interface KeyboardEvent<T = Element> extends SyntheticEvent<T> {
            key: string;
            shiftKey: boolean;
            ctrlKey: boolean;
            altKey: boolean;
            metaKey: boolean;
        }
        interface MouseEvent<T = Element> extends SyntheticEvent<T> {
            clientX: number;
            clientY: number;
            button: number;
        }

        // Component
        class Component<P = {}, S = {}> {
            props: P;
            state: S;
            setState(state: Partial<S> | ((prevState: S) => Partial<S>)): void;
            render(): ReactNode;
        }
    }

    namespace JSX {
        interface IntrinsicElements {
            [elemName: string]: any;
        }
        interface Element extends React.ReactElement<any, any> { }
    }
}

// Module declarations
declare module 'react' {
    export = React;
    export as namespace React;
}

declare module 'react-dom/client' {
    export function createRoot(container: Element | DocumentFragment): {
        render(children: React.ReactNode): void;
        unmount(): void;
    };
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare module '*.svg' {
    const content: string;
    export default content;
}

export { };
