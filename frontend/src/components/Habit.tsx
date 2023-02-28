interface HabitProps {
    completed: number
}

export function Habit(props: HabitProps){ // tipo de dado
    return (
    <div > 
        Teste {props.completed} 
    </div>
    )
}
