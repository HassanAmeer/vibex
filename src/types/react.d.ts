// Type declarations for React to fix all JSX errors
// This file provides React types when node_modules aren't installed yet

declare module 'react' {
    import * as React from 'react';
    export = React;
    export as namespace React;
}

declare module 'react-dom/client' {
    export function createRoot(container: Element | DocumentFragment): {
        render(children: any): void;
        unmount(): void;
    };
}

declare namespace React {
    type FC<P = {}> = FunctionComponent<P>;

    interface FunctionComponent<P = {}> {
        (props: P & { children?: ReactNode }, context?: any): ReactElement<any, any> | null;
    }

    function useState<S>(initialState: S | (() => S)): [S, (newState: S | ((prevState: S) => S)) => void];
    function useEffect(effect: () => (void | (() => void)), deps?: any[]): void;
    function useRef<T>(initialValue: T): { current: T };

    type ReactElement<P = any, T = any> = {
        type: T;
        props: P;
        key: string | number | null;
    };

    type ReactNode = ReactElement | string | number | boolean | null | undefined | ReactNodeArray;
    interface ReactNodeArray extends Array<ReactNode> { }

    interface FormEvent<T = Element> {
        preventDefault(): void;
        stopPropagation(): void;
        target: EventTarget & T;
    }

    interface ChangeEvent<T = Element> {
        target: EventTarget & T;
    }

    interface KeyboardEvent<T = Element> {
        key: string;
        shiftKey: boolean;
        ctrlKey: boolean;
        altKey: boolean;
        metaKey: boolean;
        preventDefault(): void;
        stopPropagation(): void;
    }

    interface MouseEvent<T = Element> {
        preventDefault(): void;
        stopPropagation(): void;
        target: EventTarget & T;
    }
}

declare namespace JSX {
    interface IntrinsicElements {
        div: any;
        span: any;
        button: any;
        input: any;
        textarea: any;
        form: any;
        h1: any;
        h2: any;
        h3: any;
        h4: any;
        p: any;
        a: any;
        img: any;
        ul: any;
        li: any;
        section: any;
        header: any;
        footer: any;
        nav: any;
        pre: any;
        code: any;
        label: any;
        select: any;
        option: any;
        svg: any;
        circle: any;
        text: any;
        defs: any;
        linearGradient: any;
        stop: any;
        [elemName: string]: any;
    }

    interface Element extends React.ReactElement<any, any> { }

    interface ElementClass extends React.Component<any> {
        render(): React.ReactNode;
    }

    interface ElementAttributesProperty {
        props: {};
    }

    interface ElementChildrenAttribute {
        children: {};
    }
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

declare global {
    interface Window {
        acquireVsCodeApi?: () => any;
    }

    interface EventTarget {
        value?: string;
        checked?: boolean;
    }
}

export { };
