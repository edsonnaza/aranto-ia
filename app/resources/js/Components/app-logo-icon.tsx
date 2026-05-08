import { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    const { className = '', ...rest } = props;

    return (
        <>
            <svg {...rest} className={`${className} dark:hidden`} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 10 C30 45, 30 85, 60 110 C90 85, 90 45, 60 10 Z" fill="#1E3D34" />
                <path d="M60 25 C45 55, 45 75, 60 100 C75 75, 75 55, 60 25 Z" fill="#34A853" />
                <path d="M40 70 C55 60, 65 60, 80 70" stroke="#FFFFFF" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>

            <svg {...rest} className={`hidden ${className} dark:block`} viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                <path d="M60 10 C30 45, 30 85, 60 110 C90 85, 90 45, 60 10 Z" fill="#FFFFFF" />
                <path d="M60 25 C45 55, 45 75, 60 100 C75 75, 75 55, 60 25 Z" fill="#34A853" />
                <path d="M40 70 C55 60, 65 60, 80 70" stroke="#1E3D34" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
        </>
    );
}
