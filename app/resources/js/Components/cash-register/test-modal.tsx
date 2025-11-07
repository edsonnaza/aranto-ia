interface TestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function TestModal({ isOpen, onClose }: TestModalProps) {
    console.log('TestModal rendered, isOpen:', isOpen);
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50" 
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="relative bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-xl">
                <h2 className="text-lg font-semibold mb-4">Modal de Prueba</h2>
                <p className="mb-4">Este modal se está mostrando correctamente!</p>
                <button
                    onClick={onClose}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
}