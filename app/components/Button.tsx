const Button = ({ onClick, children }: { onClick: () => void; children: React.ReactNode }) => {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
            {children}
        </button>
    );
}

export default Button;