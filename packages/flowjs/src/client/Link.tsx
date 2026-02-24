import React from "react";
import { useRouter } from "./router.js";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    href: string;
    replace?: boolean;
}

export function Link({ href, replace, onClick, children, ...props }: LinkProps) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Prevent default navigation for internal links that open in the same frame
        if (
            !e.defaultPrevented &&
            e.button === 0 &&
            (!props.target || props.target === "_self") &&
            !e.metaKey &&
            !e.altKey &&
            !e.ctrlKey &&
            !e.shiftKey
        ) {
            e.preventDefault();
            // Fire transition using the custom router
            router.navigate(href, !replace);
        }

        if (onClick) {
            onClick(e);
        }
    };

    return (
        <a href={href} onClick={handleClick} {...props}>
            {children}
        </a>
    );
}
