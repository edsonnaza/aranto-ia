type AppLogoIconProps = {
    className?: string;
};

export default function AppLogoIcon({ className = '' }: AppLogoIconProps) {
    return (
        <span className={`${className} inline-flex overflow-hidden`}>
            <img
                src="/app-logo.png"
                alt="Aranto"
                className="h-full w-full scale-[2.2] object-contain dark:hidden"
            />

            <img
                src="/app-logo-dark.png"
                alt="Aranto"
                className="hidden h-full w-full scale-[2.2] object-contain dark:block"
            />
        </span>
    );
}
