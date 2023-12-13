type VariableProps = {
    value: number;
    min: number;
    step: number;
    onChange: (v: number) => void;
};

function Variable({ value, step, min, onChange }: VariableProps) {
    const increase = () => {
        onChange(value + step);
    };

    const decrease = () => {
        onChange(Math.max(min, value - step));
    };

    return (
        <div className="inline-flex gap-1 rounded font-bold">
            <button
                onClick={decrease}
                className="px-2.5 rounded-full cursor-pointer text-white bg-blue-600 transition-all hover:bg-blue-700"
            >
                -
            </button>
            <div>{value}</div>
            <button
                onClick={increase}
                className="px-2.5 rounded-full cursor-pointer text-white bg-blue-600 transition-all hover:bg-blue-700"
            >
                +
            </button>
        </div>
    );
}

export default Variable;
