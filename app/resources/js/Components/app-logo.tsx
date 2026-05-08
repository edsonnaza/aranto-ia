export default function AppLogo() {
    return (
        <div className="ml-1 flex flex-1 items-center">
            <img
                src="/logo-brand.png"
                alt="Aranto"
                className="h-16 w-auto max-w-72 object-contain dark:hidden"
            />
            <img
                src="/logo-brand-dark.png"
                alt="Aranto"
                className="h-16 w-auto max-w-72 object-contain hidden dark:block"
            />
            <div className="sr-only">
                <span>Aranto</span>
            </div>
        </div>
    );
}
